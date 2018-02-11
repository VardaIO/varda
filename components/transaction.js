const createKeccakHash = require('keccak')
const {
    forOwn
} = require('lodash')
const Utils = require('./utils')
const utils = new Utils()

class Transaction {
    constructor() {
        this.payload_hash = null
        this.type = null
        this.sender = null
        this.amount = null
        this.recpient = null
        this.senderPublicKey = null
        this.signature = null
    }

    toHash() {
        return createKeccakHash('sha3-256').update(this.type + this.sender + this.amount + this.recpient + this.senderPublicKey).digest('hex')
    }

    sign(sk) {
        return utils.sign(this.payload_hash, sk)
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

        //first check address and signature 
        // 1. get address and vailate address with pubkey
        // 2. get sig , use pubkey to vailate sig
        if (utils.genAddress(this.senderPublicKey) !== this.sender) {
            return {
                msg: 'sender address is wrong'
            }
        }

        if (!utils.sigVerify(this.signature, this.senderPublicKey)) {
            return {
                msg: 'signature is wrong'
            }
        }

        //secound check amount
        // 1.get amount
        // 2. if sender amount > his have, return false 
    }

}
