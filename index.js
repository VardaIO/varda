const fs = require('fs-extra')
const figlet = require('figlet')
const inquirer = require('inquirer')
const colors = require('colors')
const _ = require('lodash')

const init = require('./first-start')

const start = async () => {
  try {
    await init()

    const p2pNetwork = require('./network/p2p')

    const HD = require('./components/hd-wallet')
    const config = require('./config.json')

    console.clear()

    console.log(
      colors.blue(
        figlet.textSync('Varda', {
          horizontalLayout: 'full'
        })
      )
    )

    const hd = new HD()

    let seed
    let sk

    if (config.mnemonic !== '') {
      seed = hd.getSeed(config.mnemonic)
      sk = hd.genKeypair(0, seed).secretKey
    } else {
      const askForMnemonic = () => {
        const questions = [
          {
            name: 'mnemonic',
            type: 'password',
            message: 'Enter your wallet mnemonic:',
            validate: function(value) {
              if (value.length) {
                if (hd.validateMnemonic(value)) {
                  return true
                }
                return 'mnemonic is wrong'
              } else {
                console.log(
                  `\n Your mnemonic is here, please remember to backup it. \n ${hd.genMnemonic()}`
                )
                console.log(
                  '\n mnemonic has been generated, the Varda will exit, input mnemonic next time'
                )
                return process.exit()
              }
            }
          },
          {
            name: 'password',
            type: 'password',
            message: 'Enter your mnemonic password (option):'
          }
        ]

        if (config.commission) {
          return inquirer.prompt(questions)
        }

        return Promise.resolve('welcome to use Varda')
      }

      const answer = await askForMnemonic()

      if (typeof answer === 'object') {
        if (answer.password) {
          seed = hd.getSeed(answer.mnemonic, answer.password)
          // console.log('have password')
          sk = hd.genKeypair(0, seed).secretKey
        } else {
          seed = hd.getSeed(answer.mnemonic)

          sk = hd.genKeypair(0, seed).secretKey
        }
      }
    }
    // console.log(new Utils().getAddressFromSk(sk))
    const node = await p2pNetwork(sk)

    const httpServer = require('./network/http/http')
    await httpServer()
    const sync = require('./components/sync/sync')

    const syncStars = () => {
      //   try {
      //     setTimeout(async () => {
      //       const mciFromPeers = await sync.getLastMciFromPeers()
      //       console.log(mciFromPeers)
      //       sync.sync(mciFromPeers)
      //     }, 1000 * 30)
      //   } catch (error) {
      //     console.log(error)
      //   } finally {
      //     setImmediate(syncStars())
      //   }
      setInterval(async () => {
        try {
          const mciFromPeers = await sync.getLastMciFromPeers()
          console.log(mciFromPeers)
          sync.sync(mciFromPeers)
        } catch (error) {
          console.log(error)
        }
      }, 1000 * 5)
    }

    const checkPeersValue = () => {
      console.log(_.values(global.n.peerBook.getAll()).length)
      setTimeout(() => {
        if (_.values(global.n.peerBook.getAll()).length > 1) {
          syncStars()
          console.log('em')
          return
        } else {
          checkPeersValue()
        }
      }, 1000 * 5)
    }
    checkPeersValue()
  } catch (error) {
    console.log(error)
  }
}

start()
