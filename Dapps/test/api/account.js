class Account {
    constructor(dbFilePath) {
        this.dbFilePath = dbFilePath
    }

    newAccount() {
        process.send({
            api: 'account',
            method: 'newAccount',
            args: []
        })
    }

    getBalance(address, dbFilePath) {
        dbFilePath = this.dbFilePath
        process.send({
            api: 'account',
            method: 'getBalance',
            args: [address, dbFilePath]
        })
    }

    getPk(address , dbFilePath )　{
        dbFilePath = this.dbFilePath
        
        process.send({
            api: 'account',
            method: 'getPk',
            args: [address, dbFilePath]
        })
    }

    checkTransaction(address , amount, dbFilePath ) {
        dbFilePath = this.dbFilePath
        
        process.send({
            api: 'account',
            method: 'checkTransaction',
            args: [address , amount, dbFilePath]
        })
    }

}

module.exports = Account