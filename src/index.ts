const { App } = require("@slack/bolt")
import * as notion from "./notion"
import * as slack from "./slack"
import { QueryDatabaseParameters } from "@notionhq/client/build/src/api-endpoints"
import { MetaData } from "./type"
import * as cache from "./cache"

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  // ソケットモードではポートをリッスンしませんが、アプリを OAuth フローに対応させる場合、
  // 何らかのポートをリッスンする必要があります
  port: process.env.PORT || 3000,
})

;(async () => {
  await app.start()
  console.log("⚡️ Bolt app is running!")
})()

app.message("hello", async ({ message, say }) => {
  await say(`Hey there <@${message.user}>!`)
})

app.event("app_mention", async ({ logger, payload, say }) => {
  logger.info("app_mention event called")

  try {
    const modalButtonMessage = slack.modalButtonMessage(payload.ts)

    // If database id is passed, the default database is set to modal button.
    const query = payload.text.split(" ")
    let dbId = null
    if (query.length > 1) {
      dbId = query[1]
      modalButtonMessage.blocks[0].elements[0]["value"] = dbId
    }

    await say(modalButtonMessage)
  } catch (error) {
    console.log(error)
  }
})

app.action("open-modal-button", async ({ ack, body, client, logger }) => {
  logger.info("open-modal-button action called")
  ack()

  try {
    const dbId = body.actions[0].value
    console.log(`dbId: ${dbId}`)

    if (dbId == undefined) {
      const dbs = await cache.getDatabases()
      const metaData: MetaData = {
        channel_id: body.channel.id,
        thread_ts: body.message.thread_ts,
        filter_values: [],
      }
      await client.views.open({
        trigger_id: body.trigger_id,
        view: slack.searchDbView(metaData, dbs),
      })
    } else {
      const resRetrieve = await notion.client.databases.retrieve({
        database_id: dbId,
      })
      const dbTitle = await notion.getDatabaseTitle(resRetrieve)
      const resQuery = await notion.client.databases.query({
        database_id: dbId,
        page_size: 10,
      })
      const metaData: MetaData = {
        channel_id: body.channel.id,
        thread_ts: body.message.thread_ts,
        selected_db_id: dbId,
        selected_db_name: dbTitle,
        filter_values: [],
      }
      const urls = await notion.getPageUrls(resQuery)
      const nextCursor = resQuery.has_more ? resQuery.next_cursor : ""
      metaData.next_cursor = nextCursor

      await client.views.open({
        trigger_id: body.trigger_id,
        view: slack.searchPagesResultView(metaData, urls),
      })
    }
  } catch (error) {
    logger.error(error)
  }
})

