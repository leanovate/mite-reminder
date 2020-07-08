import { App } from "@slack/bolt"
import { registerHello } from "./events"
import config from "../config"
import { createMiteApi } from "../mite/mite-api-wrapper"

interface SlackBotApi {
  start: () => void
}

const app = new App({
    token: config.slackToken,
    signingSecret: config.slackSigningSecret
})

const start = async (): Promise<void> => {
    // Start your app
    await app.start(process.env.PORT || 3000)


    createMiteApi(config.miteApiKey ?? '123').getTimeEntries({
        from: '1234',
        to: '123',
        user_id: '1234'
    }, entries => {
        console.log(entries)
    })

    registerHello(app)

    console.log('⚡️ Bolt app is running!')

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
