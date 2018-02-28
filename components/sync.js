const pool = require('../database/pool')

const checkMci = async () => {
    const client = await pool.acquire()
    try {
        const lastMci = client
            .prepare(
                'SELECT main_chain_index FROM stars ORDER BY main_chain_index DESC LIMIT 1'
            )
            .get().main_chain_index
        console.log(lastMci)
    } catch (error) {
        console.log('lalalala', error)
    } finally {
        pool.release(client)
    }
}

const getLastMciFromPeers = () => {
    
}