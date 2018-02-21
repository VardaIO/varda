/* this is a state machine
 * √ 1. vailidate balance should be biger than amount
 * √ 2. star author should be equal with transaction sender 
 * √ 3. star signature should be vailidate
 * 4. the same address should not appear in interval 6 main chain index
 * 5. a star should have at least one on star'main chain index - 1
 * 6. in one mci, the same should appear only once
 * √ if a star confirmed with 2/3 , broadcast this star to the network at once
 */

/* todao 
 * waiting pool 缺少一个内存清理工具
 * 当大于一时间时，清理掉waiting pool中broadcast = true的star
 */
const pool = require('../database/pool')
const Vailidate = require('./vailidate')
const _ = require('lodash')
const commissionNumber = 4

class Commission {
    constructor() {
        this.pool = new Proxy({}, this.prepare())
        this.waiting = new Proxy({}, this.waiting());
    }

    prepare(star) {

        return {
            set: async (receiver, property, value) => {
                // if protobuf, decode it
                // 来自普通用户
                // 判断是否在waiting中
                if (_.has(receiver, property)) {
                    return
                }
                // 遍历prepare pool，如果有在waiting pool中的， 忽略
                _.forOwn(receiver,   (value,  key)  => {  
                    if (_.has(this.waiting), key) {
                        _.omit(receiver, key)
                    }
                })
                // 查库
                if (await this.haveStar(property)) {
                    return
                }
                // vailidate, then boardcast
                const vailidateStar = await new Vailidate().vailidateStar(star)
                if (!vailidateStar) {
                    return
                }
                // 写一个递归，不断地从prepare pool取出Star转向waiting pool
            }
        }

    }

    // todo:如果不是从本地来的star，要移除broadcast，count属性
    // 如果不是来自本地，需要验证消息发送者是不是来自议会成员，以及消息签名是否正确
    waiting() {
        return {
            set: async (receiver, property, value) => {
                // 0.验证
                if (!property || !value) {
                    return
                }
                // if from local
                if (value['starFrom'] && value['starFrom'] == 'local') {
                    receiver[property] = value
                    receiver[property].count = 0
                    return
                }

                if (!new Vailidate().vailidateStarWithoutTransaction(value)) {
                    return
                }
                //1. 判断key（star hash）是否存在
                const existKey = _.has(receiver, property)
                //1.1存在：查看key中的count，若大于3/1则commit并广播(在receiver[property].broadcas不存在时)，不大于则继续计数
                if (existKey) {
                    if (receiver[property].count >= Math.floor(commissionNumber / 3) * 2 && !receiver[property].broadcast) {
                        //broadcast
                        receiver[property].broadcast = true
                        return
                    }
                    receiver[property].count++
                        return
                }
                // 1.2 不存在：查看数据库中是否有，没有则添加
                if (!await this.haveStar(property)) {
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

    broadcast(node, from) {
        if (from == 'prepare') {

        }
        // else is from waiting
    }
}

setImmediate(async () => {
    let b = new Commission()
    console.log(b.pool)
    console.log(b.waiting)
    const Star = require('./star')
    let star = await new Star().getStar('d3e07MIoj95eJDV29gX3Ydyi6MkZI23MsWFuAsEk0XQ=')
    // star.starFrom = 'local'
    b.waiting[star.star_hash] = star
    console.log(b.waiting)

})
// setImmediate(async () => {
//     let a = await b.validate('dYixChMfNFnkpGCyaqQLYjcpq2Cxw5RAhgfqh+jKKYA=')
//     console.log(a)
// })