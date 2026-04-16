type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
};

type OpenAIJsonOptions = {
  schema: JsonSchema;
  system: string;
  user: string;
  maxOutputTokens?: number;
};

const responsesUrl = "https://api.openai.com/v1/responses";

export async function generateOpenAIJson<T>({
  schema,
  system,
  user,
  maxOutputTokens = 1800,
}: OpenAIJsonOptions): Promise<T | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(responsesUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
        },
      ],
      max_output_tokens: maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name: schema.name,
          strict: false,
          schema: schema.schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`OpenAI request failed: ${response.status} ${detail}`);
    return null;
  }

  const data = await response.json();
  const text = extractResponseText(data);
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("OpenAI JSON parse failed", error, text);
    return null;
  }
}

function extractResponseText(data: {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
}) {
  if (data.output_text) return data.output_text;

  return data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("");
}
