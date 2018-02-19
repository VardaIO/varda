const pool = require('../database/pool')

class Account {
    constructor(address) {
        this.address = address
    }

    getBalance() {
        return pool.acquire().then((client) => {
            try {
                if (this.address == null || this.address == undefined) {
                    return
                }
                const income = client.prepare(`SELECT SUM(amount) AS receive FROM transactions WHERE recpient='${this.address}'`).get().receive

                if (income === null) {
                    return 0
                }

                const payment = client.prepare(`SELECT SUM(amount) AS pay FROM transactions WHERE sender='${this.address}'`).get().pay
                const balance = income - payment
                return balance
            } catch (error) {
                return Promise.reject(error)
            } finally {
                pool.release(client)
            }
        })
    }

    getPk() {
        return pool.acquire().then((client) => {
            try {
                if (this.address == null || this.address == undefined) {
                    return
                }

                const pk = client.prepare(`SELECT pk FROM account_pks WHERE address='${this.address}'`).get()

                if (pk == undefined) {
                    return null
                }
                return pk.pk
            } catch (error) {
                return Promise.reject(error)
            } finally {
                pool.release(client)
            }
        })
    }

    async checkTransaction(amount) {
        const balance = await this.getBalance()
        
        if (balance - amount < 0) {
            return false
        }
        return true
    }
}

module.exports = Account