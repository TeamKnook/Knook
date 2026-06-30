# Knook Setup Progress

Checkpoint created on 2026-06-30 on branch `integration/emergent-base`.

## Current State

- Active branch: `integration/emergent-base`
- Do not merge into `main`.
- Local `.env` files exist for `Mobile/` and `Backend/preview-api/`; they are ignored by Git and must not be committed.
- `Backend/preview-api/.venv` exists and is ignored by Git.
- `Mobile/node_modules` and `Backend/functions/node_modules` exist and are ignored by Git.
- MongoDB was confirmed running from Terminal and Codex after Homebrew ownership was repaired.
- Preview API was started successfully on `http://127.0.0.1:8000`.
- Preview API was stopped after validation.
- Process listing was blocked by the environment: `zsh:1: operation not permitted: ps`.

## Completed Setup Steps

- Installed and configured nvm-managed Node:
  - `node v20.20.2`
  - `npm 10.8.2`
  - `npx 10.8.2`
  - `yarn 1.22.22`
- Added `.nvmrc` with Node `20`.
- Added shell bootstrap:
  - `~/.zshrc` loads nvm.
  - `~/.zprofile` sources `~/.zshrc` for login shells.
- Confirmed fresh shell command works:
  - `zsh -lc 'node -v && npm -v && npx --version && yarn -v'`
- Created local env files from examples:
  - `Mobile/.env`
  - `Backend/preview-api/.env`
- Generated a local-only `JWT_SECRET` for the preview API. Do not print or commit it.
- Installed Mobile dependencies with Yarn.
- Installed Firebase Functions dependencies with npm.
- Installed MongoDB Community and `mongosh` through Homebrew from the normal Terminal.
- Installed CocoaPods through Homebrew from the normal Terminal.
- Created/used preview API virtual environment:
  - Python `3.12.13`
  - pip `26.1.2`
- Installed preview API Python requirements.
- Added root `.watchmanconfig`.
- Moved old pnpm validation backup folders out of the project to `/private/tmp`.

## Versions Detected

- Homebrew: `6.0.6`
- Git: `2.50.1 (Apple Git-155)`
- Watchman: `2026.06.22.00`
- CocoaPods: `1.16.2`
- System Python: `3.9.6`
- System pip: `21.2.4`
- Preview API venv Python: `3.12.13`
- Preview API venv pip: `26.1.2`
- Node: `v20.20.2`
- npm: `10.8.2`
- npx: `10.8.2`
- Yarn: `1.22.22`

## Package Managers

- `Mobile/`: Yarn 1.22.22, from `packageManager` in `Mobile/package.json`.
- `Backend/functions/`: npm, because no package manager field or lockfile existed before install and `engines.node` requires Node 20.
- `Backend/preview-api/`: Python venv plus `pip install -r requirements.txt`.

## Validation Results

- Passed: `yarn typecheck` in `Mobile/`.
- Passed: `yarn lint` in `Mobile/`.
- Passed: `npx expo config --type public` in `Mobile/`.
- Passed: `npm run build` in `Backend/functions/`.
- Passed: MongoDB ping:
  - `mongosh --eval 'db.runCommand({ ping: 1 })'`
- Passed: Preview API health endpoint:
  - `curl http://127.0.0.1:8000/api/`
  - Response: `{"service":"knook","status":"ok"}`
- Passed: Backend tests:
  - `TEST_BACKEND_URL=http://127.0.0.1:8000 .venv/bin/pytest tests`
  - Result: `15 passed, 1 warning`
- Passed: Python syntax check:
  - `PYTHONPYCACHEPREFIX=/private/tmp/knook-pycache python3 -m py_compile Backend/preview-api/server.py Backend/preview-api/tests/test_knook_backend.py`
- Failed: `npm run lint` in `Backend/functions/`.
  - Exact error:
    - `sh: eslint: command not found`
  - Reason: `Backend/functions/package.json` has a lint script but does not include ESLint or an ESLint config.
- Failed: Expo/Metro startup.
  - Exact error:
    - `Error: EMFILE: too many open files, watch`
  - Watchman also failed from this sandbox with:
    - `fchmod(/Users/Amoux/.local/state/watchman/Amoux-state, 2700): Operation not permitted`

## Failed Commands And Errors

- Fresh shell Node check initially failed before `.zprofile` was added:
  - `zsh:1: command not found: node`
- CocoaPods missing:
  - `zsh:1: command not found: pod`
- MongoDB tools missing:
  - `mongod` not found
  - `mongosh` not found
  - Resolved from Terminal by installing MongoDB Community and `mongosh`.
- Homebrew install path blocked:
  - Homebrew directories are not writable by user `Amoux`.
  - Homebrew recommended repairing ownership before installing packages.
- Watchman reset did not fully work:
  - `failed to create /Users/Amoux/.local/state/watchman/Amoux-state: Operation not permitted`
  - Then, after creating state folder:
    - `Failed to open /Users/Amoux/Library/LaunchAgents/com.github.facebook.watchman.plist for write: No such file or directory`
  - Write access to `~/Library/LaunchAgents` was not granted.
