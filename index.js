process.env.NTBA_FIX_319 = 1;
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
require("dotenv").config();

const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, { polling: true });

const filename = "audio.mp3";
const maxDuration = 2917;
let specialCase = false;
const magicWord = "porfis";

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  if (msgIsValidUrl(msg.text)) {
    durationTest(msg.text, (error, duration) => {
      if (error)
        bot.sendMessage(
          chatId,
          `Sorry, the video duration should be less than ${
            maxDuration / 60
          } minutes`
        );
      if (!specialCase) return false;

      if (error && specialCase) {
        bot.sendMessage(
          chatId,
          `..you know what? I will make a exception for today.`
        );
      }

      downloadVideo(msg.text, chatId, () => {
        bot
          .sendAudio(chatId, `./${filename}`)
          .then(() => {
            console.log("file send!");
            fs.unlinkSync(`./${filename}`);
          })
          .catch((e) => {
            console.log("error sending the file");
            bot.sendMessage(
              chatId,
              "Something was wrong please try again with a smaller video"
            );
            fs.unlinkSync(`./${filename}`);
          });
      });
    });
  } else {
    bot.sendMessage(chatId, "Please send a valid youtube url");
  }
});

function msgIsValidUrl(msg) {
  if (!msg) return false;
  const message = msg.toLowerCase().split(" ");
  if (message.length > 1) specialCase = message[0] === magicWord;
  const url = message[message.length - 1];

  return (
    url &&
    (url.indexOf("youtube") !== -1 || url.indexOf("youtu") !== -1) &&
    url.indexOf("https") !== -1
  );
}

async function downloadVideo(videoUrl, chatId, callback) {
  bot.sendMessage(chatId, "Downloading and converting... please wait.");
  const { stdout, stderr } = await exec(
    `youtube-dl -x --output ${filename} --audio-format mp3 ${videoUrl} `
  );

  if (!stderr && callback) callback();
}

async function durationTest(videoUrl, callback) {
  const { stdout, stderr } = await exec(
    `youtube-dl -s --get-duration ${videoUrl} `
  );
  duration = hmsToSeconds(stdout);
  if (!stderr && callback) callback(duration > maxDuration, stdout);
}

function hmsToSeconds(str) {
  var p = str.split(":"),
    s = 0,
    m = 1;

  while (p.length > 0) {
    s += m * parseInt(p.pop(), 10);
    m *= 60;
  }

  return s;
}

bot.on("polling_error", (err) => console.log(err));
