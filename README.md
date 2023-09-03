# Notion bot

A Slack bot searches pages in Notion DB.

## Quick start

run on k8s

```bash
kubectl apply -f manifests
```

run locally

```bash
export SLACK_SIGNING_SECRET=xxx
export SLACK_BOT_TOKEN=xxx
export SLACK_APP_TOKEN=xxx
export NOTION_TOKEN=xxx
docker compose up
```
