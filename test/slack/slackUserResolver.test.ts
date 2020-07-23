jest.mock("../../src/config", () => ({
}))

import { App } from "@slack/bolt"
import { Either } from "fp-ts/lib/Either"
import { isRight, isLeft } from "fp-ts/lib/These"
import { slackUserResolver } from "../../src/slack/slackUserResolver"
import { UnknownAppError } from "../../src/app/errors"

describe("Help", () => {
    it("should return the email", async () => {
        const email = "test@email.com"
        const slackApp: App = { client: { users: { info: () => Promise.resolve({ user: { profile: { email } } }) } } as unknown } as App

        const result = await slackUserResolver(slackApp)("test-slack-id")()

        expect(getLeft(result)).toEqual({ email })
    })

    it("should return an AppError when the slack api throws", async () => {
        const slackApiError = new Error("You are missing the read.users.email scope")
        const slackApp: App = { client: { users: { info: () => Promise.reject(slackApiError) } } as unknown } as App

        const result = await slackUserResolver(slackApp)("test-slack-id")()

        expect(getRight(result)).toEqual(new UnknownAppError(slackApiError))
    })
})

function getLeft<T>(either: Either<unknown, T>): T {
    if(isRight(either)) {
        return either.right
    }

    throw either.left
}

function getRight<T>(either: Either<T, unknown>): T {
    if(isLeft(either)) {
        return either.left
    }

    throw either.right
}