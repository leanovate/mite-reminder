describe("Help", () => {
    const sayMock = jest.fn()

    afterEach(() => {
        jest.clearAllMocks()
        jest.resetModules()
    })

    it("should respond with default help text, when mite admin key should not be used", async () => {
        jest.mock("../../src/config", () => ({
            miteApiKey: undefined,
            miteAccountName: "test"
        }))

        sayMock.mockReturnValue(Promise.resolve())

        const help = await import("../../src/slack/help")
        await help.sayHelp(sayMock)

        expect(sayMock).toBeCalledTimes(1)
        expect(sayMock.mock.calls[0][0]).toContain("Use `register <MITE_API_KEY>` to receive mite reminders in the future")
    })

    it("should respond with admin help text, when mite admin key should be used", async () => {
        jest.mock("../../src/config", () => ({
            miteApiKey: "mite-api-key"
        }))

        sayMock.mockReturnValue(Promise.resolve())

        const help = await import("../../src/slack/help")
        await help.sayHelp(sayMock)

        expect(sayMock).toBeCalledTimes(1)
        expect(sayMock.mock.calls[0][0]).toContain("Use `register` to receive mite reminders in the future.")
    })
})