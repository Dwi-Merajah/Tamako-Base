(async () => {
  require("./config");
  require('./lib/functions'), require('./lib/scraper')
  require('events').EventEmitter.defaultMaxListeners = 500
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    makeInMemoryStore,
    makeCacheableSignalKeyStore,
    makeWALegacySocket,
    DisconnectReason,
    Browsers,
    fetchLatestBaileysVersion,
    PHONENUMBER_MCC,
    getAggregateVotesInPollMessage,
  } = require("@whiskeysockets/baileys");
  const WebSocket = require("ws");
  const path = require("path");
  const p = require("pino");
  const pino = require("pino");
  const Pino = require("pino");
  const { Boom } = require("@hapi/boom");
  const fs = require("fs");
  const chokidar = require("chokidar");
  const readline = require("readline");
  const yargs = require("yargs/yargs");
  const cp = require("child_process");
  const { promisify } = require("util");
  const exec = promisify(cp.exec).bind(cp);
  const _ = require("lodash");
  const syntaxError = require("syntax-error");
  const os = require("os");
  const { randomBytes } = require("crypto");
  const moment = require("moment-timezone");
  const time = moment.tz("Asia/Makassar").format("HH:mm:ss");
  const chalk = require("chalk");
  let simple = require("./lib/simple");
  const readdirAsync = promisify(fs.readdir);
  const statAsync = promisify(fs.stat);
  
  const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

  global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in APIs ? APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: APIKeys[name in APIs ? APIs[name] : name] } : {}) })) : '')

  timestamp = {
    start: new Date(),
  };
  //DATABASE
  const killua = new (require('./lib/database/localdb'))(global.database)
  global.db = { users: [], chats: [], groups: [], guild: [], redeem: {}, menfess: {}, statistic: {}, sticker: {}, msgs: {}, setting: {}, ...(await killua.fetch() || {}) }

  /* save database */
  await killua.save(global.db)
  setInterval(async () => {
      if (global.db) await killua.save(global.db)
   }, 30 * 1000)
   
  const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

  global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse(),);
  global.prefix = new RegExp("^["+(opts["prefix"] || "/!#$%+Â£Â¢â‚¬Â¥^Â°=Â¶âˆ†Ã—Ã·Ï€âˆšâœ“Â©Â®:;?&.\\-").replace(/[|\\{}()[\]^$+*?.\-\^]/g, "\\$&") + "]");
  
  const { state, saveState, saveCreds } = await useMultiFileAuthState("sessions");
  const { version } = await fetchLatestBaileysVersion();
  const pairingCode = process.argv.includes("--code");
   
  const connectionOptions = {
	printQRInTerminal: !pairingCode,
	syncFullHistory: true,
	markOnlineOnConnect: true,
	connectTimeoutMs: 60000, 
	defaultQueryTimeoutMs: 0,
	keepAliveIntervalMs: 10000,
	generateHighQualityLinkPreview: true, 
	patchMessageBeforeSending: (message) => {
		const requiresPatch = !!(
			message.buttonsMessage 
			|| message.templateMessage
			|| message.listMessage
		);
		if (requiresPatch) {
			message = {
				viewOnceMessage: {
					message: {
						messageContextInfo: {
							deviceListMetadataVersion: 2,
							deviceListMetadata: {},
						},
						...message,
					},
				},
			};
		}

		return message;
	},
	version,
	browser: Browsers.ubuntu("Chrome"),
	logger: pino({ level: 'fatal' }),
	auth: { 
		creds: state.creds, 
		keys: makeCacheableSignalKeyStore(state.keys, pino().child({ 
			level: 'silent', 
			stream: 'store' 
		})), 
	},
  }
  const getMessage = async (key) => {
    const messageData = await store.loadMessage(key.remoteJid, key.id);
    return messageData?.message || undefined;
  };
  
  setInterval(
    async () => {
      await exec("rm -rf ./temp/*");
    },
    60 * 60 * 1000,
  );
  
  global.conn = simple.makeWASocket(connectionOptions);
  conn.isInit = false;
  
  async function connectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin } = update;
    if (isNewLogin) conn.isInit = true;
    const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
    if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
      console.log(reloadHandler(true));
      global.timestamp.connect = new Date();
    }
    let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
    if (connection === "close") {
      if (reason === DisconnectReason.badSession) {
        conn.logger.error(`[ ⚠ ] Sesi buruk, harap hapus folder sessions dan pindai lagi.`);
      } else if (reason === DisconnectReason.connectionClosed) {
        conn.logger.warn(`[ ⚠ ] Sambungan ditutup, menyambung kembali...`);
        console.log(reloadHandler(true));
      } else if (reason === DisconnectReason.connectionLost) {
        conn.logger.warn(`[ ⚠ ] Kehilangan koneksi ke server, menghubungkan kembali...`);
        console.log(reloadHandler(true));
      } else if (reason === DisconnectReason.connectionReplaced) {
        conn.logger.error(`[ ⚠ ]  Koneksi diganti, sesi baru lainnya telah dibuka. Silakan keluar dari sesi saat ini terlebih dahulu.`);
      } else if (reason === DisconnectReason.loggedOut) {
        conn.logger.error(`[ ⚠ ] Koneksi ditutup, harap hapus folder sessions dan pindai lagi.`);
      } else if (reason === DisconnectReason.restartRequired) {
        conn.logger.info(`[ ⚠ ] Waktu koneksi habis, menyambung kembali... perlu, restart server jika ada masalah`);
        console.log(reloadHandler(true));
      } else if (reason === DisconnectReason.timedOut) {
        conn.logger.warn(`[ ⚠ ] Koneks terputus, menghubungkan ulang...`);
        console.log(reloadHandler(true));
      } else {
        conn.logger.warn(`[ ⚠ ] Koneksi Terputus ⚠️. ${reason || ""}: ${connection || ""}`);
        console.log(reloadHandler(true));
      }
    }
    if (update.connection == "connecting" || update.receivedPendingNotifications == "false") {
	}
    if (connection == "open") {
      console.log(chalk.green.bold('Terhubung:'), chalk.cyan.bold(conn.user.name || "Tanpa Nama"));
    }
  }
  async function getPhoneNumber() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise((resolve) => {
      rl.question(chalk.yellow("Enter your WhatsApp number: "), (num) => {
        rl.close();
        resolve(num);
      });
    });
   }
   if (!conn.authState.creds.registered) {
    const phone = await getPhoneNumber();
    setTimeout(async () => {
        let code = await conn.requestPairingCode(phone);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(`Your Pairing Code: ${code}`);
      }, 3000);
  }
  store.bind(conn.ev)
  process.on("uncaughtException", console.error);

  let isInit = true,
    handler = require("./handler");
  reloadHandler = function (restatConn) {
    let Handler = require("./handler");
    if (Object.keys(Handler || {}).length) handler = Handler;
    if (restatConn) {
      try {
        conn.ws.close();
      } catch {}
      conn = {
        ...conn,
        ...simple.makeWASocket(connectionOptions),
      };
    }
    if (!isInit) {
      conn.ev.off("messages.upsert", conn.handler);
      conn.ev.off("group-participants.update", conn.onParticipantsUpdate);
      //conn.ev.off('groups.update', conn.groupsUpdate)
      //conn.ev.off('message.delete', conn.onDelete);
      conn.ev.off("connection.update", conn.connectionUpdate);
      conn.ev.off("creds.update", conn.credsUpdate);
    }

    conn.welcome = 'Welcome to @subject, @user\n'
    conn.bye = 'Goodbye @user 👋'
    conn.spromote = '@user *Promote* to Admin '
    conn.sdemote = '@user *Demote* from Admin' 
    conn.sDesc = 'Description Has Been Changed To \n@desc'
    conn.sSubject = 'Group Name Has Been Changed To \n@subject'
    conn.sIcon = 'Group Photo Has Been Changed!'
    conn.sRevoke = 'Group Link Has Been Changed To \n@revoke'
    conn.sAnnounceOn = 'The group has been closed!\now only admins can send messages.'
    conn.sAnnounceOff = 'The group is open!\nNow all participants can send messages.'
    conn.sRestrictOn = 'Edit Group Info changed to admin only!'
    conn.sRestrictOff = 'Edit Group Info changed to all participants!'
   
    conn.handler = handler.handler.bind(conn)
    conn.onParticipantsUpdate = handler.participantsUpdate.bind(conn);
    //conn.pollUpdate = handler.pollUpdate.bind(conn);
    //conn.groupsUpdate = handler.groupsUpdate.bind(conn)
    //conn.onDelete = handler.delete.bind(conn)
    conn.connectionUpdate = connectionUpdate.bind(conn)
    conn.credsUpdate = saveCreds.bind(conn)
    
    const currentDateTime = new Date();
    const messageDateTime = new Date(conn.ev);
    if (currentDateTime >= messageDateTime) {
        const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0]);
    } else {
        const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0]);
    }
    
    conn.ev.on("messages.upsert", conn.handler);
    conn.ev.on("group-participants.update", conn.onParticipantsUpdate);
    //conn.ev.on('groups.update', conn.groupsUpdate)
    //conn.ev.on('message.delete', conn.onDelete);
    conn.ev.on("connection.update", conn.connectionUpdate);
    conn.ev.on("creds.update", conn.credsUpdate);

    isInit = false;
    return true;
  };
  
  global.plugins = {};

  let getAllFiles = async (dirPath) => {
    let files = await readdirAsync(dirPath);
    let allFiles = await Promise.all(
      files.map(async (file) => {
        let filePath = path.resolve(dirPath, file);
        if ((await statAsync(filePath)).isDirectory()) {
          return getAllFiles(filePath);
        } else {
          return filePath;
        }
      })
    );
    return allFiles.reduce((acc, files) => acc.concat(files), []);
  };

  try {
    let pluginFiles = await getAllFiles("./plugins");
    let loadedPlugins = {};
    for (let file of pluginFiles.map((file) => file.replace(process.cwd(), ""))) {
      try {
        loadedPlugins[file] = require(path.join(process.cwd(), file));
      } catch (error) {
        console.log(chalk.red.bold(error));
        delete loadedPlugins[file];
      }
    }
    const watcher = chokidar.watch(path.resolve("./plugins"), {
      persistent: true,
      ignoreInitial: true,
    });
    watcher
      .on("add", async (filePath) => {
        console.log(chalk.yellow.bold( "[ New ] Detected New Plugins : " + filePath.replace(process.cwd(), "")));
        loadedPlugins[filePath.replace(process.cwd(), "")] = require(filePath);
      })
      .on("change", async (filePath) => {
        if (require.cache[filePath] && require.cache[filePath].id === filePath) {
          loadedPlugins[filePath.replace(process.cwd(), "")] = require.cache[filePath].exports;
          console.log( chalk.yellow.bold("[ Change ] Changes code in Plugins : " + filePath.replace(process.cwd(), "")));
          delete require.cache[filePath];
        }
        let syntaxErrorResult = syntaxError(fs.readFileSync(filePath), filePath.replace(process.cwd(), ""));
        if (syntaxErrorResult) {
        conn.logger.error("syntax error while loading '" + filePath + "'\n" + syntaxErrorResult);
        }
        loadedPlugins[filePath.replace(process.cwd(), "")] = require(filePath);
      })
      .on("unlink", (filePath) => {console.log(chalk.yellow.bold("[ Delete ] Suucess Delete : " + filePath.replace(process.cwd(), "")));
        delete loadedPlugins[filePath.replace(process.cwd(), "")];
      });
    loadedPlugins = Object.fromEntries(Object.entries(loadedPlugins).sort(([key1], [key2]) => key1.localeCompare(key2)));
    global.plugins = loadedPlugins;
    console.log(chalk.blue.bold("[ Success ] Success Load " + Object.keys(loadedPlugins).length + " plugins"));
  } catch (error) {
    console.error(error);
  }

  const resetLimit = async () => {
    const setting = global.db.setting;
    try {
      const Makassar = new Date(new Date().toLocaleString("en-US", {
        timeZone: "Asia/Makassar"
      }));
      setting.lastReset = new Date().getTime();
      global.db.users.filter(v => v.limit < 100 && !v.premium).forEach(v => v.limit = 100);
      Object.values(global.db.statistic).forEach(v => v.today = 0);
      Object.values(global.db.users).forEach(v => v.daily = false);
      await conn.reply("120363390846847825@newsletter", `*[ Auto Information ]*\nLimit pengguna gratis telah di reset.`);
      console.log('Limit telah direset pada jam 12 malam');
    } catch (e) {
      console.log('Terjadi kesalahan saat mereset limit:', e);
    }
  };

  const msToMidnight = () => {
    const Makassar = new Date(new Date().toLocaleString("en-US", {
      timeZone: "Asia/Makassar"
    }));
    const midnight = new Date(Makassar);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - Makassar.getTime()
  };

  const scheduleReset = () => {
    const waitTime = msToMidnight();
    setTimeout(() => {
      resetLimit();
      scheduleReset(); 
    }, waitTime);
  };
 
  scheduleReset();
  reloadHandler(); 
})();
