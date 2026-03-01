-- Civic Gym Supabase Schema (Zero-Cost Prototype)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    rank TEXT DEFAULT 'Keyboard Warrior',
    xp_points INTEGER DEFAULT 0,
    civic_fitness_level JSONB, -- baseline assessment results
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. Game Sessions Table
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    module_name TEXT NOT NULL, -- 'sparring_zone', 'detective_zone', 'consensus_zone'
    status TEXT DEFAULT 'completed',
    turns_data JSONB NOT NULL, -- The 5-turn conversation history
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Game Sessions
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own game sessions" ON public.game_sessions;
CREATE POLICY "Users can manage their own game sessions" 
    ON public.game_sessions FOR ALL USING (auth.uid() = user_id);

-- 3. Evaluations Table
-- Stores the final radar chart scores and XP awarded to the user after 5 turns
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    logic_score INTEGER CHECK (logic_score >= 0 AND logic_score <= 100),
    emotion_score INTEGER CHECK (emotion_score >= 0 AND emotion_score <= 100),
    comprehension_score INTEGER CHECK (comprehension_score >= 0 AND comprehension_score <= 100),
    fact_accuracy_score INTEGER CHECK (fact_accuracy_score >= 0 AND fact_accuracy_score <= 100),
    openness_score INTEGER CHECK (openness_score >= 0 AND openness_score <= 100),
    feedback TEXT,
    xp_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Evaluations
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own evaluations" ON public.evaluations;
CREATE POLICY "Users can view their own evaluations" 
    ON public.evaluations FOR SELECT USING (auth.uid() = user_id);

-- 4. Automated trigger to create profile record on Google auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
