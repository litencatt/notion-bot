const { App } = require('@slack/bolt');
import * as notion from "./notion"
import * as slack from "./slack"
import { isFullDatabase, isFullPage } from '@notionhq/client'

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

      const pages = await notion.queryDb(service, tags, type);
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
    const dbs = await notion.searchDb();
    const dbChoices = []
    for (const db of dbs) {
      if (db.object != "database") {
        continue
      }
      if (!isFullDatabase(db)) {
        continue
      }
      if (db.title[0] == null) {
        continue
      }
      dbChoices.push({
        title: db.title[0].plain_text,
        value: db.id,
      })
    }
    const sortedDbChoices = dbChoices.sort((a,b)=> {
      return a.title.localeCompare(b.title)
    })
    console.log(sortedDbChoices)

    const metaData = {
      channel_id: body.channel.id,
      thread_ts: body.message.thread_ts,
    }
    await client.views.open({
      trigger_id: body.trigger_id,
      view: slack.searchDbView(metaData, sortedDbChoices),
    })
  } catch (error) {
    logger.error(error)
  }
});

app.action('select_db-action', async({ack, body, client, logger}) => {
  ack()

  try {
    logger.info("select_db action called")
    // console.dir(body.view, {depth: null})

    const dbName = body.view.state.values["select_db"][`select_db-action`].selected_option.text.text
    const dbId = body.view.state.values["select_db"][`select_db-action`].selected_option.value
    const pm = JSON.parse(body.view.private_metadata)
    pm.selected_db_id = dbId
    pm.selected_db_name = dbName

    // DBのプロパティ取得
    // const selectedDb = await retrieveDb(dbId, {})
    // const props = []
    // Object.entries(selectedDb.properties).forEach(([_, prop]) => {
    //   props.push({
    //     prop_name: prop.name,
    //     prop_type: prop.type
    //   })
    // })

    const res = await notion.client.databases.query({
      database_id: dbId,
      page_size: 20,
    })
    const urls = []
    for (const page of res.results) {
      if (page.object != "page") {
        continue
      }
      if (!isFullPage(page)) {
        continue
      }
      const title = notion.getPageTitle(page)
      urls.push(`・ <${page.url}|${title}>`)
    }

    // プロパティ設定用モーダルに更新
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchResultModal(pm, urls),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('set_prop-action', async({ack, body, client, logger}) => {
  ack()

  try {
    logger.info("set_prop action called")
    const propName = body.view.state.values["set_prop"][`set_prop-action`].selected_option.value
    const propNameAndTypeText = body.view.state.values["set_prop"][`set_prop-action`].selected_option.text.text
    const propType = propNameAndTypeText.split(" (")[1] as string
    const pm = JSON.parse(body.view.private_metadata)
    pm.selected_prop_name = propName
    pm.selected_prop_type = propType.substring(0, propType.length - 1)
    logger.info(pm)

    const filterFields = await slack.getFilterFields(pm.selected_prop_type)
    logger.info(filterFields)

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchDbView3(pm, filterFields),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('set_prop_field-action', async({ack, body, client, logger}) => {
  ack()

  try {
    logger.info("set_prop_field action called")
    const propField = body.view.state.values["set_prop_field"][`set_prop_field-action`].selected_option.value
    const pm = JSON.parse(body.view.private_metadata)
    pm.selected_prop_field = propField
    logger.info(pm)

    const res = await notion.retrieveDb(pm.selected_db_id, {})
    let props = []
    Object.entries(res.properties).forEach(([_, prop]) => {
      if (prop.name != pm.selected_prop_name) {
        return
      }
      switch (prop.type) {
        case 'select':
          props = prop.select.options.map((o) => o.name)
          break
        case'multi_select':
        props = prop.multi_select.options.map((o) => o.name)
          break
        default:
          console.log(`${prop.type} is not supported`)
      }
    })

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchDbView4(pm, props),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('set_prop_value-action', async ({ ack, body, logger }) => {
  ack();

  try {
    const pm = JSON.parse(body.view.private_metadata)
    const propValue = body.view.state.values["set_prop_value"][`set_prop_value-action`].selected_option.value
    pm.selected_prop_value = propValue

  } catch (error) {
    logger.error(error)
  }
});

app.action("x-open-modal-button", async({ ack, body, client, logger}) => {
  ack()
  // console.log(body)
  try {
    // 指定DBのスキーマ情報よりselectブロックの情報を取得
    const dbSchema = await notion.queryDbSchema();
    console.dir(dbSchema.properties, {depth: null})

    const selectProps = []
    selectProps.push(dbSchema.properties["Media"])
    selectProps.push(dbSchema.properties["出版社"])
    // selectProps.push(dbSchema.properties["TagDB"])
    console.log(selectProps)

    // Get relation DB info
    // @ts-ignore
    // const relationOptions = await queryRelationDb(dbSchema.properties.TagDB.relation.database_id, "Name")
    // for (const page of relationOptions) {
    //   console.log(page.properties.Name.title[0].plain_text)
    // }
    // return

    const metaData = {
      channel_id: body.channel.id,
      thread_ts: body.message.thread_ts,
      selectProps: selectProps
    }
    await client.views.open({
      trigger_id: body.trigger_id,
      view: slack.searchBlock(JSON.stringify(metaData), selectProps),
    })
  } catch (error) {
    logger.error(error)
  }
});


// Receive modal submit action and reply result.
app.view('search-db-modal', async({ack, view, client, logger}) => {
  ack()

  try {
    logger.info("search-db-modal view called")
    // console.log(view)
    const propValue = view.state.values["set_prop_value"][`set_prop_value-action`].selected_option.value
    //console.log(propValue)

    const pm = JSON.parse(view.private_metadata)
    pm.selected_prop_value = propValue

    console.dir(pm, {depth: null})

    // console.dir(view.state.values, {depth: null})

    // for (const prop of pm.selectProps) {
    //   prop.selectedOptions = []
    //   for (const block of view.blocks) {
    //     if (prop.id == block.block_id) {
    //       const type = view.state.values[prop.id][`static_select-action`].type
    //       switch (type) {
    //         case "static_select":
    //           // prop.selectedOption = view.state.values[prop.id][`${prop.id}-action`].selected_option.value
    //           prop.selectedOptions.push(view.state.values[prop.id][`static_select-action`].selected_option.value)
    //           break;
    //         case "multi_static_select":
    //           view.state.values[prop.id][`static_select-action`].selected_options.map(
    //             so => prop.selectedOptions.push(so.value)
    //           )
    //           break;
    //         default:
    //           console.log("Not supported type")
    //       }
    //     }
    //   }
    // }
    // console.log(pm.selectProps)

    // // Search Notion DB
    // const pages = await queDb(pm.selectProps)
    // // console.log(pages)

    const {pages, filter} = await notion.queDb(pm)
    const urls = []
    for (const page of pages) {
      if (page.object != "page") {
        continue
      }
      if (!isFullPage(page)) {
        continue
      }
      const title = notion.getPageTitle(page)
      urls.push(`・ <${page.url}|${title}>`)
    }

    // Reply result
    await client.chat.postMessage({
      channel: pm.channel_id,
      thread_ts: pm.thread_ts,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "フィルター条件:\n```" + JSON.stringify(filter) + "```"
          }
        },
        {
          "type": "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "検索結果:\n" + urls.join("\n")
          }
        },
      ],
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('static_select-action', async({ack}) => {
  ack()
})
