const { models } = require('./models')
const init = new (require('./init'))
require(process.cwd() + "/config")
module.exports = (m) => {
   let user = global.db.users.find(v => v.jid == m.sender)
   if (user) {
      init.execute(user, models.users)
   } else {
      global.db.users.push({
         jid: m.sender,
     	   ...(models?.users || {})
      })
   }

   if (m.isGroup) {
      let group = global.db.groups.find(v => v.jid == m.chat)
      if (group) {
         init.execute(group, models.groups)
      } else {
         global.db.groups.push({
            jid: m.chat,
            ...(models?.groups || {})
         })
      }
   }

   let chat = global.db.chats.find(v => v.jid == m.chat)
   if (chat) {
      init.execute(chat, models.chats)
   } else {
      global.db.chats.push({
         jid: m.chat,
         ...(models?.chats || {})
      })
   }

   let setting = global.db.setting
   if (setting && Object.keys(setting).length < 1) {
      init.execute(setting, models.setting)
   } else {
      global.db.setting = {
         ...(models?.setting || {})
      }
   }
}