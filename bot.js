require("dotenv").config();
const { Bot, InlineKeyboard } = require("grammy");
const { execSync } = require("child_process");

const bot = new Bot(process.env.BOT_TOKEN);

// ── Helpers ──────────────────────────────────────────────────────────
function $(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 30_000 }).trim();
  } catch (e) {
    return `ERR: ${e.stderr || e.message}`;
  }
}

function esc(text) {
  // Escape Telegram MarkdownV2 special characters
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

// ── Commands ─────────────────────────────────────────────────────────
bot.command("start", async (ctx) => {
  await ctx.reply(
    "🤖 *ArcAgent* — Circle Agent Wallet for Arc Network\\\n\n" +
      "/wallet — Create or show SCA wallet\n" +
      "/balance — Check USDC balance\n" +
      "/fund — Fund wallet from faucet\n" +
      "/pay — Pay another address\n" +
      "/services — Search Circle services",
    { parse_mode: "MarkdownV2" }
  );
});

bot.command("wallet", async (ctx) => {
  const out = $("circle wallet create 2>/dev/null || circle wallet show");
  await ctx.reply(`\`\`\`\n${esc(out.slice(0, 3800))}\n\`\`\``, {
    parse_mode: "MarkdownV2",
  });
});

bot.command("balance", async (ctx) => {
  const out = $("circle wallet balance");
  await ctx.reply(`\`\`\`\n${esc(out.slice(0, 3800))}\n\`\`\``, {
    parse_mode: "MarkdownV2",
  });
});

bot.command("fund", async (ctx) => {
  const out = $("circle wallet fund");
  await ctx.reply(`\`\`\`\n${esc(out.slice(0, 3800))}\n\`\`\``, {
    parse_mode: "MarkdownV2",
  });
});

bot.command("pay", async (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1);
  if (args.length < 2) {
    return ctx.reply("Usage: `/pay <to_address> <amount_usdc>`", {
      parse_mode: "MarkdownV2",
    });
  }
  const [to, amount] = args;
  const out = $(`circle services pay --to ${to} --amount ${amount}`);
  await ctx.reply(`\`\`\`\n${esc(out.slice(0, 3800))}\n\`\`\``, {
    parse_mode: "MarkdownV2",
  });
});

bot.command("services", async (ctx) => {
  const query = ctx.message.text.split(/\s+/).slice(1).join(" ") || "";
  const cmd = query
    ? `circle services search "${query}"`
    : "circle services search";
  const out = $(cmd);
  await ctx.reply(`\`\`\`\n${esc(out.slice(0, 3800))}\n\`\`\``, {
    parse_mode: "MarkdownV2",
  });
});

// ── Start ────────────────────────────────────────────────────────────
bot.start({ drop_pending_updates: true });
console.log("ArcAgent bot running…");
