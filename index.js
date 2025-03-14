require("./config.js")
if (process.argv.includes('--server')) require('./server')
let cluster = require('cluster')
let path = require('path')
let fs = require('fs')
let os = require('os')
let package = require('./package.json')
const CFonts = require('cfonts')
const Readline = require('readline')
const yargs = require('yargs/yargs')
const chalk = require("chalk");
const rl = Readline.createInterface(process.stdin, process.stdout)

CFonts.say(`${package.name}`, {
  font: 'tiny',
  align: 'left',
  colors: ['system']
})
const tod = performance.now();
console.log(`${chalk.yellow.bold('Informasi Server:')}`, `\n* ${chalk.blue('Kecepatan:')} ${chalk.magenta.bold((performance.now() - tod).toFixed(3))} ms`, `\n* ${chalk.red('Waktu Aktif:')} ${chalk.green.bold(Func.toTime(os.uptime() * 1000))}`, `\n* ${chalk.cyan('Total Memori:')} ${chalk.yellow.bold(Func.formatSize(os.totalmem() - os.freemem()))} / ${chalk.yellow.bold(Func.formatSize(os.totalmem()))}`, `\n* ${chalk.magenta('CPU:')} ${chalk.blue.bold(os.cpus()[0].model)} (${chalk.red.bold(os.cpus().length)} CORE)`, `\n* ${chalk.green('Rilis:')} ${chalk.cyan.bold(os.release())}`,`\n* ${chalk.yellow('Tipe:')} ${chalk.magenta.bold(os.type())}`);

var isRunning = false
/**
 * Start a js file
 * @param {String} file `path/to/file`
 */
function start(file) {
  if (isRunning) return
  isRunning = true
  let args = [path.join(__dirname, file), ...process.argv.slice(2)]
  cluster.setupMaster({
    exec: path.join(__dirname, file),
    args: args.slice(1),
  })
  let p = cluster.fork()
  p.on('message', data => {
    console.log('[RECEIVED]', data)
    switch (data) {
      case 'reset':
        p.process.kill()
        isRunning = false
        start.apply(this, arguments)
        break
      case 'uptime':
        p.send(process.uptime())
        break
    }
  })
  p.on('exit', (_, code) => {
    isRunning = false
    console.error('Exited with code:', code)
    if (code === 0) return
    fs.watchFile(args[0], () => {
      fs.unwatchFile(args[0])
      start(file)
    })
  })
  let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
  if (!opts['test'])
    if (!rl.listenerCount()) rl.on('line', line => {
      p.emit('message', line.trim())
    })
  // console.log(p)
}

start('main.js')