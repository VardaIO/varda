const os = require('os')
const fs = require('fs')
const PeerInfo = require('peer-info')
const peerId = require('peer-id')
const pify = require('pify')
const rootPath = require('app-root-path')
const multiaddr = require('multiaddr')
const { values } = require('lodash')
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
        .then(id => { return new PeerInfo(id) }) // peerInfo
        .then(peerInfo => {
            let addr = `/ip4/${ip.address()}/tcp/${config.Port}`
            let ma = multiaddr(addr)
            peerInfo.multiaddrs.add(ma) //add multiaddr
            return peerInfo
        })
        .then(peerInfo => { return new Node(peerInfo, config) })
}

const getIp = async () => {
    try {
        return await publicIP.v4()
    } catch (error) {
        return ip.address()
    }
}

const addBootstrap = (peer) => {
    const find = element => {
        return element == peer
    }
    if (bootstrap.findIndex(find) == -1) {
        bootstrap.push(peer)
    }
}


function getPeers() {
    const buf = msg.addrs.encode({
        addrs: bootstrap
    })
    return buf
}

function sendAddrs(node, peerInfo) {
    node.dial(peerInfo, '/addrs', (err, conn) => {
        if (err) console.log(err)
        pull(
            pull.values([getPeers()]),
            conn
        )
    })
}

async function sendAddr(node, peerInfo) {
    try {
        let publicIp = await publicIP.v4()
        const buf = msg.addr.encode({
            addr: `/ip4/${publicIp}/tcp/${config.Port}/ipfs/${node.peerInfo.id.toB58String()}`
        })
        node.dial(peerInfo, '/addr', (err, conn) => {
            if (err) console.log(err)
            pull(
                pull.values([buf]),
                conn
            )
        })
    } catch (error) {
        console.log('no public ip')
    }

}

setImmediate(async () => {
    let node = await createNode()
    node.start(() => {
        console.log('node has started (true/false):', node.isStarted())
        console.log('listening on:')
        node.peerInfo.multiaddrs.forEach((ma) => console.log(ma.toString()))

        // send all bootstrap peers to connected client
        node.handle('/addrs', (protocol, conn) => {
            pull(
                conn,
                pull.map((v) => msg.addrs.decode(v)),
                pull.collect(function (err, array) {
                    array[0].addrs.map((v) => {
                        addBootstrap(v)
                    })
                })
            )
        })

        // send own public ip to server/bootstrap peer
        node.handle('/addr', (protocol, conn) => {
            pull(
                conn,
                pull.map((v) => msg.addr.decode(v)),
                pull.collect(function (err, array) {
                    addBootstrap(array[0].addr)
                })
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
            sendAddr(node, peerInfo)
        })

        node.on('peer:disconnect', (peerInfo) => {
            console.log('disconnect a peer')
        })



        setInterval(() => {
            values(node.peerBook.getAll()).forEach((peer) => {
                const addr = peer.isConnected()
                if (!addr) { return }
                sendAddrs(node, peer)
            })

        }, 1000 * 10 * 2)

        // setInterval(() => {
        //     values(node.peerBook.getAll()).forEach((peer) => {
        //         const addr = peer.isConnected()
        //         if (!addr) { return }
        //         console.log('=====================')
        //         console.log(addr.toString())
        //         console.log('=====================')
        //         console.log(bootstrap)
        //     })

        // }, 1000 * 10)
    })

})