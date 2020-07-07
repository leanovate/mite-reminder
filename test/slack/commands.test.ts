import { parse } from "../../src/slack/commands"

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
    expect((<any>result).value).toEqual("register")
  })

  it("should parse the 'check' command", () => {
    expect(parse("check").status).toBeTruthy()
  })
})