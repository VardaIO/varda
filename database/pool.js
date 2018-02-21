// const Db = require("linvodb3")
const genericPool = require('generic-pool')
const Db = require('better-sqlite3')
const os = require('os')

const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'

// module.exports = () => {
// }
// Db.defaults.store = { db: require("leveldown") }
// Db.dbPath = VARDA_HOME + '/data'
// module.exports = Db
const factory = {
  create: function() {
    return new Db(`${VARDA_HOME}/varda.sqlite`)
  },
  destroy: function(client) {
    client.close()
  }
}
const options = {
  max: 5,
  min: 2
}
const Pool = genericPool.createPool(factory, options)
module.exports = Pool
