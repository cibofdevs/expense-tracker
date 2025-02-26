-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Drop tables in correct order (respect foreign key constraints)
drop table if exists notifications cascade;
drop table if exists expenses cascade;
drop table if exists income_records cascade;
drop table if exists categories cascade;
drop table if exists user_preferences cascade;
drop table if exists user_details cascade;

-- Drop triggers
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_user_deletion on auth.users;

-- Drop functions
drop function if exists handle_new_user() cascade;
drop function if exists handle_user_delete() cascade;

-- Create tables
create table if not exists user_details (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    full_name text,
    avatar_url text,
    phone text,
    address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id)
);

create table if not exists user_preferences (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    default_currency text default 'USD',
    theme text default 'light',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id)
);

create table if not exists categories (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    type text not null check (type in ('expense', 'income')),
    icon text,
    color text,
    budget_percentage decimal(5,2) default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, name, type)
);

create table if not exists expenses (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    category_id uuid references categories(id) on delete set null,
    amount decimal(12,2) not null,
    currency text default 'USD',
    description text,
    date date default current_date,
    payment_method text,
    receipt_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists income_records (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    category_id uuid references categories(id) on delete set null,
    amount decimal(12,2) not null,
    currency text default 'USD',
    description text,
    date date default current_date,
    is_recurring boolean default false,
    recurring_period text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    message text not null,
    read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists budgets (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    category_id uuid references categories(id) on delete cascade,
    amount decimal(12,2) not null,
    currency text default 'USD',
    period text not null check (period in ('daily', 'weekly', 'monthly', 'yearly')),
    start_date date not null,
    end_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add address column if it doesn't exist
do $$
begin
  if not exists (
    select column_name
    from information_schema.columns
    where table_name = 'user_details'
    and column_name = 'address'
  ) then
    alter table user_details add column address text;
  end if;
end $$;

-- Enable storage
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set public = true;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Storage policies
drop policy if exists "Users can view own avatar" on storage.objects;
create policy "Users can view own avatar"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars' and
  auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars' and
  auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars' and
  auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create indexes for better performance
create index if not exists idx_expenses_user_id on expenses(user_id);
create index if not exists idx_expenses_date on expenses(date);
create index if not exists idx_expenses_category_id on expenses(category_id);

create index if not exists idx_income_records_user_id on income_records(user_id);
create index if not exists idx_income_records_date on income_records(date);
create index if not exists idx_income_records_category_id on income_records(category_id);

create index if not exists idx_categories_user_id on categories(user_id);
create index if not exists idx_categories_type on categories(type);

create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_read on notifications(read);

-- User Details Policies
drop policy if exists "Users can view own details" on user_details;
create policy "Users can view own details"
on user_details for select
using (auth.uid() = user_id);

drop policy if exists "Users can update own details" on user_details;
create policy "Users can update own details"
on user_details for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can insert own details" on user_details;
create policy "Users can insert own details"
on user_details for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own details" on user_details;
create policy "Users can delete own details"
on user_details for delete
using (auth.uid() = user_id);

-- Create trigger to handle user_details timestamps
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_user_details_updated_at on user_details;
create trigger update_user_details_updated_at
  before update on user_details
  for each row
  execute function handle_updated_at();

-- Function to handle new user creation
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_details (user_id)
  values (new.id);
  
  insert into user_preferences (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql;

-- Trigger to create user_details and preferences on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Create function to insert default categories for a new user
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  rls_enabled boolean;
begin
  -- Store current RLS state
  select obj_description(c.oid, 'pg_class') ~ 'RLS enabled'
  into rls_enabled
  from pg_class c
  where c.relname = 'categories';

  -- Disable RLS for all tables
  alter table categories disable row level security;
  alter table user_preferences disable row level security;
  alter table user_details disable row level security;
  alter table expenses disable row level security;
  alter table income_records disable row level security;
  alter table notifications disable row level security;

  -- Insert default expense categories
  insert into categories (user_id, name, type, icon, color, budget_percentage)
  values 
    (new.id, 'Food', 'expense', '🍽️', '#FF9F8F', 35),
    (new.id, 'Utilities', 'expense', '💡', '#86E594', 20),
    (new.id, 'Entertainment', 'expense', '🎮', '#D8B4FE', 15),
    (new.id, 'Transportation', 'expense', '🚗', '#93C5FD', 15),
    (new.id, 'Shopping', 'expense', '🛍️', '#FDE047', 10),
    (new.id, 'Internet', 'expense', '🌐', '#F052B6', 5);

  -- Insert default income categories
  insert into categories (user_id, name, type, icon, color)
  values 
    (new.id, 'Salary', 'income', '💰', '#34D399'),
    (new.id, 'Freelance', 'income', '💻', '#60A5FA'),
    (new.id, 'Investment', 'income', '📈', '#F472B6'),
    (new.id, 'Other', 'income', '📝', '#A78BFA');

  -- Insert default user preferences
  insert into user_preferences (user_id, default_currency)
  values (new.id, 'USD');

  -- Insert default user details
  insert into user_details (user_id, full_name, address)
  values (new.id, '', '');

  -- Re-enable RLS for all tables
  alter table categories enable row level security;
  alter table user_preferences enable row level security;
  alter table user_details enable row level security;
  alter table expenses enable row level security;
  alter table income_records enable row level security;
  alter table notifications enable row level security;

  return new;
end;
$$;

-- Create function to handle user deletion
create or replace function handle_user_delete()
returns trigger
security definer
set search_path = public
language plpgsql as $$
begin
    -- Delete all user related data
    delete from notifications where user_id = old.id;
    delete from expenses where user_id = old.id;
    delete from income_records where user_id = old.id;
    delete from categories where user_id = old.id;
    delete from user_preferences where user_id = old.id;
    delete from user_details where user_id = old.id;
    return old;
end;
$$;

-- Create trigger for user deletion
create trigger on_user_deletion
    before delete on auth.users
    for each row execute procedure handle_user_delete();

-- Enable RLS on all tables
alter table user_details enable row level security;
alter table user_preferences enable row level security;
alter table categories enable row level security;
alter table expenses enable row level security;
alter table income_records enable row level security;
alter table notifications enable row level security;
alter table budgets enable row level security;

-- Drop existing policies
drop policy if exists "Users can view own user details" on user_details;
drop policy if exists "Users can update own user details" on user_details;
drop policy if exists "Users can view own preferences" on user_preferences;
drop policy if exists "Users can update own preferences" on user_preferences;
drop policy if exists "Users can view own categories" on categories;
drop policy if exists "Users can insert own categories" on categories;
drop policy if exists "Users can update own categories" on categories;
drop policy if exists "Users can delete own categories" on categories;
drop policy if exists "Users can view own expenses" on expenses;
drop policy if exists "Users can insert own expenses" on expenses;
drop policy if exists "Users can update own expenses" on expenses;
drop policy if exists "Users can delete own expenses" on expenses;
drop policy if exists "Users can view own income records" on income_records;
drop policy if exists "Users can insert own income records" on income_records;
drop policy if exists "Users can update own income records" on income_records;
drop policy if exists "Users can delete own income records" on income_records;
drop policy if exists "Users can view own notifications" on notifications;
drop policy if exists "Users can insert own notifications" on notifications;
drop policy if exists "Users can update own notifications" on notifications;
drop policy if exists "Users can delete own notifications" on notifications;
drop policy if exists "Users can view own budgets" on budgets;
drop policy if exists "Users can insert own budgets" on budgets;
drop policy if exists "Users can update own budgets" on budgets;
drop policy if exists "Users can delete own budgets" on budgets;

-- Create RLS policies
create policy "Users can view own user details"
    on user_details for select
    using (auth.uid() = user_id);

create policy "Users can update own user details"
    on user_details for update
    using (auth.uid() = user_id);

create policy "Users can view own preferences"
    on user_preferences for select
    using (auth.uid() = user_id);

create policy "Users can update own preferences"
    on user_preferences for update
    using (auth.uid() = user_id);

create policy "Users can insert own preferences"
    on user_preferences for insert
    with check (auth.uid() = user_id);

create policy "Users can view own categories"
    on categories for select
    using (auth.uid() = user_id);

create policy "Users can insert own categories"
    on categories for insert
    with check (auth.uid() = user_id);

create policy "Users can update own categories"
    on categories for update
    using (auth.uid() = user_id);

create policy "Users can delete own categories"
    on categories for delete
    using (auth.uid() = user_id);

create policy "Users can view own expenses"
    on expenses for select
    using (auth.uid() = user_id);

create policy "Users can insert own expenses"
    on expenses for insert
    with check (auth.uid() = user_id);

create policy "Users can update own expenses"
    on expenses for update
    using (auth.uid() = user_id);

create policy "Users can delete own expenses"
    on expenses for delete
    using (auth.uid() = user_id);

create policy "Users can view own income records"
    on income_records for select
    using (auth.uid() = user_id);

create policy "Users can insert own income records"
    on income_records for insert
    with check (auth.uid() = user_id);

create policy "Users can update own income records"
    on income_records for update
    using (auth.uid() = user_id);

create policy "Users can delete own income records"
    on income_records for delete
    using (auth.uid() = user_id);

create policy "Users can view own notifications"
    on notifications for select
    using (auth.uid() = user_id);

create policy "Users can insert own notifications"
    on notifications for insert
    with check (auth.uid() = user_id);

create policy "Users can update own notifications"
    on notifications for update
    using (auth.uid() = user_id);

create policy "Users can delete own notifications"
    on notifications for delete
    using (auth.uid() = user_id);

create policy "Users can view own budgets"
    on budgets for select
    using (auth.uid() = user_id);

create policy "Users can insert own budgets"
    on budgets for insert
    with check (auth.uid() = user_id);

create policy "Users can update own budgets"
    on budgets for update
    using (auth.uid() = user_id);

create policy "Users can delete own budgets"
    on budgets for delete
    using (auth.uid() = user_id);

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
