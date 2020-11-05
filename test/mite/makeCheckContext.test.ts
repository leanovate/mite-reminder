import { either } from "fp-ts"
import { UserIsUnknown } from "../../src/app/errors"
import { Repository, User } from "../../src/db/userRepository"
import { makeCheckContext } from "../../src/mite/makeCheckContext"
import { UserContext } from "../../src/slack/userContext"

describe("makeCheckContext", () => {
    it("should return failure if user could not be found by slackId", () => {
        const slackId = "4711"
        const loadUser: (slackId: string) => User | null = () => null
        const repository = <Repository>{ loadUser }
        const userContext = <UserContext>{
            slackId,
            repository
        }
        const result = makeCheckContext(userContext)
        expect(result).toEqual(either.left(new UserIsUnknown(slackId)))
    })
})