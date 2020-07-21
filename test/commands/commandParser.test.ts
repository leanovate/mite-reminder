import { parse, MiteCommand } from "../../src/commands/commandParser"
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
        expect((<Success<MiteCommand>>result).value).toEqual({name: "register"})
    })

    it("should parse the 'register' command with a miteApiKey", () => {
        const testKey = "my-mite-api-key"
        const result = parse(`register ${testKey}`)

        expect(result.status).toBeTruthy()
        expect((<Success<MiteCommand>>result).value).toEqual({ name: "register", miteApiKey: testKey })
    })

    it("should parse the 'check' command", () => {
        expect(parse("check").status).toBeTruthy()
    })
})