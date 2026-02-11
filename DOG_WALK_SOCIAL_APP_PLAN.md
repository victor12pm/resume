# DogWalk Social — Mobile App Product Blueprint

## 1) Product vision
Create a **mobile-first app** for dog owners that combines:
- **Route tracking** (like Strava/Wikiloc),
- **Community sharing** (friends + local dog owners), and
- **Safety alerts** (bugs, hazards, temporary closures, aggressive dogs, etc.).

Core value: help people find safe, fun, dog-friendly walks and share reliable local knowledge.

### Platform answer (mobile vs web)
- **Primary product:** Mobile app (iOS + Android), because GPS tracking, outdoor usage, and location permissions are core.
- **Optional companion:** Lightweight web app for route browsing, public profiles, and basic account management.
- **MVP recommendation:** Build mobile first; add web after validating retention and route-sharing behavior.

---

## 2) Core user stories

### Dog owner (primary user)
- I can record a walk with GPS and distance/time stats.
- I can save a route and mark it as public/private/friends-only.
- I can discover nearby routes with filters (dog size, difficulty, leash requirement).
- I can add warnings on a map (ticks, broken glass, construction, toxic plants, etc.).
- I can react/comment on routes and follow other owners.

### Community moderator / trusted users
- I can review and validate high-impact warnings.
- I can hide spam/inaccurate content.

---

## 3) MVP scope (first release)

### A. Authentication and profiles
- Sign up/in (email + social login optional).
- Dog profile(s): name, breed, age, energy level.
- Basic privacy controls.

### B. GPS walk tracking
- Start/pause/stop walk.
- Distance, elapsed time, pace, elevation (if available).
- Save walk with optional photos and notes.

### C. Route feed and map discovery
- Home feed with nearby/public walks.
- Map view with route overlays.
- Route detail page (stats, tags, comments, warnings).

### D. Warning/report system
- Add warning pins with category + severity + expiry.
- Example categories: insects/bugs, water hazards, broken glass, aggressive animal sightings, temporary restrictions.
- Community confirmations ("still active" / "resolved").

### E. Social layer
- Follow users.
- Like/comment/share routes.
- Friends-only route visibility.

---

## 4) Suggested tech stack

### Mobile app
- **React Native + Expo** (fast MVP, cross-platform iOS/Android).
- Map SDK: Mapbox or Google Maps.
- Background location tracking with OS permissions.

### Backend
- **Node.js (NestJS or Express)** or **Supabase/Firebase** for rapid launch.
- PostgreSQL + PostGIS for geo queries (`nearby routes`, `warnings in radius`).
- Object storage for photos.

### Realtime + notifications
- Push notifications (Expo Notifications / Firebase Cloud Messaging).
- Realtime warning updates for followed areas/routes.

### Analytics and observability
- Product analytics (Amplitude/Mixpanel).
- Crash monitoring (Sentry).

---

## 5) Data model (high level)

- `users` (id, name, home_city, privacy_settings)
- `dogs` (id, owner_id, name, breed, age, energy_level)
- `walks` (id, owner_id, started_at, ended_at, distance_m, visibility)
- `walk_points` (walk_id, seq, lat, lng, timestamp)
- `routes` (id, creator_id, geometry, difficulty, surface_type, leash_required)
- `warnings` (id, reporter_id, lat, lng, category, severity, status, expires_at)
- `route_reactions` / `comments` / `follows`

---

## 6) Ranking and trust strategy

To reduce misinformation in warnings:
- Add trust signals: confirmations, recency, reporter reliability score.
- Display confidence level (low/medium/high).
- Auto-expire warnings unless reconfirmed.

For route recommendations:
- Prioritize proximity + freshness + quality score.
- Factor in similar dog profile (energy level, size) when suggesting routes.

---

## 7) Safety, privacy, and moderation

- Never expose exact live location by default.
- Allow users to hide start/end points near home.
- Add report-abuse tools and category moderation.
- Publish clear community guidelines for safety posts.

---

## 8) MVP roadmap (12 weeks)

### Weeks 1–2
- Product design, wireframes, technical setup.

### Weeks 3–5
- Auth, profile, dog profile, basic map and route recording.

### Weeks 6–8
- Save/share routes, feed, comments/reactions.

### Weeks 9–10
- Warnings feature, validation flow, push notifications.

### Weeks 11–12
- QA, beta testing in one city, app store preparation.

---

## 9) Monetization options (post-MVP)

- Premium subscription: offline maps, advanced stats, heatmaps.
- Sponsored listings: dog-friendly cafes, parks, vets.
- Partner integrations: pet insurance, pet brands, local services.

---

## 10) Next steps you can take immediately

1. Define launch city and target persona (urban dog owners, suburban hikers, etc.).
2. Build a clickable prototype (Figma) for tracking + warning flow.
3. Choose stack: Expo + Supabase is fastest for MVP.
4. Implement a very small beta: 50–100 users, one city.
5. Measure retention and warning reliability before scaling.

---

## 11) What you should do now (practical action plan)

If you want to move fast, follow this exact order:

### Today (2–3 hours)
1. **Pick your beachhead city** (one city only for launch).
2. **Define your first target user** in one sentence (example: "Apartment dog owners who do 20–40 min daily walks").
3. **Lock MVP features** to only:
   - walk tracking,
   - route save/share,
   - map discovery,
   - warning pins.

### This week (execution checklist)
1. Create a 10–12 screen Figma prototype:
   - onboarding/login,
   - home feed,
   - map discovery,
   - start/pause/stop tracking,
   - save walk,
   - route detail,
   - add warning,
   - profile.
2. Interview 8–12 dog owners in your launch city and validate:
   - where they currently walk,
   - what safety issues matter most,
   - whether they would contribute warnings.
3. Set success metrics for beta:
   - Week-1 retention target,
   - warnings confirmed by other users,
   - walks tracked per active user.

### Next 2 weeks (build sprint)
1. Set up Expo app + Supabase backend.
2. Implement auth, dog profile, and walk tracking.
3. Implement warning pins with expiry and "still active / resolved" votes.
4. Ship a private beta to 20–30 users.

### 30-day goal
- Validate that users return weekly and that warning data is trustworthy.
- If retention is weak, improve UX and onboarding before adding more features.
- If retention is strong, expand social features and add companion web browsing.

### Quick decision answer: mobile or web?
- Build **mobile first**.
- Add a **lightweight web companion** only after MVP traction.
