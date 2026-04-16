# MAYA Technical Specification

## 1. Product Summary

MAYA turns a short person description into a living, task-capable digital character.

Core loop:

```text
Create seed -> Manifest life -> Inhabit world -> Chat / assign tasks -> Save artifacts -> Update Life Trace
```

North star:

```text
Generate life -> inspect life -> assign task -> show trace
```

Positioning:

```text
MAYA is not a chatbot. It is a Codex-built life.
The conversation is just the interface.
```

## 2. Current Codebase Snapshot

Framework:

- Next.js app router
- React client UI
- TypeScript
- Tailwind CSS
- Three.js procedural avatar
- OpenAI Responses API helper with local fallback

Important files:

- `app/page.tsx`: main client app, Create -> Manifest -> Inhabit UI, chat, tasks, artifacts, export/share.
- `app/avatar-stage.tsx`: Three.js procedural character renderer.
- `app/api/manifest/route.ts`: builds a full character from seed text.
- `app/api/chat/route.ts`: replies as the current generated character.
- `app/api/task/route.ts`: creates artifacts from task requests.
- `lib/maya-data.ts`: data model, Arjun fallback, demo seeds, local compiler, fallback task artifacts.
- `lib/openai-server.ts`: OpenAI JSON generation wrapper.
- `app/globals.css`: global visual system and animation styles.
- `.env.example`: OpenAI environment variables.

Current routes:

```text
POST /api/manifest
POST /api/chat
POST /api/task
```

Current fallback behavior:

- If `OPENAI_API_KEY` is missing, the app still works through local compiler functions.
- Arjun remains the safest demo character.
- Manifest, chat, and task routes all have fallback outputs.

## 3. User Journey

### Create

User lands on MAYA and enters or selects a character seed.

Example:

```text
Arjun, 28, indie game developer in Bengaluru, vegan, Ghibli-obsessed, dry humor, building a tiny monsoon game.
```

Create step should clearly communicate:

- Describe a person.
- MAYA builds identity, world, memory, project, avatar, tasks, and trace.
- User can then talk to the character or assign useful work.

### Manifest

MAYA shows agents building the life.

Current agent sequence:

- Identity Agent
- World Agent
- Journal Agent
- Project Agent
- Avatar Agent
- Task Agent
- Conversation Agent

Each agent creates a visible Life Trace event.

### Inhabit

User enters the generated character world.

Visible surfaces:

- Character website
- 3D avatar
- Journal
- Memories
- Current project
- Task skills
- Artifact cards
- Chat panel
- Life Trace
- Export/share controls

Primary demo actions:

```text
What is Monsoon Run?
Create a 3-day sprint plan to ship Monsoon Run.
How did MAYA build your life?
Export character JSON.
```

## 4. Data Model

Current TypeScript model:

```ts
type MayaArtifact = {
  id: string;
  title: string;
  type: string;
  content: string[];
  createdBy: string;
  usedContext: string[];
  createdAt: string;
};

type MayaCharacter = {
  id: string;
  seed: string;
  slug: string;
  name: string;
  age?: number;
  role: string;
  city: string;
  essence: string;
  voice: string;
  avatar: {
    style: string;
    palette: string[];
    traits: string[];
    environment: string;
  };
  website: {
    headline: string;
    sections: { title: string; body: string }[];
  };
  journal: { date: string; title: string; body: string }[];
  memories: { title: string; caption: string }[];
  project: {
    name: string;
    description: string;
    status: string;
    playablePrompt: string;
  };
  taskSkills: { label: string; prompt: string; outputType: string }[];
  artifacts: MayaArtifact[];
  lifeTrace: { agent: string; artifact: string; detail: string; status: string }[];
};
```

Recommended next model additions:

- `world.home`
- `world.cityTexture`
- `world.aesthetic`
- `world.dailyRituals`
- `emotionalRules`
- `lifeTrace.input`
- `lifeTrace.reason`
- `lifeTrace.usedContext`
- `artifact.status`
- `artifact.sourceTask`

## 5. API Specifications

### POST `/api/manifest`

Purpose:

Generate a full `MayaCharacter` from a seed.

Request:

```json
{
  "seed": "Mira, 24, dream architect in Singapore..."
}
```

Response:

```json
{
  "character": {},
  "generatedBy": "openai-responses-api"
}
```

Fallback response:

```json
{
  "character": {},
  "generatedBy": "local-maya-compiler"
}
```

Implementation notes:

