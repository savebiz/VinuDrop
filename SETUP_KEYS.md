# Setup Guide: Getting Your API Keys

To deploy VinuDrop, you need to create accounts on **Supabase** (for the database) and **Thirdweb** (for the wallet). Follow these steps to get your keys.

## 1. Supabase (Database)

1.  **Create Account/Project**:
    - Go to [supabase.com](https://supabase.com) and sign up/log in.
    - Click **"New Project"**.
    - Choose your organization, give it a name (e.g., "VinuDrop"), and set a strong database password (save this password!).
    - Choose a region close to you.
    - Click **"Create new project"**.

2.  **Get API Keys**:
    - Once the project is created (it takes a minute), go to **Project Settings** (gear icon at the bottom left).
    - Click on **"API"**.
    - You will see `Project URL` and `Project API keys`.
    - **`NEXT_PUBLIC_SUPABASE_URL`**: Copy the "Project URL".
    - **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Copy the `anon` `public` key.
    - **`SUPABASE_SERVICE_ROLE_KEY`**: Copy the `service_role` `secret` key (reveal it first).

3.  **Setup Database Schema**:
    - Go to the **SQL Editor** (icon on the left sidebar).
    - Click **"New Query"**.
    - Copy the code below and paste it into the editor:
      ```sql
      -- Create scores table
      create table if not exists scores (
        id bigint primary key generated always as identity,
        player_name text not null,
        score bigint not null,
        wallet_address text,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
      );

      -- Enable RLS
      alter table scores enable row level security;

      -- Allow public read access
      create policy "Public scores are viewable by everyone."
        on scores for select
        using ( true );

      -- Allow authenticated insert (or anon for now if using API route)
      create policy "Anyone can upload scores."
        on scores for insert
        with check ( true );

      -- Create users table for daily rewards
      CREATE TABLE IF NOT EXISTS users (
          wallet_address TEXT PRIMARY KEY,
          last_daily_claim TIMESTAMP WITH TIME ZONE,
          free_shakes INTEGER DEFAULT 1,
          free_blasts INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE users ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Users can read own data" ON users
          FOR SELECT
          USING (auth.uid()::text = wallet_address OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub');
          
      -- Allow inserts/updates for game logic (simplified for demo)
      CREATE POLICY "Users can update own data" ON users
          FOR ALL
          USING (auth.uid()::text = wallet_address OR wallet_address = current_setting('request.jwt.claims', true)::json->>'sub');
      ```
    - Click **"Run"**.

## 2. Thirdweb (Wallet)

1.  **Create Account/Project**:
    - Go to [thirdweb.com](https://thirdweb.com) and connect your wallet or sign up.
    - Go to the **Dashboard**.
    - Click **"Create Project"** (or "Connect App").
    - Give it a name (e.g., "VinuDrop").
    - For "Domains", enter `localhost:3000` (for testing) and your Vercel domain (e.g., `vinudrop.vercel.app`) once you have it. You can add `*` for testing if allowed.

2.  **Get Client ID**:
    - Once created, you will see your **Client ID**.
    - **`NEXT_PUBLIC_THIRDWEB_CLIENT_ID`**: Copy this Client ID.

## 3. Deployment

Now you have all 4 keys!

1.  Go to your Vercel Project Settings.
2.  Add them as Environment Variables.
3.  Deploy!
