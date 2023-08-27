export const searchDbView = (metaData: any, data: any[]) => {
  const dbOptions = []
  for (const db of data) {
    dbOptions.push({
      text: {
        type: "plain_text",
        text: db.title,
      },
      value: db.value
    })
  }
  return {
    "private_metadata": JSON.stringify(metaData),
    "type": "modal",
    "callback_id": "search-db-modal",
    "title": {
      "type": "plain_text",
      "text": "Notion bot",
    },
    "submit": {
      "type": "plain_text",
      "text": "Search DB",
    },
    "close": {
      "type": "plain_text",
      "text": "Cancel",
    },
    "blocks": [
      {
        "block_id": "select_db",
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "DB選択"
        },
        "accessory": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select a DB",
            "emoji": true
          },
          "options": dbOptions,
          "action_id": "select_db-action"
        }
      },
    ]
  }
}

export const searchResultModal = (metaData: any, urls: any[]) => {
  return {
    "private_metadata": JSON.stringify(metaData),
    "type": "modal",
    "callback_id": "search-db-modal",
    "title": {
      "type": "plain_text",
      "text": "Notion bot",
    },
    "submit": {
      "type": "plain_text",
      "text": "Search DB",
    },
    "close": {
      "type": "plain_text",
      "text": "Cancel",
    },
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `database: ${metaData.selected_db_name}`
        },
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Add Filter",
            },
            "action_id": "add_filter-action",
            "value": "click_add_filter",
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Change database",
            },
            "style": "primary",
            "value": "click_change_db",
          },
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*検索結果*"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "フィルター:\n```" + JSON.stringify(metaData.filter) + "```"
        }
      },
      {
        "type": "divider",
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": urls.join("\n")
        }
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Next Results",
            },
            "value": "click_next_results",
          },
        ]
      }
    ]
  }
}

export const searchDbView2 = (metaData: any, data: any[], dbName: string) => {
  const propOptions = []
  for (const prop of data) {
    propOptions.push({
      text: {
        type: "plain_text",
        text: `${prop.prop_name} (${prop.prop_type})`,
      },
      value: prop.prop_name
    })
  }
  return {
    "private_metadata": JSON.stringify(metaData),
    "type": "modal",
    "callback_id": "search-db-modal",
    "title": {
      "type": "plain_text",
      "text": "Notion bot",
    },
    "submit": {
      "type": "plain_text",
      "text": "Search DB",
    },
    "close": {
      "type": "plain_text",
      "text": "Cancel",
    },
    "blocks": [
      {
        "block_id": "select_db",
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": `Selected DB: ${dbName}`,
          "emoji": true
        }
      },
      {
        "block_id": "set_prop",
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "フィルター用プロパティ選択"
        },
        "accessory": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select a property",
            "emoji": true
          },
          "options": propOptions,
          "action_id": "set_prop-action"
        }
      },
    ]
  }
}

export const searchDbView3 = (metaData: any, data: string[]) => {
  const propFields = []
  for (const field of data) {
    propFields.push({
      text: {
        type: "plain_text",
        text: field
      },
      value: field
    })
  }
  return {
    "private_metadata": JSON.stringify(metaData),
    "type": "modal",
    "callback_id": "search-db-modal",
    "title": {
      "type": "plain_text",
      "text": "Notion bot",
    },
    "submit": {
      "type": "plain_text",
      "text": "Search DB",
    },
    "close": {
      "type": "plain_text",
      "text": "Cancel",
    },
    "blocks": [
      {
        "block_id": "select_db",
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": `Selected DB: ${metaData.selected_db_name}`,
          "emoji": true
        }
      },
      {
        "block_id": "set_prop",
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": `Selected Property: ${metaData.selected_prop_name}`,
          "emoji": true
        }
      },
      {
        "block_id": "set_prop_field",
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "フィルタープロパティのフィールド選択",
        },
        "accessory": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select a field",
            "emoji": true
          },
          "options": propFields,
          "action_id": "set_prop_field-action"
        },
      }
    ]
  }
}

export const searchDbView4 = (metaData: any, data: string[]) => {
  const propOptions = []
  for (const o of data) {
    propOptions.push({
      text: {
        type: "plain_text",
        text: o
      },
      value: o
    })
  }
  return {
    "private_metadata": JSON.stringify(metaData),
    "type": "modal",
    "callback_id": "search-db-modal",
    "title": {
      "type": "plain_text",
      "text": "Notion bot",
    },
    "submit": {
      "type": "plain_text",
      "text": "Search DB",
    },
    "close": {
      "type": "plain_text",
      "text": "Cancel",
    },
    "blocks": [
      {
        "block_id": "select_db",
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": `Selected DB: ${metaData.selected_db_name}`,
          "emoji": true
        }
      },
      {
        "block_id": "set_prop",
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": `Selected Property: ${metaData.selected_prop_name}`,
          "emoji": true
        }
      },
      {
        "block_id": "set_prop_field",
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": `Selected field: ${metaData.selected_prop_field}`,
          "emoji": true
        }
      },
      {
        "block_id": "set_prop_value",
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "フィルター値入力",
        },
        "accessory": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select a field",
            "emoji": true
          },
          "options": propOptions,
          "action_id": "set_prop_value-action"
        },
      }
    ]
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
            "text": {
              "type": "plain_text",
              "text": option.name
            },
            "value": option.name
          })
        }
        break;
      case "multi_select":
        selectType = "multi_static_select"
        for (const option of prop.multi_select.options) {
          blockSelectOptions.push({
            "text": {
              "type": "plain_text",
              "text": option.name
            },
            "value": option.name
          })
        }
        break;
      case "relation":
        // relationの場合は prop.relation.database_id のDBの情報も必要になる
        break;
      default:
        console.log("Not supported type.")
    }
    const block = {
      "type": "section",
      // ID for relation of modal blocks and submited values
      "block_id": prop.id,
      "text": {
        "type": "mrkdwn",
        "text": `Pick an ${prop.name}`
      },
      "accessory": {
        "type": selectType,
        "placeholder": {
          "type": "plain_text",
          "text": `Select an ${prop.name}`,
        },
        "options": blockSelectOptions,
        // "action_id": `${prop.id}-action`
        "action_id": "static_select-action"
      }
    }
    console.log(blockSelectOptions)  
    blocks.push(block)
  }
  console.dir(blocks, {depth: null})

  return {
    "private_metadata": data,
    "type": "modal",
    "callback_id": "modal-id",
    "title": {
      "type": "plain_text",
      "text": "Notion bot",
    },
    "submit": {
      "type": "plain_text",
      "text": "Search",
    },
    "close": {
      "type": "plain_text",
      "text": "Cancel",
    },
    "blocks": blocks
  }
}
