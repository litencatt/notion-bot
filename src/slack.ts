import { FilterValue } from "./type"

export const modalButtonMessage = (message_ts: string) => {
  return {
    thread_ts: message_ts,
    blocks: [
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "モーダルを開いて検索する",
            },
            action_id: "open-modal-button",
          },
        ],
      },
    ],
  }
}

export const searchDbView = (metaData: any, data: any[]) => {
  const dbOptions = []
  for (const db of data) {
    dbOptions.push({
      text: {
        type: "plain_text",
        text: db.title,
      },
      value: db.value,
    })
  }
  return {
    private_metadata: JSON.stringify(metaData),
    type: "modal",
    callback_id: "search-db-modal",
    title: {
      type: "plain_text",
      text: "Notion bot",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: [
      {
        type: "input",
        block_id: "select_db",
        dispatch_action: true,
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select a DB",
            emoji: true,
          },
          options: dbOptions,
          action_id: "select_db-action",
        },
        label: {
          type: "plain_text",
          text: "DB選択",
        },
      },
    ],
  }
}

export const searchPagesResultView = (metaData: any, urls: any[]) => {
  const dbId = metaData.selected_db_id.replace(/-/g, "")
  let view = {
    private_metadata: JSON.stringify(metaData),
    type: "modal",
    callback_id: "search-db-modal",
    title: {
      type: "plain_text",
      text: "Notion bot",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    submit: {
      type: "plain_text",
      text: "Submit",
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*DB: <https://www.notion.so/${dbId}|${metaData.selected_db_name}>*`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Change DB",
          },
          style: "primary",
          action_id: "change_db-action",
          value: "click_change_db",
        },
      },
      {
        dispatch_action: true,
        type: "input",
        element: {
          type: "plain_text_input",
          action_id: "title_search_input-action",
          placeholder: {
            type: "plain_text",
            text: "Type to search ...",
          },
          initial_value: metaData.search_string ? metaData.search_string : "",
        },
        label: {
          type: "plain_text",
          text: "タイトル検索",
        },
        optional: true,
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Add filter",
            },
            action_id: "add_filter-action",
            value: "click_add_filter",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Clear filter",
            },
            style: "danger",
            action_id: "clear_filter-action",
            value: "click_clear_filter",
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*フィルター*: なし",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*検索結果*",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: urls.join("\n"),
        },
      },
    ],
  }
  if (metaData.filters) {
    view.blocks[3].text.text = "*フィルター*"
    view.blocks[3].text.text += "\n```" + JSON.stringify(metaData.filters) + "```"
  }
  if (metaData.next_cursor) {
    view.blocks[7] = {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Next Result",
          },
          value: metaData.next_cursor,
          action_id: "next_result-action",
        },
      ],
    } as any
  }

  return view
}

export const selectFilterPropertyView = (metaData: any, propOptions: any[]) => {
  return {
    private_metadata: JSON.stringify(metaData),
    type: "modal",
    callback_id: "search-db-modal",
    title: {
      type: "plain_text",
      text: "Notion bot",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: [
      {
        type: "section",
        block_id: "selected_db",
        text: {
          type: "plain_text",
          text: `DB: ${metaData.selected_db_name}`,
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "select_prop",
        dispatch_action: true,
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select a property",
          },
          options: propOptions,
          action_id: "select_prop-action",
        },
        label: {
          type: "plain_text",
          text: "フィルター用プロパティ選択",
        },
      },
    ],
  }
}

export const selectFilterPropertyFieldView = (
  metaData: any,
  selectedPropNameAndType: string,
  filterFieldOptions: string[]
) => {
  return {
    private_metadata: JSON.stringify(metaData),
    type: "modal",
    callback_id: "search-db-modal",
    title: {
      type: "plain_text",
      text: "Notion bot",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: [
      {
        type: "section",
        block_id: "select_db",
        text: {
          type: "plain_text",
          text: `DB: ${metaData.selected_db_name}`,
          emoji: true,
        },
      },
      {
        type: "section",
        block_id: "set_prop",
        text: {
          type: "plain_text",
          text: `Property: ${selectedPropNameAndType}`,
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "select_prop_field",
        dispatch_action: true,
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select a field",
          },
          options: filterFieldOptions,
          action_id: "select_prop_field-action",
        },
        label: {
          type: "plain_text",
          text: "フィルタープロパティのフィールド選択",
        },
      },
    ],
  }
}

