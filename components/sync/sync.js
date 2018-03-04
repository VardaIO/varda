const pool = require('../../database/pool')
const { values } = require('lodash')
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
  values(node.peerBook.getAll()).forEach(peer => {
    node.dialProtocol(peer, '/getLastMci', (err, conn) => {
      if (err) console.log(err)
      // pull(pull.values(['please tell me the last mci']), conn)
      pull(
        conn,
        pull.map(data => {
          return data.toString('utf8')
        }),
        pull.drain((data) => {
          console.log(data)
        }, (error) => {
          console.log(error)
        })
      )
      
    })
  })
}

module.exports = { getLastMciFromPeers }
