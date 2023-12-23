# Notion bot

<p align="center">
   <img src="./misc/icon.png" width="200" alt="icon" />
</p>

🤖 A Slack bot searches pages in Notion DB.

## Features

- Select/change DB on modal
- Add/delete filters in modal
- Display page search results in modal
- Display page search results in threads

## Quick start

run locally

```bash
export SLACK_SIGNING_SECRET=xxx
export SLACK_BOT_TOKEN=xxx
export SLACK_APP_TOKEN=xxx
export NOTION_TOKEN=xxx
docker compose up
```

run on k8s

```bash
cp .env.example .env
# edit .env

make install-sealed-secrets
make secret-init
make secret-update
make apply
```

## Usage

[!['Usage'](https://github.com/litencatt/notion-bot/assets/17349045/a4763cb3-e02d-49d8-8f25-b098e40de3b8)](https://youtu.be/mHCKeCSVFAw)
