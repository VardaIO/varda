const fs = require('fs')
const os = require('os')

const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'

if (!fs.existsSync(VARDA_HOME)) {
    fs.mkdirSync(VARDA_HOME)
}

const pool = require('./database/pool')
// tables: stars, transactions, account_pks
// star use base64
pool.acquire().then((client) => {
    client.prepare("CREATE TABLE  stars (" +
        "star CHAR(44) PRIMARY KEY NOT NULL," +
        "main_chain_index BIGINT NOT NULL," +
        "timestamp INT NOT NULL," +
        "payload_hash CHAR(64) NOT NULL," +
        "author_address CHAR(29) NOT NULL" +
        ")"
    ).run()
    // client.prepare("CREATE TABLE IF NOT EXISTS transactions (" +
    //         "star TEXT PRIMARY KEY NOT NULL" +
    //         ""
    //     )
})