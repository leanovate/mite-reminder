import { App } from "@slack/bolt"
import { setupMessageHandling, setupHomeTabHandling } from "./events"
import config from "../config"
import { Repository } from "../db/user-repository"
import { scheduleCronJobs } from "./cron"

interface SlackBotApi {
  start: (repository: Repository) => Promise<void>
}

const app = new App({
    token: config.slackToken,
    signingSecret: config.slackSigningSecret
})

const start = async (repository: Repository): Promise<void> => {
    await app.start(process.env.PORT || 3000)
    setupMessageHandling(app, repository)
    setupHomeTabHandling(app, repository)
    scheduleCronJobs(app, repository)

    console.log("⚡️ Bolt app is running!")
}

const api: SlackBotApi = {
    start
}

export default api
