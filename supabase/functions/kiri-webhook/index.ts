// Supabase Edge Function to handle KIRI Engine webhooks
// Deploy: supabase functions deploy kiri-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Optional: Verify webhook secret for security
    // Uncomment and configure if KIRI Engine provides webhook secret
    /*
    const webhookSecret = Deno.env.get('KIRI_WEBHOOK_SECRET')
    const providedSecret = req.headers.get('x-kiri-signature')
    if (webhookSecret && providedSecret !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    */

    // Get Supabase client with service role (bypasses RLS)
    // These are automatically set by Supabase when deploying Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse webhook payload
    const payload = await req.json()
    
    console.log('KIRI Webhook received:', JSON.stringify(payload))

    // Extract task information
    const serialize = payload.serialize || payload.task_id || payload.id
    if (!serialize) {
      return new Response(
        JSON.stringify({ error: 'Missing serialize/task_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map status
    const status = mapStatus(payload.status || payload.state)
    // Try multiple possible field names for progress (0-100)
    const progress = payload.progress !== undefined ? payload.progress :
                     payload.progress_percent !== undefined ? payload.progress_percent :
                     payload.progressPercent !== undefined ? payload.progressPercent :
                     payload.percent !== undefined ? payload.percent :
                     null // null means progress not available yet
    const downloadUrl = payload.download_url || payload.url || payload.model_url
    const errorMessage = payload.error || payload.error_message
    
    console.log('Extracted values:', {
      serialize,
      status,
      progress,
      downloadUrl: downloadUrl ? 'present' : 'missing',
      errorMessage: errorMessage || 'none'
    })

    // Update task in database
    const { data, error } = await supabase
      .from('kiri_tasks')
      .update({
        status,
        progress,
        download_url: downloadUrl,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('serialize', serialize)
      .select()
      .single()

    if (error) {
      console.error('Database update error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update task', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Task updated:', serialize, status)

    return new Response(
      JSON.stringify({ success: true, task: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function mapStatus(status: string): string {
  const normalized = status.toLowerCase()
  if (normalized.includes('complete') || normalized === 'done' || normalized === 'success') {
    return 'completed'
  }
  if (normalized.includes('fail') || normalized.includes('error')) {
    return 'failed'
  }
  if (normalized.includes('pending') || normalized === 'queued') {
    return 'pending'
  }
  return 'processing'
}
