export const searchBlock = (data: string, selectProps: any[]) => {
  const blocks = []
  for (const prop of selectProps) {
    const blockSelectOptions = []
    switch (prop.type) {
      case "select":
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
        break;
      default:
        console.log("Not supported type.")
    }
    const block = {
      "type": "section",
      "block_id": prop.id,
      "text": {
        "type": "mrkdwn",
        "text": `Pick an ${prop.name}`
      },
      "accessory": {
        "type": "static_select",
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
