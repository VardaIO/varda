//first, get last main chain index, and view how many stars in it
const pool = require('../database/pool')

pool.acquire().then(client => {
    const lastMci = client.prepare('SELECT main_chain_index FROM stars ORDER BY main_chain_index DESC LIMIT 1').get().main_chain_index
    const starsOfMci = client.prepare(`SELECT * FROM stars WHERE main_chain_index=${lastMci}`).all()
    //  const starsCountInLastMci
    function findUnLinkedInFour() {
        const mciArray = []
        if (lastMci < 4) return
        for (let i = 1; i < 5; i++) {
            const index = lastMci - i
            const stars = client.prepare(`SELECT * FROM stars WHERE main_chain_index=${index}`).all()
            stars.map(star => {
                const starHash = star.star
                const childrenCount = client.prepare(`SELECT COUNT(*) AS children FROM parenthoods WHERE parent_star=${starHash}`).children
                if (childrenCount == 0) {
                    mciArray.push(starHash)
                }
            })
        }
        return mciArray
    }
    
    findUnLinkedInFour()
    if (starsOfMci.length == 1) {
        const intervalTime = Math.floor(Date.now() / 1000) - starsOfMci[0].timestamp
        if (intervalTime > 10) {

        }
    }
}).catch(error => console.log(error))