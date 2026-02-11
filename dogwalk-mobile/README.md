# DogWalk Social Mobile (MVP starter)

This is a working React Native + Expo starter for a dog-owner social walking app.

## Included features
- Walk tracking with foreground GPS (start/stop + elapsed time + estimated distance).
- Save tracked walks to a local in-memory feed.
- Add warning reports (bugs/ticks, glass, aggressive dog, construction, toxic plants).
- Discover tab to view warning reports.
- Social tab to view shared walks.

## Run locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Expo:
   ```bash
   npm run start
   ```
3. Open on iOS/Android simulator or Expo Go.

## Notes
- This MVP uses local state only; no backend persistence yet.
- Next step: connect to Supabase/Postgres + auth + realtime warnings.
