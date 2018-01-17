const defaultBootstrap = require(`${require('app-root-path')}/config.json`).bootstrap

const bootstrap = []

defaultBootstrap.forEach(peer => {
    bootstrap.push(peer)
})

module.exports = bootstrap