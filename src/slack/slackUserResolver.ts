import { App } from "@slack/bolt"
import { SlackApiUser } from "./events"
import config from "../config"

export const slackUserResolver: (app: App) => (id: string) => Promise<{ email: string | undefined }> = app => async id => {
    const apiCallResult: SlackApiUser = await app.client.users.info({
        user: id,
        token: config.slackToken
    })
    return { email: apiCallResult.user?.profile?.email }
}