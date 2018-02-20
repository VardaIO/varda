/* this is a state machine
 * 1. vailidate balance should be biger than amount
 * 2. star author should be equal with transaction sender 
 * 3. star signature should be vailidate
 * 4. the same address should not appear in interval 6 main chain index
 * 5. a star should have at least one on star'main chain index - 1
 * if a star confirmed with 2/3 , broadcast this star to the network at once
 */
const pool = require('../database/pool')
const Vailidate = require('./vailidate')
const _ = require('lodash')
const commissionNumber = 4

class Commission {
    constructor() {
        this.pool = {}
        this.waiting = new Proxy({}, this.waiting());
    }

    prepare() {
        // vailidate, then boardcast
    }

    waiting() {
        return {
            set: async (receiver, property, value) => {
                // 0.验证
                if (!property || !value) {
                    return
                }
                if (!new Vailidate().vailidateStarWithoutTransaction(value)) {
                    return
                }
                //1. 判断key（star hash）是否存在
                const existKey = _.has(receiver, property)
                //1.1存在：查看key中的count，若大于3/1则commit并广播，不大于则继续计数
                if (existKey) {
                    if (receiver[property].count >= Math.floor(commissionNumber / 3) * 2) {
                        //broadcast
                        return
                    }
                    receiver[property].count++
                        return
                }
                // 1.2 不存在：查看数据库中是否有，没有则添加
                if (!this.haveStar(property)) {
                    receiver[property] = value
                    receiver[property].count = 0
                }
            }
        }
    }

    commit() {}

    haveStar(star_hash) {
        return pool.acquire().then((client) => {
            if (client.prepare(`SELECT star FROM stars WHERE star='${star_hash}'`).get() === undefined) {
                return false
            }
            return true
        })
    }

    validate(star) {
        return new Vailidate().vailidateStar(star)
    }
}

setImmediate(async () => {
    let b = new Commission()
    console.log(b.pool)
    console.log(b.waiting)
    const Star = require('./star')
    let star = await new Star().getStar('d3e07MIoj95eJDV29gX3Ydyi6MkZI23MsWFuAsEk0XQ=')
    b.waiting[star.star_hash] = star

})
// setImmediate(async () => {
//     let a = await b.validate('dYixChMfNFnkpGCyaqQLYjcpq2Cxw5RAhgfqh+jKKYA=')
//     console.log(a)
// })