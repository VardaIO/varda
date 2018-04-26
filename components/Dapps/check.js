const db = require('better-sqlite3')
const fs = require('fs-extra')

class Check {
  constructor(path) {
    this.path = path
  }

  async checkDb() {
    const exist = await fs.pathExists(`${this.path}/chain.db`)
    return exist
  }

  //check file
  //check dapp
}

module.exports = Check