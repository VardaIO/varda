const fs = require('fs-extra')
const os = require('os')

const VARDA_HOME = process.env.VARDA_HOME || os.homedir() + '/.varda'
const {
  initDb,
  addGenesisStar
} = require('./components/helpers/prepareForStart')

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
    .then(async () => {
      const Star = require('./components/star')
      const pool = require('./database/pool')
      await initDb(pool)
      await addGenesisStar(pool, Star)
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

module.exports = init
