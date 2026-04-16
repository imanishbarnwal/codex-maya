import { compileMayaCharacter } from "@/lib/maya-data";
import { generateOpenAIJson } from "@/lib/openai-server";
import type { MayaCharacter, RelationshipMode } from "@/lib/maya-data";

type ManifestOptions = {
  outputs?: string[];
  relationshipMode?: RelationshipMode;
  avatarMode?: string;
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

const relationshipGuidance: Record<RelationshipMode, string> = {
  friend:
    "Tune voice warm and casual. Journal entries feel emotional and personal. Task skills lean toward reflection, reminders, small thoughtful outputs.",
  assistant:
    "Tune voice crisp and practical. Journal entries feel like work notes. Task skills lean toward plans, summaries, drafts, checklists.",
  muse:
    "Tune voice vivid and imaginative. Journal entries feel like creative sketches. Task skills lean toward brainstorms, vignettes, mood boards.",
  npc:
    "Tune voice in-world and lore-heavy. Journal entries feel like scroll fragments or quest notes. Task skills lean toward dialogue, quests, scene writing.",
  guide:
    "Tune voice calm and symbolic. Journal entries feel dreamlike. Task skills lean toward rituals, reflections, tiny stories.",
  operator:
    "Tune voice direct and unsentimental. Journal entries feel like founder notes. Task skills lean toward launch plans, sprints, strategy docs.",
  coach:
    "Tune voice reflective and probing. Journal entries feel like coaching observations. Task skills lean toward questions, frameworks, single-move commitments.",
};

export async function POST(request: Request) {
  let body: { seed?: unknown; options?: ManifestOptions } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { seed, options } = body;
  const manifestOptions = (options ?? {}) as ManifestOptions;
  const relationshipMode = normalizeRelationshipMode(manifestOptions.relationshipMode);
  const fallbackCharacter: MayaCharacter = {
    ...compileMayaCharacter(String(seed ?? "")),
    relationshipMode,
  };
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
    system: `You are MAYA's Manifest Agent. Turn a short person seed into a complete, usable digital life. Return JSON only. Keep outputs vivid, specific, demo-safe, and grounded in the seed. The user will interact with this character as a ${relationshipMode}. ${relationshipGuidance[relationshipMode]} Prioritize requested modules; keep deselected modules minimal but valid. Do not add external actions or unsafe claims.`,
    user: JSON.stringify({
      seed: String(seed ?? ""),
      relationshipMode,
      buildRecipe: {
        outputs: manifestOptions.outputs ?? [
          "website",
          "journal",
          "memories",
          "project",
          "avatar",
          "chat",
          "trace",
        ],
        avatarMode: manifestOptions.avatarMode ?? "stylized",
      },
      fallbackShape: fallbackCharacter,
      required:
        "Return a character with the same shape as fallbackShape: identity, avatar, website, journal, memories, project, taskSkills, artifacts, lifeTrace.",
    }),
    maxOutputTokens: 2800,
  });
  const character: MayaCharacter = {
    ...normalizeCharacter(generated?.character, fallbackCharacter),
    relationshipMode,
  };

  return Response.json({
    character,
    generatedBy: generated ? "openai-responses-api" : "local-maya-compiler",
  });
}

function normalizeRelationshipMode(value: unknown): RelationshipMode {
  return relationshipModes.includes(value as RelationshipMode)
    ? (value as RelationshipMode)
    : "friend";
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
