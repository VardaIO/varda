//first, get last main chain index, and view how many stars in it

/* today is new year, so drink some bear～ happy new year every friends!!!!!
*   at 2018.2.15 23:52
*/ 
const _ = require('lodash')
const pool = require('../database/pool')
const Star = require('./star')
const aStar = new Star()
const genesis = aStar.getGenesis()

const lastMci = client.prepare('SELECT main_chain_index FROM stars ORDER BY main_chain_index DESC LIMIT 1').get().main_chain_index

function findUnLinked(client, index) {
    const unlinkedStars = []
    const stars = client.prepare(`SELECT * FROM stars WHERE main_chain_index=${index}`).all()
    stars.map(star => {
        const starHash = star.star
        const childrenCount = client.prepare(`SELECT COUNT(*) AS children FROM parenthoods WHERE parent_star=${starHash}`).children
        if (childrenCount == 0) {
            unlinkedStars.push(starHash)
        }
    })
    return unlinkedStars
}

function findUnLinkedInFour(client) {
    const mciArray = []
    if (lastMci < 4) return mciArray
    for (let i = 1; i < 5; i++) {
        const unlinkedStars = findUnLinked(client, i)
        mciArray.concat(unlinkedStars)
    }
    return mciArray
}

function getSortedStars(client, index) {
    const stars = client.prepare(`SELECT star FROM stars WHERE main_chain_index=${index}`).all().map(star => {
        return star.star
    })
    stars = _.sortBy(stars, (star) => {
        return star
    })
}

function getParents(client) {
    const starsOfMci = client.prepare(`SELECT * FROM stars WHERE main_chain_index=${lastMci}`).all()
    const intervalTime = Math.floor(Date.now() / 1000) - starsOfMci[0].timestamp

    if (starsOfMci.length == 1) {
        if (intervalTime > 10) {
            const parents = [starsOfMci[0].star, ...findUnLinkedInFour(client)]
            const move = 1
            return {
                parents,
                move
            }
        } else {
            const index = lastMci - 1
            if (index == 0) {
                return {
                    parents: [genesis.star_hash],
                    move: 0
                }
            }

            const unlinkedStars = findUnLinked(client, index)

            if (unlinkedStars.length > 2) {
                return {
                    parents: [...unlinkedStars, ...findUnLinkedInFour(client)],
                    move: 0
                }
            }

            if (unlinkedStars.length = 1) {
                if (findUnLinkedInFour(client).length == 0) {
                    const stars = getSortedStars(client, index)
                    return {
                        parents: [...unlinkedStars, stars[0]],
                        move: 0
                    }
                } else {
                    return {
                        parents: [...unlinkedStars, ...findUnLinkedInFour(client)],
                        move: 0
                    }
                }
            }

            // when count of unlinkedStars equal 0

            if (findUnLinkedInFour(client).length == 0) {
                const stars = getSortedStars(client, index)
                return {
                    parents: [...unlinkedStars, stars[0].slice(0, 2)],
                    move: 0
                }
            } else {
                const stars = getSortedStars(client, index)

                return {
                    parents: [...stars[0], ...findUnLinkedInFour(client)],
                    move: 0
                }
            }

        }
    } else {
        if (intervalTime > 10) {
            const parents = [starsOfMci[0].star, ...findUnLinkedInFour(client)]
            const move = 1
            return {
                parents,
                move
            }
        }

        if (starsOfMci.length < 10) {
            const unlinkedStars = findUnLinked(client, lastMci - 1)
            const starsInFour = findUnLinkedInFour(client)
            if (starsInFour.length == 0) {
                if (1 < unlinkedStars.length < 2) {
                    return {
                        parents: [getSortedStars(client, lastMci - 1)[0], unlinkedStars],
                        move: 0
                    }
                }

                if (unlinkedStars.length > 2) {
                    return {
                        parents: unlinkedStars,
                        move: 0
                    }
                }

                if (unlinkedStars.length = 0) {
                    return {
                        parents: getSortedStars(client, lastMci - 1).slice(0, 2),
                        move: 0
                    }
                }
            } else {
                if (1 < unlinkedStars.length < 2) {
                    return {
                        parents: [unlinkedStars, starsInFour],
                        move: 0
                    }
                }

                if (unlinkedStars.length > 2) {
                    return {
                        parents: [...unlinkedStars, ...starsInFour],
                        move: 0
                    }
                }

                if (unlinkedStars.length = 0) {
                    return {
                        parents: [getSortedStars(client, lastMci - 1)[0], ...starsInFour],
                        move: 0
                    }
                }

            }
        }
    }
}

const addStar = (transaction) => {
    return pool.acquire().then(client => {
        const begin = client.prepare('BEGIN');
        const commit = client.prepare('COMMIT');
        const rollback = client.prepare('ROLLBACK');
        const {
            parents,
            move
        } = getParents(client)
        const mci = lastMci + move
        const star = aStar.buildStar({
            timestamp: Math.floor(Date.now() / 1000),
            parentStars: parents,
            payload_hash: transaction.payload_hash,
            transaction: transaction,
            authorAddress: transaction.sender,
            mci: mci
        })
        aStar.buildStar(transaction)

        begin.run()
        try {
            let addStar = client.prepare('INSERT INTO stars VALUES (?, ?, ?, ?, ?)')
            addStar.run(aStar.star_hash, aStar.mci, aStar.timestamp, transaction.payload_hash, aStar.authorAddress)
            // transaction
            let addTransaction = client.prepare('INSERT INTO transactions VALUES (@star, @type, @sender, @amount, @recpient, @signature)')
            addTransaction.run({
                star: aStar.star_hash,
                type: transaction.type,
                sender: transaction.sender,
                amount: transaction.amount,
                recpient: transaction.recpient,
                signature: transaction.signature
            })
            // parenthood
            let addparenthood = client.prepare('INSERT INTO parenthoods VALUES (@child_star, @parent_star, @parent_index)')
            parents.map((parent, index) => {
                addparenthood.run({
                    child_star: aStar.star_hash,
                    parent_star: parent,
                    parent_index: index
                })
            })
            //account pk

            let findPk = client.prepare(`SELECT COUNT(*) AS pk FROM account_pks WHERE address=${transaction.sender}`).pk
            if (findPk == 0) {
                let addAccount = client.prepare('INSERT INTO account_pks VALUES (@address,@pk)')
                addAccount.run({
                    address: transaction.sender,
                    pk: transaction.senderPublicKey
                })
            }
            commit.run()

        } finally {
            if (client.inTransaction) rollback.run();
        }
        pool.release(client)
    }).catch(error => {
        return Promise.reject(error)
    })
}