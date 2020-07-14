import SlackApi from "./slack/api"
import { createRepository } from "./db/user-repository"

createRepository()
    .then(repository => SlackApi.start(repository))
    .catch(e => console.log("Unable to start the application:", e))
