# DogWalk Social Mobile (MVP starter)

This is a React Native + Expo starter for a dog-owner social walking app.

## What is implemented now

### Phase 1 (prototype)
- Walk tracking with foreground GPS (start/stop + elapsed time + estimated distance).
- Local warning reports with categories (bugs/ticks, glass, aggressive dog, construction, toxic plants).
- Local social feed for saved walks.

### Phase 2 (this update)
- Supabase email/password authentication.
- Persistent walks (`walks` table).
- Persistent warning reports (`warnings` table).
- Follow model (`follows` table) with simple follow-by-user-id UI.
- Automatic local-only fallback when Supabase env vars are missing.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env
   ```
3. Fill in values in `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Run SQL in Supabase SQL Editor:
   - `supabase-schema.sql`
5. Start Expo:
   ```bash
   npm run start
   ```

## Notes
- If env vars are missing, app still works with in-memory data only.
- For production, add proper profile tables, map geometry columns, moderation, and push notifications.
