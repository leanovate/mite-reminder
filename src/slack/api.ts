import { App } from "@slack/bolt";
import { registerHello } from "./events";
import config from "../config"

interface SlackBotApi {
  start: () => void
}

const app = new App({
  token: config.slackToken,
  signingSecret: config.slackSigningSecret
});

const start = async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  registerHello(app);

  console.log('⚡️ Bolt app is running!');

  // app.client.chat.postMessage({
  //   text: "test",
  //   channel: "<channel-id>",
  //   token: config.slackToken
  // })
}


const api: SlackBotApi = {
  start
}

export default api
