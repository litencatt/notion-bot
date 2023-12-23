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

<p align="center">
   <a href="https://youtu.be/mHCKeCSVFAw">
      <img src="https://github.com/litencatt/notion-bot/assets/17349045/a4763cb3-e02d-49d8-8f25-b098e40de3b8" width="800" alt="Usage notion-bot">
   </a>
</p>

1. Mention to notion-bot
2. Click `Open modal`button in reply message received thread, then open a modal.
3. You can search pages in selected Notion DB with any filters.
4. Click submit, if you want to show result in thread.
