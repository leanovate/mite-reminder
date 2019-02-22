const send = async (context, message) => {
    try {
        const { channel: { id: channelID } } = await context.bot.openIm(context.user);
        await context.bot.postMessage(channelID, message)
    } catch (err) {
        console.log("Failed to send message to user: ", err)
    }
}

module.exports = {
    send
}