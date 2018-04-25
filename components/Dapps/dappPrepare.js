const fs = require('fs-extra')

class prepare {
  constructor(path) {
    this.path = path
  }

  async prepareDb() {
    await fs.ensureFile(`${this.path}/chain.db`)
  }
}
