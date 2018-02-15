//first, get last main chain index, and view how many stars in it
const _ = require('lodash')
const pool = require('../database/pool')
const Star = require('./star')
const genesis = new Star().getGenesis()

pool.acquire().then(client => {
    const lastMci = client.prepare('SELECT main_chain_index FROM stars ORDER BY main_chain_index DESC LIMIT 1').get().main_chain_index
    const starsOfMci = client.prepare(`SELECT * FROM stars WHERE main_chain_index=${lastMci}`).all()
    //  const starsCountInLastMci
    function findUnLinked(index) {
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

    function findUnLinkedInFour() {
        const mciArray = []
        if (lastMci < 4) return mciArray
        for (let i = 1; i < 5; i++) {
            const unlinkedStars = findUnLinked(i)
            mciArray.concat(unlinkedStars)
        }
        return mciArray
    }

    function getSortedStars(index) {
        const stars = client.prepare(`SELECT star FROM stars WHERE main_chain_index=${index}`).all().map(star => {
            return star.star
        })
        stars = _.sortBy(stars, (star) => {
            return star
        })
    }

    const intervalTime = Math.floor(Date.now() / 1000) - starsOfMci[0].timestamp

    if (starsOfMci.length == 1) {
        if (intervalTime > 10) {
            // findUnLinkedInFour()
            const parents = [starsOfMci[0].star, ...findUnLinkedInFour()]
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

            const unlinkedStars = findUnLinked(index)

            if (unlinkedStars.length > 2) {
                return {
                    parents: [...unlinkedStars, ...findUnLinkedInFour],
                    move: 0
                }
            }

            if (unlinkedStars.length = 1) {
                if (findUnLinkedInFour().length == 0) {
                    const stars = getSortedStars
                    return {
                        parents: [...unlinkedStars, stars[0]],
                        move: 0
                    }
                } else {
                    return {
                        parents: [...unlinkedStars, ...findUnLinkedInFour],
                        move: 0
                    }
                }
            }

            // when count of unlinkedStars equal 0

            if (findUnLinkedInFour().length == 0) {
                const stars = getSortedStars
                return {
                    parents: [...unlinkedStars, stars[0].slice(0, 2)],
                    move: 0
                }
            } else {
                const stars = getSortedStars

                return {
                    parents: [...stars[0], ...findUnLinkedInFour()],
                    move: 0
                }
            }

        }
    } else {
        if (intervalTime > 10) {
            const parents = [starsOfMci[0].star, ...findUnLinkedInFour()]
            const move = 1
            return {
                parents,
                move
            }
        }

        if (starsOfMci.length < 10) {
            const unlinkedStars = findUnLinked(lastMci - 1)
            const starsInFour = findUnLinkedInFour()
            if (starsInFour.length == 0) {
                if (1 < unlinkedStars.length < 2) {
                    return {
                        parents: [getSortedStars(lastMci - 1)[0], unlinkedStars],
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
                        parents: getSortedStars(lastMci - 1).slice(0, 2),
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
                        parents: [getSortedStars(lastMci - 1)[0], ...starsInFour],
                        move: 0
                    }
                }

            }
        }
    }
    
    pool.release(client)
}).catch(error => console.log(error))