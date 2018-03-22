const router = require('koa-router')()
const appRoot = require('app-root-path')
const _ = require('lodash')

const Wallet = require('../../components/wallet')
const Utils = require('../../components/utils')
const Account = require(`${appRoot}/components/account`)
const utils = new Utils()

const fs = require('fs')
const pb = require('protocol-buffers')
const starProto = pb(fs.readFileSync(`${appRoot}/network/protos/star.proto`))
const sync = require('../../components/sync/sync')
const HD = require('../../components/hd-wallet')
const Star = require('../../components/star')
// router.get('/createAccount', ctx => {
//   const hd = new HD()
//   ctx.body = hd.genMnemonic()
// })

router.get('/genMnemonic', async ctx => {
  ctx.body = { mnemonic: new HD().genMnemonic() }
})

router.post('/verifyMnemonic', async ctx => {
  const mnemonic = ctx.request.body.mnemonic
  const hd = new HD()
  ctx.body = { result: hd.validateMnemonic(mnemonic) }
})

router.post('/mnemonicToSk', async ctx => {
  const mnemonic = ctx.request.body.mnemonic
  const hd = new HD()
  const seed = hd.getSeed(mnemonic)
  const sk = hd.genKeypair(0, seed).secretKey
  ctx.body = { sk }
})

router.post('/skToAddress', async ctx => {
  const sk = ctx.request.body.sk
  ctx.body = { address: utils.getAddressFromSk(sk) }
})

router.post('/getBalance', async ctx => {
  // const sk = ctx.request.body.sk
  // const pk = utils.getPub(sk)
  const address = ctx.request.body.address
  const account = new Account(address)
  const balance = await account.getBalance()

  ctx.body = { balance }
})

router.post('/getStar', async ctx => {
  const starHash = ctx.request.body.starHash
  const genesis = new Star().getGenesis()

  if (_.isEqual(starHash, genesis.star_hash)) {
    ctx.body = { star: genesis }
    return
  }

  const star = await new Star().getStar(starHash)
  ctx.body = { star }
})

router.post('/getStars', async ctx => {
  const index = parseInt(ctx.request.body.index)
  if (index === 0) {
    ctx.body = {
      stars: [new Star().getGenesis()]
    }
    return
  }

  const stars = await sync.buildStarsForSync(index)
  ctx.body = {
    stars
  }
})

router.post('/payment', async ctx => {
  const request = ctx.request.body
  const sk = request.sk
  const to = request.to
  const amount = request.amount
  const wallet = new Wallet()

  if (amount <= 0) {
    ctx.body = {
      message: 'amount is wrong'
    }
    return
  }

  try {
    let star = await wallet.pay(to, amount, sk)
    console.log(star)

    global.n.pubsub.publish(
      'sendStar',
      Buffer.from(star.toString('hex')),
      error => {
        if (error) {
          return Promise.reject(error)
        }
      }
    )

    ctx.body = { message: 'send success' }
  } catch (error) {
    ctx.body = { message: error }
  }
})

router.get('/getLastMci', async ctx => {
  const lastMci = await sync.getLastMci()
  ctx.body = { lastMci }
})

module.exports = router
