const send = async (context, message) => {
    const { channel: { id: channelID } } = await context.bot.openIm(context.user);
    await context.bot.postMessage(channelID, message)
}

module.exports = {
    send
}