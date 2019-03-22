const SlackBot = require('slackbots');

const send = async (context, message) => {
    try {
        const { channel: { id: channelID } } = await context.bot.openIm(context.user);
        await context.bot.postMessage(channelID, message)
    } catch (err) {
        console.log("Failed to send message to user: ", err)
    }
}

const createBot = (name, disconnect) => new SlackBot({
    token: process.env.SLACK_TOKEN,
    name,
    disconnect
});

module.exports = {
    send,
    createBot
}