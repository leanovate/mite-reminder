# mite-reminder
This is a slack app for reminding mite users about missing time entries.

## How to run
You will need to set up a few environment variables. Either `export <VAR_NAME>=<VAR_VALUE>` them or put them in a `.env` [file](https://github.com/motdotla/dotenv#readme).

You will need:
* `SLACK_TOKEN` and `SLACK_SIGNING_SECRET`. You can get these when you setup a new app in slack.
* `MITE_ACCOUNT_NAME`. This is the prefix of your mite url in `https://<MITE_ACCOUNT_NAME>.mite.yo.lk`
* (optionally) `MITE_API_KEY`. Adding a mite api key with admin rights allows the user to check for times without having to provide its own api key.

Then, run the app with:
```
npm i
npm start
```