-- LiftAI Database Schema

-- Users profile extension
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  height_cm numeric,
  weight_kg numeric,
  goal text check (goal in ('strength', 'muscle', 'weight_loss', 'general')),
  experience text check (experience in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Exercises library
create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  muscle_group text not null,
  equipment text,
  instructions text,
  created_at timestamptz default now()
);

-- Workouts (a session)
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text,
  notes text,
  duration_minutes int,
  ai_generated boolean default false,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Workout sets (individual sets within a workout)
create table public.workout_sets (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id),
  exercise_name text not null, -- fallback if no exercise_id
  set_number int not null,
  reps int,
  weight_kg numeric,
  rpe numeric check (rpe >= 1 and rpe <= 10),
  notes text,
  created_at timestamptz default now()
);

-- Meal plans
create table public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  target_calories int,
  target_protein_g int,
  target_carbs_g int,
  target_fat_g int,
  ai_generated boolean default true,
  active boolean default true,
  created_at timestamptz default now()
);

-- Meals within a plan
create table public.meals (
  id uuid default gen_random_uuid() primary key,
  meal_plan_id uuid references public.meal_plans(id) on delete cascade not null,
  name text not null, -- breakfast, lunch, dinner, snack
  foods jsonb not null, -- [{name, calories, protein, carbs, fat, portion}]
  order_index int default 0,
  created_at timestamptz default now()
);

-- Progress tracking (weight, measurements)
create table public.progress_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  weight_kg numeric,
  body_fat_pct numeric,
  notes text,
  logged_at timestamptz default now()
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

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meals enable row level security;
alter table public.progress_logs enable row level security;
alter table public.personal_records enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can manage own workouts" on public.workouts for all using (auth.uid() = user_id);
create policy "Users can manage own sets" on public.workout_sets for all using (
  workout_id in (select id from public.workouts where user_id = auth.uid())
);

create policy "Users can manage own meal plans" on public.meal_plans for all using (auth.uid() = user_id);
create policy "Users can manage own meals" on public.meals for all using (
  meal_plan_id in (select id from public.meal_plans where user_id = auth.uid())
);

create policy "Users can manage own progress" on public.progress_logs for all using (auth.uid() = user_id);
create policy "Users can manage own PRs" on public.personal_records for all using (auth.uid() = user_id);

-- Exercises are public read
create policy "Anyone can view exercises" on public.exercises for select using (true);

-- Seed some common exercises
insert into public.exercises (name, muscle_group, equipment) values
  ('Barbell Squat', 'legs', 'barbell'),
  ('Bench Press', 'chest', 'barbell'),
  ('Deadlift', 'back', 'barbell'),
  ('Overhead Press', 'shoulders', 'barbell'),
  ('Barbell Row', 'back', 'barbell'),
  ('Pull-ups', 'back', 'bodyweight'),
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
  ('Russian Twist', 'core', 'bodyweight');
