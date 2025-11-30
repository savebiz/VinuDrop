# Deployment Guide: Vercel

Your project is ready for deployment! Since you want to keep secrets secure and local, follow these steps to deploy to Vercel without exposing your keys in the code.

## 1. Security Check (Already Verified)
- Your `.gitignore` file already includes `.env*`, so your local environment variables will **NOT** be uploaded to GitHub or Vercel automatically.
- The code uses `process.env.NEXT_PUBLIC_...` to access these values, which is the correct secure pattern.

## 2. Deploying via Vercel Dashboard (Recommended)

1.  **Push to GitHub**: Ensure your latest code is pushed to your GitHub repository.
2.  **Import Project**:
    - Go to [Vercel Dashboard](https://vercel.com/dashboard).
    - Click **"Add New..."** -> **"Project"**.
    - Import your `VinuDrop` repository.
3.  **Configure Environment Variables**:
    - **Crucial Step**: Before clicking "Deploy", look for the **"Environment Variables"** section.
    - You must manually add the secrets from your local `.env` file here.
    - Add the following key-value pairs:
        - `NEXT_PUBLIC_SUPABASE_URL`: (Your Supabase URL)
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)
        - `SUPABASE_SERVICE_ROLE_KEY`: (Your Service Role Key)
        - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`: (Your Thirdweb Client ID)
4.  **Deploy**: Click **"Deploy"**.

## 3. Deploying via CLI (Alternative)

If you prefer using the command line:

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in your project folder.
3.  Follow the prompts.
4.  When asked **"Want to modify these settings?"**, answer **"N"**.
5.  **After deployment fails (or before)**, go to the Vercel Dashboard for this project, add the Environment Variables as described above, and redeploy.

## Summary
- **Code**: Safe to push (no hardcoded secrets).
- **Secrets**: Keep them in `.env` locally and in **Vercel Project Settings > Environment Variables** for production.
