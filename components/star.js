const pool = require('../database/pool')
const _ = require('lodash')
const joi = require('joi')
const createKeccakHash = require('keccak')

/**
 * a star should have a hash, type, parent star / stars, transaction ,create_date and main chain index 
 */

class Star {
    constructor() {

    }
    buildStar(star) {
        const schema = joi.object().keys({
            timestamp: joi.string().required(),
            parentStars: joi.array().required(),
            transaction: joi.object().required()
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
        let beforeHash = star.timestamp + parents + star.transaction.payload_hash
        return createKeccakHash('sha3-256').update(beforeHash).digest('hex')

    }
}

