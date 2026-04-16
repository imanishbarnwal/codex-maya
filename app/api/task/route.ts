import { arjun, compileTaskArtifact } from "@/lib/maya-data";
import { generateOpenAIJson } from "@/lib/openai-server";
import type { MayaCharacter } from "@/lib/maya-data";

export async function POST(request: Request) {
  let body: { character?: unknown; task?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { character: payloadCharacter, task } = body;
  const character = (payloadCharacter ?? arjun) as MayaCharacter;
  const fallbackArtifact = compileTaskArtifact(character, String(task ?? "Create a practical plan."));
  const isArjun = character.slug === "arjun" || character.name.toLowerCase() === "arjun";

  if (isArjun) {
    return Response.json({
      artifact: fallbackArtifact,
      lifeTraceEvent: traceForArtifact(fallbackArtifact),
      generatedBy: "arjun-demo-fallback",
    });
  }

  const generated = await generateOpenAIJson<{
    artifact?: Partial<typeof fallbackArtifact>;
    lifeTraceEvent?: MayaCharacter["lifeTrace"][number];
  }>({
    schema: {
      name: "maya_task",
      schema: {
        type: "object",
        properties: {
          artifact: { type: "object" },
          lifeTraceEvent: { type: "object" },
        },
        required: ["artifact", "lifeTraceEvent"],
        additionalProperties: false,
      },
    },
    system:
      "You are MAYA's Task Agent. Create one useful artifact from the character's identity, world, journal, project, and task request. Return JSON only. The artifact should be practical, specific, and in the character's world.",
    user: JSON.stringify({
      task,
      character,
      fallbackShape: fallbackArtifact,
    }),
    maxOutputTokens: 1400,
  });
  const artifact = {
    ...fallbackArtifact,
    ...(generated?.artifact ?? {}),
    id: generated?.artifact?.id || fallbackArtifact.id,
    title: generated?.artifact?.title || fallbackArtifact.title,
    type: generated?.artifact?.type || fallbackArtifact.type,
    content: normalizeStringArray(generated?.artifact?.content, fallbackArtifact.content),
    createdBy: generated?.artifact?.createdBy || fallbackArtifact.createdBy,
    usedContext: normalizeStringArray(generated?.artifact?.usedContext, fallbackArtifact.usedContext),
    createdAt: generated?.artifact?.createdAt || fallbackArtifact.createdAt,
  };
  const lifeTraceCandidate = generated?.lifeTraceEvent;
  const lifeTraceEvent = {
    ...(lifeTraceCandidate ?? {}),
    ...traceForArtifact(artifact),
    agent: lifeTraceCandidate?.agent || traceForArtifact(artifact).agent,
    artifact: lifeTraceCandidate?.artifact || traceForArtifact(artifact).artifact,
    detail: lifeTraceCandidate?.detail || traceForArtifact(artifact).detail,
    status: lifeTraceCandidate?.status || traceForArtifact(artifact).status,
  };

  return Response.json({
    artifact,
    lifeTraceEvent,
    generatedBy: generated ? "openai-responses-api" : "local-maya-compiler",
  });
}

function traceForArtifact(artifact: ReturnType<typeof compileTaskArtifact>) {
  return {
    agent: "Task Agent",
    artifact: `Created artifact: ${artifact.title}.`,
    detail: `Used ${artifact.usedContext.join(", ")} to produce a ${artifact.type} output.`,
    status: "complete",
  };
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) && value.every((item) => typeof item === "string") && value.length
    ? value
    : fallback;
}
