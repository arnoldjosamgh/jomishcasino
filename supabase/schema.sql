-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  email text unique not null,
  first_name text,
  last_name text,
  phone_number text,
  date_of_birth date,
  balance_ugx numeric default 0 not null,
  bonus_balance_ugx numeric default 0 not null,
  kyc_status text default 'pending' check (kyc_status in ('pending', 'verified', 'rejected')),
  vip_level text default 'bronze' check (vip_level in ('bronze', 'silver', 'gold', 'platinum')),
  language_pref text default 'en' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions table
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('deposit', 'withdrawal', 'bet', 'win', 'bonus')),
  amount_ugx numeric not null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  payment_method text,
  reference text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bets table
create table bets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  game_type text not null,
  bet_amount_ugx numeric not null,
  outcome_amount_ugx numeric not null,
  result text not null check (result in ('win', 'loss', 'push')),
  game_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sports Bets table
create table sports_bets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  event_id text not null,
  event_name text not null,
  selection text not null,
  odds numeric not null,
  stake_ugx numeric not null,
  potential_payout_ugx numeric not null,
  status text not null check (status in ('pending', 'won', 'lost', 'void')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table bets enable row level security;
alter table sports_bets enable row level security;

-- Profiles: Users can read their own profile
create policy "Users can view own profile." on profiles
  for select using (auth.uid() = id);

-- Profiles: Users can update their own profile
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Transactions: Users can read their own transactions
create policy "Users can view own transactions." on transactions
  for select using (auth.uid() = user_id);

-- Bets: Users can read their own bets
create policy "Users can view own bets." on bets
  for select using (auth.uid() = user_id);

-- Sports Bets: Users can read their own sports bets
create policy "Users can view own sports bets." on sports_bets
  for select using (auth.uid() = user_id);

-- RPC Functions for atomic updates
create or replace function increment_balance(user_id uuid, add_amount numeric)
returns numeric as $$
declare
  new_balance numeric;
begin
  update profiles
  set balance_ugx = balance_ugx + add_amount
  where id = user_id
  returning balance_ugx into new_balance;
  return new_balance;
end;
$$ language plpgsql security definer;

create or replace function decrement_balance(user_id uuid, sub_amount numeric)
returns numeric as $$
declare
  current_balance numeric;
  new_balance numeric;
begin
  select balance_ugx into current_balance from profiles where id = user_id;
  
  if current_balance < sub_amount then
    raise exception 'Insufficient balance';
  end if;

  update profiles
  set balance_ugx = balance_ugx - sub_amount
  where id = user_id
  returning balance_ugx into new_balance;
  return new_balance;
end;
$$ language plpgsql security definer;
