const pool = require('./pool')

pool.acquire().then((client) => {
    let a = client.prepare('INSERT INTO stars VALUES (?, ?, ?)');
    a.run(1, 'star1', 'address-test');
    pool.release(client)
}).catch(err => console.log(err))