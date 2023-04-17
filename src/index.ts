const { App } = require('@slack/bolt');
import { queryDb, queryDbSchema } from "./notion"
import { searchBlock } from "./slack"

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
    // @bot service tag1,tag2,... [all(default)|spec|man|log]
    const query = payload.text.split(" ");
    // console.log(query)

    if (query.length > 1) {
      const service = query[1]
      const tags = query[2].split(",")
      console.log(tags)
      const type = query[3]

      if (service == undefined) {
        await say("Service not included");
        return
      }

      const pages = await queryDb(service, tags, type);
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
    } else {
      const threadTs = payload.ts
      await say({
        thread_ts: threadTs,
        blocks: [{
          "type": "actions",
          elements: [
          {
            type: "button",
            "text": {
                "type": "plain_text",
                "text": "モーダルを開いて検索する",
            },
            "value": "clicked",
            "action_id": "open-modal-button",
          }]
        }]
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.action("open-modal-button", async({ ack, body, client, logger}) => {
  ack()
  // console.log(body)
  try {
    // 指定DBのスキーマ情報よりselectブロックの情報を取得
    const dbSchema = await queryDbSchema();
    console.dir(dbSchema.properties, {depth: null})

    const selectOptions = []
    selectOptions[0] = {
      type: dbSchema.properties.Media.type,
      // @ts-ignore
      options: dbSchema.properties.Media.select.options
    }

    // selectOptions[1] = {
    //   type: dbSchema.properties.TagDB.type,
    //   // @ts-ignore
    //   options: dbSchema.properties.TagDB.multi_select.options
    // }  
    console.log(selectOptions)

    const metaData = `${body.channel.id},${body.message.thread_ts}`
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: searchBlock(metaData, selectOptions),
    })
  } catch (error) {
    logger.error(error)
  }
});


// Receive modal submit action and reply result.
app.view('modal-id', async({ack, body, view, client}) => {
  ack()

  // console.log(view)
  const pm = view.private_metadata.split(",")
  const channel_id = pm[0]
  const thread_ts = pm[1]

  // Search Notion DB

  // Reply result
  await client.chat.postMessage({
    channel: channel_id,
    thread_ts: thread_ts,
    text: "received"
  })
})

app.action('service-selection', async({ack}) => {
  await ack()
})

app.action('search-button-action', async({ ack, body, message, client }) => {
  await ack()
  console.log(message)
  await client.chat.postMessage({
    channel: body.channel.id,
    text: "show result"
  })
})
