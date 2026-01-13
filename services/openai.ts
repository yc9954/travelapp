const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// 디버깅: 환경 변수 로드 확인
console.log('🔍 OpenAI 환경 변수 체크:');
console.log('  EXPO_PUBLIC_OPENAI_API_KEY:', OPENAI_API_KEY ? `${OPENAI_API_KEY.substring(0, 10)}...` : '❌ 없음');

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TravelRecommendationResponse {
  recommendations: string[];
  message: string;
}

class OpenAIService {
  private async makeRequest(messages: ChatMessage[]) {
    if (!OPENAI_API_KEY) {
      throw new Error(
        'OpenAI API 키가 설정되지 않았습니다.\n' +
        '프로젝트 루트에 .env 파일을 생성하고 EXPO_PUBLIC_OPENAI_API_KEY를 설정하세요.'
      );
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `OpenAI API 오류: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      throw new Error(error.message || 'OpenAI API 호출 중 오류가 발생했습니다.');
    }
  }

  async getTravelRecommendation(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    const systemPrompt = `You are a friendly and professional travel recommendation AI assistant. 
You ONLY answer questions related to travel, destinations, tourism, vacation planning, and travel-related topics.
If a user asks about anything NOT related to travel (such as general knowledge, math, programming, cooking, etc.), you must politely decline and remind them that you can only help with travel-related questions.
When answering travel questions, provide helpful recommendations, destination information, and travel tips in a friendly and conversational manner.
Include specific reasons and features when recommending destinations.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    return await this.makeRequest(messages);
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    return await this.makeRequest(messages);
  }
}

export const openaiService = new OpenAIService();
