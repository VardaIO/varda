const libp2p = require('libp2p')
const Multiplex = require('libp2p-multiplex')
const SECIO = require('libp2p-secio')
const TCP = require('libp2p-tcp')
const WS = require('libp2p-websockets')
const WebSocketStar = require('libp2p-websocket-star')
const Railing = require('libp2p-railing')
const MulticastDNS = require('libp2p-mdns')

class Node extends libp2p {
    constructor(peerInfo, config) {
        const wsstar = new WebSocketStar({ id: peerInfo.id })
        const modules = {
            transport: [new TCP(), new WS(), wsstar],
            connection: {
                [Multiplex],
                crypto: [SECIO]
            },
            discovery: [wsstar.discovery]
        }
        // bootstrap
        modules.push(config.bootstrap)
        // mdns
        modules.push(new MulticastDNS(peerInfo, { interval: 100 }))

        super(modules, peerInfo)
    }
}

module.exports = Node