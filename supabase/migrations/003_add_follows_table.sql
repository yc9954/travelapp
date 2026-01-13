-- Create follows table for follower/following relationships
create table if not exists follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure a user can't follow the same person twice
  constraint unique_follow unique (follower_id, following_id),

  -- Ensure a user can't follow themselves
  constraint no_self_follow check (follower_id != following_id)
);

-- Create indexes for better query performance
create index idx_follows_follower_id on follows(follower_id);
create index idx_follows_following_id on follows(following_id);

-- Enable Row Level Security
alter table follows enable row level security;

-- RLS Policies for follows table
-- Allow users to see all follow relationships (for displaying followers/following lists)
create policy "Follows are viewable by everyone"
  on follows for select
  using (true);

-- Users can only insert their own follows (they can follow others)
create policy "Users can follow others"
  on follows for insert
  with check (auth.uid() = follower_id);

-- Users can only delete their own follows (they can unfollow)
create policy "Users can unfollow others"
  on follows for delete
  using (auth.uid() = follower_id);

-- Function to increment follower counts
create or replace function increment_follower_counts()
returns trigger as $$
begin
  -- Increment following_count for the follower
  update profiles
  set following_count = following_count + 1,
      updated_at = now()
  where id = new.follower_id;

  -- Increment followers_count for the user being followed
  update profiles
  set followers_count = followers_count + 1,
      updated_at = now()
  where id = new.following_id;

  return new;
end;
$$ language plpgsql security definer;

-- Function to decrement follower counts
create or replace function decrement_follower_counts()
returns trigger as $$
begin
  -- Decrement following_count for the follower
  update profiles
  set following_count = following_count - 1,
      updated_at = now()
  where id = old.follower_id;

  -- Decrement followers_count for the user being unfollowed
  update profiles
  set followers_count = followers_count - 1,
      updated_at = now()
  where id = old.following_id;

  return old;
end;
$$ language plpgsql security definer;

-- Triggers to automatically update follower counts
create trigger on_follow_created
  after insert on follows
  for each row
  execute function increment_follower_counts();

create trigger on_follow_deleted
  after delete on follows
  for each row
  execute function decrement_follower_counts();

-- Add comments for documentation
comment on table follows is 'Stores follower/following relationships between users';
comment on column follows.follower_id is 'The user who is following';
comment on column follows.following_id is 'The user being followed';
