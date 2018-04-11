var path = require('path')
const Account = require('./account')

class Api {
    constructor () {
        this.dbFilePath = `${path.resolve(__dirname, '..')}/chain.db`
        this.account = new Account(this.dbFilePath) 
    }
}