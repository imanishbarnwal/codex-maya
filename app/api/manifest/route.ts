import { compileMayaCharacter } from "@/lib/maya-data";
import { generateOpenAIJson } from "@/lib/openai-server";
import type { MayaCharacter } from "@/lib/maya-data";

export async function POST(request: Request) {
  const { seed } = await request.json();
  const fallbackCharacter = compileMayaCharacter(String(seed ?? ""));
  const generated = await generateOpenAIJson<{ character: Partial<MayaCharacter> }>({
    schema: {
      name: "maya_manifest",
      schema: {
        type: "object",
        properties: {
          character: { type: "object" },
        },
        required: ["character"],
        additionalProperties: false,
      },
    },
    system:
      "You are MAYA's Manifest Agent. Turn a short person seed into a complete, usable digital life. Return JSON only. Keep outputs vivid, specific, demo-safe, and grounded in the seed. Do not add external actions or unsafe claims.",
    user: JSON.stringify({
      seed: String(seed ?? ""),
      fallbackShape: fallbackCharacter,
      required:
        "Return a character with the same shape as fallbackShape: identity, avatar, website, journal, memories, project, taskSkills, artifacts, and lifeTrace.",
    }),
    maxOutputTokens: 2800,
  });
  const character = normalizeCharacter(generated?.character, fallbackCharacter);

  return Response.json({
    character,
    generatedBy: generated ? "openai-responses-api" : "local-maya-compiler",
  });
}

function normalizeCharacter(candidate: Partial<MayaCharacter> | undefined, fallback: MayaCharacter): MayaCharacter {
  if (!candidate) return fallback;

  return {
    ...fallback,
    ...candidate,
    id: candidate.id || fallback.id,
    seed: candidate.seed || fallback.seed,
    slug: candidate.slug || fallback.slug,
    name: candidate.name || fallback.name,
    role: candidate.role || fallback.role,
    city: candidate.city || fallback.city,
    essence: candidate.essence || fallback.essence,
    voice: candidate.voice || fallback.voice,
    avatar: {
      ...fallback.avatar,
      ...(candidate.avatar ?? {}),
      palette: candidate.avatar?.palette?.length ? candidate.avatar.palette : fallback.avatar.palette,
      traits: candidate.avatar?.traits?.length ? candidate.avatar.traits : fallback.avatar.traits,
    },
    website: {
      ...fallback.website,
      ...(candidate.website ?? {}),
      sections: candidate.website?.sections?.length ? candidate.website.sections : fallback.website.sections,
    },
    journal: candidate.journal?.length ? candidate.journal : fallback.journal,
    memories: candidate.memories?.length ? candidate.memories : fallback.memories,
    project: {
      ...fallback.project,
      ...(candidate.project ?? {}),
    },
    taskSkills: candidate.taskSkills?.length ? candidate.taskSkills : fallback.taskSkills,
    artifacts: candidate.artifacts ?? fallback.artifacts,
    lifeTrace: candidate.lifeTrace?.length ? candidate.lifeTrace : fallback.lifeTrace,
  };
}
