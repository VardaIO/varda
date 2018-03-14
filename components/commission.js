/* this is a state machine
 * √ 1. vailidate balance should be biger than amount
 * √ 2. star author should be equal with transaction sender 
 * √ 3. star signature should be vailidate
 * √ 4. the same address should not appear in interval 6 main chain index
 * √ 5. a star should have at least one on star'main chain index - 1
 * √ 6. in one mci, the same should appear only once
 * √ if a star confirmed with 2/3 , broadcast this star to the network at once
 */

/* todao 
 * waiting pool 缺少一个内存清理工具
 * 当大于一时间时，清理掉waiting pool中broadcast = true的star
 */
const _ = require('lodash')

const pool = require('../database/pool')
const Vailidate = require('./vailidate')
const { addStar } = require('./addStar')
const emitter = require('./event')
const fs = require('fs')
const pb = require('protocol-buffers')
const appRoot = require('app-root-path')
const starProto = pb(fs.readFileSync(`${appRoot}/network/protos/star.proto`))
const Utils = require('./utils')

const commissionsList = require('../commissions.json')
const commissionNumber = commissionsList.length

const colors = require('colors')
class Commission {
  constructor(sk) {
    this.preparePool = new Proxy({}, this.prepare())
    this.waitingPool = new Proxy({}, this.waiting())
    this.sk = sk
  }

  prepare() {
    return {
      set: async (receiver, property, value) => {
        try {
          // 来自普通用户
          // 判断是否在waiting中
          if (_.has(receiver, property)) {
            return
          }
          // 遍历prepare pool，如果有在waiting pool中的， 忽略
          _.forOwn(receiver, (value, key) => {
            if ((_.has(this.waiting), key)) {
              _.omit(receiver, key)
            }
          })
          // vaildate amount for transaction

          if (value.transaction.type === 1) {
            if (value.transaction.amount <= 0) {
              return
            }
          }

          // 查库
          if (await this.haveStar(property)) {
            return
          }
          // vailidate, then add it
          const vailidateStar = await new Vailidate().vailidateStar(value)
          if (!vailidateStar) {
            return
          }

          // find mci
          const authorLastMci = await this._findLastMci(property.authorAdress)

          // a star should have at least one on star'main chain index - 1
          if (authorLastMci) {
            if (value.mci - authorLastMci < 6) {
              console.log(
                ` a star should have at least one on star'main chain index - 1`
              )
              return
            }
          }

          // 5. a star should have at least one on star'main chain index - 1
          const starsFromLastMci = await this._getStarHashByMci(value.mci - 1)
          // _.isArray(starsFromLastMci)
          const starHashesFromLastMci = starsFromLastMci.map(v => {
            return v.star
          })
          const includedStarFromLastMci = []

          value.parentStars.map(v => {
            if (starHashesFromLastMci.indexOf(v) !== -1) {
              includedStarFromLastMci.push(v)
            }
          })

          if (includedStarFromLastMci.length < 1) {
            return
          }
          // 6. in one mci, the same should appear only once
          const starsFromMci = await this._getStarHashByMci(property.mci)
          const authorsFromMci = starsFromMci.map(v => {
            return v.author_address
          })

          let authorAddressAppearTime = 0
          authorsFromMci.map(v => {
            if (property.authorAdress == v) {
              authorAddressAppearTime++
            }
          })

          if (authorAddressAppearTime >= 1) {
            return
          }

          //7. 当mci中有其他star时，如果star的时间戳比当前mci中时间戳最大的star多10s，不添加
          const haveStarInMci = await this._haveStarInMci(mci)
          if (haveStarInMci) {
            const starTimestamp = value.timestamp
            const anotherTimestamp = haveStarInMci.timestamp
            if (starTimestamp - anotherTimestamp > 10) {
              return
            }
          }
          //methods from above is vailidate, now vailidate is finished.

          // add it!
          receiver[property] = value
          // console.log(receiver)
          // emitter.emit('waitingStar', property)
          // 写一个递归，不断地从prepare pool取出Star广播并转向waiting pool
          value.starFrom = 'local'
          this.waitingPool[property] = value
        } catch (error) {
          console.log(error)
        }
      }
    }
  }

