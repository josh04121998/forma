-- Forma Database Schema
-- Run this in Supabase SQL Editor

-- Users profile extension (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  -- Onboarding data for AI coach
  height_cm numeric,
  weight_kg numeric,
  age int,
  gender text check (gender in ('male', 'female', 'other')),
  goal text check (goal in ('lose_fat', 'build_muscle', 'maintain', 'strength')),
  experience text check (experience in ('beginner', 'intermediate', 'advanced')),
  workout_days int check (workout_days >= 1 and workout_days <= 7),
  workout_duration int check (workout_duration in (30, 45, 60, 90)),
  equipment text check (equipment in ('full_gym', 'home', 'bodyweight')),
  injuries text,
  dietary_restrictions text[],
  onboarding_complete boolean default false,
  is_premium boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Exercises library (shared)
create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  muscle_group text not null,
  equipment text,
  instructions text,
  created_at timestamptz default now()
);

-- AI-generated workout programs
create table public.workout_programs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  summary text,
  duration_weeks int default 4,
  schedule jsonb not null, -- [{day, workout: {name, exercises: [{name, sets, reps, rest}]} | 'Rest'}]
  active boolean default true,
  ai_generated boolean default true,
  created_at timestamptz default now()
);

-- Logged workouts (actual sessions)
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.workout_programs(id) on delete set null,
  name text,
  notes text,
  duration_minutes int,
  started_at timestamptz default now(),
  completed_at timestamptz,
  -- Offline sync
  local_id text, -- client-generated UUID for offline creates
  sync_status text default 'synced' check (sync_status in ('pending', 'synced')),
  created_at timestamptz default now()
);

-- Workout sets (individual sets within a workout)
create table public.workout_sets (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id),
  exercise_name text not null,
  set_number int not null,
  reps int,
  weight_kg numeric,
  rpe numeric check (rpe >= 1 and rpe <= 10),
  notes text,
  -- Offline sync
  local_id text,
  sync_status text default 'synced' check (sync_status in ('pending', 'synced')),
  created_at timestamptz default now()
);

-- Meal plans (AI-generated)
create table public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  target_calories int,
  target_protein_g int,
  target_carbs_g int,
  target_fat_g int,
  meals jsonb not null, -- [{name, foods: [{name, portion, calories, protein}]}]
  active boolean default true,
  ai_generated boolean default true,
  created_at timestamptz default now()
);

-- Progress tracking (weight, measurements)
create table public.progress_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  weight_kg numeric,
  body_fat_pct numeric,
  notes text,
  logged_at timestamptz default now(),
  local_id text,
  sync_status text default 'synced'
);

-- Personal records
create table public.personal_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  exercise_name text not null,
  weight_kg numeric not null,
  reps int default 1,
  achieved_at timestamptz default now()
);

-- ============================================
-- Row Level Security
-- ============================================
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_programs enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;
alter table public.meal_plans enable row level security;
alter table public.progress_logs enable row level security;
alter table public.personal_records enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Exercises (public read)
create policy "Anyone can view exercises" on public.exercises for select using (true);

-- Workout Programs
create policy "Users can manage own programs" on public.workout_programs for all using (auth.uid() = user_id);

-- Workouts
create policy "Users can manage own workouts" on public.workouts for all using (auth.uid() = user_id);

-- Workout Sets
create policy "Users can manage own sets" on public.workout_sets for all using (
  workout_id in (select id from public.workouts where user_id = auth.uid())
);

-- Meal Plans
create policy "Users can manage own meal plans" on public.meal_plans for all using (auth.uid() = user_id);

-- Progress
create policy "Users can manage own progress" on public.progress_logs for all using (auth.uid() = user_id);

-- PRs
create policy "Users can manage own PRs" on public.personal_records for all using (auth.uid() = user_id);

-- ============================================
-- Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- Updated_at trigger
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- ============================================
-- Seed exercises
-- ============================================
insert into public.exercises (name, muscle_group, equipment) values
  ('Barbell Squat', 'legs', 'barbell'),
  ('Bench Press', 'chest', 'barbell'),
  ('Deadlift', 'back', 'barbell'),
  ('Overhead Press', 'shoulders', 'barbell'),
  ('Barbell Row', 'back', 'barbell'),
  ('Pull-ups', 'back', 'bodyweight'),
  ('Push-ups', 'chest', 'bodyweight'),
  ('Dumbbell Curl', 'arms', 'dumbbell'),
  ('Tricep Pushdown', 'arms', 'cable'),
  ('Leg Press', 'legs', 'machine'),
  ('Lat Pulldown', 'back', 'cable'),
  ('Dumbbell Shoulder Press', 'shoulders', 'dumbbell'),
  ('Romanian Deadlift', 'legs', 'barbell'),
  ('Incline Bench Press', 'chest', 'barbell'),
  ('Cable Fly', 'chest', 'cable'),
  ('Leg Curl', 'legs', 'machine'),
  ('Leg Extension', 'legs', 'machine'),
  ('Face Pull', 'shoulders', 'cable'),
  ('Lateral Raise', 'shoulders', 'dumbbell'),
  ('Plank', 'core', 'bodyweight'),
  ('Russian Twist', 'core', 'bodyweight'),
  ('Lunges', 'legs', 'bodyweight'),
  ('Dips', 'chest', 'bodyweight'),
  ('Hip Thrust', 'legs', 'barbell'),
  ('Calf Raises', 'legs', 'machine');
