const fs = require('fs-extra')

const init = require('./first-start')
const p2pNetwork = require('./network/p2p')

setImmediate(async () => {
  try {
    const exists = await fs.pathExists('initialComplete')
    if (!exists) {
      init()
    }
  } catch (error) {
    console.log(error)
  }
})

p2pNetwork()
