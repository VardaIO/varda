const router = require('koa-router')()

const _ = require('lodash')
const Container = require('../../components/Dapps/container') 

const fs = require('fs')

router.prefix('/dapps')

router.get('/genMnemonic', async ctx => {
  ctx.body = { emm: "emm"}
})

router.get('/d', async ctx => {
    let c = new Container(`${require('app-root-path')}/Dapps/test`)
    let cc = c.newContainer()
    cc.send({ emm: 'hahahahhaahha' })

})

module.exports = router
