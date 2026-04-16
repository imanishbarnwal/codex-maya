type TelegramChat = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  title?: string;
  type?: string;
};

type TelegramUpdate = {
  message?: { chat?: TelegramChat; from?: TelegramChat };
  channel_post?: { chat?: TelegramChat };
  my_chat_member?: { chat?: TelegramChat };
};

function getToken() {
  return (
    process.env.telegram_bot_key ||
    process.env.TELEGRAM_BOT_KEY ||
    process.env.TELEGRAM_BOT_TOKEN ||
    ""
  );
}

function loadContacts() {
  const raw = process.env.TELEGRAM_CONTACTS || "";
  const map = new Map<string, number>();
  raw
    .split(/[,;\n]/)
    .map((pair) => pair.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const [key, value] = pair.split("=").map((s) => s.trim());
      const id = Number(value);
      if (key && !Number.isNaN(id)) map.set(key.toLowerCase(), id);
    });
  return map;
}

function chatMatches(chat: TelegramChat, needle: string) {
  const haystack = [chat.first_name, chat.last_name, chat.username, chat.title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle.toLowerCase());
}

function displayName(chat: TelegramChat) {
  if (chat.first_name || chat.last_name) {
    return [chat.first_name, chat.last_name].filter(Boolean).join(" ");
  }
  return chat.username ? `@${chat.username}` : chat.title || `chat ${chat.id}`;
}

async function findChat(
  token: string,
  recipient: string,
): Promise<{ id: number; name: string } | null> {
  const contacts = loadContacts();
  const direct = contacts.get(recipient.toLowerCase());
  if (direct) return { id: direct, name: recipient };

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?limit=100`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; result?: TelegramUpdate[] };
    if (!data.ok || !data.result) return null;
    // Scan newest updates first so the most-recent chat wins ties
    for (let i = data.result.length - 1; i >= 0; i -= 1) {
      const update = data.result[i];
      const chat = update.message?.chat || update.channel_post?.chat || update.my_chat_member?.chat;
      if (!chat) continue;
      if (chatMatches(chat, recipient)) {
        return { id: chat.id, name: displayName(chat) };
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      parse_mode: "Markdown",
    }),
  });
  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(data.description || "telegram_send_failed");
  return true;
}

export async function POST(request: Request) {
  let body: { recipient?: string; message?: string; from?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const recipient = String(body.recipient ?? "").trim();
  const message = String(body.message ?? "").trim();
  const from = String(body.from ?? "").trim();
  const token = getToken();

  if (!token) {
    return Response.json(
      { ok: false, reason: "No Telegram bot token configured in .env.local" },
      { status: 200 },
    );
  }
  if (!recipient || !message) {
    return Response.json(
      { ok: false, reason: "Missing recipient or message" },
      { status: 200 },
    );
  }

  const chat = await findChat(token, recipient);
  if (!chat) {
    return Response.json(
      {
        ok: false,
        reason: `No Telegram chat found for "${recipient}". Ask them to DM the bot once with /start, then try again.`,
      },
      { status: 200 },
    );
  }

  const prefix = from ? `💬 *${from}* via MAYA\n\n` : "";
  try {
    await sendTelegramMessage(token, chat.id, `${prefix}${message}`);
    return Response.json({
      ok: true,
      to: chat.name,
      chatId: chat.id,
      recipient,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "send_failed";
    return Response.json({ ok: false, reason }, { status: 200 });
  }
}
