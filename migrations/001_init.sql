CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  age INT,
  sex TEXT,
  height_cm INT,
  weight_kg INT,
  goals TEXT
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_id UUID REFERENCES client_profiles(id),
  coach_id UUID REFERENCES users(id),
  duration_weeks INT,
  goal TEXT,
  status TEXT DEFAULT 'draft',
  blocks JSONB DEFAULT '[]'::jsonb,
  meal_plans JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
