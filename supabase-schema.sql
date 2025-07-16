-- Weekly Wins Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extended user information)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weekly_entries table
CREATE TABLE IF NOT EXISTS weekly_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_ending_date DATE NOT NULL,
  wins JSONB NOT NULL DEFAULT '[]', -- Array of 3 wins
  work_summary TEXT,
  results_contributed TEXT,
  learnings TEXT,
  challenges TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one entry per user per week
  CONSTRAINT unique_user_week UNIQUE(user_id, week_ending_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_entries_user_id ON weekly_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_entries_week_ending_date ON weekly_entries(week_ending_date);
CREATE INDEX IF NOT EXISTS idx_weekly_entries_is_published ON weekly_entries(is_published);
CREATE INDEX IF NOT EXISTS idx_weekly_entries_created_at ON weekly_entries(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_entries ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Weekly entries RLS Policies
CREATE POLICY "Users can view published entries and their own entries" 
  ON weekly_entries 
  FOR SELECT 
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries" 
  ON weekly_entries 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries" 
  ON weekly_entries 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries" 
  ON weekly_entries 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_weekly_entries
  BEFORE UPDATE ON weekly_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create a view for weekly entries with user profile information
CREATE OR REPLACE VIEW weekly_entries_with_profiles AS
SELECT 
  we.*,
  p.full_name,
  p.avatar_url,
  p.email
FROM weekly_entries we
JOIN profiles p ON we.user_id = p.id;

-- Grant necessary permissions
GRANT SELECT ON weekly_entries_with_profiles TO authenticated;
GRANT SELECT ON weekly_entries_with_profiles TO anon;