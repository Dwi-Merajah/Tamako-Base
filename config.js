const { Function: Func, Scraper } = new (require('@neoxr/wb'))
require('./lib/functions'), require('./lib/scraper')
const Api = new(require(process.cwd() + '/lib/neoxrApi'))("apilu")

global.owner = ['6285133663664', '6283145247560', '628990239482']
global.botnet = "Tamako - X1"
global.botner = "Dev Man"
global.botnum = "6285133663664"
global.database = "Tamako"
global.Key = Api
global.multiplier = 1000
global.max_upload = 100
global.max_upload_free = 30
global.saluran = "120363390846847825@newsletter"
global.rewardGames = {
exp: [100, 1000],
tiketcoin: [1, 10]
}

global.Func = Func
global.Scraper = Scraper
global.APIs = {}
global.APIKeys = {}

global.set = {
  wm: `© Tamako X1 v${require('./package.json').version}`,
  footer: `© Tamako X1 By ${global.botner}`,
  packname: 'Credit :',
  author: '© Nyoman'
}

global.multiplier = 1000

global.status = {
  wait: 'Processing. . .',
  invalid: 'Invalid URL!',
  wrong: 'Wrong format!',
  error: 'Error occurred!',
  premium: 'This feature is only for premium users.',
  admin: 'This command is specific to Admins.',
  botAdmin: 'Make the bot admin to use this command.',
  owner: 'This command is for Owner only.',
  mod: 'This command is for Moderators only.',
  group: 'This command is Group specific.',
  private: 'This command is private chat only.',
  register: 'Before using this feature, please register\n\n*[ Example ]*\n.daftar name.age',
  game: 'The game feature has not been activated.',
  rpg: 'The RPG feature has not been activated.',
  restrict: 'This feature is disabled',
  banned: 'sorry you have been banned'
}
global.rpg = {
  emoticon(string) {
    string = string.toLowerCase()
    let emot = {
      exp: '✉️',
      money: '💵',
      potion: '🥤',
      diamond: '💎',
      common: '📦',
      uncommon: '🎁',
      mythic: '🗳️',
      legendary: '🗃️',
      pet: '🎁',
      trash: '🗑',
      armor: '🥼',
      sword: '⚔️',
      wood: '🪵',
      rock: '🪨',
      string: '🕸️',
      horse: '🐎',
      cat: '🐈',
      dog: '🐕',
      fox: '🦊',
      petFood: '🍖',
      iron: '⛓️',
      gold: '👑',
      emerald: '💚',
    }
    let results = Object.keys(emot).map((v) => [v, new RegExp(v, 'gi')]).filter((v) => v[1].test(string))
    if (!results.length) return ''
    else return emot[results[0][0]]
  },
}
/** reload file */
const fs = require('fs')
const chalk = require('chalk')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  delete require.cache[file]
  require(file)
})