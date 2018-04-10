// 封装一些ＡＰＩ，然后用消息调用
const Container = require('./container')
const dappsCache = require('./dappsCache')
const fs = require('fs')

class Dapps {
  loadDapps() {
    return new Promise((resolve, reject) => {
      const dappsPath = fs.readdirSync(`${require('app-root-path')}/Dapps`)
      // todo: vailidate path
      dappsPath.forEach(path => {
        dappsCache[path] = new Container(
          `${require('app-root-path')}/Dapps/${path}`
        ).newContainer()
      })
      resolve(dappsPath)
    })
  }
}

setImmediate(async () => {
  let a = await new Dapps().loadDapps()
  console.log(a)
    console.log(dappsCache.test.send({ wwwwwwwwwww: 'world' }))
  
})
module.exports = Dapps
