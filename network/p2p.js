const os = require('os')
const fs = require('fs')
const PeerInfo = require('peer-info')
const peerId = require('peer-id')
const pify = require('pify')
const rootPath = require('app-root-path')
const multiaddr = require('multiaddr')
const {
    values,
    pullAt
} = require('lodash')
const pb = require('protocol-buffers')
const pull = require('pull-stream')
const ip = require('ip')
const publicIP = require('public-ip')
const colors = require('colors')
const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'
const privateKey = require(VARDA_HOME + '/keys.json').PrivateKey
const config = require(`${rootPath}/config.json`)
const Node = require('./node-bundle')
const bootstrap = require('./bootstrap')

config.bootstrap = bootstrap
const msg = pb(fs.readFileSync('./protos/node.proto'))

const createNode = () => {
    return pify(peerId.createFromPrivKey)(privateKey) // peerid 
        .then(id => {
            return new PeerInfo(id)
        }) // peerInfo
        .then(peerInfo => {
            if (config.signal) {
                let ma = multiaddr(config.signal)
                peerInfo.multiaddrs.add(ma)
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

let getAddrs = async (node) => {
    return new Promise((resolve, reject) => {
        let addrs = []
        values(node.peerBook.getAll()).forEach((peer) => {
            const addr = peer.isConnected()
            if (!addr) {
                return
            }
            peer.multiaddrs.forEach((ma) => {
                if (ma) {
                    addrs.push(ma.toString())
                }
            })
        })
        resolve(addrs)
    })
}

const encodePeers = async (node) => {
    let addrs = await getAddrs(node)
    const buf = msg.addrs.encode({
        addrs: addrs
    })
    return buf
}

const sendAddrs = (node, peerInfo) => {
    node.dial(peerInfo, '/addrs', (err, conn) => {
        if (err) console.log(err)
        pull(
            pull.values([encodePeers(node)]),
            conn
        )
    })
}


setImmediate(async () => {

    let node = await createNode()

    node.start(() => {
        console.log('node has started (true/false):', node.isStarted())
        console.log('listening on:')
        node.peerInfo.multiaddrs.forEach((ma) => console.log(ma.toString()))
    })

    node.handle('/addrs', (protocol, conn) => {
        pull(
            conn,
            pull.map((v) => msg.addrs.decode(v)),
            pull.collect(function (err, array) {
                // array[0].addrs.map((v) => {
                //     // console.log(v)
                //     const peer = new PeerInfo()
                //     peer.multiaddrs.add(v)
                //     node.dial(peer, (err, conn) => {
                //         if (err) console.log(err)
                //     })
                // })
                console.log(array)
            })
        )
    })

    node.handle('/t', (protocol, conn) => {
        pull(
            conn,
            pull.map((s) => s.toString()),
            pull.log()
        )
    })

    // when discovery a peer, try to dial to this peer,if it can reply, 
    // peers will connect with each other
    node.on('peer:discovery', (peerInfo) => {
        node.dial(peerInfo, (err, conn) => {
            if (err) console.log(err)
        })
    })

    // when connect a peer, send own public ip to it
    node.on('peer:connect', (peerInfo) => {
        const idStr = peerInfo.id.toB58String()
        console.log(colors.green('Connected: ') + idStr)
        sendAddrs(node, peerInfo)
    })

    node.on('peer:disconnect', (peerInfo) => {
        console.log(colors.gray('Disconnect:'), peerInfo.id.toB58String())
    })

    setInterval(() => {
        // let addrs = await encodePeers(node)
        // console.log(addrs)

        let i = node.peerInfo.id.toB58String()
        values(node.peerBook.getAll()).forEach((peer) => {
            node.dial(peer, '/t', (err, conn) => {
                if (err) console.log(err)
                pull(
                    pull.values([`hello, this is a ${i} dial`]),
                    conn
                )
            })
        })
    }, 2000)

})