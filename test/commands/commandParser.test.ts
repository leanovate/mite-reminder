import { parse, Command } from "../../src/commands/commandParser"
import { Success } from "parsimmon"

describe("command parser", () => {
    it("should trim leading and trailing whitespaces", () => {
        expect(parse(" register ").status).toBeTruthy()
    })
    it("should ignore case", () => {
        expect(parse(" register ").status).toBeTruthy()
    })

    it("should parse the 'register' command", () => {
        const result = parse("register")

        expect(result.status).toBeTruthy()
        expect((<Success<Command>>result).value).toEqual("register")
    })

    it("should parse the 'register' command with a miteApiKey", () => {
        const testKey = "my-mite-api-key"
        const result = parse(`register ${testKey}`)

        expect(result.status).toBeTruthy()
        expect((<Success<Command>>result).value).toEqual({ command: "register", miteApiKey: testKey })
    })

    it("should parse the 'check' command", () => {
        expect(parse("check").status).toBeTruthy()
    })
})