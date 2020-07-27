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

        const expectedText = `
Use \`register <MITE_API_KEY>\` to receive mite reminders in the future. You can find your api key here: https://test.mite.yo.lk/myself
Use \`check\` to for missing time entries. Holidays and weekends are automatically excluded.
Use \`unregister\` to undo your registration.
`
        sayMock.mockReturnValue(Promise.resolve())

        const help = await import("../../src/slack/help")
        await help.sayHelp(sayMock)

        expect(sayMock).toBeCalledTimes(1)
        expect(sayMock).toBeCalledWith(expectedText)
    })

    it("should respond with admin help text, when mite admin key should be used", async () => {
        const expectedText = `
Use \`register\` to receive mite reminders in the future.
Use \`check\` to for missing time entries. Holidays and weekends are automatically excluded.
Use \`unregister\` to undo your registration.
`

        jest.mock("../../src/config", () => ({
            miteApiKey: "mite-api-key"
        }))

        sayMock.mockReturnValue(Promise.resolve())

        const help = await import("../../src/slack/help")
        await help.sayHelp(sayMock)

        expect(sayMock).toBeCalledTimes(1)
        expect(sayMock).toBeCalledWith(expectedText)
    })
})