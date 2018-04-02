const pool = require('../database/pool')
const _ = require('lodash')
const joi = require('joi')
const createKeccakHash = require('keccak')
const Transaction = require('./transaction')

const Utils = require('./utils')
const utils = new Utils()

/**
 * a star should have a hash, type, parent star / stars, transaction ,create_date and main chain index
 */

// return

class Star {
  constructor() {
    this.timestamp = null
    this.parentStars = null
    this.payload_hash = null
    this.transaction = null
    this.star_hash = null
    this.mci = null
  }

  getGenesis() {
    let tx = new Transaction()
    let genesisTx = tx.newTransaction({
      type: 0,
      sender: 'system',
      amount: 100000000000,
      recpient: 'VLRAJEAFXJBVYZQYT67YUQ3KJV53A'
    })

    return this.buildStar({
      // timestamp: Math.floor(Date.now() / 1000),
      timestamp: 1518578669,
      parentStars: [],
      payload_hash: 'ELggd3MSKdJf9HuOK3V7TkfhOeEnqmTUtmdF7yFkK9A=',
      // transaction: {},
      transaction: {
        payload_hash: genesisTx.payload_hash,
        type: genesisTx.type,
        sender: genesisTx.sender,
        amount: genesisTx.amount,
        recpient: genesisTx.recpient
      },
      authorAddress: 'system',
      mci: 0
    })
  }

  buildStar(star) {
    const schema = joi.object().keys({
      timestamp: joi.number().required(),
      parentStars: joi.array().required(),
      payload_hash: joi.string().required(),
      transaction: joi.object().required(),
      authorAddress: joi.string().required(),
      mci: joi.number().required()
    })

    const result = joi.validate(star, schema)

    if (result.error !== null || result.value === undefined) {
      return false
    }

    const truePayloadHash = createKeccakHash('sha3-256')
      .update(star.payload_hash + star.timestamp)
      .digest('hex')

    star.payload_hash = truePayloadHash

    let parents = ''

    if (star.parentStars.length > 1) {
      star.parentStars.forEach(value => {
        parents = parents + value
      })
    } else {
      parents = star.parentStars[0]
    }

    const beforeHash =
      star.timestamp +
      parents +
      star.payload_hash +
      star.authorAddress +
      star.mci
    const star_hash = createKeccakHash('sha3-256')
      .update(beforeHash)
      .digest('base64')

    const aStar = new Star()
    //_.assign faster than Object.assign
    _.assign(aStar, star)
    aStar.star_hash = star_hash

    if (star.transaction.sk) {
      const signature = utils.sign(star_hash, star.transaction.sk)
      aStar.signature = signature
    }

    return aStar
  }

  getStar(starHash, dbFilePath = null) {
    return pool(dbFilePath)
      .acquire()
      .then(client => {
        let star = client
          .prepare(
            `SELECT star AS star_hash, main_chain_index AS mci, timestamp, payload_hash, author_address AS authorAddress, signature  FROM stars WHERE star='${starHash}'`
          )
          .get()

        if (star === undefined) {
          return null
        }

        let transaction = client
          .prepare(
            `SELECT type, sender, amount, recpient FROM transactions WHERE star='${starHash}'`
          )
          .get()
        const parents = client
          .prepare(
            `SELECT parent_star FROM parenthoods WHERE child_star='${starHash}'  ORDER BY parent_index DESC`
          )
          .all()
          .map(v => {
            return v['parent_star']
          })
        const pk = client
          .prepare(
            `SELECT pk  FROM account_pks WHERE address='${star.authorAddress}'`
          )
          .get().pk
        pool().release(client)
        star.parentStars = parents
        transaction.senderPublicKey = pk
        transaction.payload_hash = star.payload_hash
        star.transaction = transaction
        return star
      })
  }
}

module.exports = Star
