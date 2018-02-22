const os = require('os')
const fs = require('fs')
const { EventEmitter } = require('events')
const appRoot = require('app-root-path')
const PeerInfo = require('peer-info')
const peerId = require('peer-id')
const pify = require('pify')
const rootPath = require('app-root-path')
const multiaddr = require('multiaddr')
const { values, pullAt } = require('lodash')
const pb = require('protocol-buffers')
const pull = require('pull-stream')
const ip = require('ip')
const publicIP = require('public-ip')
const colors = require('colors')
const _ = require('lodash')
const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'
const privateKey = require(VARDA_HOME + '/keys.json').PrivateKey
const config = require(`${rootPath}/config.json`)
const Node = require('./node-bundle')

const msg = pb(fs.readFileSync(`${appRoot}/network/protos/node.proto`))
const starProto = pb(fs.readFileSync(`${appRoot}/network/protos/star.proto`))

/**
 * todo:
 * if local peer have a public ip, then broadcast this ip and peer id to the world
 * the net should have a public ip list, every 1 min send it to other peers
 */

const getPublicIp = async () => {
  try {
    if (config.enablePublicIp) {
      return await publicIP.v4()
    }
    return null
  } catch (error) {
    return null
  }
}

const encodePublicIps = publicIps => {
  const buf = msg.addrs.encode({
    addrs: publicIps
  })
  return buf
}

const createNode = async () => {
  return pify(peerId.createFromPrivKey)(privateKey) // peerid
    .then(id => {
      return new PeerInfo(id)
    }) // peerInfo
    .then(async peerInfo => {
      let peerPublicIP = await getPublicIp()
      if (!peerPublicIP) {
        if (config.signal) {
          let ma = multiaddr(config.signal)
          peerInfo.multiaddrs.add(ma)
        }
      }
      let addr = `/ip4/0.0.0.0/tcp/${config.Port}`
      let ma = multiaddr(addr)
      peerInfo.multiaddrs.add(ma)

      return peerInfo
    })
    .then(peerInfo => {
      return new Node(peerInfo, config)
    })
}

const runP2p = async () => {
  let publicIpsList = []
  const emitter = new EventEmitter()

  let node = await createNode()

  let start = () => {
    return new Promise((reslove, reject) => {
      node.start(error => {
        if (error) reject(error)
        reslove()
      })
    })
  }

  return start().then(async () => {
    console.log('node has started (true/false):', node.isStarted())
    console.log('listening on:')
    node.peerInfo.multiaddrs.forEach(ma => console.log(ma.toString()))

    emitter.addListener('newPublicAddr', addr => {
      const ma = multiaddr(addr)
      const id = peerId.createFromB58String(ma.getPeerId())
      let peer = new PeerInfo(id)
      peer.multiaddrs.add(ma)
      node.dial(peer, (err, conn) => {
        if (err) {
          _.remove(publicIpsList, n => {
            return n == addr
          })
        }
      })
    })

    // when discovery a peer, try to dial to this peer,if it can reply,
    // peers will connect with each other
    node.on('peer:discovery', peerInfo => {
      node.dial(peerInfo, (err, conn) => {
        if (err) console.log(err)
      })
    })

    // when connect a peer, send own public ip to it
    node.on('peer:connect', peerInfo => {
      const idStr = peerInfo.id.toB58String()
      console.log(colors.green('Connected: ') + idStr)
    })

    node.on('peer:disconnect', peerInfo => {
      console.log(colors.gray('Disconnect:'), peerInfo.id.toB58String())
    })

    let peerPublicIp = await getPublicIp()

    node.handle('/getPubIpAddr', (protocol, conn) => {
      pull(
        conn,
        pull.map(ip => msg.addr.decode(ip)),
        pull.collect((err, array) => {
          if (err) console.log(err)
          if (publicIpsList.indexOf(array[0].addr) == -1) {
            publicIpsList.push(array[0].addr)
            emitter.emit('newPublicAddr', array[0].addr)
          }
        })
      )
    })

    node.handle('/getAddrList', (protocol, conn) => {
      pull(
        conn,
        pull.map(v => msg.addrs.decode(v)),
        pull.collect(function(err, array) {
          array[0].addrs.map(v => {
            if (publicIpsList.indexOf(v) == -1) {
              publicIpsList.push(v)
              emitter.emit('newPublicAddr', v)
            }
          })
        })
      )
    })

    // sendstar receive a unconfirm star, it should push to pool, to be confirm( for commissions) .
    node.handle('/sendStar', (protocol, conn) => {
      pull(conn, pull.map(star => starProto.star.decode(star)), pull.log())
    })

    node.handle('/t', (protocol, conn) => {
      pull(conn, pull.map(s => s.toString()), pull.log())
    })

    setInterval(() => {
      let i = node.peerInfo.id.toB58String()
      values(node.peerBook.getAll()).forEach(peer => {
        node.dial(peer, '/t', (err, conn) => {
          if (err) console.log(err)
          pull(pull.values([`hello, this is a ${i} dial`]), conn)
        })
      })
    }, 2000)

    if (peerPublicIp) {
      let id = node.peerInfo.id.toB58String()
      let addr = `/ip4/${peerPublicIp}/tcp/${config.Port}/ipfs/${id}`
      const buf = msg.addr.encode({
        addr: addr
      })
      setInterval(() => {
        values(node.peerBook.getAll()).forEach(peer => {
          node.dial(peer, '/getPubIpAddr', (err, conn) => {
            if (err) console.log(err)
            pull(pull.values([buf]), conn)
          })
        })
      }, 1000 * 60)
    }

    setInterval(() => {
      if (publicIpsList.length != 0) {
        values(node.peerBook.getAll()).forEach(peer => {
          node.dial(peer, '/getAddrList', (err, conn) => {
            if (err) console.log(err)
            pull(pull.values([encodePublicIps(publicIpsList)]), conn)
          })
        })
      }
    }, 1000 * 30)

    return node
  })
}

module.exports = runP2p
