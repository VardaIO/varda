const pool = require('../database/pool')
const _ = require('lodash')
const joi = require('joi')
const createKeccakHash = require('keccak')
/**
 * a star should have a hash, type, parent star / stars, transaction ,create_date and main chain index 
 */

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
        return this.buildStar({
            // timestamp: Math.floor(Date.now() / 1000),
            timestamp: 1518578669,
            parentStars: [],
            payload_hash: 'ELggd3MSKdJf9HuOK3V7TkfhOeEnqmTUtmdF7yFkK9A=',
            transaction: {},
            authorAddress: 'VLRAJEAFXJBVYZQYT67YUQ3KJV53A',
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

        let parents = ''

        if (star.parentStars.length > 1) {
            star.parentStars.forEach(value => {
                parents = parents + value
            });
        } else {
            parents = star.parentStars[0]
        }

        const beforeHash = star.timestamp + parents + star.payload_hash + star.authorAddress + star.mci
        const star_hash = createKeccakHash('sha3-256').update(beforeHash).digest('base64')

        const aStar = new Star()
        //_.assign faster than Object.assign
        _.assign(aStar, star)
        aStar.star_hash = star_hash
        return aStar
    }

}

module.exports = Star