import SlackApi from "./slack/api"
import { createRepository } from "./db/create-user-repository"

createRepository()
    .then(repository => SlackApi.start(repository))
    .catch(e => console.error("Unable to start the application:", e))
