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

const relationshipModes: RelationshipMode[] = [
  "friend",
  "assistant",
  "muse",
  "npc",
  "guide",
  "operator",
  "coach",
];

export async function POST(request: Request) {
  let body: { message?: unknown; character?: unknown; relationshipMode?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { message, character: payloadCharacter, relationshipMode } = body;
  const character = (payloadCharacter ?? arjun) as MayaCharacter;
  const mode: RelationshipMode =
    normalizeRelationshipMode(relationshipMode || character.relationshipMode);
  const userMessage = String(message ?? "").trim();
  const arjunReply = arjunDemoReply(userMessage, character, mode);
  if (arjunReply) {
    return Response.json({
      reply: arjunReply,
      generatedBy: "arjun-demo-fallback",
    });
  }

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

function arjunDemoReply(
  message: string,
  character: MayaCharacter,
  mode: RelationshipMode,
) {
  const isArjun = character.slug === "arjun" || character.name.toLowerCase() === "arjun";
  if (!isArjun) return null;

  const lower = message.toLowerCase().trim();
  const project = character.project.name;

  if (lower.includes("what is monsoon") || lower.includes("what is monsoon run")) {
    return "Monsoon Run is a tiny one-button reflex game about crossing Bengaluru before the storm meter eats the road. You dodge potholes, puddles, scooters, and traffic cones, but the real enemy is panic. Very realistic, sadly.";
  }

  if (lower.includes("journal") || lower.includes("yesterday") || lower.includes("wrote")) {
    return "My latest journal entry is \"Koramangala as a maze.\" The road outside flooded again, so I turned it into a level: cones as soft blockers, scooters as panic punctuation, potholes as tiny betrayals. Maybe the city is not broken; maybe it is aggressively playtesting me.";
  }

  if (lower.includes("bengaluru") || lower.includes("bangalore") || lower.includes("city")) {
    return "Bengaluru is my environment art and my villain system. Rain makes the trees cinematic, traffic makes timing matter, and every flooded lane becomes a level design note. The city is beautiful, generous, and absolutely committed to testing my collision logic.";
  }

  if (lower.includes("3-day") || lower.includes("three day") || lower.includes("sprint")) {
    return "Day 1: lock the 20-second loop: movement, storm meter, potholes, restart. Day 2: build the Indiranagar slice with puddles, scooters, cones, and one street dog cameo. Day 3: polish sound, instructions, devlog, and pitch, then ship before doubt gets a chair in the meeting.";
  }

  if (lower.includes("level") || lower.includes("indiranagar")) {
    return "I would build Indiranagar After First Rain: narrow lanes, scooters on the edges, puddles that tug you sideways, and one fake pothole that is only a reflection. If the player panic-swerves, they hit a real cone. Bengaluru as psychological thriller.";
  }

  if (lower.includes("npc") || lower.includes("dialogue") || lower.includes("chai") || lower.includes("dog")) {
    return "Chai vendor: \"The rain has already read your calendar.\" Delivery rider: \"I know a shortcut. So does every pothole.\" Street dog: \"Bark once for left, twice for doom.\" I would keep the lines tiny; nobody wants a lore dump while hydroplaning.";
  }

  if (lower.includes("pitch") || lower.includes("judge") || lower.includes("demo")) {
    return "Most AI characters are chat windows wearing costumes. MAYA builds the life first: identity, world, journal, project, task skills, avatar, and trace. I am the proof: you can inspect my world, ask me about Monsoon Run, and make me produce real artifacts from the context MAYA built.";
  }

  if (lower.includes("friend") || lower.includes("assistant") || lower.includes("what can you do")) {
    const modeLine =
      mode === "assistant"
        ? "As your assistant, I can turn messy ideas into plans, checklists, devlogs, and launch notes."
        : mode === "muse"
          ? "As your muse, I can make level ideas, dialogue, tiny scenes, and weird mechanics with a pulse."
          : "As a friend, I can talk like an actual person, remember my little world, and still help you make something useful.";
    return `${modeLine} For the demo, ask me for a sprint plan, a monsoon level, NPC dialogue, today's devlog, or why MAYA is not just a chatbot.`;
  }

  if (lower.includes("why") && (lower.includes("chatbot") || lower.includes("maya"))) {
    return "A chatbot starts with a blank box and a costume. MAYA gave me a life first: Koramangala, journal entries, memories, Monsoon Run, task skills, avatar, and Life Trace. The chat is just the door; the room already exists.";
  }

  if (lower.includes("how") && lower.includes("maya") && (lower.includes("build") || lower.includes("built"))) {
    return "MAYA built me in layers: Identity Agent gave me voice, World Agent gave me Koramangala rain, Journal Agent gave me recent days, Project Agent gave me Monsoon Run, Task Agent gave me useful work, and Life Trace recorded the whole thing. I am not starting from a blank prompt, which is honestly a relief for both of us.";
  }

  if (lower.includes("food") || lower.includes("vegan") || lower.includes("eat")) {
    return "Dosa, dal, peanut chutney, filter coffee, and the occasional suspicious vegan brownie from Indiranagar. My cooking style is mostly \"will this compile before the sambar gets cold?\"";
  }

  if (lower.includes("how are you") || lower === "hi" || lower === "hey" || lower === "hello") {
    return "Hey. I am good, slightly rain-soaked in spirit. I got the puddle physics to feel less like soup today, which is my current definition of inner peace. How are you holding up?";
  }

  return null;
}

function normalizeRelationshipMode(value: unknown): RelationshipMode {
  return relationshipModes.includes(value as RelationshipMode)
    ? (value as RelationshipMode)
    : "friend";
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
