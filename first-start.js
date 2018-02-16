const fs = require('fs')
const os = require('os')

const Star = require('./components/star')
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
    // PRIMARY KEY (
    //     parent_unit,
    //     child_unit
    // ),
    // CONSTRAINT parenthoodsByChild FOREIGN KEY (
    //     child_unit
    // )
    // REFERENCES units (unit),
    // CONSTRAINT parenthoodsByParent FOREIGN KEY (
    //     parent_unit
    // )
    // REFERENCES units (unit) 
    client.prepare(`CREATE TABLE IF NOT EXISTS  parenthoods (
        child_star CHAR(44) NOT NULL,
        parent_star CHAR(44) NOT NULL,
        parent_index INT NOT NULL DEFAULT 0,
    
    PRIMARY KEY (
        parent_star,
        child_star
    )
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

    if (!client.prepare('SELECT star FROM stars WHERE main_chain_index=0').get()) {
        const star = new Star()
        const genesis = star.getGenesis()
        let addGenesis = client.prepare('INSERT INTO stars VALUES (?, ?, ?, ?, ?)');
        addGenesis.run(genesis.star_hash, 0, genesis.timestamp, genesis.payload_hash, genesis.authorAddress);
        console.log('added a genesis star ')
    }
    pool.release(client)
}).catch(error => console.log(error))