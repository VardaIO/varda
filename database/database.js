const Db = require("linvodb3")
const fs = require('fs')
const os = require('os')
const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'

if (!fs.existsSync(VARDA_HOME)) {
    fs.mkdirSync(VARDA_HOME)
}

Db.defaults.store = { db: require("leveldown") }
Db.dbPath = VARDA_HOME
module.exports = Db