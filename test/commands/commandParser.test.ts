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

    it("should parse the 'sync' command", () => {
        const result = parse("sync")

        expect(result.status).toBeTruthy()
        expect((<Success<MiteCommand>>result).value).toEqual({ name: "sync" })
    })

    it("should parse the 'projects <search_string>' command", () => {
        const result = parse("projects general meetings")

        expect(result.status).toBeTruthy()
        expect((<Success<MiteCommand>>result).value).toEqual({ 
            name: "show projects",
            searchString: "general meetings"
        })
    })
    it("should parse the 'projects' command even when no search string is provided", () => {
        const result = parse("projects")

        expect(result.status).toBeTruthy()
        expect((<Success<MiteCommand>>result).value).toEqual({ 
            name: "show projects",
            searchString: undefined
        })
    })
})