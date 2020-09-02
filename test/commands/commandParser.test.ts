import { parse, MiteCommand, tryParse } from "../../src/commands/commandParser"
import { Success } from "parsimmon"

describe("command parser", () => {
    it("should trim leading and trailing whitespaces", () => {
        expect(parse(" register ").status).toBeTruthy()
    })
    it("should ignore case", () => {
        expect(parse("Register").status).toBeTruthy()
    })

    it("should parse the 'register' command", () => {
        const result = parse("register")

        expect(result.status).toBeTruthy()
        expect((<Success<MiteCommand>>result).value).toEqual({ name: "register" })
    })

    it("should extract the channel id from the 'check channel' command", () => {
        const result = parse("check <#E43QM54DC|general>")

        tryParse("check <#E43QM54DC|general>")
        expect(result.status).toBeTruthy()
        expect((<Success<MiteCommand>>result).value).toEqual({ name: "check channel", channelName: "E43QM54DC" })
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