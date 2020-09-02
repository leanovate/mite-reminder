import { App } from "@slack/bolt";
import { taskEither as T } from "fp-ts";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { AppError, UnknownAppError } from "../app/errors";

export const getAllUsersFromChannel = (app: App, channelName: string): TaskEither<AppError, string[]> =>
    T.tryCatch(
        () => app.client.conversations.members({ channel: channelName }).then((result: any) => result["members"]),
        (e: unknown) => {
            console.warn(`Failed to get members of channel ${channelName}`, e)
            return new UnknownAppError(e)
        }
    )