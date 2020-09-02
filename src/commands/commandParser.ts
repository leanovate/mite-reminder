import P, { Parser } from "parsimmon"

export type CommandName = "register" | "check" | "unregister" | "check channel"

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

export interface CheckChannel extends BaseMiteCommand {
    name: "check channel",
    channelName: string
}

export type MiteCommand = RegisterCommand | CheckCommand | UnregisterCommand | CheckChannel

const register: Parser<RegisterCommand> =
  P.alt(
      P.string("register")
          .then(P.whitespace)
          .then(P.all)
          .map(result => ({ name: "register", miteApiKey: result } as RegisterCommand)),
      P.string("register").result( { name: "register" } as RegisterCommand)
  )

const unregister: Parser<UnregisterCommand> = P.string("unregister").result({ name: "unregister" } as UnregisterCommand)
const check: Parser<CheckCommand> = P.string("check").result({ name: "check" } as CheckCommand)
const checkChannel: Parser<CheckChannel> = P.string("check")
    .then(P.whitespace)
    .skip(P.string("<#"))
    .then(P.takeWhile(char => char !== "|"))
    .skip(P.all)
    .map(result => ({ name: "check channel", channelName: result.toUpperCase() } as CheckChannel))
const all: Parser<MiteCommand> = P.alt(register, unregister, checkChannel, check)

export function parse(commandString: string): P.Result<MiteCommand> {
    return all.parse(commandString.trim().toLowerCase())
}

export function tryParse(commandString: string): MiteCommand {
    return all.tryParse(commandString.trim().toLowerCase())
}