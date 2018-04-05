const pool = require('../database/pool')

class Account {
  constructor(address) {
    this.address = address
  }

  async getBalance(address = null, dbFilePath = null) {
    let client =
      dbFilePath === null
        ? await pool().acquire()
        : await pool(dbFilePath).acquire()

    try {
      if (
        this.address === null ||
        (this.address === undefined && address === null)
      ) {
        return
      }

      if (address === null) {
        address = this.address
      }

      const income = client
        .prepare(
          `SELECT SUM(amount) AS receive FROM transactions WHERE recpient='${address}'`
        )
        .get().receive

      if (income === null) {
        return 0
      }

      const payment = client
        .prepare(
          `SELECT SUM(amount) AS pay FROM transactions WHERE sender='${address}'`
        )
        .get().pay
      const balance = income - payment
      return Promise.resolve(balance)
    } catch (error) {
      return Promise.reject(error)
    } finally {
      const loan = new Map().get(client)
      if (loan !== undefined) {
        pool().release(client)
      }
    }
  }

  async getPk(address = null, dbFilePath = null) {
    let client =
      dbFilePath === null
        ? await pool().acquire()
        : await pool(dbFilePath).acquire()

    try {
      if (
        this.address === null ||
        (this.address === undefined && address === null)
      ) {
        return
      }

      if (address === null) {
        address = this.address
      }

      const pk = client
        .prepare(`SELECT pk FROM account_pks WHERE address='${address}'`)
        .get()

      if (pk == undefined) {
        return Promise.resolve(null)
      }
      return Promise.resolve(pk.pk)
    } catch (error) {
      return Promise.reject(error)
    } finally {
      const loan = new Map().get(client)
      if (loan !== undefined) {
        pool().release(client)
      }
    }
  }

  async checkTransaction(address = null, amount, dbFilePath = null) {
    if (
      this.address === null ||
      (this.address === undefined && address === null)
    ) {
      return
    }

    if (address === null) {
      address = this.address
    }

    const balance = await this.getBalance(address, dbFilePath)

    if (balance - amount < 0) {
      return false
    }
    return true
  }
}

module.exports = Account