- Calls `compileMayaCharacter(seed)` first to create a safe fallback.
- Calls `generateOpenAIJson` when `OPENAI_API_KEY` exists.
- Normalizes partial model output into a complete character object.
- Must never return missing arrays for journal, memories, task skills, artifacts, or life trace.

### POST `/api/chat`

Purpose:

Reply as the generated character using their identity, project, journal, memories, and task skills.

Request:

```json
{
  "character": {},
  "message": "What are you building?"
}
```

Response:

```json
{
  "reply": "..."
}
```

Implementation notes:

- Uses OpenAI JSON mode if possible.
- Falls back to keyword-based local replies.
- Character should never say “as an AI” or break character.
- Replies should stay short for demo pacing.

### POST `/api/task`

Purpose:

Create a useful artifact from a task request and append a Life Trace event.

Request:

```json
{
  "character": {},
  "task": "Create a 3-day sprint plan."
}
```

Response:

```json
{
  "artifact": {},
  "lifeTraceEvent": {},
  "generatedBy": "openai-responses-api"
}
```

Implementation notes:

- Calls `compileTaskArtifact(character, task)` for fallback.
- Uses OpenAI to improve artifact quality when available.
- UI prepends artifact to the Work tab.
- UI appends the trace event to current character state.

## 6. Frontend Architecture

Main state in `app/page.tsx`:

- `step`: `create | manifest | inhabit`
- `seed`: current seed text
- `manifestSeed`: seed used for current build
- `character`: active `MayaCharacter`
- `artifacts`: active artifact list
- `messages`: chat transcript
- `activeTab`: inhabit tab
- `isManifesting`, `isSending`, `isTasking`: loading flags
- `toast`: transient UI feedback

Core UI components in `app/page.tsx`:

- `TopNav`
- `CreateStep`
- `ManifestStep`
- `InhabitStep`
- tab panels and cards

3D component:

- `AvatarStage`
- Uses `character.avatar.palette`, `traits`, `environment`, `role`, and `project.name`.
- Supports sizes such as full/compact/hero depending on current UI state.
- Should remain non-blocking for demo reliability.

UX requirements for new users:

- The first screen must explain what MAYA does without needing a pitch.
- CTA should make the next action obvious.
- Presets should reduce blank-page anxiety.
- Manifest screen should show agent progress clearly.
- Inhabit screen should separate world, life, work, and trace.
- Task buttons should demonstrate usefulness quickly.

## 7. OpenAI Integration

Environment:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

Current helper:

```ts
generateOpenAIJson<T>({
  schema,
  system,
  user,
  maxOutputTokens,
})
```

Current model default:

```text
gpt-4.1-mini
```

Reliability rules:

- Always build fallback object first.
- Treat OpenAI output as optional enhancement.
- Normalize every partial response.
- Keep output shape stable for UI.
- Log failed OpenAI requests server-side.
- Do not block demo if API key is missing.

Future upgrade:

- Move schemas into named constants.
- Make schema stricter once all shape fields are final.
- Add validation before returning route responses.
- Consider model upgrade after MVP is stable.

## 8. Demo Presets

Use these for the live demo:

### Arjun

```text
Arjun, 28, indie game developer in Bengaluru, vegan, Ghibli-obsessed, dry humor, building a tiny monsoon game.
```

Purpose:

- Main demo
- Emotional + game-dev use case
- Strongest current fallback content

### Mira

```text
Mira, 24, dream architect in Singapore, calm but intense, designs virtual gardens, helps people turn emotions into spaces.
```

Purpose:

- Dream-world guide
- Emotional imagination
- Visual contrast from Arjun

### Nova

```text
Nova, 31, startup operator in San Francisco, direct, high-agency, helps founders turn messy ideas into launch plans.
```

Purpose:

- Practical virtual worker
- Task usefulness
- Sprint/launch plan artifacts

## 9. Two-Person Work Split

### Person 1: UI / Product Flow

Owner: current UI developer.

Primary files:

