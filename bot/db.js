const fs = require('fs');
const { send } = require("./utils")

const dbPath = process.env.DB_PATH || "db.json"

const updateDb = (context, value) => {
    context.db[context.user] = value
    fs.writeFile(dbPath, JSON.stringify(context.db), 'utf8', err => {
        if (err) {
            console.error("Failed to update db", err)
            send(context, "Sorry, there was an error completing your action")
        }
        console.log(`Updated db at key '${context.user}'`);
    })
}
const removeFromDb = (context) => {
    delete context.db[context.user]
    fs.writeFile(dbPath, JSON.stringify(context.db), 'utf8', err => {
        if (err) {
            console.error("Failed to update db", err)
            sendToId(context, "Sorry, there was an error completing your action")
        }
        console.log(`Removed db at key '${context.user}'`);
    })
}
const registerUser = (context, miteApiKey) => {
    updateDb(context, { miteApiKey })
    send(context, "Hi, I registered you. You can now check your times with `check`!")
}
const unregisterUser = (context) => {
    removeFromDb(context)
    sendToId(context, "Ok, I successfully unregistered you.")
}

const loadUsers = csvPath => 
    new Promise(resolve =>
        fs.readFile(csvPath, 'utf8', (err, data) => {
            if (err) {
                console.error("Error when loading users to check", err)
            }
            if (data) {
                resolve(
                    data
                        .split(/\r?\n/)
                        .map(line => line.split(",").map(entry => entry.trim()))
                        .map(line => ({
                            name: line[0],
                            miteId: line[1],
                            slackId: line[2]
                        }))
                )
            }
        })
    )

const getDb = callback => {
    let db = {}
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            console.log(`Error when loading db: '${err}'`)
        }
        if (data) {
            db = JSON.parse(data)
        }
        callback(db);
    })
}

module.exports = {
    registerUser,
    unregisterUser,
    loadUsers,
    getDb
}