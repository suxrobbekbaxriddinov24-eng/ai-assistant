-- ============================================================
-- AI Personal Assistant - Full Database Schema
-- Run this in your Supabase SQL editor
-- Safe to run multiple times (idempotent)
-- ============================================================

-- Enable pgvector extension for semantic memory search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TIER LIMITS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tier_limits (
  tier                  text PRIMARY KEY,
  daily_request_limit   integer,
  has_voice             boolean DEFAULT false,
  has_web_search        boolean DEFAULT false,
  has_file_management   boolean DEFAULT false,
  has_screen_control    boolean DEFAULT false,
  has_agent             boolean DEFAULT false,
  has_offline_mode      boolean DEFAULT false,
  has_priority_speed    boolean DEFAULT false,
  ai_model              text DEFAULT 'llama-3.1-8b-instant',
  max_memory_entries    integer DEFAULT 50,
  max_conversation_history integer DEFAULT 20
);

INSERT INTO public.tier_limits VALUES
  ('free',    10,   false, false, false, false, false, false, false, 'llama-3.1-8b-instant',    50,  20),
  ('plus',    100,  true,  true,  true,  false, false, true,  false, 'llama-3.3-70b-versatile', 200, 50),
  ('pro',     500,  true,  true,  true,  true,  false, true,  true,  'llama-3.3-70b-versatile', 500, 100),
  ('premium', -1,   true,  true,  true,  true,  true,  true,  true,  'llama-3.3-70b-versatile', -1,  -1)
ON CONFLICT (tier) DO UPDATE SET
  daily_request_limit = EXCLUDED.daily_request_limit,
  has_voice = EXCLUDED.has_voice,
  has_web_search = EXCLUDED.has_web_search,
  has_file_management = EXCLUDED.has_file_management,
  has_screen_control = EXCLUDED.has_screen_control,
  has_agent = EXCLUDED.has_agent,
  has_offline_mode = EXCLUDED.has_offline_mode,
  has_priority_speed = EXCLUDED.has_priority_speed,
  ai_model = EXCLUDED.ai_model,
  max_memory_entries = EXCLUDED.max_memory_entries,
  max_conversation_history = EXCLUDED.max_conversation_history;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                      uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email                   text UNIQUE NOT NULL,
  display_name            text,
  avatar_url              text,
  tier                    text DEFAULT 'free' REFERENCES public.tier_limits(tier),
  stripe_customer_id      text UNIQUE,
  stripe_subscription_id  text,
  subscription_status     text DEFAULT 'active',
  requests_today          integer DEFAULT 0,
  requests_reset_at       timestamptz DEFAULT now(),
  total_requests_all_time bigint DEFAULT 0,
  last_active_at          timestamptz DEFAULT now(),
  created_at              timestamptz DEFAULT now(),
  settings                jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CONVERSATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title       text DEFAULT 'New Conversation',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false,
  metadata    jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own conversations" ON public.conversations;
CREATE POLICY "Users can manage own conversations" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role            text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content         text NOT NULL,
  tokens_used     integer DEFAULT 0,
  model_used      text,
  created_at      timestamptz DEFAULT now(),
  metadata        jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own messages" ON public.messages;
CREATE POLICY "Users can manage own messages" ON public.messages
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

-- ============================================================
-- MEMORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memories (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content       text NOT NULL,
  category      text DEFAULT 'general',
  importance    integer DEFAULT 5,
  embedding     vector(1536),
  source_msg_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  expires_at    timestamptz,
  is_active     boolean DEFAULT true
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own memories" ON public.memories;
CREATE POLICY "Users can manage own memories" ON public.memories
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_memories_user ON public.memories(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON public.memories
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- AGENT TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title           text NOT NULL,
  description     text,
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled')),
  trigger_type    text DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'event', 'condition')),
  trigger_config  jsonb DEFAULT '{}'::jsonb,
  result          jsonb,
  error_message   text,
  requires_approval boolean DEFAULT false,
  approved_at     timestamptz,
  celery_task_id  text,
  created_at      timestamptz DEFAULT now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  next_run_at     timestamptz
);

ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.agent_tasks;
CREATE POLICY "Users can manage own tasks" ON public.agent_tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_user ON public.agent_tasks(user_id, status);

-- ============================================================
-- SCREEN SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.screen_sessions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  goal          text NOT NULL,
  status        text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'failed', 'cancelled')),
  steps_taken   integer DEFAULT 0,
  actions       jsonb DEFAULT '[]'::jsonb,
  created_at    timestamptz DEFAULT now(),
  completed_at  timestamptz
);

ALTER TABLE public.screen_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own screen sessions" ON public.screen_sessions;
CREATE POLICY "Users can manage own screen sessions" ON public.screen_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- API USAGE LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.api_usage (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  endpoint      text NOT NULL,
  model_used    text,
  input_tokens  integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  cost_usd      numeric(10, 6) DEFAULT 0,
  response_ms   integer,
  tier_at_time  text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own usage" ON public.api_usage;
CREATE POLICY "Users can view own usage" ON public.api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON public.api_usage(user_id, created_at);

-- ============================================================
-- FUNCTION: Reset daily request counts
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_daily_requests()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET requests_today = 0,
      requests_reset_at = now()
  WHERE requests_reset_at::date < now()::date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
