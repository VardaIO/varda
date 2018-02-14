const fs = require('fs')
const os = require('os')

const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'

if (!fs.existsSync(VARDA_HOME)) {
    fs.mkdirSync(VARDA_HOME)
}

const pool = require('./database/pool')
// tables: stars, parenthoods, transactions, account_pks
// star use base64
pool.acquire().then((client) => {
    client.prepare(`CREATE TABLE IF NOT EXISTS stars (
        star CHAR(44) PRIMARY KEY NOT NULL,
        main_chain_index BIGINT NOT NULL,
        timestamp INT NOT NULL,
        payload_hash CHAR(64) NOT NULL,
        author_address CHAR(29) NOT NULL
        )`).run()
    client.prepare("CREATE INDEX IF NOT EXISTS mci ON stars (main_chain_index)").run()

    client.prepare(`CREATE TABLE IF NOT EXISTS  parenthoods (
        child_star CHAR(44) PRIMARY KEY NOT NULL,
        parent_star CHAR(44) NOT NULL,
        parent_index INT NOT NULL DEFAULT 0
    )`).run()
    client.prepare("CREATE INDEX IF NOT EXISTS byChildStar ON parenthoods (child_star)").run()

    client.prepare(`CREATE TABLE IF NOT EXISTS transactions (
            star CHAR(44) PRIMARY KEY NOT NULL,
            type INT NOT NULL,
            sender CHAR(29) NOT NULL,
            amount BIGINT NOT NULL,
            recpient CHAR(29),
            signature CHAR(128) NOT NULL
    )`).run()
    client.prepare("CREATE INDEX IF NOT EXISTS byStar ON transactions (star)").run()

    client.prepare(
        `CREATE TABLE IF NOT EXISTS account_pks (
           address  CHAR(29) PRIMARY KEY NOT NULL,
           pk CHAR(64) NOT NULL
        )`
    ).run()
    client.prepare("CREATE INDEX IF NOT EXISTS byAddress ON account_pks (address)").run()

}).catch(e => console.log(e))