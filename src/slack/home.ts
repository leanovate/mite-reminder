import { App } from "@slack/bolt"
import { Button, KnownBlock, View } from "@slack/web-api"
import { taskEither } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { Task } from "fp-ts/lib/Task"
import moment from "moment"
import { doCheck } from "../commands/commands"
import config from "../config"
import { Repository, User } from "../db/userRepository"
import { missingTimeEntriesBlock } from "./blocks"
import { createUserContextFromUser } from "./createUserContext"

export enum Actions {
    Register = "register",
    Unregister = "unregister",
    Refresh = "refresh",
}

const registerButton: Button = {
    type: "button",
    action_id: Actions.Register,
    text: {
        type: "plain_text",
        text: "Start using mite reminder"
    },
    style: "primary"
}

const refreshButton: Button = {
    type: "button",
    action_id: Actions.Refresh,
    text: {
        type: "plain_text",
        text: "Refresh"
    },
}

const unregisterButton: Button = {
    type: "button",
    action_id: Actions.Unregister,
    style: "danger",
    text: {
        type: "plain_text",
        text: "Stop receiving notifications"
    }
}

const registerBlocks: KnownBlock[] = [
    {
        "type": "actions",
        "elements": [registerButton]
    },
    {
        type: "section",
        text: {
            type: "plain_text",
            text: "If you register you can check your missing mite entries and will receive reminders about them."
        }
    },
    {
        type: "section",
        text: {
            type: "plain_text",
            text: "Reminders will happen each friday morning and will include all days for the past seven days, automatically excluding holidays and weekends."
        }
    }
]

export const publishDefaultHomeTab: (app: App, slackId: string, repository: Repository) => Promise<void> = async (app, slackId, repository) => {
    const user = repository.loadUser(slackId)
    const blocks = user ? await buildMissingTimesBlocks(repository, user)() : registerBlocks

    app.client.views.publish({
        user_id: slackId,
        token: config.slackToken,
        view: {
            type: "home",
            blocks
        }
    })
}

function buildMissingTimesBlocks(repository: Repository, user: User): Task<KnownBlock[]> {
    const userContext = createUserContextFromUser(repository, user)
    const result = doCheck(userContext)
    
    return pipe(
        result,
        taskEither.map(timeEntries => [{
            type: "actions",
            elements: [
                refreshButton,
                unregisterButton
            ]
        },
        ...missingTimeEntriesBlock(timeEntries).blocks,
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `_Update at: ${moment().format("LLL")}_`
            }
        }] as KnownBlock[]
        ),
        taskEither.getOrElse(() => () => Promise.resolve([
            {
                type: "actions",
                elements: [unregisterButton]
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Failed to report missing times, sorry!" + (userContext.miteApi ? " Maybe you have mistyped your api key?":"") 
                }
            } as KnownBlock])
        )
    )
}

export const registerWithApiKeyModal = {
    id: "registerWithApiKeyModal",
    inputBlockId: "miteApiKeyInputBlockId",
    inputBlockActionId: "miteApiKeyInputActionId"
}
export const registerWithApiKeyModalView: View = {
    callback_id: registerWithApiKeyModal.id,
    title: {
        type: "plain_text",
        text: "Register"
    },
    submit: {
        type: "plain_text",
        text: "Register"
    },
    blocks: [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `Sorry, I can't find your mite account. Please register with your mite api key from https://${config.miteAccountName}.mite.yo.lk/myself`
            }
        },
        {
            type: "input",
            block_id: registerWithApiKeyModal.inputBlockId,
            element: {
                type: "plain_text_input",
                placeholder: {
                    type: "plain_text",
                    text: "mite api key"
                },
                action_id: registerWithApiKeyModal.inputBlockActionId
            },
            label: {
                type: "plain_text",
                text: "Enter your mite api key"
            }
        }
    ],
    type: "modal"
}

export async function openRegisterWithApiKeyModal(app: App, triggerId: string): Promise<void> {
    await app.client.views.open({
        token: config.slackToken,
        trigger_id: triggerId,
        view: registerWithApiKeyModalView
    })
}