export const selectFilterValueInputView = (
  metaData: any,
  selectedPropName: string,
  selectedPropertyField: string
) => {
  return {
    private_metadata: JSON.stringify(metaData),
    type: "modal",
    callback_id: "search-db-modal",
    title: {
      type: "plain_text",
      text: "Notion bot",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: [
      {
        type: "section",
        block_id: "select_db",
        text: {
          type: "plain_text",
          text: `DB: ${metaData.selected_db_name}`,
          emoji: true,
        },
      },
      {
        type: "section",
        block_id: "set_prop",
        text: {
          type: "plain_text",
          text: `Property: ${selectedPropName}`,
          emoji: true,
        },
      },
      {
        type: "section",
        block_id: "select_prop_field",
        text: {
          type: "plain_text",
          text: `field: ${selectedPropertyField}`,
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "select_prop_value_input",
        dispatch_action: true,
        element: {
          type: "plain_text_input",
          action_id: "select_prop_value_input-action",
          placeholder: {
            type: "plain_text",
            text: "Type a value...",
          },
        },
        label: {
          type: "plain_text",
          text: "フィルター値入力",
        },
      },
    ],
  }
}

export const selectFilterValueView = (
  metaData: any,
  selectedProp: FilterValue,
  selectDbPropValueOptions: string[]
) => {
  let selectPropValueType = "static_select"
  let selectPropValueAction = "select_prop_value-action"
  // if (["multi_select", "relation"].includes(selectedProp.prop_type)) {
  //   selectPropValueType = "multi_static_select"
  //   selectPropValueAction = "multi_select_prop_value-action"
  // }
  return {
    private_metadata: JSON.stringify(metaData),
    type: "modal",
    callback_id: "set-filter-property",
    title: {
      type: "plain_text",
      text: "Notion bot",
    },
    // submit: {
    //   type: "plain_text",
    //   text: "Submit",
    // },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: [
      {
        type: "section",
        block_id: "select_db",
        text: {
          type: "plain_text",
          text: `DB: ${metaData.selected_db_name}`,
          emoji: true,
        },
      },
      {
        type: "section",
        block_id: "set_prop",
        text: {
          type: "plain_text",
          text: `Property: ${selectedProp.prop_name}`,
          emoji: true,
        },
      },
      {
        type: "section",
        block_id: "select_prop_field",
        text: {
          type: "plain_text",
          text: `field: ${selectedProp.prop_field}`,
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "select_prop_value",
        dispatch_action: true,
        element: {
          type: selectPropValueType,
          placeholder: {
            type: "plain_text",
            text: "Select a value",
          },
          options: selectDbPropValueOptions,
          action_id: selectPropValueAction,
        },
        label: {
          type: "plain_text",
          text: "フィルター値選択",
        },
      },
    ],
  }
}

export const searchBlock = (data: string, selectProps: any[]) => {
  const blocks = []
  for (const prop of selectProps) {
    const blockSelectOptions = []
    let selectType: string
    switch (prop.type) {
      case "select":
        selectType = "static_select"
        for (const option of prop.select.options) {
          blockSelectOptions.push({
            text: {
              type: "plain_text",
              text: option.name,
            },
            value: option.name,
          })
        }
        break
      case "multi_select":
        selectType = "multi_static_select"
        for (const option of prop.multi_select.options) {
          blockSelectOptions.push({
            text: {
              type: "plain_text",
              text: option.name,
            },
            value: option.name,
          })
        }
        break
      case "relation":
        // relationの場合は prop.relation.database_id のDBの情報も必要になる
        break
      default:
        console.log("Not supported type.")
    }
    const block = {
      type: "section",
      // ID for relation of modal blocks and submited values
      block_id: prop.id,
      text: {
        type: "mrkdwn",
        text: `Pick an ${prop.name}`,
      },
      accessory: {
        type: selectType,
        placeholder: {
          type: "plain_text",
          text: `Select an ${prop.name}`,
        },
        options: blockSelectOptions,
        // "action_id": `${prop.id}-action`
        action_id: "static_select-action",
      },
    }
    console.log(blockSelectOptions)
    blocks.push(block)
  }
  console.dir(blocks, { depth: null })

  return {
    private_metadata: data,
    type: "modal",
    callback_id: "modal-id",
    title: {
      type: "plain_text",
      text: "Notion bot",
    },
    submit: {
      type: "plain_text",
      text: "Search",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: blocks,
  }
}
