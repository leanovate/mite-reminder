jest.mock("../../src/config", () => ({
}))

import { slackUserResolver } from "../../src/slack/slackUserResolver"
import { App } from "@slack/bolt"

describe("Help", () => {
    it("should return the email", async () => {
        const email = "test@email.com"
        const slackApp: App = { client: { users: { info: () => ({ user: { profile: { email } } }) } } as any } as App

        const result = await slackUserResolver(slackApp)("test-slack-id")

        expect(result).toEqual({ email });
    })

    it("should return undefined when the slack api throws", async () => {
        const slackApiError = new Error("You are missing the read.users.email scope")
        const slackApp: App = { client: { users: { info: () => { throw slackApiError } } } as any } as App

        const result = await slackUserResolver(slackApp)("test-slack-id")

        expect(result).toEqual({ email: undefined });
    })
})