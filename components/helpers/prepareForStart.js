const root = require('app-root-path')

const initDb = async (pool, dbFilePath) => {
  if (pool === undefined || typeof Star !== 'function') {
    pool = require(`${root}/database/pool`)
  }

  let client
  if (dbFilePath) {
    client = await pool().acquire(dbFilePath)
  } else {
    client = await pool().acquire()
  }

  try {
    client
      .prepare(
        `CREATE TABLE IF NOT EXISTS stars (
              star CHAR(44) PRIMARY KEY NOT NULL,
              main_chain_index BIGINT NOT NULL,
              timestamp INT NOT NULL,
              payload_hash CHAR(64) NOT NULL,
              author_address CHAR(29) NOT NULL,
              signature CHAR(128)
              )`
      )
      .run()
    client
      .prepare('CREATE INDEX IF NOT EXISTS mci ON stars (main_chain_index)')
      .run()

    client
      .prepare(
        `CREATE TABLE IF NOT EXISTS  parenthoods (
              child_star CHAR(44) NOT NULL,
              parent_star CHAR(44) NOT NULL,
              parent_index INT NOT NULL DEFAULT 0,
          
          PRIMARY KEY (
              parent_star,
              child_star
          )
          )`
      )
      .run()
    client
      .prepare(
        'CREATE INDEX IF NOT EXISTS byChildStar ON parenthoods (child_star)'
      )
      .run()

    client
      .prepare(
        `CREATE TABLE IF NOT EXISTS transactions (
                  star CHAR(44) PRIMARY KEY NOT NULL,
                  type INT NOT NULL,
                  sender CHAR(29) NOT NULL,
                  amount BIGINT NOT NULL,
                  recpient CHAR(29)
          )`
      )
      .run()
    client
      .prepare('CREATE INDEX IF NOT EXISTS byStar ON transactions (star)')
      .run()

    client
      .prepare(
        `CREATE TABLE IF NOT EXISTS account_pks (
                 address  CHAR(29) PRIMARY KEY NOT NULL,
                 pk CHAR(64) NOT NULL
              )`
      )
      .run()
    client
      .prepare('CREATE INDEX IF NOT EXISTS byAddress ON account_pks (address)')
      .run()
    return Promise.resolve()
  } catch (error) {
    return Promise.reject(error)
  } finally {
    const loan = new Map().get(client)
    if (loan !== undefined) {
      pool().release(client)
    }
  }
}

const addGenesisStar = async (pool, Star) => {
  if (pool === undefined || typeof Star !== 'function') {
    pool = require(`${root}/database/pool`)
  }

  if (Star === undefined || typeof Star !== 'function') {
    Star = require(`${root}/components/star`)
  }
  const client = await pool().acquire()
  try {
    if (
      !client.prepare('SELECT star FROM stars WHERE main_chain_index=0').get()
    ) {
      const star = new Star()
      const genesis = star.getGenesis()
      let addGenesis = client.prepare(
        'INSERT INTO stars VALUES (?, ?, ?, ?, ?, ?)'
      )
      addGenesis.run(
        genesis.star_hash,
        0,
        genesis.timestamp,
        genesis.payload_hash,
        genesis.authorAddress,
        'null'
      )

      let addGenesisTx = client.prepare(
        'INSERT INTO transactions VALUES (@star, @type, @sender, @amount, @recpient)'
      )
      addGenesisTx.run({
        star: genesis.star_hash,
        type: 0,
        sender: genesis.transaction.sender,
        amount: genesis.transaction.amount,
        recpient: genesis.transaction.recpient
      })

      console.log('added a genesis star ')
      return Promise.resolve()
    }
  } catch (error) {
    return Promise.reject(error)
  } finally {
    const loan = new Map().get(client)
    if (loan !== undefined) {
      pool().release(client)
    }
  }
}

module.exports = {
  initDb,
  addGenesisStar
}
