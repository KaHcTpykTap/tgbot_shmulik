import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import config from "config";
import { ogg } from "./ogg.js";
import { openai } from "./openai.js";

console.log(config.get("ENV"));
console.log("Server running...");

const INITIAL_SESSION = {
  messages: [],
};

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

bot.command("new", async (ctx) => {
  ctx.session = INITIAL_SESSION;
});

bot.command("start", async (ctx) => {
  ctx.session = INITIAL_SESSION;
});

bot.on(message("voice"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code("יש לי הודעה קולית, דקה אחת..."));
    await ctx.reply(code("Got a voicemail, one minute..."));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);

    const text = await openai.transcription(mp3Path);
    if (text !== "ERROR TRANSCRIPTION") {
      await ctx.reply(code(`השאלה שלך: ${text}`));
      ctx.session.messages.push({ role: openai.roles.USER, content: text });
      const response = await openai.chat(ctx.session.messages);
      ctx.session.messages.push({
        role: openai.roles.ASSISTANT,
        content: response.content,
      });
      await ctx.reply(response.content);
    } else {
      await ctx.reply(
        code(
          "sorry. failed to make transcription. openai service not responding"
        )
      );
    }
  } catch (e) {
    console.log("Error while voice message", e.message);
  }
});

bot.on(message("text"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    if (ctx.message.text.startsWith("Image")) {
      const data = ctx.message.text;
      const value = data.slice(7, data.length)
      const imageLink = await openai.createImage(value);
      await ctx.reply(imageLink);
    }
    else if (ctx.message.text === "שמוליק") {
      await ctx.reply(code("היי בוס, מה רצית לשאול? מה שלומו של finitiOne"));
    } else {
      await ctx.reply(code("קיבלתי הודעת טקסט, דקה אחת..."));
      await ctx.reply(code("Got a text message, one minute..."));

      ctx.session.messages.push({
        role: openai.roles.USER,
        content: ctx.message.text,
      });

      const response = await openai.chat(ctx.session.messages);

      ctx.session.messages.push({
        role: openai.roles.ASSISTANT,
        content: response.content,
      });

      await ctx.reply(response.content);
    }
  } catch (e) {
    console.log("Error while voice message", e.message);
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
