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

    async  ensureDb() {
        await fs.ensureFile(`${this.path}/chain.db`)
    }
}

let a = new Check()
setImmediate(async () => {
    let x = await a.checkDb()
    console.log(x)
})