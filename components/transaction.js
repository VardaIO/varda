const createKeccakHash = require('keccak')

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
        const sig = utils.sign(this.payload_hash, sk)
        this.signature = sig
        return sig
    }

    newTransaction(tx, sk) {
        Object.assign(this, tx)
        this.payload_hash = this.toHash()
        this.sign(sk)
        let transaction = new Transaction()
        Object.assign(transaction, this)
        return transaction
    }

    check(tx) {
        //first check address and signature 
        // 1. get address and vailate address with pubkey
        // 2. get sig , use pubkey to vailate sig
        if (utils.genAddress(tx.senderPublicKey) !== tx.sender) {
            return {
                msg: 'sender address is wrong'
            }
        }

        if (!utils.sigVerify(tx.payload_hash, tx.signature, tx.senderPublicKey)) {
            return {
                msg: 'signature is wrong'
            }
        }

        //secound check amount
        // 1.get amount
        // 2. if sender amount > his have, return false 
        return true


    }

}

module.exports = Transaction