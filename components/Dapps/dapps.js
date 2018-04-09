// 封装一些ＡＰＩ，然后用消息调用
const Container = require('./container')
const dappsCache = require('./dappsCache')
const fs = require('fs')

class Dapps {
  loadDapps() {
    return new Promise((resolve, reject) => {
      //   let c = new Container(`${require('app-root-path')}/Dapps/test`)
      //   let cc = c.newContainer()
      const dappsPath = fs.readdirSync(`${require('app-root-path')}/Dapps`);
      resolve(dappsPath)
    })
  }
}

setImmediate(async() => {
    let a = await new Dapps().loadDapps()
    console.log(a)
})
module.exports = Dapps
