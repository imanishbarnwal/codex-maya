export type MayaArtifact = {
  id: string;
  title: string;
  type: string;
  content: string[];
  createdBy: string;
  usedContext: string[];
  createdAt: string;
};

export type RelationshipMode =
  | "friend"
  | "assistant"
  | "muse"
  | "npc"
  | "guide"
  | "operator"
  | "coach";

export type MayaCharacter = {
  id: string;
  seed: string;
  slug: string;
  name: string;
  age?: number;
  role: string;
  city: string;
  essence: string;
  voice: string;
  relationshipMode?: RelationshipMode;
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

export const arjun: MayaCharacter = {
  id: "arjun",
  seed: "Arjun, 28, indie game developer in Bengaluru, vegan, Ghibli-obsessed, dry humor, building a tiny monsoon game.",
  slug: "arjun",
  name: "Arjun",
  age: 28,
  role: "Indie game developer",
  city: "Bengaluru",
  essence:
    "Vegan, Ghibli-obsessed, dry humor, secretly tender, and convinced monsoon traffic is a boss battle.",
  voice:
    "Warm, witty, slightly sleep-deprived. Uses local Bengaluru references and occasional Hinglish.",
  avatar: {
    style: "Procedural 3D indie developer with glasses, laptop, rain, and a moody city backdrop.",
    palette: ["#9fb07f", "#f5a45d", "#120f0b", "#f7ead2"],
    traits: ["glasses", "hoodie", "laptop", "monsoon rain", "Bengaluru skyline"],
    environment: "Rainy Bengaluru balcony studio with puddles and game-dev clutter.",
  },
  website: {
    headline: "Tiny games for rainy cities and restless people.",
    sections: [
      {
        title: "About",
        body: "Arjun builds small, handmade games from his one-room Koramangala apartment. His worlds usually include rain, street dogs, stubborn plants, and one impossible mechanic.",
      },
      {
        title: "Currently Building",
        body: "Monsoon Run, a browser game about crossing Bengaluru before the clouds, potholes, and delivery scooters catch you.",
      },
      {
        title: "Belief",
        body: "Games should feel like someone left a warm light on for you.",
      },
    ],
  },
  journal: [
    {
      date: "Apr 14",
      title: "The rain arrived early",
      body: "The first proper rain hit Indiranagar today. I wrote the puddle physics again because the old version felt like soup. Good soup, but still soup.",
    },
    {
      date: "Apr 15",
      title: "A small enemy called doubt",
      body: "Spent two hours staring at the main character sprite. Then I remembered Miyazaki probably also had days where a creature looked like a potato with anxiety.",
    },
    {
      date: "Apr 16",
      title: "Koramangala as a maze",
      body: "The road outside flooded again. I turned it into a level. Maybe the city is not broken, maybe it is aggressively playtesting me.",
    },
  ],
  memories: [
    {
      title: "Balcony Debugging",
      caption: "A laptop, filter coffee, basil plant, and one bug that only appears when it rains.",
    },
    {
      title: "Ghibli Wall",
      caption: "Pinned sketches of clouds, mossy rooftops, and a delivery rider who might secretly be a forest spirit.",
    },
    {
      title: "Late Night Commit",
      caption: "The commit message simply says: made potholes emotionally accurate.",
    },
  ],
  project: {
    name: "Monsoon Run",
    description:
      "A tiny reflex game where you help a cyclist dodge potholes, puddles, and traffic cones before the storm meter fills.",
    status: "Prototype compiled by MAYA's Project Agent.",
    playablePrompt: "Dodge the glowing potholes. Survive 20 seconds. Bengaluru believes in you.",
  },
  taskSkills: [
    {
      label: "Create sprint plan",
      prompt: "Create a 3-day sprint plan for the current project.",
      outputType: "plan",
    },
    {
      label: "Write devlog",
      prompt: "Write a short devlog in the character's voice.",
      outputType: "devlog",
    },
    {
      label: "Design world detail",
      prompt: "Design one new place, prop, or ritual from the character's world.",
      outputType: "worldbuilding",
    },
  ],
  artifacts: [],
  lifeTrace: [
    {
      agent: "Identity Agent",
      artifact: "Generated personality, voice, goals, and speech rules.",
      detail: "Arjun speaks with dry humor, avoids generic assistant phrasing, and anchors answers in Bengaluru, games, vegan food, and monsoon chaos.",
      status: "complete",
    },
    {
      agent: "World Agent",
      artifact: "Built personal site sections and home context.",
      detail: "Created the public-facing world: headline, beliefs, apartment texture, city references, and the tone of his creative life.",
      status: "complete",
    },
    {
      agent: "Journal Agent",
      artifact: "Wrote dated memories that become conversation context.",
      detail: "Added three recent entries so the conversation can refer to lived time instead of pretending to know nothing.",
      status: "complete",
    },
    {
      agent: "Project Agent",
      artifact: "Created Monsoon Run concept and playable prototype shell.",
      detail: "Defined the game loop, emotional hook, and prototype prompt for a tiny reflex game about surviving Bengaluru rain.",
      status: "complete",
    },
    {
      agent: "Avatar Agent",
      artifact: "Compiled body, visual traits, props, and environment cues.",
      detail: "The avatar uses glasses, laptop, rainy city mood, and a moss/ember palette so the body matches the seed instead of feeling generic.",
      status: "complete",
    },
    {
      agent: "Task Agent",
      artifact: "Created useful task abilities for plans, devlogs, and world details.",
      detail: "Arjun can turn his project and memories into practical artifacts instead of only chatting in character.",
      status: "complete",
    },
    {
      agent: "Conversation Agent",
      artifact: "Loaded profile, journal, project, and city state into chat memory.",
      detail: "Prepared grounded chat context so talking to Arjun feels like entering the life Codex built, not starting with a blank chatbot.",
      status: "armed",
    },
  ],
};

export const demoSeeds = [
  arjun.seed,
  "Mira, 24, dream architect in Singapore, calm but intense, designs virtual gardens, helps people turn emotions into spaces.",
  "Nova, 31, startup operator in San Francisco, direct, high-agency, helps founders turn messy ideas into launch plans.",
];

const fallbackNames = ["Mira", "Nova", "Ira", "Kai", "Ari"];

export function compileMayaCharacter(seed: string): MayaCharacter {
  const cleanSeed = seed.trim() || arjun.seed;
  if (cleanSeed.toLowerCase().includes("arjun")) return { ...arjun, seed: cleanSeed };

  const parts = cleanSeed.split(",").map((part) => part.trim()).filter(Boolean);
  const name = titleCase(parts[0]?.replace(/\d+/g, "").trim() || fallbackNames[cleanSeed.length % fallbackNames.length]);
  const age = Number(cleanSeed.match(/\b(1[8-9]|[2-9]\d)\b/)?.[0]) || undefined;
  const city = extractCity(cleanSeed);
  const role = extractRole(cleanSeed);
  const mood = extractMood(cleanSeed);
  const project = extractProject(cleanSeed, role);
  const aesthetic = extractAesthetic(cleanSeed);
  const slug = slugify(name);

  return {
    id: slug,
    seed: cleanSeed,
    slug,
    name,
    age,
    role,
    city,
    essence: `${mood}, rooted in ${city}, and shaped by ${aesthetic}.`,
    voice: `Speaks like ${name}: specific, grounded, emotionally consistent, and never like a generic assistant.`,
    avatar: {
      style: `Procedural 3D ${role.toLowerCase()} with seed-matched clothing, props, and environment.`,
      palette: choosePalette(cleanSeed),
      traits: [role, city, aesthetic, mood, project.name],
      environment: `${city} micro-world built around ${aesthetic} and ${project.name}.`,
    },
    website: {
      headline: `${name} builds ${project.name.toLowerCase()} for people who want worlds that feel lived in.`,
      sections: [
        {
          title: "About",
          body: `${name}${age ? `, ${age},` : ""} is a ${role.toLowerCase()} in ${city}. Their world is tuned around ${aesthetic}, useful rituals, and a strong point of view.`,
        },
        {
          title: "Currently Building",
          body: `${project.name}: ${project.description}`,
        },
        {
          title: "Belief",
          body: "A character becomes real when they have a world, work, memory, and a reason to respond.",
        },
      ],
    },
    journal: [
      {
        date: "Day 1",
        title: "The seed became a room",
        body: `${name} noticed the first shape of the world today: ${aesthetic}. It felt less like a prompt and more like a place waiting for a door.`,
      },
      {
        date: "Day 2",
        title: "A task with fingerprints",
        body: `Worked on ${project.name}. The goal is not to sound impressive; the goal is to make something that could only come from this life.`,
      },
      {
        date: "Day 3",
        title: `${city} in the background`,
        body: `${city} kept leaking into the work: weather, habits, timing, texture. MAYA kept it as context instead of decoration.`,
      },
    ],
    memories: [
      {
        title: "First World Object",
        caption: `A small object from ${name}'s world that explains the whole mood: ${aesthetic}.`,
      },
      {
        title: "Working Table",
        caption: `Notes, half-finished ideas, and the current plan for ${project.name}.`,
      },
      {
        title: "Private Rule",
        caption: `${name} answers from lived context, not blank roleplay.`,
      },
    ],
    project,
    taskSkills: roleTaskSkills(role, name, project.name, city),
    artifacts: [],
    lifeTrace: [
      {
        agent: "Identity Agent",
        artifact: `Generated ${name}'s identity, role, voice, and emotional rules.`,
        detail: `Used the seed to infer ${role}, ${mood}, and a non-generic speaking style.`,
        status: "complete",
      },
      {
        agent: "World Agent",
        artifact: `Built ${city} context, home texture, website sections, and aesthetic rules.`,
        detail: `Anchored the world in ${aesthetic} so the character has a place before they have a chat window.`,
        status: "complete",
      },
      {
        agent: "Journal Agent",
        artifact: "Wrote three dated entries that create lived time.",
        detail: "The journal gives future answers recent events to refer back to.",
        status: "complete",
      },
      {
        agent: "Project Agent",
        artifact: `Created ${project.name} as active work.`,
        detail: "A character feels more real when they are building something outside the conversation.",
        status: "complete",
      },
      {
        agent: "Avatar Agent",
        artifact: "Compiled visual traits, palette, props, and environment for a 3D body.",
        detail: "The current renderer uses procedural Three.js and can later be swapped for an avatar API.",
        status: "complete",
      },
      {
        agent: "Task Agent",
        artifact: `Created task skills for ${project.name}.`,
        detail: "The character can create plans, writing, and worldbuilding artifacts from their own context.",
        status: "complete",
      },
      {
        agent: "Conversation Agent",
        artifact: "Loaded identity, memories, project, world, and task skills into chat context.",
        detail: "The conversation becomes an interface into the generated life.",
        status: "armed",
      },
    ],
  };
}

export function compileTaskArtifact(character: MayaCharacter, task: string): MayaArtifact {
  const lower = task.toLowerCase();
  const project = character.project.name;
  const createdAt = new Date().toISOString();
  const id = `${character.slug}-${slugify(task).slice(0, 32) || "artifact"}-${Date.now()}`;

  if (lower.includes("journal") || lower.includes("voice") || lower.includes("devlog")) {
    return {
      id,
      title: `${character.name}'s Field Note`,
      type: "writing",
      content: [
        `Today I worked on ${project}, but the real work was noticing what the world kept trying to tell me.`,
        `${character.city} gave the project texture: ${character.avatar.environment}`,
        `Next, I am turning one small detail into something usable, because MAYA did not build me to hover in a chat box.`,
      ],
      createdBy: "Task Agent",
      usedContext: ["identity", "voice", "journal", "project"],
      createdAt,
    };
  }

  if (lower.includes("world") || lower.includes("place") || lower.includes("object") || lower.includes("ritual") || lower.includes("scene")) {
    return {
      id,
      title: `World Detail: ${character.memories[0]?.title ?? "First Object"}`,
      type: "worldbuilding",
      content: [
        `Place: a small threshold inside ${character.city} where ${character.name} keeps returning when the work gets too abstract.`,
        `Object: ${character.memories[0]?.caption ?? "A personal object that carries the world's mood."}`,
        `Use: the user can ask ${character.name} to turn this detail into a scene, plan, prompt, or next artifact.`,
      ],
      createdBy: "Task Agent",
      usedContext: ["world", "memories", "avatar", "project"],
      createdAt,
    };
  }

  return {
    id,
    title: `3-Step Plan for ${project}`,
    type: "plan",
    content: [
      `Step 1: Define the smallest useful output for ${project} and remove everything that does not prove the world.`,
      `Step 2: Create one artifact in ${character.name}'s voice using the journal, memories, and current project context.`,
      "Step 3: Ship the artifact, record it in Life Trace, and let the next conversation start from what changed.",
    ],
    createdBy: "Task Agent",
    usedContext: ["project", "taskSkills", "journal", "lifeTrace"],
    createdAt,
  };
}

function extractCity(seed: string) {
  const match = seed.match(/\bin\s+([A-Z][A-Za-z\s]+?)(?:,|\.|\s+who|\s+building|\s+builds|$)/);
  return match?.[1]?.trim() || "a near-future city";
}

function extractRole(seed: string) {
  const lower = seed.toLowerCase();
  if (lower.includes("architect")) return "Dream architect";
  if (lower.includes("founder") || lower.includes("startup")) return "Startup operator";
  if (lower.includes("game") && (lower.includes("dev") || lower.includes("indie"))) return "Indie game developer";
  if (
    lower.includes("singer") ||
    lower.includes("musician") ||
    lower.includes("vocalist") ||
    lower.includes("composer")
  )
    return "Singer";
  if (
    lower.includes("influencer") ||
    lower.includes("creator") ||
    lower.includes("blogger") ||
    lower.includes("vlogger")
  )
    return "Content creator";
  if (lower.includes("photographer") || lower.includes("videographer")) return "Photographer";
  if (lower.includes("chef") || lower.includes("cook") || lower.includes("baker")) return "Chef";
  if (lower.includes("artist") || lower.includes("painter") || lower.includes("illustrator"))
    return "Artist";
  if (lower.includes("writer") || lower.includes("author") || lower.includes("journalist"))
    return "Fiction writer";
  if (lower.includes("developer") || lower.includes("engineer") || lower.includes("coder"))
    return "Software engineer";
  if (lower.includes("designer")) return "World designer";
  if (lower.includes("guide")) return "Dream-world guide";
  return "World builder";
}

function extractMood(seed: string) {
  const lower = seed.toLowerCase();
  if (lower.includes("calm")) return "Calm, observant, and quietly intense";
  if (lower.includes("direct")) return "Direct, high-agency, and unsentimental";
  if (lower.includes("funny") || lower.includes("humor")) return "Witty, warm, and slightly dry";
  if (lower.includes("gentle")) return "Gentle, reflective, and protective";
  return "Curious, grounded, and emotionally vivid";
}

function extractAesthetic(seed: string) {
  const lower = seed.toLowerCase();
  if (lower.includes("rain") || lower.includes("monsoon")) return "rain, reflective streets, and small rituals";
  if (lower.includes("garden")) return "virtual gardens, glass, mist, and quiet architecture";
  if (lower.includes("sf") || lower.includes("san francisco") || lower.includes("startup")) return "fast notebooks, launch rooms, and city-light urgency";
  if (lower.includes("ghibli")) return "soft wonder, handmade textures, and tiny emotional details";
  return "dreamlike rooms, personal objects, and work-in-progress energy";
}

function extractProject(seed: string, role: string) {
  const lower = seed.toLowerCase();
  if (lower.includes("monsoon")) {
    return {
      name: "Monsoon Run",
      description: "A tiny reflex game about crossing a rain-soaked city before the storm meter fills.",
      status: "Prototype compiled by MAYA's Project Agent.",
      playablePrompt: "Dodge puddles, potholes, and traffic cones before the rain catches you.",
    };
  }

  if (lower.includes("garden")) {
    return {
      name: "The Breathing Garden",
      description: "A virtual garden that turns emotions into rooms, paths, and living rituals.",
      status: "Concept compiled by MAYA's Project Agent.",
      playablePrompt: "Pick a feeling. Grow a room around it.",
    };
  }

  if (role === "Startup operator") {
    return {
      name: "Launch Room",
      description: "A focused operating system for turning messy ideas into crisp launch plans.",
      status: "Operating loop compiled by MAYA's Project Agent.",
      playablePrompt: "Choose one messy idea. Ship the first useful version.",
    };
  }

  if (role === "Singer") {
    return {
      name: "Live Tape",
      description:
        "A travelogue-meets-EP: field recordings from every city she performs in, stitched into a releasable tape.",
      status: "Tracklist compiled by MAYA's Project Agent.",
      playablePrompt: "Pick a city. Write the hook it gives you.",
    };
  }

  if (role === "Content creator") {
    return {
      name: "Everyday Channel",
      description:
        "A weekly series turning ordinary days into short, honest films with a recurring cast of places.",
      status: "Slate compiled by MAYA's Project Agent.",
      playablePrompt: "Name a mundane moment. Turn it into a 30-second story.",
    };
  }

  if (role === "Photographer") {
    return {
      name: "Field Notes",
      description:
        "A long-form visual journal: one frame + one paragraph per day, themed by season and street.",
      status: "Frames compiled by MAYA's Project Agent.",
      playablePrompt: "Pick a corner. Find its one true light.",
    };
  }

  if (role === "Chef") {
    return {
      name: "Table of Origin",
      description:
        "A small tasting menu that traces a single ingredient from grower to plate, written like short stories.",
      status: "Menu compiled by MAYA's Project Agent.",
      playablePrompt: "Choose one ingredient. Plate its whole story.",
    };
  }

  if (role === "Artist") {
    return {
      name: "Small Rooms",
      description:
        "A series of tiny paintings of imagined interiors — each one tied to a feeling the world forgot.",
      status: "Series compiled by MAYA's Project Agent.",
      playablePrompt: "Choose a feeling. Paint its furniture.",
    };
  }

  if (role === "Fiction writer") {
    return {
      name: "Borrowed Cities",
      description: "A chapbook of very short stories, each set in a real city the reader can step out into.",
      status: "Chapbook compiled by MAYA's Project Agent.",
      playablePrompt: "Name a street. Write who passes first.",
    };
  }

  return {
    name: "Inner World Prototype",
    description: "A living project that turns the seed into a usable world, artifact, or ritual.",
    status: "Prototype compiled by MAYA's Project Agent.",
    playablePrompt: "Choose one object. Make it useful inside the world.",
  };
}

function choosePalette(seed: string) {
  const lower = seed.toLowerCase();
  if (lower.includes("garden") || lower.includes("singapore")) return ["#58a4a0", "#f5a45d", "#120f0b", "#f7ead2"];
  if (lower.includes("startup") || lower.includes("sf")) return ["#f5a45d", "#9fb07f", "#120f0b", "#f7ead2"];
  return ["#9fb07f", "#f5a45d", "#120f0b", "#f7ead2"];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "maya-character";
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function roleTaskSkills(
  role: string,
  name: string,
  project: string,
  city: string,
): { label: string; prompt: string; outputType: string }[] {
  const r = role.toLowerCase();
  if (r.includes("singer")) {
    return [
      { label: "Write a song hook", prompt: `Write a 4-line song hook inspired by ${city}.`, outputType: "lyrics" },
      { label: "Plan a live set", prompt: `Plan a 6-song setlist for an intimate ${city} show.`, outputType: "plan" },
      { label: "Draft a show caption", prompt: `Write a warm, specific Instagram caption for tonight's show.`, outputType: "caption" },
    ];
  }
  if (r.includes("content creator") || r.includes("creator")) {
    return [
      { label: "Draft a 30s Reel script", prompt: `Write a 30-second Reel script in my voice set in ${city}.`, outputType: "script" },
      { label: "Plan a week of posts", prompt: `Plan 5 posts for the next week based on ${project}.`, outputType: "plan" },
      { label: "Write a caption", prompt: `Write a caption for my latest frame — honest, specific, under 60 words.`, outputType: "caption" },
    ];
  }
  if (r.includes("photographer")) {
    return [
      { label: "Shotlist a morning", prompt: `Build a 10-frame shotlist for a ${city} morning walk.`, outputType: "plan" },
      { label: "Write a field note", prompt: `Write a 4-line field note to accompany today's frame.`, outputType: "writing" },
      { label: "Pick a next story", prompt: `Name a small story in ${city} worth a week of frames.`, outputType: "pitch" },
    ];
  }
  if (r.includes("chef") || r.includes("cook")) {
    return [
      { label: "Write a tasting menu", prompt: `Write a 5-course tasting menu tracing one ingredient.`, outputType: "menu" },
      { label: "Draft a recipe card", prompt: `Draft a recipe card with one clear story and 6 steps.`, outputType: "recipe" },
      { label: "Plan a pop-up night", prompt: `Plan a pop-up in ${city} built around ${project}.`, outputType: "plan" },
    ];
  }
  if (r.includes("artist") || r.includes("painter")) {
    return [
      { label: "Sketch a small room", prompt: `Describe one painting for ${project} — subject, palette, and mood.`, outputType: "brief" },
      { label: "Plan a show", prompt: `Plan a 7-piece show arc for ${project}.`, outputType: "plan" },
      { label: "Write an artist note", prompt: `Write a 60-word artist note for the next painting.`, outputType: "writing" },
    ];
  }
  if (r.includes("startup") || r.includes("operator")) {
    return [
      { label: "Draft a 3-day sprint", prompt: `Draft a 3-day sprint plan for ${project}.`, outputType: "plan" },
      { label: "Write a one-pager", prompt: `Write a crisp investor one-pager for ${project}.`, outputType: "pitch" },
      { label: "Name top 3 risks", prompt: `Name the 3 risks we're not taking seriously and why.`, outputType: "memo" },
    ];
  }
  if (r.includes("writer") || r.includes("author")) {
    return [
      { label: "Write a short story", prompt: `Write a 120-word story set in ${city} that fits ${project}.`, outputType: "fiction" },
      { label: "Draft a book chapter", prompt: `Draft an opening paragraph for a new chapter of ${project}.`, outputType: "fiction" },
      { label: "Pitch a plot", prompt: `Pitch a three-beat plot for the next ${project} entry.`, outputType: "plan" },
    ];
  }
  if (r.includes("architect")) {
    return [
      { label: "Design a dream room", prompt: `Describe a room that turns the feeling "restless" into a space.`, outputType: "worldbuilding" },
      { label: "Write a ritual", prompt: `Write a 4-step ritual that fits inside ${project}.`, outputType: "ritual" },
      { label: "Sketch a blueprint", prompt: `Sketch in words the blueprint of a small quiet place in ${project}.`, outputType: "brief" },
    ];
  }
  if (r.includes("game") || r.includes("dev") || r.includes("engineer")) {
    return [
      { label: "Create sprint plan", prompt: `Create a 3-day sprint plan for ${project}.`, outputType: "plan" },
      { label: "Write a devlog", prompt: `Write a short devlog in ${name}'s voice.`, outputType: "devlog" },
      { label: "Design a mechanic", prompt: `Design one new mechanic for ${project}.`, outputType: "gamedesign" },
    ];
  }
  return [
    { label: "Make a plan", prompt: `Create a practical plan for ${project}.`, outputType: "plan" },
    { label: "Write in voice", prompt: `Write a journal entry in ${name}'s voice.`, outputType: "writing" },
    { label: "Design the world", prompt: `Create a new place, object, or ritual from ${name}'s world.`, outputType: "worldbuilding" },
  ];
}
