import { App } from "@slack/bolt";
import { datesWithoutEntries } from "./bot";

export const registerHello = (app: App) => app.message(async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered

  console.log("received ", message)
  if (message.text === "register") {
    await say({
      text: "I don't know you, please enter your mite api key.",
      blocks: [
        {
          "type": "input",
          "block_id": "input123",
          "label": {
            "type": "plain_text",
            "text": "Label of input"
          },
          "element": {
            "type": "plain_text_input",
            "action_id": "plain_input",
            "placeholder": {
              "type": "plain_text",
              "text": "Enter some plain text"
            }
          }
        }
      ]
    })
    return
  }

  const missingEntriesMessage: string = await datesWithoutEntries()
  await say({
    text: "Some of your time entries is missing",
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text":
            `Hey *there* <@${message.user}>!
            ${missingEntriesMessage}`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Click Me"
          },
          "action_id": "button_click"
        }
      }
    ]
  });
});
