import { App } from "@slack/bolt"
import { setupEventHandling } from "./events"
import config from "../config"
import { Repository } from "../db/user-repository"

interface SlackBotApi {
  start: (repository: Repository) => void
}

const app = new App({
    token: config.slackToken,
    signingSecret: config.slackSigningSecret
})

const start = async (repository: Repository): Promise<void> => {
    await app.start(process.env.PORT || 3000)
    await setupEventHandling(app, repository)

    console.log("⚡️ Bolt app is running!")
}

const api: SlackBotApi = {
    start
}

export default api
