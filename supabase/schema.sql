-- Yaari Khaatha Database Schema
-- Version: 1.2 (Auth & Onboarding Update)

-- MIGRATION: Run this if profiles table already exists:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded boolean DEFAULT false NOT NULL;

-- 1. Profiles (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  upi_id text,
  phone text,
  onboarded boolean default false not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- 2. Persons (unregistered ledger contacts)
create table public.persons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  label text,           -- disambiguation display name (e.g. "Rahul Hostel")
  phone text,
  upi_id text,
  linked_user_id uuid references auth.users on delete set null, -- V3 only, not used in V1 UI
  created_at timestamptz default now()
);

alter table public.persons enable row level security;

create policy "Users can CRUD own persons"
  on public.persons for all using (auth.uid() = user_id);

-- 3. Groups (for recurring splits)
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

alter table public.groups enable row level security;

create policy "Users can CRUD own groups"
  on public.groups for all using (auth.uid() = user_id);

-- 4. Group Persons (junction table)
create table public.group_persons (
  group_id uuid references public.groups on delete cascade,
  person_id uuid references public.persons on delete cascade,
  primary key (group_id, person_id)
);

alter table public.group_persons enable row level security;

create policy "Users can CRUD own group_persons"
  on public.group_persons for all
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.user_id = auth.uid()
    )
  );

-- 5. Transactions
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  paid_by text check (paid_by in ('me', 'them', 'third_party')) not null, -- 'third_party' hidden from V1 UI
  amount_paise integer not null check (amount_paise > 0),
  currency text default 'INR' not null,
  note text,
  date date not null default current_date,
  type text check (type in ('direct', 'group_split', 'settlement')) not null,
  group_id uuid references public.groups(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;

create policy "Users can CRUD own transactions"
  on public.transactions for all using (auth.uid() = user_id);

-- 6. Transaction Persons (junction table tracking who owes what)
create table public.transaction_persons (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references public.transactions on delete cascade not null,
  person_id uuid references public.persons on delete cascade not null,
  share_amount_paise integer not null check (share_amount_paise > 0),
  direction text check (direction in ('owes_me', 'i_owe')) not null,
  is_settled boolean default false not null, -- AUTO-COMPUTED UI hint only. Set to true when net balance === 0.
  created_at timestamptz default now()
);

alter table public.transaction_persons enable row level security;

create policy "Users can CRUD own transaction_persons"
  on public.transaction_persons for all
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.user_id = auth.uid()
    )
  );

-- 7. Settlements (repayments)
create table public.settlements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  person_id uuid references public.persons on delete cascade not null,
  amount_paise integer not null check (amount_paise > 0),
  direction text check (direction in ('i_paid', 'they_paid')) not null,
  method text check (method in ('cash', 'upi', 'other')) default 'cash' not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table public.settlements enable row level security;

create policy "Users can CRUD own settlements"
  on public.settlements for all using (auth.uid() = user_id);

-- 8. Share Tokens (public read-only ledger links)
create table public.share_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  person_id uuid references public.persons on delete cascade not null,
  token text unique not null,
  expires_at timestamptz not null, -- ALWAYS set to created_at + 30 days
  created_at timestamptz default now()
);

alter table public.share_tokens enable row level security;

create policy "Users can manage own tokens"
  on public.share_tokens for all using (auth.uid() = user_id);

-- 9. Indexing for performance
create index idx_persons_user_id on public.persons(user_id);
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transaction_persons_tx_id on public.transaction_persons(transaction_id);
create index idx_settlements_user_id on public.settlements(user_id);
create index idx_share_tokens_token on public.share_tokens(token);

-- 10. Profile auto-creation trigger on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, upi_id, phone, onboarded)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    null,
    null,
    false
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 11. Secure RPC function for public shared ledger access
create or replace function public.get_public_ledger(token_val text)
returns json
language plpgsql
security definer -- Runs with database owner privileges, bypassing table RLS
as $$
declare
  token_row record;
  owner_profile record;
  person_row record;
  tx_persons_json json;
  settlements_json json;
  result json;
begin
  -- Find token (could be active or expired)
  select * into token_row from public.share_tokens
  where token = token_val;

  if not found then
    return json_build_object('error', 'not_found');
  end if;

  -- Get ledger owner details
  select name, upi_id into owner_profile from public.profiles
  where id = token_row.user_id;

  -- Check expiry
  if token_row.expires_at < now() then
    return json_build_object('error', 'expired', 'ownerName', owner_profile.name);
  end if;

  -- Get friend details (always use real name, never label)
  select id, name into person_row from public.persons
  where id = token_row.person_id;

  -- Get all transaction splits for this person
  select coalesce(json_agg(t), '[]'::json) into tx_persons_json
  from (
    select
      tp.id,
      tp.share_amount_paise,
      tp.direction,
      tp.created_at,
      json_build_object(
        'note', t.note,
        'date', t.date,
        'type', t.type,
        'paid_by', t.paid_by
      ) as transactions
    from public.transaction_persons tp
    join public.transactions t on t.id = tp.transaction_id
    where tp.person_id = token_row.person_id
  ) t;

  -- Get all settlements for this person
  select coalesce(json_agg(s), '[]'::json) into settlements_json
  from (
    select
      id,
      amount_paise,
      direction,
      method,
      note,
      date,
      created_at
    from public.settlements
    where person_id = token_row.person_id
  ) s;

  -- Build unified response payload
  result := json_build_object(
    'error', null,
    'ownerId', token_row.user_id,
    'ownerName', owner_profile.name,
    'ownerUpi', owner_profile.upi_id,
    'friendRealName', person_row.name,
    'expiresAt', token_row.expires_at,
    'history_transactions', tx_persons_json,
    'history_settlements', settlements_json
  );

  return result;
end;
$$;
