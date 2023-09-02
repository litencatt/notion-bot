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
  next_cursor?: string,
  filters?: any[],
}

app.event('app_mention', async({ logger, payload, say }) => {
  logger.info("app_mention event called")

  try {
    const modalButtonMessage = slack.modalButtonMessage(payload.thread_ts)

    // If database id is passed, the default database is set to modal button.
    const query = payload.text.split(" ");
    let dbId = null
    if (query.length > 1) {
      dbId = query[1]
      modalButtonMessage.blocks[0].elements[0]["value"] = dbId
    }

    await say(modalButtonMessage);
  } catch (error) {
    console.log(error);
  }
});

app.action("open-modal-button", async({ ack, body, client, logger}) => {
  logger.info("open-modal-button action called")
  ack()
  // console.dir(body, {depth: null})

  try {
    const dbId = body.actions[0].value
    console.log(`dbId: ${dbId}`)

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
      const dbTitle = await notion.getDatabaseTitle(db)
      const metaData: metaData = {
        channel_id: body.channel.id,
        thread_ts: body.message.thread_ts,
        selected_db_id: dbId,
        selected_db_name: dbTitle,
      }

      const res = await notion.client.databases.query({
        database_id: dbId,
        page_size: 10,
      })
      const urls = await notion.getPageUrls(res)
      const nextCursor = res.has_more ? res.next_cursor : ""

      await client.views.open({
        trigger_id: body.trigger_id,
        view: slack.searchPagesResultView(metaData, urls, nextCursor),
      })
    }
  } catch (error) {
    logger.error(error)
  }
});

app.action('select_db-action', async({ack, body, client, logger}) => {
  logger.info("select_db action called")
  ack()

  try {
    // console.dir(body, {depth: null})
    const metaData = JSON.parse(body.view.private_metadata) as metaData
    console.dir({private_metadata: metaData}, {depth: null})

    const dbName = body.view.state.values["select_db"][`select_db-action`].selected_option.text.text
    const dbId = body.view.state.values["select_db"][`select_db-action`].selected_option.value
    metaData.selected_db_id = dbId
    metaData.selected_db_name = dbName
    console.dir({private_metadata: metaData}, {depth: null})

    const res = await notion.client.databases.query({
      database_id: dbId,
      page_size: 10,
    })
    const urls = await notion.getPageUrls(res)
    const nextCursor = res.has_more ? res.next_cursor : ""    
    metaData.next_cursor = nextCursor

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchPagesResultView(metaData, urls, nextCursor),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('change_db-action', async({ack, body, client, logger}) => {
  logger.info("change_db action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as metaData
    console.dir(metaData, {depth: null})

    const dbs = await notion.getDatabases()
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchDbView(metaData, dbs),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('next_result-action', async({ack, body, client, logger}) => {
  logger.info("next_result action called")
  ack()

  try {
    console.dir(body.view.state.values, {depth: null})

    const metaData = JSON.parse(body.view.private_metadata) as metaData
    console.dir({private_metadata: metaData}, {depth: null})

    const res = await notion.client.databases.query({
      database_id: metaData.selected_db_id,
      start_cursor: metaData.next_cursor,
      page_size: 10,
    })
    const urls = await notion.getPageUrls(res)
    const nextCursor = res.has_more ? res.next_cursor : ""
    metaData.next_cursor = nextCursor

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchPagesResultView(metaData, urls, nextCursor),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('add_filter-action', async({ack, body, client, logger}) => {
  logger.info("add_filter action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as metaData
    console.dir(metaData, {depth: null})

    const selectedDb = await notion.retrieveDb(metaData.selected_db_id, {})
    const dbProps = notion.buildFilterPropertyOptions(selectedDb)
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.selectFilterPropertyView(metaData, dbProps),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('set_prop-action', async({ack, body, client, logger}) => {
  logger.info("set_prop action called")
  ack()

  try {
    const selectedPropName = body.view.state.values["set_prop"][`set_prop-action`].selected_option.value
    const selectedPropNameAndTypeText = body.view.state.values["set_prop"][`set_prop-action`].selected_option.text.text
    const propType = selectedPropNameAndTypeText.split(" (")[1] as string
    const type = propType.substring(0, propType.length - 1)

    const metaData = JSON.parse(body.view.private_metadata) as metaData
    if (metaData.filters == null) {
      metaData.filters = []
    }
    metaData.filters.push({
      prop_name: selectedPropName,
      prop_type: type,
    })
    logger.info(metaData)

    const filterFields = await notion.getFilterFields(type)
    logger.info(filterFields)

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.selectFilterPropertyFieldView(metaData, filterFields),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('set_prop_field-action', async({ack, body, client, logger}) => {
  logger.info("set_prop_field action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as metaData
    console.dir(metaData, {depth: null})
    console.dir(body.view.state.values, {depth: null})

    const propField = body.view.state.values["set_prop_field"][`set_prop_field-action`].selected_option.value
    metaData.filters[metaData.filters.length - 1].prop_field = propField

    const res = await notion.retrieveDb(metaData.selected_db_id, {})
    const props = await notion.getSelectedDbPropValues(res, metaData.filters[metaData.filters.length - 1].prop_name)
    console.dir(props, {depth: null})
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.selectFilterValueView(metaData, props),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action('set_prop_value-action', async ({ ack, body, client, logger }) => {
  logger.info("set_prop_value action called")
  ack();

  try {
    const metaData = JSON.parse(body.view.private_metadata) as metaData
    console.dir(metaData, {depth: null})

    const propValue = body.view.state.values["set_prop_value"][`set_prop_value-action`].selected_option.value
    metaData.filters[metaData.filters.length - 1].prop_value = propValue
    console.dir(metaData.filters, {depth: null})

    const f = metaData.filters.map(f => {
      return {
        property: f.prop_name,
        [f.prop_type]: {
          [f.prop_field]: f.prop_value
        }
      }
    })
    const res = await notion.client.databases.query({
      database_id: metaData.selected_db_id,
      // filter: {},
      page_size: 10,
    })
    const urls = await notion.getPageUrls(res)

    // プロパティ設定用モーダルに更新
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchPagesResultView(metaData, urls, res.next_cursor),
    })
  } catch (error) {
    logger.error(error)
  }
});

// Receive modal submit action and reply result.
app.view('search-db-modal', async({ack, view, client, logger}) => {
  logger.info("search-db-modal view called")
  ack()

  try {
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
