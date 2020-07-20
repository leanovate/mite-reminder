const getTimeEntriesMock = jest.fn()
const getMiteIdMock = jest.fn()
jest.mock("../../src/mite/mite-api-wrapper", () => ({
    getTimeEntries: getTimeEntriesMock,
    getMiteIdByEmail: getMiteIdMock
}))

import { RegisterCommand, UnregisterCommand, CheckCommand } from "../../src/commands/commandParser"
import { CommandRunner, Failures } from "../../src/commands/commands"
import { Repository } from "../../src/db/user-repository"
import { Config } from "../../src/config"
import { UserContext } from "../../src/slack/events"
import { MiteApi } from "mite-api"

describe("Commands", () => {
    const loadUserMock = jest.fn()

    const userRepository: Repository = {
        /* eslint-disable @typescript-eslint/no-empty-function */
        registerUser: jest.fn(() => { }),
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

        await new CommandRunner(defaultUserContext).runMiteCommand(registerCommand)

        expect(userRepository.registerUser).toBeCalledTimes(1)
        expect(userRepository.registerUser).toBeCalledWith(defaultUserContext.slackId, undefined)
    })

    it("should register a user with api key in the database", async () => {
        const miteApiKey = "mite-api-key"
        const registerCommand: RegisterCommand = { name: "register", miteApiKey }

        await new CommandRunner(defaultUserContext).runMiteCommand(registerCommand)

        expect(userRepository.registerUser).toBeCalledTimes(1)
        expect(userRepository.registerUser).toBeCalledWith(defaultUserContext.slackId, miteApiKey)
    })

    it("should unregister a user", async () => {
        const unregisterCommand: UnregisterCommand = { name: "unregister" }

        await new CommandRunner(defaultUserContext).runMiteCommand(unregisterCommand)

        expect(userRepository.unregisterUser).toHaveBeenCalledTimes(1)
        expect(userRepository.unregisterUser).toHaveBeenCalledWith(defaultUserContext.slackId)
    })

    it("should detect missing time entries for the current user", async () => {
        const checkCommand: CheckCommand = { name: "check" }

        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({ miteApiKey: "mite-api-key" })

        await new CommandRunner(defaultUserContext).runMiteCommand(checkCommand)

        expect(userRepository.loadUser).toHaveBeenCalledTimes(1)
        expect(userRepository.loadUser).toHaveBeenCalledWith(defaultUserContext.slackId)
        expect(getTimeEntriesMock).toHaveBeenCalledTimes(1)
        expect(getTimeEntriesMock).toHaveBeenLastCalledWith(miteApiMock, "current", expect.anything(), expect.anything())
    })

    it("should detect missing time entries for a user without a personal api key", async () => {
        const slackId = "slack-id"
        const miteId = "mite-id"
        const checkCommand: CheckCommand = { name: "check" }

        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({})
        getMiteIdMock.mockReturnValue(miteId)

        await new CommandRunner(defaultUserContext).runMiteCommand(checkCommand)

        expect(userRepository.loadUser).toHaveBeenCalledTimes(1)
        expect(userRepository.loadUser).toHaveBeenCalledWith(slackId)
        expect(getTimeEntriesMock).toHaveBeenCalledTimes(1)
        expect(getTimeEntriesMock).toHaveBeenLastCalledWith(miteApiMock, miteId, expect.anything(), expect.anything())
    })

    it("should return a failure if the user has no api key and is unknown", async () => {
        expect.assertions(1)
        const checkCommand: CheckCommand = { name: "check" }

        getTimeEntriesMock.mockReturnValue([])
        loadUserMock.mockReturnValue({})
        getMiteIdMock.mockReturnValue(null)

        const result = await new CommandRunner(defaultUserContext).runMiteCommand(checkCommand)

        expect(result).toEqual(Failures.UserIsUnknown)
    })
})