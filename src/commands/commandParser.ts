import P, { Parser } from "parsimmon"

export type CommandName = "register" | "check" | "unregister"

export interface BaseMiteCommand  {
    name: CommandName
}

export interface RegisterCommand extends BaseMiteCommand {
    name : "register" 
    miteApiKey?: string
}

export interface CheckCommand extends BaseMiteCommand {
    name : "check"
}

export interface UnregisterCommand extends BaseMiteCommand {
    name: "unregister"
}

export type MiteCommand = RegisterCommand | CheckCommand | UnregisterCommand

const register: Parser<RegisterCommand> =
  P.alt(
      P.string("register")
          .then(P.whitespace)
          .then(P.all)
          .map(result => ({ name: "register", miteApiKey: result }) as RegisterCommand),
      P.string("register").result( { name: "register" } as RegisterCommand)
  )

const unregister: Parser<UnregisterCommand> = P.string("unregister").result({ name: "unregister" } as UnregisterCommand)
const check: Parser<CheckCommand> = P.string("check").result({ name: "check" } as CheckCommand)
const all: Parser<MiteCommand> = P.alt(register, unregister, check)

export function parse(commandString: string): P.Result<MiteCommand> {
    return all.parse(commandString.trim().toLowerCase())
}

export function tryParse(commandString: string): MiteCommand {
    return all.tryParse(commandString.trim().toLowerCase())
}