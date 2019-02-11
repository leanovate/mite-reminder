const updateDb = (context, value) => {
    context.db[context.user] = value
    fs.writeFile('db.json', JSON.stringify(context.db), 'utf8', err => {
        if (err) {
            console.error("Failed to update db", err)
            send(context, "Sorry, there was an error completing your action")
        }
        console.log(`Updated db at key '${context.user}'`);
    })
}
const removeFromDb = (context) => {
    delete context.db[context.user]
    fs.writeFile('db.json', JSON.stringify(context.db), 'utf8', err => {
        if (err) {
            console.error("Failed to update db", err)
            sendToId(context, "Sorry, there was an error completing your action")
        }
        console.log(`Removed db at key '${context.user}'`);
    })
}
const registerUser = (context, name, miteApiKey) => {
    updateDb(context, { name, miteApiKey })
    send(context, `Hi ${name}, I registered you. You can now check your times with \`check\`!`)
}
const unregisterUser = (context) => {
    removeFromDb(context)
    sendToId(context, `Ok, I successfully unregistered you.`)
}
        
module.exports = {
    registerUser,
    unregisterUser
}