- Earlier backend tests failed because MongoDB was not reachable:
  - `pymongo.errors.ServerSelectionTimeoutError`
  - `127.0.0.1:27017: [Errno 61] Connection refused`
- Earlier Metro startup failed before Watchman setup:
  - `Error: EMFILE: too many open files, watch`
- Metro still fails after MongoDB/backend validation because Watchman cannot manage its user state path from the Codex sandbox:
  - `fchmod(/Users/Amoux/.local/state/watchman/Amoux-state, 2700): Operation not permitted`
- At the abrupt stop, attempts to run:
  - `mongosh --eval 'db.runCommand({ ping: 1 })'`
  - preview API startup with `uvicorn`
  were blocked by the environment usage limit before execution.

## Commands Already Executed

Key commands run during setup:

```bash
git branch --show-current
git status --short --ignored
find . -path './.git' -prune -o \( -name '.nvmrc' -o -name '.node-version' -o -name 'package.json' -o -name 'package-lock.json' -o -name 'yarn.lock' -o -name 'pnpm-lock.yaml' -o -name 'requirements.txt' -o -name 'app.json' -o -name '.env.example' -o -name '.env' -o -name 'firebase.json' -o -name '.firebaserc' -o -name 'tsconfig.json' \) -print
brew --version
git --version
watchman --version
python3 --version
pip3 --version
source /Users/Amoux/.nvm/nvm.sh && nvm install 20
source /Users/Amoux/.nvm/nvm.sh && nvm alias default 20
source /Users/Amoux/.nvm/nvm.sh && nvm use 20
corepack enable
corepack prepare yarn@1.22.22 --activate
zsh -lc 'node -v && npm -v && npx --version && yarn -v'
openssl rand -hex 32
cd Mobile && YARN_CACHE_FOLDER=/private/tmp/knook-yarn-cache yarn install --network-timeout 600000
cd Backend/functions && npm install
cd Backend/preview-api && .venv/bin/python -m pip install --upgrade pip
cd Backend/preview-api && .venv/bin/pip install -r requirements.txt
watchman watch-del-all || true
ulimit -n
cd Mobile && yarn typecheck
cd Mobile && yarn lint
cd Mobile && npx expo config --type public
cd Backend/functions && npm run build
cd Backend/functions && npm run lint
PYTHONPYCACHEPREFIX=/private/tmp/knook-pycache python3 -m py_compile Backend/preview-api/server.py Backend/preview-api/tests/test_knook_backend.py
brew tap mongodb/brew
brew install mongodb-community mongosh cocoapods
brew services start mongodb/brew/mongodb-community
mongosh --eval 'db.runCommand({ ping: 1 })'
watchman watch-del-all || true
pod --version
cd Backend/preview-api && TEST_BACKEND_URL=http://127.0.0.1:8000 .venv/bin/pytest tests
cd Mobile && npx expo start --clear
```

## Remaining Setup Steps

1. Fix Watchman user-state permissions so Metro can use Watchman instead of exhausting file descriptors.
2. Fix or intentionally skip `Backend/functions` lint:
   - Either add ESLint/config to Functions in a later code-quality task, or remove the lint script if not supported.
3. Start Expo/Metro.
4. Verify app flow:
   - app launches
   - configured demo OTP succeeds
   - invalid OTP fails
   - onboarding opens
   - home screen loads
   - MongoDB writes succeed
   - dev reveal route requires auth
   - dev reveal route requires demo mode

## Resume Commands

MongoDB is installed. Start it if needed:

```bash
brew services start mongodb/brew/mongodb-community
mongosh --eval 'db.runCommand({ ping: 1 })'
```

If Metro still fails with `EMFILE`, repair Watchman state from the normal Terminal:

```bash
mkdir -p ~/.local/state/watchman ~/Library/LaunchAgents
sudo chown -R "$(whoami)":staff ~/.local ~/Library/LaunchAgents
chmod -R u+rwX ~/.local ~/Library/LaunchAgents
watchman watch-del-all || true
```

Use Node:

```bash
cd /Users/Amoux/Documents/Knook
nvm use
```

Start preview API:

```bash
cd /Users/Amoux/Documents/Knook/Backend/preview-api
source .venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Verify preview API:

```bash
curl http://127.0.0.1:8000/api/
```

Run backend tests:

```bash
cd /Users/Amoux/Documents/Knook/Backend/preview-api
source .venv/bin/activate
TEST_BACKEND_URL=http://127.0.0.1:8000 pytest tests
```

Start Expo:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
nvm use
yarn install
yarn typecheck
yarn lint
npx expo start --clear
```

If Metro hits watcher issues, try in the same shell:

```bash
ulimit -n 65536
npx expo start --clear
```

Stop services:

```bash
brew services stop mongodb/brew/mongodb-community
```

Stop preview API or Expo with `Ctrl+C` in their terminal sessions.

## Git Safety Notes

- Do not commit:
  - `Mobile/.env`
  - `Backend/preview-api/.env`
  - `.venv`
  - `node_modules`
  - caches
  - generated build outputs
- Current `.gitignore` covers those paths.
- No merge into `main` has been performed.
