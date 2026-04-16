import { arjun, compileTaskArtifact } from "@/lib/maya-data";
import { generateOpenAIJson } from "@/lib/openai-server";
import type { MayaCharacter } from "@/lib/maya-data";

export async function POST(request: Request) {
  const { character: payloadCharacter, task } = await request.json();
  const character = (payloadCharacter ?? arjun) as MayaCharacter;
  const fallbackArtifact = compileTaskArtifact(character, String(task ?? "Create a practical plan."));
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
    content: generated?.artifact?.content?.length ? generated.artifact.content : fallbackArtifact.content,
    createdBy: generated?.artifact?.createdBy || fallbackArtifact.createdBy,
    usedContext: generated?.artifact?.usedContext?.length
      ? generated.artifact.usedContext
      : fallbackArtifact.usedContext,
    createdAt: generated?.artifact?.createdAt || fallbackArtifact.createdAt,
  };
  const lifeTraceEvent = {
    agent: "Task Agent",
    artifact: `Created artifact: ${artifact.title}.`,
    detail: `Used ${artifact.usedContext.join(", ")} to produce a ${artifact.type} output.`,
    status: "complete",
    ...(generated?.lifeTraceEvent ?? {}),
  };

  return Response.json({
    artifact,
    lifeTraceEvent,
    generatedBy: generated ? "openai-responses-api" : "local-maya-compiler",
  });
}
