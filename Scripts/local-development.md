# Local Development

This runbook documents the local commands for the integrated Emergent preview base.

## Install Frontend Dependencies

```bash
cd Mobile
yarn install
```

## Create Python Virtual Environment

```bash
cd Backend/preview-api
python3 -m venv .venv
source .venv/bin/activate
```

## Install Backend Dependencies

```bash
pip install -r requirements.txt
```

## Start Local Preview API

```bash
cd Backend/preview-api
source .venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8000
```

## Start Expo App

```bash
cd Mobile
yarn start
```

## Run Backend Tests

```bash
cd Backend/preview-api
source .venv/bin/activate
TEST_BACKEND_URL=http://127.0.0.1:8000 pytest tests
```

## Run Lint and Type Checking

```bash
cd Mobile
yarn lint
yarn typecheck
```

```bash
cd Backend/functions
npm install
npm run build
```
