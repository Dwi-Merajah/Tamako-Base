require("./config.js")
const { spawn } = require("child_process");
const path = require("path");
const chalk = require("chalk");
const CFonts = require("cfonts");
const os = require("os");
const { checkServerIP } = require("./lib/acc");
console.clear();

// Box styling with chalk
const boxTop = chalk.cyan("╭──────────────────────────────────────────────╮");
const boxBottom = chalk.cyan("╰──────────────────────────────────────────────╯");

// Status Information
console.log(boxTop);
console.log(chalk.cyan.bold("          📡 Your Status Info:"));
console.log(chalk.cyan(`  • Namebot: ${chalk.bold(require("./package.json").name || "N/A")}`));
console.log(chalk.cyan(`  • Creator: ${chalk.bold(require("./package.json").author || "N/A")}`));
console.log(chalk.cyan(`  • Type: ${chalk.bold("PLUGINS")}`));
console.log(chalk.cyan(`  • Version: ${chalk.bold(require("./package.json").version || "N/A")}`));
console.log(chalk.cyan(`  • WhatsApps: ${chalk.bold("https://wa.me/6285133663664")}`));
console.log(chalk.cyan(`  • Github: ${chalk.bold("https://github.com/dwi-merajah")}`));
console.log(boxBottom);

// Server Information
console.log(boxTop);
console.log(chalk.cyan.bold("          📂 Your Server Info:"));
console.log(chalk.cyan(`  • Platform: ${chalk.bold(os.platform() || "N/A")}`));
console.log(chalk.cyan(`  • Architecture: ${chalk.bold(os.arch() || "N/A")}`));
console.log(chalk.cyan(`  • CPU Model: ${chalk.bold(os.cpus()[0]?.model || "N/A")}`)); // Safe optional chaining
console.log(chalk.cyan(`  • Total Memory: ${chalk.bold(Func.formatSize(os.totalmem()) || "N/A")}`));
console.log(chalk.cyan(`  • Free Memory: ${chalk.bold(Func.formatSize(os.freemem()) || "N/A")}`));
console.log(chalk.cyan(`  • IP Address: ${chalk.bold(process.env.INTERNAL_IP || "N/A")}`));
console.log(boxBottom);

// Text animation with CFonts
CFonts.say("Tamako", {
  colors: ["cyan", "blue"],
  font: "block",
  align: "center",
  gradient: ["cyan", "blue"],
  transitionGradient: true,
});

// Function to start the main process
function start() {
  const args = [path.join(__dirname, "main.js"), ...process.argv.slice(2)];
  const p = spawn(process.argv[0], args, {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });

  p.on("message", (data) => {
    try {
      if (data === "reset") {
        console.log("Restarting...");
        p.kill();
        start(); // Ensure restart happens properly
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  });

  p.on("exit", (code) => {
    console.error("Exited with code:", code);
    if (code !== 0) {
      console.log("Restarting process due to non-zero exit code...");
      start();
    }
  });

  p.on("error", (err) => {
    console.error("Spawn error:", err);
  });
}

(async () => {
  try {
    const isAllowed = await checkServerIP();
    if (!isAllowed) {
      process.exit(1);
    } else {
      start();
    }
  } catch (err) {
    console.error("Error checking server IP:", err);
    process.exit(1);
  }
})();