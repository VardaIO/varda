const fs = require('fs-extra')
const prepareForStart = require('../helpers/prepareForStart')

class Prepare {
  constructor(path) {
    this.path = path
    this.dbFilePath = `${this.path}/chain.db`
  }

  async prepareDbFile() {
    await fs.ensureFile(`${this.path}/chain.db`)
    // return
  }

  async prepareDb() {
    const pool = require('../../database/pool')
    await prepareForStart.initDb(pool, this.dbFilePath)
    // return
  }

}

module.exports = Prepare