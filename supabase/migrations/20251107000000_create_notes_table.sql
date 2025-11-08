create table notes (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content jsonb not null,
  is_deleted boolean not null default false
);