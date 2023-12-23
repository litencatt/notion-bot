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

1. Mention to bot
   - <img width="473" alt="image" src="https://github.com/litencatt/notion-bot/assets/17349045/a284735f-3fa4-4234-999c-144bbfaa1bc6">
2. Click button in reply message received thread, then open a modal.
   - <img width="576" alt="image" src="https://github.com/litencatt/notion-bot/assets/17349045/6c17600e-a8aa-4127-ad01-5364ee993631">
   - <img width="528" alt="image" src="https://github.com/litencatt/notion-bot/assets/17349045/3f2cda27-49ea-4d6d-bb92-7bc7389928e0">
3. You can search pages in selected Notion DB with filters.
   - <img width="523" alt="image" src="https://github.com/litencatt/notion-bot/assets/17349045/f5dc07a3-e373-4f3f-b387-20e068955e23">
4. Click submit, if you want to show result in thread.
   - <img width="576" alt="image" src="https://github.com/litencatt/notion-bot/assets/17349045/ed239da8-4d5a-44b5-9ed0-34f796163f0c">
