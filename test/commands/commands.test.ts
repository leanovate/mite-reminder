const getTimeEntriesMock = jest.fn()
const getMiteIdMock = jest.fn()
jest.mock("../../src/mite/mite-api-wrapper", () => ({
    getTimeEntries: getTimeEntriesMock,
    getMiteIdByEmail: getMiteIdMock
}))

import { MiteApi } from "mite-api"
import { RegisterCommand } from "../../src/commands/commandParser"
import { doCheck, doRegister, doUnregister, Failures } from "../../src/commands/commands"
import { Config } from "../../src/config"
import { Repository } from "../../src/db/user-repository"
import { UserContext } from "../../src/slack/userContext"
import { taskEither, option } from "fp-ts"

describe("Commands", () => {
    const loadUserMock = jest.fn()

    const registerUserWithMiteIdMock = jest.fn()
    const registerUserWithMiteApiKeyMock = jest.fn()

    const userRepository: Repository = {
        /* eslint-disable @typescript-eslint/no-empty-function */
        registerUserWithMiteApiKey: registerUserWithMiteApiKeyMock,
        registerUserWithMiteId: registerUserWithMiteIdMock,
        unregisterUser: jest.fn(() => { }),
        loadUser: loadUserMock
        /* eslint-enable @typescript-eslint/no-empty-function */
    } as unknown as Repository

    const miteApiMock = {} as unknown as MiteApi

    const defaultUserContext: UserContext = {
        repository: userRepository,
        config: {
            miteApiKey: "mite-api-key"
        } as unknown as Config,
        miteApi: miteApiMock,
        slackId: "slack-id"
    }

    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should register a user without api key in the database", async () => {
        const registerCommand: RegisterCommand = { name: "register" }
        const miteId = 4711
        getMiteIdMock.mockReturnValue(taskEither.right(option.of(miteId)))
        registerUserWithMiteIdMock.mockReturnValue(taskEither.right(null))

        await doRegister(registerCommand, defaultUserContext, () => taskEither.right({ email: "test@email.com" }))()

        expect(userRepository.registerUserWithMiteId).toBeCalledTimes(1)
        expect(userRepository.registerUserWithMiteId).toBeCalledWith(defaultUserContext.slackId, miteId)
    })

    it("should register a user with api key in the database", async () => {
        const miteApiKey = "mite-api-key"
        const registerCommand: RegisterCommand = { name: "register", miteApiKey }
        registerUserWithMiteApiKeyMock.mockReturnValue(taskEither.right(null))

        await doRegister(registerCommand, defaultUserContext, () => taskEither.right({ email: "test@email.com" }))()

        expect(userRepository.registerUserWithMiteApiKey).toBeCalledTimes(1)
        expect(userRepository.registerUserWithMiteApiKey).toBeCalledWith(defaultUserContext.slackId, miteApiKey)
    })

    it("should unregister a user", async () => {
        await doUnregister(defaultUserContext)

        expect(userRepository.unregisterUser).toHaveBeenCalledTimes(1)
        expect(userRepository.unregisterUser).toHaveBeenCalledWith(defaultUserContext.slackId)
    })

    it("should detect missing time entries for the current user", async () => {
        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({ miteApiKey: "mite-api-key" })

        await doCheck(defaultUserContext)

        expect(userRepository.loadUser).toHaveBeenCalledTimes(1)
        expect(userRepository.loadUser).toHaveBeenCalledWith(defaultUserContext.slackId)
        expect(getTimeEntriesMock).toHaveBeenCalledTimes(1)
        expect(getTimeEntriesMock).toHaveBeenLastCalledWith(miteApiMock, "current", expect.anything(), expect.anything())
    })

    it("should detect missing time entries for a user without a personal api key", async () => {
        const slackId = "slack-id"
        const miteId = "mite-id"

        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({ miteId })

        await doCheck(defaultUserContext)

        expect(userRepository.loadUser).toHaveBeenCalledTimes(1)
        expect(userRepository.loadUser).toHaveBeenCalledWith(slackId)
        expect(getTimeEntriesMock).toHaveBeenCalledTimes(1)
        expect(getTimeEntriesMock).toHaveBeenLastCalledWith(miteApiMock, miteId, expect.anything(), expect.anything())
    })

    it("should return a failure if the user has no api key and is unknown", async () => {
        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue(null)

        const result = await doCheck(defaultUserContext)

        expect(result).toEqual(Failures.UserIsUnknown)
    })
})