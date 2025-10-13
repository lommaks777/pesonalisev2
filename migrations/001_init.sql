create extension if not exists pgcrypto;

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  lesson_number int not null,
  title text not null,
  summary text,
  content jsonb,
  created_at timestamptz default now(),
  unique(course_id, lesson_number)
);

create table if not exists lesson_descriptions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now(),
  unique(lesson_id)
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_identifier text unique not null,
  name text,
  course_slug text,
  survey jsonb,
  created_at timestamptz default now()
);

create table if not exists personalized_lesson_descriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  content jsonb not null,
  created_at timestamptz default now(),
  unique(profile_id, lesson_id)
);

create table if not exists lesson_assets (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  asset_type text not null,
  url text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create or replace function set_timestamps()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    NEW.created_at := coalesce(NEW.created_at, now());
  elsif TG_OP = 'UPDATE' then
    NEW.created_at := OLD.created_at;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger set_created_at_courses before insert or update on courses
for each row execute function set_timestamps();

create trigger set_created_at_lessons before insert or update on lessons
for each row execute function set_timestamps();

create trigger set_created_at_lesson_descriptions before insert or update on lesson_descriptions
for each row execute function set_timestamps();

create trigger set_created_at_profiles before insert or update on profiles
for each row execute function set_timestamps();

create trigger set_created_at_personalized before insert or update on personalized_lesson_descriptions
for each row execute function set_timestamps();

create trigger set_created_at_assets before insert or update on lesson_assets
for each row execute function set_timestamps();



