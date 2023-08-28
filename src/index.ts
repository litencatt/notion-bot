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

type metaData = {
  channel_id: string,
  thread_ts: string,
  selected_db_id?: string,
  selected_db_name?: string,
  filter?: any[],
}

app.event('app_mention', async({ payload, say }) => {
  try {
    const modalMessage = {
      "thread_ts": payload.ts,
      "blocks": [{
        "type": "actions",
        "elements": [
        {
          "type": "button",
          "text": {
              "type": "plain_text",
              "text": "モーダルを開いて検索する",
          },
          "action_id": "open-modal-button",
        }]
      }]
    }

    const query = payload.text.split(" ");
    let dbId = null
    if (query.length > 1) {
      dbId = query[1]
      modalMessage.blocks[0].elements[0]["value"] = dbId
    }

    await say(modalMessage);
  } catch (error) {
    console.log(error);
  }
});

app.action("open-modal-button", async({ ack, body, client, logger}) => {
  ack()
  // console.dir(body, {depth: null})

  try {
    const dbId = body.actions[0].value
    console.log(dbId)

    if (dbId == undefined) {
      const dbs = await notion.getDatabases()
      const metaData = {
        channel_id: body.channel.id,
        thread_ts: body.message.thread_ts,
      }
      await client.views.open({
        trigger_id: body.trigger_id,
        view: slack.searchDbView(metaData, dbs),
      })
    } else {
      const db = await notion.retrieveDb(dbId, {})
      const metaData = {
        channel_id: body.channel.id,
        thread_ts: body.message.thread_ts,
        selected_db_id: dbId,
        // @ts-ignore
        selected_db_name: db.title.length > 0 ? db.title[0].plain_text : "",
      }

      const res = await notion.client.databases.query({
        database_id: dbId,
        page_size: 10,
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

      let nextCursor = res.has_more ? res.next_cursor : ""
      console.log(nextCursor)
      await client.views.open({
        trigger_id: body.trigger_id,
        view: slack.searchResultModal(metaData, urls, nextCursor),
      })
    }
  } catch (error) {
    logger.error(error)
  }
});

app.action('select_db-action', async({ack, body, client, logger}) => {
  ack()

  try {
    logger.info("select_db action called")
    // console.dir(body, {depth: null})
    const pm = JSON.parse(body.view.private_metadata)
    console.dir({private_metadata: pm}, {depth: null})

    const dbName = body.view.state.values["select_db"][`select_db-action`].selected_option.text.text
    const dbId = body.view.state.values["select_db"][`select_db-action`].selected_option.value
    pm.selected_db_id = dbId
    pm.selected_db_name = dbName
    console.dir({private_metadata: pm}, {depth: null})

    // const start_cursor = body.actions[0].selected_option.value
    const res = await notion.client.databases.query({
      database_id: dbId,
      page_size: 10,
      start_cursor: undefined,
    })
    console.dir({res}, {depth: null})

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
    console.dir({urls}, {depth: null})

    let nextCursor = res.has_more ? res.next_cursor : undefined
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchResultModal(pm, urls, nextCursor),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('change_db-action', async({ack, body, client, logger}) => {
  ack()

  try {
    console.log("change_db action called")

    const pm = JSON.parse(body.view.private_metadata)
    console.dir(pm, {depth: null})

    const dbs = await notion.getDatabases()
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchDbView(pm, dbs),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('add_filter-action', async({ack, body, client, logger}) => {
  ack()

  try {
    console.log("add_filter action called")

    const pm = JSON.parse(body.view.private_metadata)
    console.dir(pm, {depth: null})

    // DBのプロパティ取得
    const selectedDb = await notion.retrieveDb(pm.selected_db_id, {})
    const dbProps = []
    Object.entries(selectedDb.properties).forEach(([_, prop]) => {
      dbProps.push({
        prop_name: prop.name,
        prop_type: prop.type
      })
    })

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchDbView2(pm, dbProps, pm.selected_db_name),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('set_prop-action', async({ack, body, client, logger}) => {
  ack()

  try {
    logger.info("set_prop action called")
    const selectedPropName = body.view.state.values["set_prop"][`set_prop-action`].selected_option.value
    const selectedPropNameAndTypeText = body.view.state.values["set_prop"][`set_prop-action`].selected_option.text.text
    const propType = selectedPropNameAndTypeText.split(" (")[1] as string
    const type = propType.substring(0, propType.length - 1)

    const pm = JSON.parse(body.view.private_metadata)
    if (pm.filter == null) {
      pm.filter = []
    }
    pm.filter.push({
      prop_name: selectedPropName,
      prop_type: type,
    })
    logger.info(pm)

    const filterFields = await notion.getFilterFields(type)
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
  logger.info("set_prop_field action called")
  ack()

  try {
    const pm = JSON.parse(body.view.private_metadata)
    console.dir(pm, {depth: null})
    console.dir(body.view.state.values, {depth: null})

    const propField = body.view.state.values["set_prop_field"][`set_prop_field-action`].selected_option.value
    pm.filter[pm.filter.length - 1].prop_field = propField

    const res = await notion.retrieveDb(pm.selected_db_id, {})
    const props = await notion.getSelectedDbPropValues(res, pm.filter[pm.filter.length - 1].prop_name)
    console.dir(props, {depth: null})
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchDbView4(pm, props),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('set_prop_value-action', async ({ ack, body, client, logger }) => {
  logger.info("set_prop_value action called")
  ack();

  try {
    const pm = JSON.parse(body.view.private_metadata)
    console.dir(pm, {depth: null})

    const propValue = body.view.state.values["set_prop_value"][`set_prop_value-action`].selected_option.value
    pm.filter[pm.filter.length - 1].prop_value = propValue
    console.dir(pm.filter, {depth: null})

    const res = await notion.client.databases.query({
      database_id: pm.selected_db_id,
      filter: {
        and: pm.filter.map(f => {
          return {
            property: f.prop_name,
            [f.prop_type]: {
              [f.prop_field]: f.prop_value
            }
          }
        })
      },
      page_size: 10,
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
      view: slack.searchResultModal(pm, urls, res.next_cursor),
    })
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

    const {pages, filter} = await notion.queryDb(pm)
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
