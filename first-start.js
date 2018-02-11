const fs = require('fs')
const os = require('os')

const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'

if (!fs.existsSync(VARDA_HOME)) {
    fs.mkdirSync(VARDA_HOME)
}

const pool = require('./database/pool')

// pool.acquire().then((client) => {
//     client.prepare("CREATE TABLE IF NOT EXISTS stars (" +
//         "star TEXT PRIMARY KEY NOT NULL" +
//         ""
//     )
// })