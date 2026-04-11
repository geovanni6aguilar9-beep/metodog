CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  client_id INT NOT NULL,
  coach_id INT NOT NULL,
  duration_weeks INT NOT NULL,
  goal TEXT,
  blocks JSONB,
  meal_plans JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
