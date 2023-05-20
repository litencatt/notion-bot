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
          "text": "Select DB"
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
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "プロパティ"
        },
        "accessory": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select an item",
            "emoji": true
          },
          "options": [
            {
              "text": {
                "type": "plain_text",
                "text": "*this is plain_text text*",
                "emoji": true
              },
              "value": "value-0"
            },
          ],
          "action_id": "static_select-action"
        }
      },
      {
        "block_id": "set_prop_field",
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Selectプロパティ検索フィールド",
        },
        "accessory": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select a field",
            "emoji": true
          },
          "options": [
            {
              "text": {
                "type": "plain_text",
                "text": "*this is plain_text text*",
                "emoji": true
              },
              "value": "value-0"
            },
          ],
          "action_id": "set_prop_field-action"
        },
      }
    ]
  }
}

export const setPropView = (data: any[]) => {
  const propOptions = []
  for (const prop of data) {
    propOptions.push({
      text: {
        type: "plain_text",
        text: prop,
      },
      value: prop
    })
  }
  return {
    "type": "modal",
    "callback_id": "search-db-modal",
    "title": {
      "type": "plain_text",
      "text": "Notion bot",
    },
    "submit": {
      "type": "plain_text",
      "text": "Set",
    },
    "close": {
      "type": "plain_text",
      "text": "Cancel",
    },
    "blocks": [
      {
        "type": "input",
        "element": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select an item",
            "emoji": true
          },
          "options": propOptions,
          "action_id": "set_prop-action"
        },
        "label": {
          "type": "plain_text",
          "text": "Select a Property",
          "emoji": true
        }
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
          "text": "プロパティ"
        },
        "accessory": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select an item",
            "emoji": true
          },
          "options": propOptions,
          "action_id": "set_prop-action"
        }
      },
      {
        "block_id": "set_prop_field",
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Selectプロパティ検索フィールド",
        },
        "accessory": {
          "type": "static_select",
          "placeholder": {
            "type": "plain_text",
            "text": "Select a field",
            "emoji": true
          },
          "options": [
            {
              "text": {
                "type": "plain_text",
                "text": "*this is plain_text text*",
                "emoji": true
              },
              "value": "value-0"
            },
          ],
          "action_id": "set_prop_field-action"
        }
      }
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
          "text": "Selectプロパティ検索フィールド",
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
          "text": "プロパティ検索値",
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


export const getFilterFields = async (
  type: string
) => {
  switch (type) {
    case 'number':
      return [
        'equals',
        'does_not_equal',
        'greater_than',
        'greater_than_or_equal_to',
        'less_than',
        'less_than_or_equal_to',
        'is_empty',
        'is_not_empty',
      ]
    case 'select':
      return [
        'equals',
        'does_not_equal',
        'is_empty',
        'is_not_empty',
      ]
    case 'multi_select':
    case 'relation':
      return [
        'contains',
        'does_not_contain',
        'is_empty',
        'is_not_empty',
      ]
    default:
      console.log(`${type} is not support type`)
      return null
  }
}
