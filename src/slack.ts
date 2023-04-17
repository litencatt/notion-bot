export const searchBlock = (data: string, selectProps: any[]) => {
  const blockSelectOptions = []
  for (const prop of selectProps) {
    for (const option of prop.options) {
      blockSelectOptions.push({
        "text": {
          "type": "plain_text",
          "text": option.name
        },
        "value": option.name
      })
    }
  }
  console.log(blockSelectOptions)

  const blocks = [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Pick an service"
      },
      "accessory": {
        "type": "static_select",
        "placeholder": {
          "type": "plain_text",
          "text": "Select an item",
        },
        "options": blockSelectOptions,
        "action_id": "static_select-action"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Select tag names"
      },
      "accessory": {
        "type": "multi_static_select",
        "placeholder": {
          "type": "plain_text",
          "text": "Select tag names",
        },
        "options": blockSelectOptions,
        "action_id": "multi_static_select-action"
      }
    },
  ]
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
