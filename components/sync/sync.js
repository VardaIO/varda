const fs = require('fs')
const pb = require('protocol-buffers')
const appRoot = require('app-root-path')
const { values, random, isEqual, isString, isFinite } = require('lodash')
const multiaddr = require('multiaddr')
const PeerInfo = require('peer-info')
const peerId = require('peer-id')
const colors = require('colors')
const pull = require('pull-stream')
const _ = require('lodash')

const pool = require('../../database/pool')
const Star = require('../star')
const { addStar } = require('../addStar')
const starProto = pb(fs.readFileSync(`${appRoot}/network/protos/star.proto`))
const config = require('../../config.json')
// const Pushable = require('pull-pushable')
// const push = Pushable()

const getLastMci = async () => {
  const client = await pool().acquire()

  try {
    const lastMci = client
      .prepare(
        'SELECT main_chain_index FROM stars ORDER BY main_chain_index DESC LIMIT 1'
      )
      .get().main_chain_index
    return lastMci
  } catch (error) {
    console.log(error)
  } finally {
    const loan = new Map().get(client)
    if (loan !== undefined) {
      pool().release(client)
    }
  }
}

const getDataFromPeers = conn => {
  return new Promise((resolve, reject) => {
    pull(
      conn,
      pull.map(data => {
        return data.toString('utf8')
      }),
      pull.collect((error, array) => {
        if (error) reject(error)
        resolve(array)
      })
    )
  })
}

const _prepareDataForgetLastMci = peer => {
  return new Promise((resolve, reject) => {
    global.n.dialProtocol(peer, '/getLastMci', async (error, conn) => {
      if (error) reject(error)
      let data = await getDataFromPeers(conn)
      resolve(data)
    })
  })
}

const findCurrentMciFromPeers = mcis => {
  if (_.isEmpty(mcis)) return 0

  const length = mcis.length
  const lastMci = Math.max(...mcis)
  let number = 0
  mcis.forEach(mci => {
    if (lastMci === mci) number++
  })

  if (number <= length / 2) {
    mcis = _.filter(mcis, mci => {
      return mci !== lastMci
    })
    findCurrentMciFromPeers(mcis)
  }
  return lastMci
}

const getLastMciFromPeers = async () => {
  // two pub sub,计数器
  const count = []
  const peers = values(global.n.peerBook.getAll())
  for (let i = 0; i < peers.length; i++) {
    const peer = peers[i]
    const data = await _prepareDataForgetLastMci(peer)
    let mci = data[0]
    if (mci === undefined) {
      mci = 0
    }
    count.push(mci)
  }
  console.log(count)
  // get the bigest
  // 如果最大的占一半，则可以相信
  try {
    const lastMci = findCurrentMciFromPeers(count)
  } catch (error) {
    return Promise.reject(error)
  }
  return Promise.resolve(lastMci)
}

const buildStarsForSync = async index => {
  if (index === 0 || index === '0') return
  if (isString(index)) {
    index = parseInt(index)
  }
  console.log('buildStarsForSync index is:', index)

  const client = await pool().acquire()
  try {
    let starHashList = client
      .prepare(`SELECT star FROM stars WHERE main_chain_index=${index}`)
      .all()
    console.log(starHashList.length)
    console.log(starHashList)
    if (starHashList.length == 0) {
      console.log(1)
      return []
    }

    const star = new Star()
    const stars = []
    starHashList.forEach(async v => {
      let aStar = await star.getStar(v.star)
      stars.push(aStar)
    })

    return await stars
  } catch (error) {
    console.log(error)
  } finally {
    const loan = new Map().get(client)
    if (loan !== undefined) {
      pool().release(client)
    }
  }
}

const _getStarsFromPeer = (peer, startMci) => {
  return new Promise((resolve, reject) => {
    global.n.dialProtocol(peer, '/sync', (err, conn) => {
      if (err) reject(err)

      pull(pull.values([`${startMci}`]), conn)

      pull(
        conn,
        pull.map(data => {
          return starProto.stars.decode(data)
        }),
        pull.collect((error, array) => {
          if (error) reject(error)
          let stars
          try {
            if (_.isEmpty(array[0])) return
            stars = array[0].stars
            resolve(stars)
          } catch (error) {
            reject(error)
          }
        })
      )
    })
  })
}

const getStarsFromPeer = async (peer, startMci) => {
  console.log(`in getStarsFromPeer, startMci is ${startMci}`)

  try {
    let stars = await _getStarsFromPeer(peer, startMci)
    return Promise.resolve(stars)
  } catch (error) {
    return Promise.reject(error)
  }
}

const getAPeer = () => {
  const peers = values(global.n.peerBook.getAll())
  const index = random(0, peers.length)
  console.log(`index is ${index}`)
  return peers[index]
}

const _shuffle = array => {
  var m = array.length,
    t,
    i
  while (m) {
    i = Math.floor(Math.random() * m--)
    t = array[m]
    array[m] = array[i]
    array[i] = t
  }
  return array
}

const addStarFromPeer = star => {
  // vailidate
  try {
    addStar(star)
  } catch (error) {
    console.log(error)
  }
}

const sync = async mciFromPeers => {
  if (mciFromPeers === 0 || mciFromPeers === '0') return

  if (!isFinite(mciFromPeers)) return
  console.log('wanna to sync now, and mci is:', mciFromPeers)

  let startMci
  try {
    startMci = await getLastMci()
  } catch (error) {
    console.log(error)
  }

  if (startMci === mciFromPeers) {
    console.log('sync finished')
    return
  }

  // const dValue = await getLastMciFromPeers() - lastMciInLocal
  while (startMci < mciFromPeers) {
    if (parseInt(startMci) == 0) {
      startMci = 1
    }
    const peers = _shuffle(values(global.n.peerBook.getAll()))
    let peerA = peers[0]
    let peerB = peers[1]
    let starsA
    let starsB
    try {
      starsA = await getStarsFromPeer(peerA, startMci)
      starsB = await getStarsFromPeer(peerB, startMci)
    } catch (error) {
      console.log(error)
    }

    console.log(starsA)
    console.log(starsB)

    const compare = isEqual(starsA, starsB)

    console.log('compare result:', compare)
    if (compare) {
      // add stars to database
      for (let i = 0; i < starsA.length; i++) {
        addStarFromPeer(starsA[i])
        colors.green(`add star with index ${starsA[i].mci}`)
      }
    } else {
      console.log('not equal')
      // get stars from bootstrap
      const bootstrap = config.bootstrap
      const peerIndex = random(bootstrap.length - 1)
      const addr = bootstrap[peerIndex]
      const ma = multiaddr(addr)
      const id = peerId.createFromB58String(ma.getPeerId())
      const peer = new PeerInfo(id)
      const stars = await getStarsFromPeer(peer, startMci)

      console.log('stars form bootstrap: \n', stars)
      for (let i = 0; i < stars.length; i++) {
        addStarFromPeer(stars[i])
        console.log(colors.green(`add star with index ${stars[i].mci}`))
      }
    }
    startMci++
  }
}

module.exports = {
  getLastMci,
  getLastMciFromPeers,
  buildStarsForSync,
  sync,
  getDataFromPeers
}
