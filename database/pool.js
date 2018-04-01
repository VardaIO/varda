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
const factory = dbFilePath => {
  return {
    create: function() {
      return new Db(dbFilePath)
    },
    destroy: function(client) {
      client.close()
    }
  }
}

const options = {
  max: 5,
  min: 2
}

const Pool = (dbFilePath = null) => {
  try {
    if (dbFilePath !== null) {
      return genericPool.createPool(factory(dbFilePath), options)
    } else {
      return genericPool.createPool(
        factory(`${VARDA_HOME}/varda.sqlite`),
        options
      )
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = Pool
