const miteApiMock = {}
const getTimeEntriesMock = jest.fn()
jest.mock("../../src/mite/mite-api-wrapper", () => ({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    createMiteApi: () => miteApiMock,
    getTimeEntries: getTimeEntriesMock
}))

jest.mock("../../src/config", () => ({
    miteApiKey : "mite-api-key"
}))

import { RegisterCommand, UnregisterCommand, CheckCommand } from "../../src/commands/commandParser"
import { CommandRunner } from "../../src/commands/commands"
import { Repository } from "../../src/db/user-repository"

describe("Commands", () => {

    const userRepository: Repository = {
        /* eslint-disable @typescript-eslint/no-empty-function */
        registerUser: jest.fn(() => { }),
        unregisterUser: jest.fn(() => { }),
        loadUser: jest.fn(() => { })
        /* eslint-enable @typescript-eslint/no-empty-function */
    } as unknown as Repository

    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should register a user without api key in the database", async () => {
        const registerCommand: RegisterCommand = {name: "register"}
        const slackId = "abc"

        await new CommandRunner({slackId}, userRepository).runMiteCommand(registerCommand)

        expect(userRepository.registerUser).toBeCalledTimes(1)
        expect(userRepository.registerUser).toBeCalledWith(slackId, undefined)
    })

    it("should register a user with api key in the database", async () => {
        const slackId = "slack-id"
        const miteApiKey = "mite-api-key"
        const registerCommand: RegisterCommand = {name: "register", miteApiKey}

        await new CommandRunner({slackId}, userRepository).runMiteCommand(registerCommand)

        expect(userRepository.registerUser).toBeCalledTimes(1)
        expect(userRepository.registerUser).toBeCalledWith(slackId, miteApiKey)
    })

    it("should unregister a user", async () => {
        const slackId = "slack-id"
        const unregisterCommand: UnregisterCommand = {name: "unregister"}
    
        await new CommandRunner({slackId}, userRepository).runMiteCommand(unregisterCommand)

        expect(userRepository.unregisterUser).toHaveBeenCalledTimes(1)
        expect(userRepository.unregisterUser).toHaveBeenCalledWith(slackId)
    })

    it("should detect missing time entries for the current user", async () => {
        const slackId = "slack-id"
        const checkCommand: CheckCommand = {name: "check"}

        getTimeEntriesMock.mockReturnValue([])

        await new CommandRunner({slackId}, userRepository).runMiteCommand(checkCommand)

        expect(userRepository.loadUser).toHaveBeenCalledTimes(1)
        expect(userRepository.loadUser).toHaveBeenCalledWith(slackId)
        expect(getTimeEntriesMock).toHaveBeenCalledTimes(1)
        expect(getTimeEntriesMock).toHaveBeenLastCalledWith(miteApiMock, "current", expect.anything(), expect.anything())
    })
})