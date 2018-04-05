const fs = require('fs-extra')
const os = require('os')

const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'

const createVardaHome = async () => {
  try {
    await fs.ensureDir(VARDA_HOME)
    console.log('VARDA_HOME create success! / VARDA_HOME already exists')
    await fs.ensureFile(`${VARDA_HOME}/varda.sqlite`)
  } catch (error) {
    console.error(error)
  }
}

const initVarda = () => {
  createVardaHome()
    .then(async () => {
      try {
        const exists = await fs.pathExists('config.json')
        if (!exists) {
          fs.copySync('config.json.example', 'config.json')
          console.log('create config.json success!')
        }
      } catch (error) {
        return Promise.reject(error)
      }
    })
    .then(() => {
      const Star = require('./components/star')
      const pool = require('./database/pool')
      pool()
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
            .prepare(
              'CREATE INDEX IF NOT EXISTS mci ON stars (main_chain_index)'
            )
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
            !client
              .prepare('SELECT star FROM stars WHERE main_chain_index=0')
              .get()
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
          const loan = new Map().get(client)
          if (loan !== undefined) {
            pool().release(client)
          }
          return Promise.resolve()
        })
        .catch(error => {
          return Promise.reject(error)
        })
    })
    .then(async () => {
      try {
        const generateKey = require('./network/generateKey')
        await generateKey()
        return Promise.resolve()
      } catch (error) {
        return Promise.reject(error)
      }
    })
    .then(async () => {
      try {
        await fs.ensureFile('initialComplete')
      } catch (error) {
        return Promise.reject(error)
      }
    })
    .catch(error => console.log(error))
}
// tables: stars, parenthoods, transactions, account_pks
// star use base64

const init = async () => {
  try {
    const exists = await fs.pathExists('initialComplete')
    if (!exists) {
      await initVarda()
    }
    return Promise.resolve()
  } catch (error) {
    return Promise.reject(error)
  }
}
// init()
// const initialVarda = async () => {
//   await createVardaHome()
//   await sqliteMigrate()
//   createConfig()
//   generateKey()

// }

module.exports = init
// fs.copy('./config.json.example', 'config.json')
