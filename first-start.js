const fs = require('fs-extra')
const os = require('os')

const Star = require('./components/star')
const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'
const pool = require('./database/pool')
const generateKey = require('./network/generateKey')

const createVardaHome = async () => {
  try {
    await fs.ensureDir(VARDA_HOME)
    console.log('VARDA_HOME create success! / VARDA_HOME already exists')
  } catch (error) {
    console.error(error)
  }
}

const createConfig = async () => {
  try {
    const exists = fs.pathExists('config.json')
    if (!exists) {
      await fs.copy('config.json.example', 'config.json')
      console.log('create config.json success!')
    }
  } catch (error) {
    error => console.error(error)
  }
}

// tables: stars, parenthoods, transactions, account_pks
// star use base64
const sqliteMigrate = () => {
  pool
    .acquire()
    .then(client => {
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
        .prepare(
          'CREATE INDEX IF NOT EXISTS byAddress ON account_pks (address)'
        )
        .run()

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
      }
      pool.release(client)
    })
    .catch(error => console.log(error))
}

const initialVarda = async () => {
  await createVardaHome()
  await sqliteMigrate()
  createConfig()
  generateKey()
  await fs.ensureFile('initialComplete')
}

module.exports = initialVarda
