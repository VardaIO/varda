const libp2p = require('libp2p')
const Multiplex = require('libp2p-mplex')
const SECIO = require('libp2p-secio')
const TCP = require('libp2p-tcp')
const WS = require('libp2p-websockets')
const WebSocketStar = require('libp2p-websocket-star')
const Railing = require('libp2p-railing')
const MulticastDNS = require('libp2p-mdns')

class Node extends libp2p {
  constructor(peerInfo, config) {
    const wsstar = new WebSocketStar({
      id: peerInfo.id
    })
    const ws = new WS()
    const modules = {
      transport: [new TCP(), wsstar, ws],
      connection: {
        muxer: [Multiplex],
        crypto: [SECIO]
      },
      discovery: [
        new MulticastDNS(peerInfo, {
          interval: 100
        }),
        wsstar.discovery
      ]
    }
    // bootstrap
    if (config.bootstrap) {
      modules.discovery.push(new Railing(config.bootstrap))
    }

    super(modules, peerInfo)
  }
}

module.exports = Node
