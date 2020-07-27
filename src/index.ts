import SlackApi from "./slack/api"
import { createRepository } from "./db/create-user-repository"
import { pipe } from "fp-ts/lib/function"
import { fold } from "fp-ts/lib/TaskEither"

pipe(
    createRepository(),
    fold(
        e => async () => console.error("Unable to start the application:", e),
        repository => () => SlackApi.start(repository)
    )
)()