app.action("select_db-action", async ({ ack, body, client, logger }) => {
  logger.info("select_db action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })

    const selectedOption = body.view.state.values["select_db"]["select_db-action"].selected_option
    const dbName = selectedOption.text.text
    const dbId = selectedOption.value
    metaData.selected_db_id = dbId
    metaData.selected_db_name = dbName
    console.dir({ private_metadata: metaData }, { depth: null })

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
      view: slack.searchPagesResultView(metaData, urls),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action("change_db-action", async ({ ack, body, client, logger }) => {
  logger.info("change_db action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })

    const dbs = await cache.getDatabases()
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchDbView(metaData, dbs),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action("title_search_input-action", async ({ ack, body, client, logger }) => {
  logger.info("title_search_input action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })

    // Set search string to metaData
    metaData.search_string = body.actions[0].value
    metaData.filters = null
    if (metaData.search_string) {
      const titlePropName = await notion.getDbPropNameByType(metaData.selected_db_id, "title")
      metaData.filters = {
        and: [
          {
            property: titlePropName,
            title: {
              contains: metaData.search_string,
            },
          },
        ],
      }
    }
    const params = {
      database_id: metaData.selected_db_id,
      page_size: 10,
    }
    if (metaData.filters != null) {
      params["filter"] = metaData.filters as QueryDatabaseParameters["filter"]
    }
    console.dir(params, { depth: null })
    const res = await notion.client.databases.query(params)
    const urls = await notion.getPageUrls(res, metaData.search_string)
    if (urls.length == 0) {
      urls.push("No Results")
    }
    metaData.next_cursor = res.has_more ? res.next_cursor : ""

    // プロパティ設定用モーダルに更新
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchPagesResultView(metaData, urls),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action("add_filter-action", async ({ ack, body, client, logger }) => {
  logger.info("add_filter action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })

    const selectedDb = await cache.getDbRetrieve(metaData.selected_db_id, {})
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

app.action("select_prop-action", async ({ ack, body, client, logger }) => {
  logger.info("select_prop action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })
    console.dir(body.view.state.values, { depth: null })

    const selectedOption =
      body.view.state.values["select_prop"]["select_prop-action"].selected_option
    const selectedPropName = selectedOption.value
    // Convert "Name (type)" to "type"
    const selectedPropNameAndType = selectedOption.text.text
    let selectedPropType = selectedPropNameAndType.split(" (")[1] as string
    selectedPropType = selectedPropType.substring(0, selectedPropType.length - 1)

    if (metaData.filter_values == null) {
      metaData.filter_values = []
    }
    metaData.filter_values.push({
      id: metaData.filter_values.length + 1,
      prop_name: selectedPropName,
      prop_type: selectedPropType,
    })
    logger.info(metaData)

    const filterFields = await notion.getFilterFields(selectedPropType)
    const filterFieldOptions = []
    for (const field of filterFields) {
      filterFieldOptions.push({
        text: {
          type: "plain_text",
          text: field,
        },
        value: field,
      })
    }
    logger.info(filterFieldOptions)

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.selectFilterPropertyFieldView(
        metaData,
        selectedPropNameAndType,
        filterFieldOptions
      ),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action("select_prop_field-action", async ({ ack, body, client, logger }) => {
  logger.info("select_prop_field action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })
    console.dir(body.view.state.values, { depth: null })

    const selectedOption =
      body.view.state.values["select_prop_field"]["select_prop_field-action"].selected_option
    const selectedPropertyField = selectedOption.value

    const currentFilterIndex = metaData.filter_values.length - 1
    metaData.filter_values[currentFilterIndex].prop_field = selectedPropertyField
    const currentFilterValue = metaData.filter_values[currentFilterIndex]
    console.dir({ currentFilterValue }, { depth: null })

    if (["is_empty", "is_not_empty"].includes(selectedPropertyField)) {
      currentFilterValue.prop_value = true
      const currentFilter = notion.buildDatabaseQueryFilter(currentFilterValue)

      // Build filters
      if (metaData.filters == null) {
        metaData.filters = {
          and: [currentFilter],
        }
      } else {
        metaData.filters["and"].push(currentFilter)
      }
      console.dir(metaData, { depth: null })

      const res = await notion.client.databases.query({
        database_id: metaData.selected_db_id,
        filter: metaData.filters as QueryDatabaseParameters["filter"],
        page_size: 10,
      })
      const urls = await notion.getPageUrls(res, metaData.search_string)

      await client.views.update({
        view_id: body.view.id,
        hash: body.view.hash,
        view: slack.searchPagesResultView(metaData, urls),
      })
    }
    // typeがrich_text, titleの場合は入力欄を表示
    else if (["rich_text", "title"].includes(currentFilterValue.prop_type)) {
      logger.info("rich_text or title")
      await client.views.update({
        view_id: body.view.id,
        hash: body.view.hash,
        view: slack.selectFilterValueInputView(
          metaData,
          currentFilterValue.prop_name,
          selectedPropertyField
        ),
      })
    }
    // それ以外は選択中のDBの指定プロパティの値を取得して選択肢にする
    else {
      const res = await cache.getDbRetrieve(metaData.selected_db_id, {})
      const dbPropOptions = await notion.getSelectedDbPropValues(res, currentFilterValue)
      await client.views.update({
        view_id: body.view.id,
        hash: body.view.hash,
        view: slack.selectFilterValueView(metaData, currentFilterValue, dbPropOptions),
      })
    }
  } catch (error) {
    logger.error(error)
  }
})

app.action("multi_select_prop_value-action", async ({ ack, logger }) => {
  logger.info("multi_select_prop_value action called")
  ack()
})

app.action("select_prop_value-action", async ({ ack, body, client, logger }) => {
  logger.info("select_prop_value action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })

    const propValue =
      body.view.state.values["select_prop_value"]["select_prop_value-action"].selected_option.value
    const currentFilterIndex = metaData.filter_values.length - 1
    metaData.filter_values[currentFilterIndex].prop_value = propValue

    const currentFilterValue = metaData.filter_values[currentFilterIndex]
    const currentFilter = notion.buildDatabaseQueryFilter(currentFilterValue)
    console.dir(currentFilter, { depth: null })

    if (metaData.filters == null) {
      metaData.filters = {
        and: [currentFilter],
      }
    } else {
      metaData.filters["and"].push(currentFilter)
    }

    console.dir(metaData, { depth: null })

    const res = await notion.client.databases.query({
      database_id: metaData.selected_db_id,
      filter: metaData.filters as QueryDatabaseParameters["filter"],
      page_size: 10,
    })
    const urls = await notion.getPageUrls(res, metaData.search_string)
    if (urls.length == 0) {
      urls.push("No Results")
    }
    metaData.next_cursor = res.has_more ? res.next_cursor : ""

    // プロパティ設定用モーダルに更新
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchPagesResultView(metaData, urls),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action("select_prop_value_input-action", async ({ ack, body, client, logger }) => {
  logger.info("select_prop_value_input action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })
    console.dir(body.view.state.values, { depth: null })

    const propInputValue =
      body.view.state.values["select_prop_value_input"]["select_prop_value_input-action"].value
    const currentFilterIndex = metaData.filter_values.length - 1
    metaData.filter_values[currentFilterIndex].prop_value = propInputValue

    const currentFilterValue = metaData.filter_values[currentFilterIndex]
    const currentFilter = notion.buildDatabaseQueryFilter(currentFilterValue)
    console.dir(currentFilter, { depth: null })

    if (metaData.filters == null) {
      metaData.filters = {
        and: [currentFilter],
      }
    } else {
      metaData.filters["and"].push(currentFilter)
    }

    console.dir(metaData, { depth: null })

    const res = await notion.client.databases.query({
      database_id: metaData.selected_db_id,
      filter: metaData.filters as QueryDatabaseParameters["filter"],
      page_size: 10,
    })
    const urls = await notion.getPageUrls(res, metaData.search_string)
    if (urls.length == 0) {
      urls.push("No Results")
    }

    // プロパティ設定用モーダルに更新
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchPagesResultView(metaData, urls),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.view("set-filter-property", async ({ ack, view, client, logger }) => {
  logger.info("set-filter-property view called")
  ack()
})

app.action("clear_filter-action", async ({ ack, body, client, logger }) => {
  logger.info("clear_filter action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })

    // Clear filters
    metaData.filter_values = []
    metaData.filters = null
    metaData.search_string = null

    const res = await notion.client.databases.query({
      database_id: metaData.selected_db_id,
      page_size: 10,
    })
    const urls = await notion.getPageUrls(res, metaData.search_string)
    const nextCursor = res.has_more ? res.next_cursor : ""
    metaData.next_cursor = nextCursor

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchPagesResultView(metaData, urls),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action("filter-remove-action", async ({ ack, body, client, logger }) => {
  logger.info("filter-remove action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })

    // Remove specified filter
    metaData.filter_values = metaData.filter_values.filter(
      (filter) => filter.id != parseInt(body.actions[0].value)
    )
    console.dir(metaData, { depth: null })

    // Update filters
    metaData.filters = null
    metaData.filter_values.forEach((fv, index) => {
      fv.id = index + 1
      const queryFilter = notion.buildDatabaseQueryFilter(fv)

      if (metaData.filters == null) {
        metaData.filters = {
          and: [queryFilter],
        }
      } else {
        metaData.filters["and"].push(queryFilter)
      }
    })
    console.dir(metaData, { depth: null })

    const params = {
      database_id: metaData.selected_db_id,
      page_size: 10,
    }
    if (metaData.filters != null) {
      params["filter"] = metaData.filters as QueryDatabaseParameters["filter"]
    }
    const res = await notion.client.databases.query(params)
    const urls = await notion.getPageUrls(res, metaData.search_string)
    if (urls.length == 0) {
      urls.push("No Results")
    }
    metaData.next_cursor = res.has_more ? res.next_cursor : ""

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchPagesResultView(metaData, urls),
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action("next_result-action", async ({ ack, body, client, logger }) => {
  logger.info("next_result action called")
  ack()

  try {
    const metaData = JSON.parse(body.view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })

    const params = {
      database_id: metaData.selected_db_id,
      start_cursor: metaData.next_cursor,
      page_size: 10,
    }
    if (metaData.filters != null) {
      params["filter"] = metaData.filters as QueryDatabaseParameters["filter"]
    }
    const res = await notion.client.databases.query(params)
    const urls = await notion.getPageUrls(res, metaData.search_string)
    if (urls.length == 0) {
      urls.push("No Results")
    }
    const nextCursor = res.has_more ? res.next_cursor : ""
    metaData.next_cursor = nextCursor

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: slack.searchPagesResultView(metaData, urls),
    })
  } catch (error) {
    logger.error(error)
  }
})

// Receive modal submit action and reply result.
app.view("search-db-modal", async ({ ack, view, client, logger }) => {
  logger.info("search-db-modal view called")
  ack()

  try {
    const metaData = JSON.parse(view.private_metadata) as MetaData
    console.dir({ metaData }, { depth: null })

    const res = await notion.client.databases.query({
      database_id: metaData.selected_db_id,
      // filter: metaData.filters as QueryDatabaseParameters["filter"],
      page_size: 10,
    })
    const urls = await notion.getPageUrls(res)
    if (urls.length == 0) {
      urls.push("No Results")
    }

    // Reply result
    const dbId = metaData.selected_db_id.replace(/-/g, "")
    await client.chat.postMessage({
      channel: metaData.channel_id,
      thread_ts: metaData.thread_ts,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*DB: <https://www.notion.so/${dbId}|${metaData.selected_db_name}>*`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "フィルター:\n```" + JSON.stringify(metaData.filters) + "```",
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*検索結果*:\n" + urls.join("\n"),
          },
        },
      ],
    })
  } catch (error) {
    logger.error(error)
  }
})

app.action("static_select-action", async ({ ack }) => {
  ack()
})
