<div align="center">
  <img src="public/logo.png" width="128" />
  <h1>MAYA</h1>
  <p><b>Codex-built lives.</b></p>
</div>

Most AI characters are chatbots with costumes. **MAYA** starts differently: it builds a life first. 

MAYA is an application that turns a short person description into a living, task-capable digital character (a "Codex-built life"). The conversation is just the interface.

## Core Loop

`Create seed -> Manifest life -> Inhabit world -> Chat / assign tasks -> Save artifacts -> Update Life Trace`

1. **Describe:** Provide a single-paragraph description of a person (a seed).
2. **Agents Build:** 7 Codex agents sequentially build their identity, world, journal, project, avatar, tasks, and conversation context. 
3. **Inhabit:** Explore their website, journal, memories, 3D avatar, and life trace.
4. **Assign Tasks:** Because the agent has a life and an active project, they can do genuinely useful grounded work and generate artifacts.

## Architecture

- **Framework:** Next.js App Router
- **Client:** React, Tailwind CSS
- **3D Rendering:** Three.js (procedural avatar)
- **AI:** OpenAI API (with resilient local fallbacks)
- **Language:** TypeScript

## Running Locally

1. Clone the repository.
2. Copy `.env.example` to `.env.local` and add your OpenAI API key (Note: MAYA works gracefully offline using local compiler fallback functions if no key is provided!)
3. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000` in your browser.

## Demo Presets

Try these seeds to experience different Codex-built lives:

- **Arjun:** *28, indie game developer in Bengaluru, vegan, Ghibli-obsessed, dry humor, building a tiny monsoon game.*
- **Mira:** *24, dream architect in Singapore, calm but intense, designs virtual gardens, helps people turn emotions into spaces.*
- **Nova:** *31, startup operator in San Francisco, direct, high-agency, helps founders turn messy ideas into launch plans.*

---

*Because they have a life, they can do the work.*
