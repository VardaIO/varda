const createKeccakHash = require('keccak')
const {
    forOwn
} = require('lodash')
class Transaction {
    constructor() {
        this.payload_hash = null
        this.type = null
        this.sender = null
        this.amount = null
        this.recpient = null
        this.senderPublicKey = null
    }
    // Object.assign(this, { ip, port })

    toHash() {
        return createKeccakHash('sha3-256').update(this.type + this.sender + this.amount + this.recpient + this.senderPublicKey).digest('hex')
    }

    newTransaction(tx) {
        let transaction = new Transaction()
        forOwn(tx, (value, key) => {
            transaction[key] = value
        })
        transaction.payload_hash = transaction.toHash()
        return transaction
    }

    check() {
        //first check signaature
        // 1. get address from database and vailate address with pubkey
        // 2. get sig from database, use pubkey to vailate sig

        //secound check amount
        // 1.get inputs amount
        // 2. if send amount > inputs amout,return false 
    }

}

let a = new Transaction()
a.type = 'pay'
console.log(a)