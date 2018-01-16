const os = require('os')
const PeerInfo = require('peer-info')
const peerId = require('peer-id')
const pify = require('pify')
const rootPath = require('app-root-path')
const multiaddr = require('multiaddr')
const { values } = require('lodash')
const pb = require('protocol-buffers')
const fs = require('fs')
const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'
const privateKey = require(VARDA_HOME + '/keys.json').PrivateKey
const config = require(`${rootPath}/config.json`)
const Node = require('./node-bundle')

const msg = pb(fs.readFileSync('./protos/node.proto'))


const createNode = () => {
    return pify(peerId.createFromPrivKey)(privateKey) // peerid 
        .then(id => { return new PeerInfo(id) }) // peerInfo
        .then(peerInfo => {
            // peerInfo.multiaddrs.add(ma)}
            config.Swarm.forEach((addr) => {
                let ma = multiaddr(addr)
                peerInfo.multiaddrs.add(ma) //add multiaddr
            })
            return peerInfo
        })
        .then(peerInfo => { return new Node(peerInfo, config) })
}
function getPeers(node) {
    let peers = []
    values(node.peerBook.getAll()).forEach((peer) => {
        const addr = peer.isConnected()
        if (!addr) { return }
        peers.push(addr.toString())
    })
    const buf = msg.addrs.encode({
        addrs: peers
    })
    // console.log(msg.addrs.decode(buf))
    return buf
}
function sendAddrs(node, peerInfo) {
    node.dial(peerInfo, '/addrs', (err, conn) => {
        if (err) console.log(err)
        pull(
            pull.values([getPeers(node)]),
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

        node.handle('/addrs', (protocol, conn) => {
            pull(
                conn,
                pull.map((v) => msg.addrs.decode(v)),
                pull.collect(function (err, array) {
                    console.log(array)
                })
            )

        })

        node.on('peer:discovery', (peerInfo) => {
            console.log('Discovered a peer')
            const idStr = peerInfo.id.toB58String()
            console.log('Discovered: ' + idStr)
            // console.log(peerInfo)
            node.dial(peerInfo, (err, conn) => {
                if (err) console.log(err)
            })
        })
        node.on('peer:connect', (peerInfo) => {
            console.log('connected a peer')
            const idStr = peerInfo.id.toB58String()


            console.log('connected: ' + idStr)
            console.log(node.peerBook)
        })

        node.on('peer:disconnect', (peerInfo) => {
            console.log('disconnect a peer')
            // console.log(node.peerBook)
        })



        setInterval(() => {
            values(node.peerBook.getAll()).forEach((peer) => {
                const addr = peer.isConnected()
                if (!addr) { return }
                sendAddrs(node, peer)
            })

        }, 1000 * 10 * 2)
    })

})