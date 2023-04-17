const { App } = require('@slack/bolt');
import { queDb, queryDb, queryDbSchema } from "./notion"
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

    const selectProps = []
    selectProps.push(dbSchema.properties["Media"])
    selectProps.push(dbSchema.properties["出版社"])
    console.log(selectProps)

    const metaData = {
      channel_id: body.channel.id,
      thread_ts: body.message.thread_ts,
      selectProps: selectProps
    }
    await client.views.open({
      trigger_id: body.trigger_id,
      view: searchBlock(JSON.stringify(metaData), selectProps),
    })
  } catch (error) {
    logger.error(error)
  }
});


// Receive modal submit action and reply result.
app.view('modal-id', async({ack, view, client, logger}) => {
  ack()

  try {
    // console.log(view)
    const pm = JSON.parse(view.private_metadata)
    const channel_id = pm.channel_id
    const thread_ts = pm.thread_ts
    // console.dir(pm, {depth: null})
    console.dir(view.state.values, {depth: null})

    for (const prop of pm.selectProps) {
      prop.selectedOptions = []
      for (const block of view.blocks) {
        if (prop.id == block.block_id) {
          const type = view.state.values[prop.id][`static_select-action`].type
          switch (type) {
            case "static_select":
              // prop.selectedOption = view.state.values[prop.id][`${prop.id}-action`].selected_option.value
              prop.selectedOptions.push(view.state.values[prop.id][`static_select-action`].selected_option.value)
              break;
            case "multi_static_select":
              view.state.values[prop.id][`static_select-action`].selected_options.map(
                so => prop.selectedOptions.push(so.value)
              )
              break;
            default:
              console.log("Not supported type")
          }
        }
      }
    }
    console.log(pm.selectProps)

    // const selected = view.state.values.block_id.action_id.selected_option.value
    // Search Notion DB
    const pages = await queDb(pm.selectProps)
    // console.log(pages)

    const urls = []
    for (const page of pages) {
      // @ts-ignore
      urls.push(`<${page.url}|${page.properties.Name.title[0].text.content}>`)
    }

    // Reply result
    await client.chat.postMessage({
      channel: channel_id,
      thread_ts: thread_ts,
      text: urls.join("\n")
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('static_select-action', async({ack}) => {
  ack()
})
