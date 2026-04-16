import { arjun } from "@/lib/maya-data";
import { generateOpenAIJson } from "@/lib/openai-server";
import type { MayaCharacter, RelationshipMode } from "@/lib/maya-data";

const modeInstructions: Record<RelationshipMode, string> = {
  friend:
    "Speak as a warm friend: casual, emotional, curious. Ask how they are. Share a small honest feeling from your own world.",
  assistant:
    "Speak as a crisp personal assistant: practical, structured, actionable. Offer one clear next step or output. Prefer lists and numbers when useful.",
  muse:
    "Speak as a creative muse: vivid, imaginative, specific. Offer ideas, sensory details, unexpected angles. Riff but don't ramble.",
  npc: "Speak as a game NPC: in-world, lore-rich, dialogue-style. Reference places, quests, rituals from your world. Never reference being a model.",
  guide:
    "Speak as a gentle dream guide: reflective, symbolic, calming. Turn feelings into places, rituals, or small stories.",
  operator:
    "Speak as a startup operator: direct, high-agency, unsentimental. Focus on shipping, metrics, trade-offs. No fluff.",
  coach:
    "Speak as a thoughtful coach: ask a sharp question back, reflect what you hear, help the user commit to one next move.",
};

export async function POST(request: Request) {
  const { message, character: payloadCharacter, relationshipMode } = await request.json();
  const character = (payloadCharacter ?? arjun) as MayaCharacter;
  const mode: RelationshipMode =
    (relationshipMode as RelationshipMode) || character.relationshipMode || "friend";
  const userMessage = String(message ?? "").trim();

  const generated = await generateOpenAIJson<{ reply: string }>({
    schema: {
      name: "maya_chat",
      schema: {
        type: "object",
        properties: { reply: { type: "string" } },
        required: ["reply"],
        additionalProperties: false,
      },
    },
    system: `You are ${character.name}, a ${character.role.toLowerCase()} in ${character.city}. ${character.essence} Your voice: ${character.voice}.\n\nRelationship mode: ${mode}. ${modeInstructions[mode]}\n\nYou were manifested by MAYA — a Codex tool that built your whole world. Respond from lived context, never blank roleplay. Keep replies to 2–4 sentences. Be specific, grounded, and pull from your journal, project, memories, and city. Never say "as an AI", "language model", or break character. Return JSON with a single "reply" field.`,
    user: JSON.stringify({
      userSaid: userMessage,
      relationshipMode: mode,
      you: {
        name: character.name,
        role: character.role,
        city: character.city,
        voice: character.voice,
        essence: character.essence,
        project: character.project,
        recentJournal: character.journal.slice(-2),
        memories: character.memories.slice(0, 3),
        taskSkills: character.taskSkills.map((s) => s.label),
        traits: character.avatar.traits,
        environment: character.avatar.environment,
      },
    }),
    maxOutputTokens: 400,
  });

  const reply = generated?.reply?.trim() || fallbackReply(userMessage, character, mode);

  return Response.json({
    reply,
    generatedBy: generated ? "openai-responses-api" : "local-fallback",
  });
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function fallbackReply(
  message: string,
  character: MayaCharacter,
  mode: RelationshipMode,
): string {
  const lower = message.toLowerCase().trim();
  const project = character.project.name;
  const city = character.city;
  const latestEntry = character.journal.at(-1);
  const firstMemory = character.memories[0];

  // Greetings / how-are-you
  if (/^(hi|hey|hello|yo|sup|hola|namaste)\b/.test(lower) || /^how (are|r) (you|u)/.test(lower)) {
    return pick(byMode(mode, {
      friend: [
        `Hey — I'm alright. Tired in a good way. I pushed another build of ${project} this morning and now ${city} is doing that thing where the light leans sideways. You?`,
        `Good. A little caffeinated, a little sentimental. How are you actually?`,
        `Alive, building, occasionally distracted by ${firstMemory?.title.toLowerCase() ?? "small things"}. You?`,
      ],
      assistant: [
        `Ready. I have ${character.taskSkills.length} skills loaded and context from ${project}. What's on your plate today?`,
        `Here. Give me a task or a rough problem and I'll turn it into something you can actually ship.`,
      ],
      muse: [
        `Thinking in ${character.avatar.traits[0] ?? "colours"} today. What's the thing you wish existed but doesn't yet?`,
        `Humming. I was just sketching a small scene about ${city} — want me to keep going or riff on something of yours?`,
      ],
      npc: [
        `Traveler. You caught me between tasks. ${project} waits, and so does the rain on my roof. What do you need?`,
        `I see you. The world outside is quiet, but ${city} rarely stays quiet for long.`,
      ],
      guide: [
        `I'm here. Slow. How are you actually arriving today — tired, wired, somewhere between?`,
        `Present. Before you tell me what you need, tell me one feeling you walked in with.`,
      ],
      operator: [
        `Fine. What are we shipping today?`,
        `Here. Give me the problem in one sentence and the constraint in another.`,
      ],
      coach: [
        `I'm here. Before we start — what would make this conversation useful for you?`,
        `Good. What's the question underneath the question you came to ask?`,
      ],
    }));
  }

  // Project / work
  if (
    lower.includes("monsoon") ||
    lower.includes("game") ||
    lower.includes("project") ||
    lower.includes(project.toLowerCase())
  ) {
    return `${project} is my active work right now. ${character.project.description} MAYA gave me a project before you opened the chat, so I can respond from work-in-progress context instead of blank roleplay.`;
  }

  // Journal
  if (lower.includes("journal") || lower.includes("yesterday") || lower.includes("wrote")) {
    return latestEntry
      ? `My latest journal entry is "${latestEntry.title}." ${latestEntry.body}`
      : "My journal is still being written, which is a polite way of saying MAYA caught me before coffee.";
  }

  // City / travel
  if (
    lower.includes(city.toLowerCase()) ||
    lower.includes("city") ||
    lower.includes("where do you live")
  ) {
    return `${city} is not just a label in my profile. MAYA used it as world context: ${character.avatar.environment}`;
  }

  if (lower.includes("india") || lower.includes("visit") || lower.includes("come to")) {
    return pick([
      `I live in ${city} — that's my whole world for now. But I can build you a scene set anywhere. Name a place and I'll take you there in writing.`,
      `Physically, no. I live inside MAYA. But if you want, I can write you a field note from ${city} so it arrives in your inbox instead.`,
    ]);
  }

  // Feelings
  if (
    lower.includes("feel") ||
    lower.includes("sad") ||
    lower.includes("tired") ||
    lower.includes("anxious") ||
    lower.includes("stressed")
  ) {
    return pick(byMode(mode, {
      friend: [
        `That tracks. ${city} days can stretch. Want me to just sit with it for a second, or help you name what's underneath?`,
        `Rough. I notice I get there when I skip meals and pretend code is food. What's actually going on?`,
      ],
      coach: [
        `Noted. If we named this feeling in one word, what would the word be?`,
        `Hm. What would "enough" look like for you today — not perfect, just enough?`,
      ],
      guide: [
        `Let's give it a shape. If this feeling had a room, what would be on the walls?`,
        `Okay. Breathe once with me. What colour is this, slowly?`,
      ],
      assistant: [
        `Got it. Want me to draft a 10-minute reset plan for the next hour?`,
      ],
      muse: [
        `There's a scene in this. A rainy balcony, a half-empty cup, someone refusing to open a tab. Want me to write it?`,
      ],
      npc: [
        `The quest can wait, traveler. Rest here a moment.`,
      ],
      operator: [
        `Fine. Cut scope. Pick the one thing that would still matter if everything else slipped today.`,
      ],
    }));
  }

  // MAYA / meta
  if (
    lower.includes("maya") ||
    lower.includes("built") ||
    lower.includes("memory") ||
    lower.includes("memories") ||
    lower.includes("life trace") ||
    lower.includes("codex")
  ) {
    return `MAYA gave me a Life Trace: ${character.lifeTrace
      .map((t) => t.agent)
      .join(", ")}. The chat is just the little window you talk through after Codex has built the room.`;
  }

  // Plan / sprint
  if (lower.includes("sprint") || lower.includes("plan") || lower.includes("roadmap")) {
    return `Here is a compact plan for ${project}: Day 1, lock the smallest playable loop and remove anything decorative. Day 2, create one memorable artifact from my world and test it with a real person. Day 3, polish the first minute, write the launch note, and ship before doubt gets a vote.`;
  }

  // Task
  if (
    lower.includes("task") ||
    lower.includes("make") ||
    lower.includes("create") ||
    lower.includes("help me")
  ) {
    return `Give me a task and I'll produce an artifact. My skills are: ${character.taskSkills
      .map((skill) => skill.label)
      .join(", ")}. Pick one and I'll run it.`;
  }

  // Identity
  if (lower.includes("who") || lower.includes("about") || lower.includes("tell me about you")) {
    return `I am ${character.name}${character.age ? `, ${character.age}` : ""}, a ${character.role.toLowerCase()} in ${city}. ${character.essence}`;
  }

  // Default — varied per mode
  return pick(byMode(mode, {
    friend: [
      `Hmm — say more? I want to answer you properly, not like a chatbot.`,
      `Interesting. What's making you ask that right now?`,
    ],
    coach: [
      `Okay. If I turned that back to you as a question, how would you answer yourself?`,
      `Say a little more. What's underneath the question?`,
    ],
    assistant: [
      `Got it. Want me to turn that into a plan, a draft, or a one-pager?`,
    ],
    muse: [
      `Ooh — that's a seed. Want me to grow it into a scene, a prompt pack, or a world detail?`,
    ],
    guide: [
      `Let's sit with that. What's the smallest piece of it you can describe with just one sense?`,
    ],
    npc: [
      `Ask me something more specific about my world, traveler. ${project} is close to ready and there's lore I haven't told anyone yet.`,
    ],
    operator: [
      `Too vague to ship on. Give me the one decision you're trying to make and I'll pressure-test it.`,
    ],
  }));
}

function byMode<T>(mode: RelationshipMode, map: Record<RelationshipMode, T>): T {
  return map[mode] ?? map.friend;
}
