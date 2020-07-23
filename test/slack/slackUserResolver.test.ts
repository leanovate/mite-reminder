jest.mock("../../src/config", () => ({
}))

import { App } from "@slack/bolt"
import { getLeft, getRight } from "../testUtils"
import { UnknownAppError } from "../../src/app/errors"
import { slackUserResolver } from "../../src/slack/slackUserResolver"

describe("Help", () => {
    it("should return the email", async () => {
        const email = "test@email.com"
        const slackApp: App = { client: { users: { info: () => Promise.resolve({ user: { profile: { email } } }) } } as unknown } as App

        const result = await slackUserResolver(slackApp)("test-slack-id")()

        expect(getRight(result)).toEqual({ email })
    })

    it("should return an AppError when the slack api throws", async () => {
        const slackApiError = new Error("You are missing the read.users.email scope")
        const slackApp: App = { client: { users: { info: () => Promise.reject(slackApiError) } } as unknown } as App

        const result = await slackUserResolver(slackApp)("test-slack-id")()

        expect(getLeft(result)).toEqual(new UnknownAppError(slackApiError))
    })
})
