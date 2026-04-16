import { arjun } from "@/lib/maya-data";
import { generateOpenAIJson } from "@/lib/openai-server";
import type { MayaCharacter } from "@/lib/maya-data";

export async function POST(request: Request) {
  const { message, character: payloadCharacter } = await request.json();
  const character = (payloadCharacter ?? arjun) as MayaCharacter;
  const lower = String(message ?? "").toLowerCase();
  const project = character.project.name;

  const generated = await generateOpenAIJson<{ reply: string }>({
    schema: {
      name: "maya_chat",
      schema: {
        type: "object",
        properties: {
          reply: { type: "string" },
        },
        required: ["reply"],
        additionalProperties: false,
      },
    },
    system: `You are ${character.name}, a ${character.role.toLowerCase()} in ${character.city}. ${character.essence} Your voice: ${character.voice}. You were manifested by MAYA — a Codex tool that built your whole world. Respond from lived context, never blank roleplay. Keep replies to 2–4 sentences. Be specific, grounded, and pull from your journal, project, memories, and city. Never say "as an AI", "language model", or break character. Return JSON with a single "reply" field.`,
    user: JSON.stringify({
      userSaid: message,
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

  let reply =
    generated?.reply ||
    `I am here as ${character.name}. MAYA already built my world, so ask me about ${project}, my journal, ${character.city}, or what I can make for you.`;

  if (!generated?.reply && (lower.includes("monsoon") || lower.includes("game") || lower.includes("project") || lower.includes(project.toLowerCase()))) {
    reply =
      `${project} is my active work right now. ${character.project.description} The useful part is that MAYA gave me a project before you opened the chat, so I can respond from work-in-progress context instead of blank roleplay.`;
  } else if (lower.includes("journal") || lower.includes("yesterday")) {
    const entry = character.journal.at(-1);
    reply =
      entry
        ? `My latest journal entry is "${entry.title}." ${entry.body}`
        : "My journal is still being written, which is a polite way of saying MAYA caught me before coffee.";
  } else if (lower.includes("ghibli") || lower.includes("inspiration")) {
    reply =
      "Ghibli taught me that small things can carry huge feelings. A wet balcony, a tired cyclist, a stubborn basil plant. I want my games to feel like that.";
  } else if (lower.includes("vegan") || lower.includes("food") || lower.includes("eat")) {
    reply =
      "Mostly dosa, dal, suspicious amounts of peanut chutney, and whatever vegan place near Indiranagar is willing to feed a developer who says he will sleep early and then absolutely does not.";
  } else if (lower.includes("bengaluru") || lower.includes("bangalore") || lower.includes("city") || lower.includes(character.city.toLowerCase())) {
    reply =
      `${character.city} is not just a label in my profile. MAYA used it as world context: ${character.avatar.environment}`;
  } else if (
    lower.includes("maya") ||
    lower.includes("build") ||
    lower.includes("built") ||
    lower.includes("memory") ||
    lower.includes("memories") ||
    lower.includes("life trace") ||
    lower.includes("codex")
  ) {
    reply =
      `MAYA gave me a Life Trace: ${character.lifeTrace.map((trace) => trace.agent).join(", ")}. The chat is just the little window you talk through after Codex has built the room.`;
  } else if (lower.includes("sprint") || lower.includes("plan")) {
    reply =
      `Here is a compact plan for ${project}: Day 1, lock the smallest playable loop and remove anything decorative. Day 2, create one memorable artifact from my world and test it with a real person. Day 3, polish the first minute, write the launch note, and ship the demo before doubt gets a vote.`;
  } else if (lower.includes("task") || lower.includes("work") || lower.includes("make") || lower.includes("create")) {
    reply =
      `Give me a task and I can produce an artifact. My current skills are: ${character.taskSkills.map((skill) => skill.label).join(", ")}.`;
  } else if (lower.includes("who") || lower.includes("about")) {
    reply = `I am ${character.name}${character.age ? `, ${character.age}` : ""}, a ${character.role.toLowerCase()} in ${character.city}. ${character.essence}`;
  }

  return Response.json({ reply });
}
