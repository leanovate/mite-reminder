import P, { Parser } from "parsimmon"

export type Command = Register | Check | Unregister
export type Register = "register" | { command: "register", miteApiKey: string }
export type Check = "check"
export type Unregister = "unregister"

const register: Parser<Register> =
  P.alt(
    P.string("register")
      .then(P.whitespace)
      .then(P.all)
      .map(result => ({ command: "register", miteApiKey: result })),
    P.string("register").result("register")
  )

const unregister: Parser<Unregister> = P.string("unregister").result("unregister")
const check: Parser<Check> = P.string("check").result("check")
const all: Parser<Command> = P.alt(register, unregister, check)

export function parse(commandString: string): P.Result<Command> {
  return all.parse(commandString.trim().toLowerCase())
}

export function tryParse(commandString: string): Command {
  return all.tryParse(commandString.trim().toLowerCase())
}