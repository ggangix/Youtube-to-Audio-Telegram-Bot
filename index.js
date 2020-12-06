process.env.NTBA_FIX_319 = 1;
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
require("dotenv").config();

const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  if (msgIsValidUrl(msg.text)) {
    downloadVideo(msg.text, () => {
      bot.sendMessage(chatId, "Downloading and converting... please wait.");
      bot.sendAudio(chatId, "./audio.mp3").then(() => {
        fs.unlinkSync("./audio.mp3");
      });
    });
  } else {
    bot.sendMessage(chatId, "Please send a valid youtube url");
  }
});

function msgIsValidUrl(msg) {
  return (
    msg &&
    (msg.toLowerCase().indexOf("youtube") !== -1 ||
      msg.toLowerCase().indexOf("youtu") !== -1) &&
    msg.toLowerCase().indexOf("https") !== -1
  );
}

async function downloadVideo(videoUrl, callback) {
  const { stdout, stderr } = await exec(
    `youtube-dl -x --audio-format mp3 --output audio.mp3 ${videoUrl}`
  );
  if (!stderr && callback) callback();
}

bot.on("polling_error", (err) => console.log(err));
