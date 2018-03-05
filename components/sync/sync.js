const pool = require('../../database/pool')
const { values, random, isEqual } = require('lodash')
const Star = require('../star')
const {addStar} = require('../addStar')
// const Pushable = require('pull-pushable')
// const push = Pushable()

const getLastMci = async () => {
  const client = await pool.acquire()
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
    pool.release(client)
  }
}

const getLastMciFromPeers = () => {
  // two pub sub,计数器
  const count = []
  values(node.peerBook.getAll()).forEach(peer => {
    global.n.dialProtocol(peer, '/getLastMci', (err, conn) => {
      if (error) console.log(error)
      pull(
        conn,
        pull.map(data => {
          return data.toString('utf8')
        }),
        pull.drain(
          data => {
            count.push(data)
          },
          error => {
            console.log(error)
          }
        )
      )
    })
  })
  // get the bigest
  const lastMci = Math.max(...count)

  return Promise.resolve(lastMci)
}

const buildStarsForSync = async index => {
  const client = await pool.acquire()
  try {
    let starHashList = client
      .prepare(`SELECT star FROM stars WHERE main_chain_index=${index}`)
      .all()

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
    pool.release(client)
  }
}

const getStarsFromPeer = (peer, startMci) => {
  let stars = []

  global.n.dialProtocol(peer, '/sync', (err, conn) => {
    if (err) console.log(err)
    pull(
      pull.values([`${startMCI}`]),
      conn,
      pull.map(data => {
        return DECODE
      }),
      pull.drain(
        data => {
          // add it to database
          stars.push(data)
        },
        error => {
          console.log(error)
          return getStarsFromPeer(getAPeer(), startMci)
          //Change Another Peer to get Star
        }
      )
    )
  })
  return stars
}

const getAPeer = () => {
  const peers = values(node.peerBook.getAll())
  const index = random(peers.length)
  return peers[index]
}

const addStarFromPeer = (star) => {
  // vailidate
  addStar(star)
}

const sync = async lastMci => {
  const startMci = await getLastMci()
  // const dValue = await getLastMciFromPeers() - lastMciInLocal
  // getAPeer is a mock function
  while (startMci < lastMci) {
    let peerA = getAPeer()
    let peerB = getAPeer()

    while(!isEqual(peerA, peerB)) {
      peerB = getAPeer()
    }
    
    let starsA = getStarsFromPeer(peerA, startMci)
    let starsB = getStarsFromPeer(peerB, startMci)

    const compare = isEqual(starsA, starsB)

    if (compare) {
      // add stars to database
      for (let i = 0; i < starsA.length; i++) {
        addStarFromPeer(starsA[i])
      }
    } else {
      // get stars from bootstrap
    }
    startMci++
  }
}

module.exports = { getLastMci, getLastMciFromPeers, buildStarsForSync }