- `app/page.tsx`
- `app/avatar-stage.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `public/monsoon-run.svg`

Responsibilities:

- Make Create -> Manifest -> Inhabit obvious for first-time users.
- Polish layout, spacing, typography, colors, and responsive behavior.
- Keep Arjun safe and demo-ready.
- Make presets visually understandable.
- Improve 3D character presentation.
- Make task skills and artifacts feel useful, not hidden.
- Keep Life Trace readable and judge-friendly.
- Add clear loading states and empty states.
- Verify mobile and desktop screenshots.

UI acceptance checklist:

- First screen explains MAYA in under 5 seconds.
- User knows what to click next.
- Manifest animation clearly shows agent workflow.
- Inhabit screen does not feel like only a chat app.
- Chat panel is visible but not the whole product.
- Work/artifact area is easy to find.
- Life Trace shows why MAYA is agentic.
- 3D avatar renders on desktop and mobile.
- No text overflow on mobile.
- Demo can be completed in 90 seconds.

### Person 2: Agent / API / Data Reliability

Owner: backend + AI route developer.

Primary files:

- `app/api/manifest/route.ts`
- `app/api/chat/route.ts`
- `app/api/task/route.ts`
- `lib/maya-data.ts`
- `lib/openai-server.ts`
- `.env.example`

Responsibilities:

- Stabilize the data model.
- Improve manifest output quality.
- Make chat consistently grounded in character context.
- Make task artifacts practical and specific.
- Make Life Trace richer and structured.
- Keep local fallbacks working.
- Add route-level validation.
- Add clear error handling.
- Prevent malformed OpenAI responses from breaking UI.
- Keep Arjun, Mira, and Nova high quality.

Backend acceptance checklist:

- `/api/manifest` always returns a complete `MayaCharacter`.
- `/api/chat` always returns `{ reply: string }`.
- `/api/task` always returns an artifact and Life Trace event.
- App works with no `OPENAI_API_KEY`.
- App improves when `OPENAI_API_KEY` is present.
- Generated characters have website, journal, memories, project, task skills, artifacts, and Life Trace.
- Task artifacts include `usedContext`.
- No server route throws on empty request body.
- TypeScript passes.

## 10. Integration Contract Between Both People

Person 1 can safely assume:

- `character` has the complete `MayaCharacter` shape.
- `character.artifacts` is always an array.
- `character.lifeTrace` is always an array.
- `/api/task` returns one artifact and one trace event.
- `/api/chat` returns one reply string.

Person 2 must preserve:

- Existing field names unless coordinated.
- `MayaArtifact.content` as `string[]`.
- `taskSkills` shape used by UI buttons.
- `avatar.palette` as `[primary, accent, dark, light]`.
- `lifeTrace.agent`, `artifact`, `detail`, `status`.

If the data model changes:

- Update `MayaCharacter`.
- Update fallback `arjun`.
- Update `compileMayaCharacter`.
- Update route normalization.
- Tell UI owner before changing field names.

## 11. Immediate Next Sprint

Priority 1:

- Finish UI polish without changing data contracts.
- Stabilize backend route outputs.
- Make Arjun demo bulletproof.

Priority 2:

- Improve Mira and Nova preset output.
- Add richer Life Trace fields.
- Add validation for route responses.

Priority 3:

- Export character JSON polish.
- Better artifact card types.
- Better 3D avatar differences by character type.

Do not prioritize yet:

- Auth
- Payments
- Database
- Multiplayer
- Full 3D world
- Real calendar/email integrations
- Complex long-term memory
- Mobile app

## 12. Testing Plan

Manual demo test:

1. Open app.
2. Confirm Create screen explains product clearly.
3. Manifest Arjun.
4. Confirm all agents complete.
5. Confirm Inhabit view opens.
6. Ask: `What is Monsoon Run?`
7. Run task: `Create a 3-day sprint plan.`
8. Confirm artifact card appears.
9. Confirm Life Trace appends Task Agent event.
10. Export character JSON.

Automated checks:

```text
npm run lint
npm run build
```

Browser checks:

- Desktop viewport: 1440 x 1000
- Mobile viewport: 390 x 900
- Canvas exists and is nonblank
- No layout overflow
- Main CTA visible
- Inhabit tab controls usable

## 13. Demo Script

Opening:

```text
Most AI characters are chatbots with costumes. MAYA starts differently: it builds a life first.
```

Create:

```text
We describe Arjun in one paragraph.
```

Manifest:

```text
MAYA runs agents for identity, world, journal, project, avatar, tasks, and conversation context.
```

Inhabit:

```text
Now Arjun has a website, journal, memories, project, task skills, artifacts, and Life Trace.
```

Task:

```text
Because Arjun has a life and project, he can do useful work. We ask him for a sprint plan.
```

Close:

```text
The chat is just the interface. The life behind it is what makes the answer grounded.
```

## 14. Definition of Done

MVP is ready when:

- Arjun demo works offline through fallbacks.
- API-enhanced generation works with an OpenAI key.
- UI is understandable to a new user.
- User can manifest, inspect, chat, task, and export.
- Task creates an artifact.
- Task creates a Life Trace event.
- 3D avatar renders.
- Build passes.
- 90-second demo is smooth.

