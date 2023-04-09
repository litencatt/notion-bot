const { App } = require('@slack/bolt');
import { queryDb } from "./notion"

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  // ソケットモードではポートをリッスンしませんが、アプリを OAuth フローに対応させる場合、
  // 何らかのポートをリッスンする必要があります
  port: process.env.PORT || 3000
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app is running!');
})();

app.message('hello', async ({ message, say }) => {
  await say(`Hey there <@${message.user}>!`);
});

app.event('app_mention', async({ payload, say }) => {
  try {
    const query = payload.text.split(" ");
    // console.log(query)

    const command = query[1]
    const option = query[2]

    switch (command) {
      case "search":
        const pages = await queryDb(option);
        if (pages.length == 0) {
          await say("Not found");
        } else {
          const urls = []
          for (const page of pages) {
            // @ts-ignore
            urls.push(`<${page.url}|${page.properties.Name.title[0].text.content}>`)
          }
          await say(urls.join("\n"));
        }
        break;
      default:
        await say("Not suppoted command");
    }
  } catch (error) {
    console.log(error);
  }
});