  // todo:如果不是来自本地，需要验证消息发送者是不是来自议会成员，以及消息签名是否正确
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
          delete this.preparePool[property]
          //如果是自己发出的则不管
          const utils = new Utils()
          const waitingStar = {
            star: value,
            commissionAddress: utils.getAddressFromSk(this.sk),
            commissionPublicKey: utils.getPub(this.sk),
            commissionSignature: utils.sign(value.star_hash, this.sk)
          }
          this._broadcastWaitingStar(
            starProto.commissionStar.encode(waitingStar)
          )
          return
        }

        if (!new Vailidate().vailidateStarWithoutTransaction(value)) {
          return
        }
        //1. 判断key（star hash）是否存在
        const existKey = _.has(receiver, property)
        //1.1存在：查看key中的count，若大于三分之二则commit并广播(在receiver[property].broadcas不存在时)，不大于则继续计数
        if (existKey) {
          if (
            receiver[property].count >= Math.floor(commissionNumber / 3) * 2 &&
            !receiver[property].broadcast
          ) {
            //broadcast
            console.log(colors.green('broadcast'))
            receiver[property].broadcast = true
            const utils = new Utils()

            const commitStar = starProto.commissionStar.encode({
              star: value,
              commissionAddress: utils.getAddressFromSk(this.sk),
              commissionPublicKey: utils.getPub(this.sk),
              commissionSignature: utils.sign(value.star_hash, this.sk)
            })
            this._broadcastCommitStar(commitStar)
            return
          } else if (receiver[property].broadcast == true) {
            console.log('have commit')
            return
          }

          const utils = new Utils()
          receiver[property].count++
          this._broadcastWaitingStar(
            starProto.commissionStar.encode({
              star: value,
              commissionAddress: utils.getAddressFromSk(this.sk),
              commissionPublicKey: utils.getPub(this.sk),
              commissionSignature: utils.sign(value.star_hash, this.sk)
            })
          )

          return
        }
        // 1.2 不存在：查看数据库中是否有，没有则添加
        if (!await this.haveStar(property)) {
          receiver[property] = value
          receiver[property].count = 0

          const utils = new Utils()
          this._broadcastWaitingStar(
            starProto.commissionStar.encode({
              star: value,
              commissionAddress: utils.getAddressFromSk(this.sk),
              commissionPublicKey: utils.getPub(this.sk),
              commissionSignature: utils.sign(value.star_hash, this.sk)
            })
          )
        }
      }
    }
  }

  commit(star) {
    addStar(star)
  }

  haveStar(star_hash) {
    return pool.acquire().then(client => {
      if (
        client
          .prepare(`SELECT star FROM stars WHERE star='${star_hash}'`)
          .get() === undefined
      ) {
        pool.release(client)
        return false
      }

      pool.release(client)
      return true
    })
  }

  validate(star) {
    return new Vailidate().vailidateStar(star)
  }

  _broadcastCommitStar(commitStar) {
    global.n.pubsub.publish(
      'commitStar',
      Buffer.from(commitStar.toString('hex')),
      error => {
        if (error) {
          return Promise.reject(error)
        }
      }
    )
  }

  _broadcastWaitingStar(waitingStar) {
    global.n.pubsub.publish(
      'waitingStar',
      Buffer.from(waitingStar.toString('hex')),
      error => {
        if (error) {
          return Promise.reject(error)
        }
      }
    )
  }

  _findLastMci(author) {
    return pool.acquire().then(client => {
      const mci = client
        .prepare(
          `SELECT main_chain_index AS mci FROM stars WHERE author_address='${author}' ORDER BY main_chain_index DESC LIMIT 1`
        )
        .get()
      if (mci === undefined) {
        pool.release(client)
        return null
      }

      pool.release(client)
      return mci.mci
    })
  }

  _getStarHashByMci(mci) {
    return pool
      .acquire()
      .then(client => {
        const stars = client
          .prepare(`SELECT * FROM stars WHERE main_chain_index='${mci}'`)
          .all()
        pool.release(client)
        return Promise.resolve(stars)
      })
      .catch(error => {
        pool.release(client)
        return Promise.reject(error)
      })
  }

  async _haveStarInMci(mci) {
    // if not have, return null
    // if have, return the bigest timestamp
    const client = await pool.acquire()
    try {
      let stars = client
        .prepare(`SELECT * FROM stars WHERE main_chain_index=${mci}`)
        .all()
      // console.log(stars)
      if (_.isEmpty(stars)) {
        return null
      }
      // console.log(stars)
      // return stars
      stars = _.sortBy(stars, star => {
        return star.timestamp
      })
      return stars.pop()
    } catch (error) {
      console.log(error)
    } finally {
      pool.release(client)
    }
  }
}

module.exports = Commission
