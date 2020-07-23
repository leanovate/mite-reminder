import { App } from "@slack/bolt"
import { option, taskEither as T } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { TaskEither } from "fp-ts/lib/TaskEither"
import { AppError, UnknownAppError, UserIsUnknown } from "../app/errors"
import { orElseFailWith } from "../app/utils"
import config from "../config"
import { SlackApiUser } from "./events"

export const slackUserResolver: (_: App) => (_: string) => TaskEither<AppError, { email: string }> = app => slackId => {
    const task: TaskEither<AppError, SlackApiUser> = T.tryCatch(
        () => app.client.users.info({ user: slackId, token: config.slackToken }),
        e => {
            console.warn(`Failed get the email of user '${slackId}' from slack because of:`, e)
            return new UnknownAppError(e)
        }
    )

    return pipe(
        task,
        T.map(result => option.fromNullable(result.user?.profile?.email)),
        T.chain(orElseFailWith<string>(new UserIsUnknown(slackId))),
        T.map(email => ({ email }))
    )
}