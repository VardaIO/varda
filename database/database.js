const Db = require("linvodb3")
const os = require('os')
const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'

Db.defaults.store = { db: require("leveldown") }
Db.dbPath = VARDA_HOME + '/data'
module.exports = Db