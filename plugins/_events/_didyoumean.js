const didyoumean = require('didyoumean');
const similarity = require('similarity');

let handler = (m) => m;

handler.before = async function (m, { match, usedPrefix }) {
  if ((usedPrefix = (match[0] || '')[0])) {
    let noPrefix = m.text.replace(usedPrefix, '').trim();
    let args = noPrefix.split` `.slice(1);

    // Daftar perintah yang tersedia menggunakan global.plugins
    let help = Object.values(global.plugins)
      .filter(v => (v.command || v.help) && !v.disabled)
      .map(v => v.command || v.help)
      .flat(1);

    // Normalisasi perintah dengan parameter seperti <use>
    let normalizedHelp = help
      .filter(cmd => typeof cmd === 'string') // Pastikan hanya string yang diproses
      .map(cmd => cmd.replace(/<.*?>/g, '').trim());

    // Periksa jika perintah benar
    if (normalizedHelp.includes(noPrefix.split` `[0])) return;

    // Cari rekomendasi perintah
    let mean = didyoumean(noPrefix.split` `[0], normalizedHelp);
    if (!mean) return;

    let sim = similarity(noPrefix.split` `[0], mean);
    if (sim === 1 || mean.toLowerCase() === noPrefix.split` `[0].toLowerCase()) return;

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? this.user.jid : m.sender;
    let name = await this.getName(who);

    this.reply(
      m.chat,
      `⚠️ Perintah yang kamu gunakan salah.\nCoba rekomendasi berikut:\n\n→ ${usedPrefix + mean} (${Number(sim * 100).toFixed(2)}%)`,
      m
    );
  }
  return true;
};

module.exports = handler;
