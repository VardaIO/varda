const createKeccakHash = require('keccak')
const _ = require('lodash')

const Utils = require('./utils')
const utils = new Utils()

const Account = require('./account')

/**
 * transaction type list:
 * 0 is genesis transaction
 * 1 is normal payment
 */
class Transaction {
  constructor() {
    this.payload_hash = null
    this.type = null
    this.sender = null
    this.amount = null
    this.recpient = null
    this.senderPublicKey = null
    // this.signature = null
    this.sk = null
    this.data = null
  }

  toHash() {
    return createKeccakHash('sha3-256')
      .update(
        this.type +
          this.sender +
          this.amount +
          this.recpient +
          this.senderPublicKey +
          this.data
      )
      .digest('hex')
  }

  newTransaction(tx) {
    //_.assign faster than Object.assign
    _.assign(this, tx)
    this.payload_hash = this.toHash()
    let transaction = new Transaction()
    _.assign(transaction, this)
    return _.assign({}, transaction)
  }

  async check(tx) {
    //first check address and signature
    // 1. get address and vailate address with pubkey
    if (!_.isEqual(utils.genAddress(tx.senderPublicKey), tx.sender)) {
      return false
    }

    //secound check amount
    // 1.get amount
    // 2. if sender amount > his have, return false

    const account = new Account(tx.sender)
    const type = [0, 1, 2]
    let checkTransaction

    if (tx.type === 1) {
      checkTransaction = await account.checkTransaction(tx.sender, tx.amount)
    }

    if (!type.includes(tx.type)) {
      return false
    }

    // metadata is a max size is 15000 byte
    // console.log(2, checkTransaction)
    if (!checkTransaction) {
      return false
    }

    return true
  }
}

module.exports = Transaction
