#!/usr/bin/env bash
set -euo pipefail

# Bootstraps a standalone repo from /workspace/resume/dogwalk-mobile
# and optionally creates/pushes GitHub repo named Dog-app-one.

SOURCE_DIR="${SOURCE_DIR:-/workspace/resume/dogwalk-mobile}"
TARGET_DIR="${TARGET_DIR:-/tmp/Dog-app-one}"
REPO_NAME="${REPO_NAME:-Dog-app-one}"
GITHUB_OWNER="${GITHUB_OWNER:-}"
CREATE_GITHUB_REPO="${CREATE_GITHUB_REPO:-false}"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source folder not found: $SOURCE_DIR"
  exit 1
fi

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -R "$SOURCE_DIR"/. "$TARGET_DIR"/

cd "$TARGET_DIR"

if [[ ! -f ".gitignore" ]]; then
cat > .gitignore <<'GITIGNORE'
node_modules/
.expo/
.expo-shared/
.env
npm-debug.log*
.DS_Store
GITIGNORE
fi

if [[ ! -f "README.md" ]]; then
  echo "# Dog-app-one" > README.md
fi

git init
git add .
git commit -m "Initial commit: DogWalk Social mobile app"

echo "Local standalone repo created at: $TARGET_DIR"

echo "Next local commands:"
echo "  cd $TARGET_DIR"
echo "  npm install"
echo "  npm run start"

if [[ "$CREATE_GITHUB_REPO" == "true" ]]; then
  if [[ -z "$GITHUB_OWNER" ]]; then
    echo "GITHUB_OWNER is required when CREATE_GITHUB_REPO=true"
    exit 1
  fi

  if ! command -v gh >/dev/null 2>&1; then
    echo "GitHub CLI 'gh' is not installed. Install gh or create the repo manually."
    exit 1
  fi

  gh repo create "$GITHUB_OWNER/$REPO_NAME" --private --source . --remote origin --push
  echo "Pushed to: https://github.com/$GITHUB_OWNER/$REPO_NAME"
fi
