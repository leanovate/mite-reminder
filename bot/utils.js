const SlackBot = require('slackbots');
const { getConfig } = require('./config')

const send = async (context, message) => {
    try {
        const { channel: { id: channelID } } = await context.bot.openIm(context.user);
        await context.bot.postMessage(channelID, message)
    } catch (err) {
        console.log("Failed to send message to user: ", err)
    }
}

const createBot = (name, disconnect) => new SlackBot({
    token: getConfig().slackToken,
    name,
    disconnect
});

const lastWeekThursdayToThursday = currentMoment => {
    const mostRecentThursday = currentMoment.clone().day(currentMoment.day() > 4 ? 4 : -3);
    const secondMostRecentThursday = mostRecentThursday.clone().subtract(1, "week")

    return {
        start: secondMostRecentThursday,
        end: mostRecentThursday
    }
}

module.exports = {
    send,
    createBot,
    lastWeekThursdayToThursday
}