const { getCommand } = require("../../bot/commands")

describe("commands parsing", () => {
    describe("leniency with white spaces", () => {
        it("should parse with two arguments with additional white spaces", () => {
            const myMiteApiKey = "my-mite-api-key"
            expect(getCommand(`  register   ${myMiteApiKey}    `)).toEqual({
                name: "register",
                miteApiKey: myMiteApiKey
            })
        })
    })
    describe("register", () => {
        it("should parse without miteApiKey", () => {
            expect(getCommand("register")).toEqual({ name: "register" })
        })
        it("should parse with a miteApiKey", () => {
            const myMiteApiKey = "my-mite-api-key"
            expect(getCommand(`register ${myMiteApiKey}`)).toEqual({
                name: "register",
                miteApiKey: myMiteApiKey
            })
        })
    })
    describe("others", () => {
        it("should parse help", () => {
            expect(getCommand("help")).toEqual({ name: "help" })
        })
        it("should parse unregister", () => {
            expect(getCommand("unregister")).toEqual({ name: "unregister" })
        })
        it("should parse check", () => {
            expect(getCommand("check")).toEqual({ name: "check" })
        })
        it("should return unknown for unrecognized commands", () => {
            expect(getCommand("an-unrecognized-command")).toEqual({name: "unknown"})
        })
    })
})