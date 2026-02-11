# Deploying to a new repository: Dog-app-one

This repo currently contains the mobile app under `dogwalk-mobile/`.
If you want it as its own repository named **Dog-app-one**, use one of the two paths below.

## Option A (recommended): one-command bootstrap script

From this repository root:

```bash
./scripts/bootstrap-dog-app-one.sh
```

This will:
- copy `dogwalk-mobile/` into `/tmp/Dog-app-one`,
- create a fresh git repository,
- create an initial commit,
- add a standard React Native/Expo `.gitignore`.

### Optional: create and push GitHub repo automatically

```bash
GITHUB_OWNER=<your-github-user-or-org> \
CREATE_GITHUB_REPO=true \
REPO_NAME=Dog-app-one \
./scripts/bootstrap-dog-app-one.sh
```

> Requires GitHub CLI (`gh`) authenticated locally.

## Option B: manual commands

```bash
mkdir -p /tmp/Dog-app-one
cp -R dogwalk-mobile/. /tmp/Dog-app-one/
cd /tmp/Dog-app-one
git init
git add .
git commit -m "Initial commit: DogWalk Social mobile app"
```

Then create a repository on GitHub named `Dog-app-one` and push:

```bash
git remote add origin git@github.com:<owner>/Dog-app-one.git
git branch -M main
git push -u origin main
```

## After repo creation

In the new repo directory:

```bash
cp .env.example .env
# fill EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run start
```

Also run `supabase-schema.sql` in Supabase SQL editor.
