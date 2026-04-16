"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  Boxes,
  Check,
  ChevronDown,
  Code2,
  Compass,
  Download,
  Gamepad2,
  Globe2,
  Heart,
  Layers,
  Lightbulb,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  NotebookPen,
  RefreshCw,
  Rocket,
  Send,
  Share2,
  Sparkles,
  Square,
  Target,
  User,
  Volume2,
  VolumeX,
  Wand2,
  Zap,
} from "lucide-react";
import { AvatarStage, type AvatarMode } from "@/app/avatar-stage";
import {
  arjun,
  demoSeeds,
  type MayaArtifact,
  type MayaCharacter,
  type RelationshipMode,
} from "@/lib/maya-data";
import {
  pickVoice,
  useSpeechRecognition,
  useSpeechSynthesis,
  type VoicePreference,
} from "@/lib/voice";

type Message = { role: "maya" | "you"; text: string };
type TabId = "website" | "life" | "work" | "trace";
type OutputKey = "website" | "journal" | "memories" | "project" | "avatar" | "chat" | "trace";

type ManifestOptions = {
  outputs: OutputKey[];
  relationshipMode: RelationshipMode;
  avatarMode: AvatarMode;
};

const defaultSeed =
  "Arjun, 28, indie game developer in Bengaluru, vegan, obsessed with Ghibli, dry humor, building a tiny monsoon game.";

const agentIcons = [User, Globe2, NotebookPen, Gamepad2, Wand2, Zap, MessageCircle];

const tabs: { id: TabId; label: string; shortLabel: string; icon: typeof User }[] = [
  { id: "website", label: "Website", shortLabel: "Site", icon: Globe2 },
  { id: "life", label: "Life", shortLabel: "Life", icon: BookOpenText },
  { id: "work", label: "Work", shortLabel: "Work", icon: Boxes },
  { id: "trace", label: "Life Trace", shortLabel: "Trace", icon: Layers },
];

const outputOptions: { key: OutputKey; label: string; description: string }[] = [
  { key: "website", label: "Website", description: "Public world page" },
  { key: "journal", label: "Journal", description: "Recent lived time" },
  { key: "memories", label: "Memories", description: "Emotional anchors" },
  { key: "project", label: "Project", description: "Active work" },
  { key: "avatar", label: "3D Avatar", description: "Body and props" },
  { key: "chat", label: "Chat", description: "Talk to them" },
  { key: "trace", label: "Life Trace", description: "Inspectable build" },
];

const relationshipOptions: {
  key: RelationshipMode;
  label: string;
  blurb: string;
  icon: typeof User;
  quickPrompts: (name: string, project: string, city: string) => string[];
}[] = [
  {
    key: "friend",
    label: "Friend",
    blurb: "Casual, emotional companion",
    icon: Heart,
    quickPrompts: (name, project) => [
      `How are you feeling about ${project} today?`,
      `What made you smile this week?`,
      `Tell me about your favourite place`,
      `What's stressing you out right now?`,
    ],
  },
  {
    key: "assistant",
    label: "Personal Assistant",
    blurb: "Plans, organises, summarises",
    icon: NotebookPen,
    quickPrompts: (name, project) => [
      `Create a 3-day sprint plan for ${project}`,
      `Summarise my journal into a weekly update`,
      `Draft a launch note for ${project}`,
      `What should I focus on tomorrow?`,
    ],
  },
  {
    key: "muse",
    label: "Creative Muse",
    blurb: "Brainstorm, write, critique",
    icon: Lightbulb,
    quickPrompts: (name, project, city) => [
      `Give me 5 scene ideas set in ${city}`,
      `Write a short vignette in your voice`,
      `What mechanic would make ${project} unforgettable?`,
      `Describe one world detail I haven't seen yet`,
    ],
  },
  {
    key: "npc",
    label: "Game NPC",
    blurb: "Lore, quests, dialogue",
    icon: Gamepad2,
    quickPrompts: (name) => [
      `Write dialogue for when the player first meets you`,
      `Give me three side-quests you'd offer`,
      `What's the secret you'd reveal at level 5?`,
      `Describe your room as a level`,
    ],
  },
  {
    key: "guide",
    label: "Dream Guide",
    blurb: "Feelings → stories, rituals, spaces",
    icon: Compass,
    quickPrompts: (name) => [
      `Turn the feeling "restless" into a room`,
      `Give me a small ritual for closing a long day`,
      `What would a garden of my decisions look like?`,
      `Write a tiny story about letting go`,
    ],
  },
  {
    key: "operator",
    label: "Startup Operator",
    blurb: "Launch plans, sprints, strategy",
    icon: Rocket,
    quickPrompts: (name, project) => [
      `Draft a launch plan for ${project}`,
      `What's the one KPI to watch this week?`,
      `Write a crisp one-pager for investors`,
      `Name three risks we're not taking seriously`,
    ],
  },
  {
    key: "coach",
    label: "Coach",
    blurb: "Reflect, plan, improve",
    icon: Target,
    quickPrompts: (name) => [
      `What's one thing I avoided this week?`,
      `Help me set one focus for tomorrow`,
      `Reframe my last setback in two sentences`,
      `Ask me a question I'm not asking myself`,
    ],
  },
];

const avatarOptions: { key: AvatarMode; label: string }[] = [
  { key: "stylized", label: "Stylized" },
  { key: "cinematic", label: "Cinematic" },
  { key: "minimal", label: "Minimal" },
];

const howItWorksSteps = [
  { label: "Describe", detail: "One paragraph" },
  { label: "Agents build", detail: "7 Codex agents" },
  { label: "Inhabit", detail: "Website, journal, 3D" },
  { label: "Assign tasks", detail: "Artifacts & trace" },
];

export default function Home() {
  const [step, setStep] = useState<"create" | "manifest" | "inhabit">("create");
  const [activeAgent, setActiveAgent] = useState(0);
  const [seed, setSeed] = useState(defaultSeed);
  const [manifestSeed, setManifestSeed] = useState(defaultSeed);
  const [character, setCharacter] = useState<MayaCharacter>(arjun);
  const [manifestOptions, setManifestOptions] = useState<ManifestOptions>({
    outputs: ["website", "journal", "memories", "project", "avatar", "chat", "trace"],
    relationshipMode: "friend",
    avatarMode: "stylized",
  });
  const [isManifesting, setIsManifesting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTasking, setIsTasking] = useState(false);
  const [artifacts, setArtifacts] = useState<MayaArtifact[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("website");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "maya",
      text: "Hey. I was just tuning puddle physics for Monsoon Run. What did you want to ask?",
    },
  ]);
  const [input, setInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [voicePref, setVoicePref] = useState<VoicePreference>("off");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | null>(null);
  const spokenRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const { voices, speaking, speak, cancel: cancelSpeak } = useSpeechSynthesis();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("maya-voice-pref");
      if (saved === "female" || saved === "male" || saved === "off") {
        setVoicePref(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("maya-voice-pref", voicePref);
    } catch {
      // ignore
    }
    if (voicePref === "off") cancelSpeak();
  }, [voicePref, cancelSpeak]);

  const activeRelationship = useMemo(
    () =>
      relationshipOptions.find((r) => r.key === (character.relationshipMode || manifestOptions.relationshipMode)) ||
      relationshipOptions[0],
    [character.relationshipMode, manifestOptions.relationshipMode],
  );

  const agents = useMemo(
    () =>
      character.lifeTrace.map((trace, index) => ({
        ...trace,
        icon: agentIcons[index] ?? Code2,
      })),
    [character.lifeTrace],
  );

  const demoPrompts = useMemo(
    () => activeRelationship.quickPrompts(character.name, character.project.name, character.city),
    [activeRelationship, character.name, character.project.name, character.city],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    if (step !== "manifest") return;

    setActiveAgent(0);

    const interval = window.setInterval(() => {
      setActiveAgent((value) => {
        if (value >= agents.length) {
          window.clearInterval(interval);
          window.setTimeout(() => setStep("inhabit"), 900);
          return value;
        }
        return value + 1;
      });
    }, 700);

    return () => window.clearInterval(interval);
  }, [step, agents.length]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, isSending]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!mountedRef.current) {
      spokenRef.current = last?.text ?? null;
      mountedRef.current = true;
      return;
    }
    if (voicePref === "off") return;
    if (!last || last.role !== "maya") return;
    if (spokenRef.current === last.text) return;
    spokenRef.current = last.text;
    const voice = pickVoice(voices, voicePref);
    speak(last.text, voice);
  }, [messages, voicePref, voices, speak]);

  const speakText = useCallback(
    (text: string) => {
      const voice = pickVoice(voices, voicePref === "off" ? "female" : voicePref);
      speak(text, voice);
    },
    [voices, voicePref, speak],
  );

  async function manifestCharacter() {
    const nextSeed = seed.trim() || defaultSeed;
    setManifestSeed(nextSeed);
    setStep("manifest");
    setIsManifesting(true);

    try {
      const response = await fetch("/api/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: nextSeed, options: manifestOptions }),
      });
      const data = await response.json();
      const nextCharacter: MayaCharacter = {
        ...(data.character as MayaCharacter),
        relationshipMode:
          (data.character as MayaCharacter).relationshipMode || manifestOptions.relationshipMode,
      };
      setCharacter(nextCharacter);
      setArtifacts(nextCharacter.artifacts);
      const relationship = relationshipOptions.find((r) => r.key === nextCharacter.relationshipMode);
      setMessages([
        {
          role: "maya",
          text: `Hey. I am ${nextCharacter.name}. MAYA just built my world${
            relationship ? `, and I am set up as your ${relationship.label.toLowerCase()}` : ""
          }. Ask me about ${nextCharacter.project.name}, my journal, or what I can make for you.`,
        },
      ]);
    } catch {
      const fallback: MayaCharacter = {
        ...arjun,
        relationshipMode: manifestOptions.relationshipMode,
      };
      setCharacter(fallback);
      setArtifacts(arjun.artifacts);
      setMessages([
        {
          role: "maya",
          text: "The manifest route slipped, so MAYA loaded Arjun as the safe demo life. Ask me about Monsoon Run.",
        },
      ]);
    } finally {
      setIsManifesting(false);
    }
  }

  async function sendMessage(message = input) {
    if (!message.trim() || isSending) return;

    const nextInput = message;
    setInput("");
    setMessages((current) => [...current, { role: "you", text: nextInput }]);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: nextInput,
          character,
          relationshipMode: character.relationshipMode || manifestOptions.relationshipMode,
        }),
      });
      const data = await response.json();
      setMessages((current) => [...current, { role: "maya", text: data.reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "maya",
          text: "My local context tripped over a puddle. Try that again in a second.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function runTask(task: string) {
    if (isTasking) return;

    setIsTasking(true);
    setActiveTab("work");
    try {
      const response = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character, task }),
      });
      const data = await response.json();
      const artifact = data.artifact as MayaArtifact;
      const lifeTraceEvent = data.lifeTraceEvent as MayaCharacter["lifeTrace"][number];

      setArtifacts((current) => [artifact, ...current]);
      setCharacter((current) => ({
        ...current,
        artifacts: [artifact, ...current.artifacts],
        lifeTrace: [...current.lifeTrace, lifeTraceEvent],
      }));
      setMessages((current) => [
        ...current,
        { role: "you", text: task },
        {
          role: "maya",
          text: `I made an artifact: ${artifact.title}. Saved in my world and recorded in Life Trace.`,
        },
      ]);
      showToast(`Artifact saved · Trace updated`);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "maya",
          text: "The Task Agent slipped on a wet floor. Try again in a second.",
        },
      ]);
    } finally {
      setIsTasking(false);
    }
  }

  function resetToCreate() {
    setStep("create");
    setArtifacts(character.artifacts);
    setActiveTab("website");
  }

  function exportCharacter() {
    const blob = new Blob([JSON.stringify(character, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${character.slug}-maya-life.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${character.slug}-maya-life.json`);
  }

  async function shareCharacter() {
    const text = `${character.name} — ${character.role} in ${character.city}. A Codex-built life on MAYA.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `MAYA · ${character.name}`, text, url: window.location.href });
        showToast("Shared");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      showToast("MAYA link copied");
    } catch {
      showToast("Could not share — copied to clipboard instead");
    }
  }

  return (
    <main className="min-h-screen px-5 py-6 md:px-10">
      <TopNav step={step} onHome={resetToCreate} />

      {step === "create" && (
        <CreateStep
          seed={seed}
          setSeed={setSeed}
          options={manifestOptions}
          setOptions={setManifestOptions}
          isManifesting={isManifesting}
          onManifest={manifestCharacter}
        />
      )}



      {step === "manifest" && (
        <ManifestStep
          character={character}
          manifestSeed={manifestSeed}
          agents={agents}
          activeAgent={activeAgent}
          relationship={activeRelationship}
        />
      )}

      {step === "inhabit" && (
        <InhabitStep
          character={character}
          artifacts={artifacts}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          messages={messages}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isSending={isSending}
          isTasking={isTasking}
          demoPrompts={demoPrompts}
          chatScrollRef={chatScrollRef}
          runTask={runTask}
          onReset={resetToCreate}
          onExport={exportCharacter}
          onShare={shareCharacter}
          relationship={activeRelationship}
          avatarMode={manifestOptions.avatarMode}
          outputs={manifestOptions.outputs}
          voicePref={voicePref}
          setVoicePref={setVoicePref}
          speaking={speaking}
          cancelSpeak={cancelSpeak}
          speakText={speakText}
        />
      )}

      {toast && (
        <div className="toast pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
          <div className="glass pointer-events-auto flex items-center gap-2.5 rounded-full border border-[#9fb07f]/40 bg-[#9fb07f]/[0.12] px-5 py-3 text-[13px] text-[#f7ead2] shadow-2xl shadow-black/40 backdrop-blur-xl">
            <Check size={14} className="text-[#9fb07f]" />
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}

function TopNav({
  step,
  onHome,
}: {
  step: "create" | "manifest" | "inhabit";
  onHome: () => void;
}) {
  const statusLabel =
    step === "create" ? "ready" : step === "manifest" ? "manifesting" : "inhabiting";
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between py-1">
      <button
        onClick={onHome}
        className="group flex items-center gap-3.5 rounded-2xl pr-4 text-left transition hover:bg-white/[0.035]"
        aria-label="Go home"
      >
        <div className="relative grid size-10 place-items-center rounded-xl border border-[#f5a45d]/35 bg-gradient-to-br from-[#f5a45d]/20 to-[#c97b36]/10 shadow-[0_0_30px_-5px_rgba(245,164,93,0.4)]">
          <Sparkles size={16} className="text-[#f5a45d]" />
        </div>
        <div>
          <p className="font-display text-[19px] font-medium tracking-[0.32em] transition group-hover:text-[#f5a45d]">
            MAYA
          </p>
          <p className="font-mono text-[10px] uppercase tracking-label text-[#8f7f64]">
            {step === "create" ? "Codex-built lives" : "Back to create"}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-2 md:gap-3">
        {step !== "create" && (
          <button
            onClick={onHome}
            className="rounded-full border border-[#f5a45d]/25 bg-[#f5a45d]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-label text-[#f5a45d] transition hover:border-[#f5a45d]/60 hover:bg-[#f5a45d]/15 md:px-3.5 md:text-[11px]"
          >
            New life
          </button>
        )}
        <span className="chip hidden sm:inline-flex" style={{ color: "var(--paper-soft)" }}>
          <span className="live-dot" />
          {statusLabel}
        </span>
        <span className="chip hidden md:inline-flex">Hackathon · 2026</span>
      </div>
    </header>
  );
}

function CreateStep({
  seed,
  setSeed,
  options,
  setOptions,
  isManifesting,
  onManifest,
}: {
  seed: string;
  setSeed: (v: string) => void;
  options: ManifestOptions;
  setOptions: React.Dispatch<React.SetStateAction<ManifestOptions>>;
  isManifesting: boolean;
  onManifest: () => void;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const orbAmberRef = useRef<HTMLDivElement>(null);
  const orbMossRef = useRef<HTMLDivElement>(null);
  const seedColumnRef = useRef<HTMLDivElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useCaseIndex, setUseCaseIndex] = useState(0);

  const {
    supported: micSupported,
    listening: seedListening,
    start: seedStart,
    stop: seedStop,
  } = useSpeechRecognition({
    onResult: (text) => {
      const clean = text.trim();
      if (!clean) return;
      const next = seed.trim() ? `${seed.trim()} ${clean}` : clean;
      setSeed(next.slice(0, 500));
    },
  });

  useEffect(() => {
    const id = window.setInterval(() => {
      setUseCaseIndex((current) => (current + 1) % relationshipOptions.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    let pending = false;
    let latest = { x: 0, y: 0, cx: 0, cy: 0 };

    function apply() {
      pending = false;
      const { x, y, cx, cy } = latest;
      if (orbAmberRef.current) {
        orbAmberRef.current.style.transform = `translate3d(${x * -30}px, ${y * -20}px, 0)`;
      }
      if (orbMossRef.current) {
        orbMossRef.current.style.transform = `translate3d(${x * 22}px, ${y * 28}px, 0)`;
      }
      if (seedColumnRef.current) {
        seedColumnRef.current.style.transform = `translate3d(${x * 8}px, ${y * 5}px, 0)`;
      }
      const btn = ctaRef.current;
      if (btn) {
        const br = btn.getBoundingClientRect();
        const dist = Math.hypot(cx - (br.left + br.width / 2), cy - (br.top + br.height / 2));
        if (dist < 160) {
          const mx = (cx - (br.left + br.width / 2)) * 0.14;
          const my = (cy - (br.top + br.height / 2)) * 0.14;
          btn.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        } else {
          btn.style.transform = "translate3d(0, 0, 0)";
        }
      }
    }

    function onMove(event: MouseEvent) {
      const rect = heroRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      latest = {
        x: (event.clientX - cx) / rect.width,
        y: (event.clientY - cy) / rect.height,
        cx: event.clientX,
        cy: event.clientY,
      };
      if (!pending) {
        pending = true;
        raf = requestAnimationFrame(apply);
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const activeRelationship = relationshipOptions.find((r) => r.key === options.relationshipMode)!;
  const rotatingUseCase = relationshipOptions[useCaseIndex];

  function toggleOutput(output: OutputKey) {
    setOptions((current) => {
      const hasOutput = current.outputs.includes(output);
      if (hasOutput && current.outputs.length === 1) return current;
      return {
        ...current,
        outputs: hasOutput
          ? current.outputs.filter((item) => item !== output)
          : [...current.outputs, output],
      };
    });
  }

  return (
    <section
      ref={heroRef}
      className="mx-auto grid max-w-7xl items-start gap-10 py-10 md:gap-14 md:py-16 lg:grid-cols-[1.05fr_0.95fr]"
    >
      <div className="relative">
        <div
          ref={orbAmberRef}
          className="orb-bokeh -left-20 -top-10 size-[28rem] animate-drift"
          style={{ background: "radial-gradient(circle, rgba(245,164,93,0.5), transparent 65%)" }}
        />
        <div
          ref={orbMossRef}
          className="orb-bokeh left-[26%] top-[42%] size-72 opacity-75"
          style={{ background: "radial-gradient(circle, rgba(159,176,127,0.42), transparent 65%)" }}
        />

        <div className="relative animate-rise">
          <span className="chip">
            <span className="live-dot" />
            Codex hackathon · demo
          </span>
          <h1 className="hero-title letter-rise mt-8 text-[clamp(2.6rem,4.8vw,4.6rem)] font-light">
            <span className="line">Describe a person.</span>
            <span className="line ember-anim italic">Codex builds</span>
            <span className="line">their world.</span>
          </h1>
          <p
            className="animate-fade mt-8 max-w-xl text-[18px] leading-[1.7] text-[#e6d4b0]"
            style={{ animationDelay: "0.8s" }}
          >
            Describe someone. MAYA builds their world, memories, project, voice, and abilities.
          </p>

          <div
            className="animate-fade mt-5 flex max-w-xl flex-wrap items-center gap-x-3 gap-y-1 text-[15.5px] text-[#c9b998]"
            style={{ animationDelay: "1s" }}
          >
            <span className="text-[#a39378]">Use them as a</span>
            <span
              key={rotatingUseCase.key}
              className="animate-rise inline-flex items-center gap-2 font-display text-[18px] italic text-[#f5a45d]"
            >
              <rotatingUseCase.icon size={15} />
              {rotatingUseCase.label.toLowerCase()}
            </span>
            <span className="text-[#a39378]">· {rotatingUseCase.blurb.toLowerCase()}</span>
          </div>

          <ol
            className="animate-fade mt-9 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4"
            style={{ animationDelay: "1.15s" }}
          >
            {howItWorksSteps.map((step, index) => (
              <li key={step.label} className="glass-soft rounded-xl px-3 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-label text-[#f5a45d]">
                  {`0${index + 1}`}
                </span>
                <p className="mt-1 font-display text-[15px] text-[#f7ead2]">{step.label}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-[#8f7f64]">{step.detail}</p>
              </li>
            ))}
          </ol>

          <div
            className="animate-fade mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "1.35s" }}
          >
            <button
              ref={ctaRef}
              onClick={onManifest}
              disabled={isManifesting}
              className="magnetic-cta group inline-flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#ffd3a0] via-[#f5a45d] to-[#c97b36] px-7 py-4 text-[15px] font-semibold text-[#0a0806] shadow-[0_20px_60px_-20px_rgba(245,164,93,0.6)] transition-shadow hover:shadow-[0_30px_100px_-20px_rgba(245,164,93,0.85)] disabled:opacity-70"
            >
              <Sparkles size={16} />
              {isManifesting ? "Manifesting…" : "Manifest Life"}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <span className="font-mono text-[11px] uppercase tracking-label text-[#8f7f64]">
              7 agents · ~5 seconds · inspectable
            </span>
          </div>
        </div>
      </div>

      <div
        ref={seedColumnRef}
        className="animate-rise relative will-change-transform"
        style={{ animationDelay: "0.3s" }}
      >
        <div
          className="orb-bokeh -right-16 top-16 size-80 opacity-60"
          style={{ background: "radial-gradient(circle, rgba(245,164,93,0.38), transparent 65%)" }}
        />
        <div className="glass panel-grain relative rounded-3xl p-1.5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)]">
          <div className="relative rounded-[22px] bg-[#100c08]/70 p-6 md:p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-label text-[#a39378]">
                Character Seed
              </span>
              <div className="flex items-center gap-2">
                {micSupported && (
                  <button
                    type="button"
                    onClick={seedListening ? seedStop : seedStart}
                    aria-label={seedListening ? "Stop recording" : "Speak your seed"}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-label transition ${
                      seedListening
                        ? "border-[#f5a45d]/60 bg-[#f5a45d]/15 text-[#f5a45d] shadow-[0_0_18px_0_rgba(245,164,93,0.4)]"
                        : "hairline bg-white/[0.04] text-[#c9b998] hover:border-[#f5a45d]/40 hover:text-[#f5a45d]"
                    }`}
                  >
                    {seedListening ? (
                      <>
                        <Square size={9} fill="currentColor" /> Listening
                      </>
                    ) : (
                      <>
                        <Mic size={10} /> Speak seed
                      </>
                    )}
                  </button>
                )}
                <span className="font-mono text-[11px] text-[#8f7f64]">{seed.length} / 500</span>
              </div>
            </div>
            <textarea
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              maxLength={500}
              placeholder={
                seedListening ? "Listening…" : "Describe the person. Codex builds the rest."
              }
              className="scrollbar-thin mt-5 min-h-[200px] w-full resize-none bg-transparent font-display text-[22px] leading-[1.55] text-[#f7ead2] outline-none placeholder:text-[#554733]"
            />
            <div className="mt-5 border-t hairline pt-5">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-label text-[#a39378]">
                Quick seeds
              </p>
              <div className="grid gap-2">
                {demoSeeds.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSeed(preset)}
                    className="rounded-xl border hairline bg-white/[0.02] px-4 py-3 text-left text-[13px] leading-[1.55] text-[#c9b998] transition hover:border-[#f5a45d]/40 hover:bg-[#f5a45d]/[0.05] hover:text-[#f7ead2]"
                  >
                    <span className="font-display text-[14px] text-[#f7ead2]">
                      {preset.split(",")[0]?.trim()}
                    </span>
                    <span className="ml-2 text-[#8f7f64]">
                      {preset.split(",").slice(1, 3).join(",").trim()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="glass-soft rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-label text-[#a39378]">
                Relationship mode
              </p>
              <span className="font-mono text-[10px] uppercase tracking-label text-[#9fb07f]">
                {activeRelationship.label}
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-snug text-[#8f7f64]">
              How will you use this person? MAYA tunes voice, prompts, and task output to match.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {relationshipOptions.map((relationship) => {
                const Icon = relationship.icon;
                const active = relationship.key === options.relationshipMode;
                return (
                  <button
                    key={relationship.key}
                    type="button"
                    onClick={() =>
                      setOptions((current) => ({ ...current, relationshipMode: relationship.key }))
                    }
                    className={`group/rel flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-[#f5a45d]/50 bg-[#f5a45d]/[0.08] text-[#f7ead2] shadow-[0_14px_40px_-18px_rgba(245,164,93,0.55)]"
                        : "hairline bg-white/[0.02] text-[#c9b998] hover:border-[#f5a45d]/30 hover:bg-[#f5a45d]/[0.04]"
                    }`}
                  >
                    <div
                      className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg transition ${
                        active ? "bg-[#f5a45d]/20 text-[#f5a45d]" : "bg-white/[0.04] text-[#8f7f64]"
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-[14px] leading-tight">{relationship.label}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-[#8f7f64]">
                        {relationship.blurb}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          className="mt-4 flex w-full items-center justify-between rounded-xl border hairline bg-white/[0.02] px-4 py-3 text-left transition hover:border-[#f5a45d]/30 hover:bg-[#f5a45d]/[0.04]"
        >
          <div>
            <span className="font-mono text-[11px] uppercase tracking-label text-[#a39378]">
              Advanced · demo controls
            </span>
            <p className="mt-0.5 text-[12px] text-[#8f7f64]">
              Pick which modules MAYA builds and avatar style.
            </p>
          </div>
          <ChevronDown
            size={16}
            className={`text-[#8f7f64] transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
        </button>

        {showAdvanced && (
          <div className="animate-fade mt-3 space-y-3">
            <div className="glass-soft rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-label text-[#a39378]">
                  Build modules
                </p>
                <span className="font-mono text-[10px] uppercase tracking-label text-[#8f7f64]">
                  {options.outputs.length} selected
                </span>
              </div>
              <p className="mt-1.5 text-[11.5px] text-[#8f7f64]">
                Turn modules off to keep the demo lean. Core (identity + chat) always ships.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {outputOptions.map((item) => {
                  const active = options.outputs.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleOutput(item.key)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? "border-[#f5a45d]/45 bg-[#f5a45d]/10 text-[#f7ead2]"
                          : "hairline bg-white/[0.02] text-[#8f7f64] hover:text-[#decaa6]"
                      }`}
                    >
                      <span className="block font-display text-[14px] leading-tight">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-[10.5px] leading-snug text-[#8f7f64]">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass-soft rounded-2xl p-5">
              <p className="font-mono text-[11px] uppercase tracking-label text-[#a39378]">
                Avatar style
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {avatarOptions.map((item) => {
                  const active = item.key === options.avatarMode;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setOptions((current) => ({ ...current, avatarMode: item.key }))
                      }
                      className={`rounded-xl border px-3 py-2.5 text-center font-display text-[14px] transition ${
                        active
                          ? "border-[#f5a45d]/45 bg-[#f5a45d]/10 text-[#f7ead2]"
                          : "hairline bg-white/[0.02] text-[#8f7f64] hover:text-[#decaa6]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function extractSeedName(seed: string) {
  const first = seed
    .split(/[,\n]/)[0]
    .trim()
    .split(/\s+/)
    .find((token) => /^[A-Za-z][A-Za-z'-]{1,}$/.test(token));
  return first || "this life";
}

function ManifestStep({
  character,
  manifestSeed,
  agents,
  activeAgent,
  relationship,
}: {
  character: MayaCharacter;
  manifestSeed: string;
  agents: {
    agent: string;
    artifact: string;
    detail: string;
    status: string;
    icon: typeof User;
  }[];
  activeAgent: number;
  relationship: (typeof relationshipOptions)[number];
}) {
  const pct = Math.min((activeAgent / agents.length) * 100, 100);
  const placeholderName = extractSeedName(manifestSeed);
  const displayName =
    activeAgent >= agents.length && character.seed === manifestSeed
      ? character.name
      : placeholderName;

  return (
    <section className="mx-auto max-w-7xl py-12">
      <div className="text-center">
        <span className="chip">
          <Loader2 size={12} className="animate-spin text-[#f5a45d]" />
          Manifesting · {relationship.label}
        </span>
        <h2 className="hero-title mt-5 text-4xl md:text-6xl">
          Codex is building <span className="ember-anim italic">{displayName}</span>.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-[1.8] text-[#a39378]">
          {manifestSeed}
        </p>
        <div className="mx-auto mt-10 flex max-w-2xl items-center gap-4">
          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f5a45d] to-[#c97b36] shadow-[0_0_12px_0_rgba(245,164,93,0.7)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-xs text-[#a39378]">
            {Math.min(activeAgent, agents.length)} / {agents.length}
          </span>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative flex min-h-[460px] items-center justify-center">
          <div className="ember-glow-blob absolute inset-10" />

          <div
            className="absolute left-1/2 top-1/2 size-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full border hairline"
            style={{ animation: "orbit-cw 48s linear infinite" }}
          >
            {agents.map((a, i) => {
              const angle = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
              const r = 230;
              const x = Math.cos(angle) * r + r;
              const y = Math.sin(angle) * r + r;
              const done = i < activeAgent;
              const working = i === activeAgent;
              return (
                <div
                  key={a.agent}
                  className={`absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition ${
                    done
                      ? "bg-[#9fb07f] shadow-[0_0_12px_0_rgba(159,176,127,0.7)]"
                      : working
                        ? "bg-[#f5a45d] shadow-[0_0_16px_0_rgba(245,164,93,0.85)]"
                        : "bg-white/20"
                  }`}
                  style={{ left: `${x}px`, top: `${y}px` }}
                />
              );
            })}
          </div>
          <div
            className="absolute left-1/2 top-1/2 size-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border hairline"
            style={{ animation: "orbit-ccw 36s linear infinite" }}
          />
          <div className="absolute left-1/2 top-1/2 size-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed hairline-strong" />

          <div className="relative">
            <div className="absolute inset-0 -m-8 rounded-full bg-[#f5a45d]/25 blur-3xl" />
            <div className="animate-breathe relative grid size-40 place-items-center rounded-full bg-gradient-to-br from-[#ffd3a0] via-[#f5a45d] to-[#c97b36] shadow-[0_0_80px_10px_rgba(245,164,93,0.5)]">
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/25 via-transparent to-transparent" />
              <Sparkles size={40} className="relative text-[#0a0806]" />
            </div>
            <div className="absolute inset-0 animate-pulse-ring rounded-full border border-[#f5a45d]/40" />
          </div>
        </div>

        <div className="space-y-3">
          {agents.map((agent, i) => {
            const complete = i < activeAgent;
            const working = i === activeAgent;
            const Icon = agent.icon;
            return (
              <div
                key={agent.agent}
                className={`relative rounded-2xl border p-5 transition-all duration-500 ${
                  complete
                    ? "border-[#9fb07f]/25 bg-[#9fb07f]/[0.06]"
                    : working
                      ? "border-[#f5a45d]/50 bg-[#f5a45d]/[0.08] shadow-[0_20px_60px_-20px_rgba(245,164,93,0.45)]"
                      : "hairline bg-white/[0.02] opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                      complete
                        ? "bg-[#9fb07f]/15 text-[#9fb07f]"
                        : working
                          ? "bg-[#f5a45d]/20 text-[#f5a45d]"
                          : "bg-white/[0.04] text-[#8f7f64]"
                    }`}
                  >
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-[18px] leading-tight">
                        {agent.agent}
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-label text-[#a39378]">
                        {complete ? "done" : working ? "running" : "queued"}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-[1.65] text-[#c9b998]">
                      {complete
                        ? agent.artifact
                        : working
                          ? "Writing files · shaping memory · preparing context"
                          : "Waiting for worker slot."}
                    </p>
                    {working && (
                      <div className="mt-3 h-[2px] w-full overflow-hidden rounded bg-white/10">
                        <div className="shimmer-bar h-full w-full" />
                      </div>
                    )}
                  </div>
                  {complete && <Check size={16} className="shrink-0 text-[#9fb07f]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function InhabitStep({
  character,
  artifacts,
  activeTab,
  setActiveTab,
  messages,
  input,
  setInput,
  sendMessage,
  isSending,
  isTasking,
  demoPrompts,
  chatScrollRef,
  runTask,
  onReset,
  onExport,
  onShare,
  relationship,
  avatarMode,
  outputs,
  voicePref,
  setVoicePref,
  speaking,
  cancelSpeak,
  speakText,
}: {
  character: MayaCharacter;
  artifacts: MayaArtifact[];
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  sendMessage: (m?: string) => void;
  isSending: boolean;
  isTasking: boolean;
  demoPrompts: string[];
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  runTask: (task: string) => void;
  onReset: () => void;
  onExport: () => void;
  onShare: () => void;
  relationship: (typeof relationshipOptions)[number];
  avatarMode: AvatarMode;
  outputs: OutputKey[];
  voicePref: VoicePreference;
  setVoicePref: (pref: VoicePreference) => void;
  speaking: boolean;
  cancelSpeak: () => void;
  speakText: (text: string) => void;
}) {
  const primaryTask = character.taskSkills[0];
  const latestTrace = character.lifeTrace.at(-1);

  const tabEnabled: Record<TabId, boolean> = {
    website: outputs.includes("website"),
    life: outputs.includes("journal") || outputs.includes("memories"),
    work: outputs.includes("project"),
    trace: outputs.includes("trace"),
  };
  const visibleTabs = tabs.filter((tab) => tabEnabled[tab.id]);

  useEffect(() => {
    if (!tabEnabled[activeTab] && visibleTabs[0]) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTab, tabEnabled, visibleTabs, setActiveTab]);

  return (
    <section className="animate-fade mx-auto max-w-7xl space-y-5 py-6">
      <HeroStrip
        character={character}
        onReset={onReset}
        onExport={onExport}
        onShare={onShare}
        relationship={relationship}
        avatarMode={avatarMode}
      />

      <NextBestAction
        character={character}
        artifacts={artifacts}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        runTask={runTask}
        isTasking={isTasking}
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-5">
          <div className="glass panel-grain flex items-center gap-1.5 rounded-2xl p-1.5">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                    active
                      ? "bg-gradient-to-br from-[#f5a45d]/20 to-[#f5a45d]/5 text-[#f7ead2] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-[#a39378] hover:text-[#decaa6]"
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {activeTab === "website" && <WebsitePanel character={character} />}
          {activeTab === "life" && <LifePanel character={character} />}
          {activeTab === "work" && (
            <WorkPanel
              character={character}
              artifacts={artifacts}
              runTask={runTask}
              isTasking={isTasking}
              latestTrace={latestTrace}
              onOpenTrace={() => setActiveTab("trace")}
            />
          )}
          {activeTab === "trace" && <TracePanel character={character} />}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <ChatPanel
            character={character}
            messages={messages}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            isSending={isSending}
            demoPrompts={demoPrompts}
            chatScrollRef={chatScrollRef}
            relationship={relationship}
            onRunTask={primaryTask ? () => runTask(primaryTask.prompt) : undefined}
            primaryTaskLabel={primaryTask?.label}
            isTasking={isTasking}
            voicePref={voicePref}
            setVoicePref={setVoicePref}
            speaking={speaking}
            cancelSpeak={cancelSpeak}
            speakText={speakText}
          />
        </aside>
      </div>
    </section>
  );
}

function NextBestAction({
  character,
  artifacts,
  activeTab,
  setActiveTab,
  runTask,
  isTasking,
}: {
  character: MayaCharacter;
  artifacts: MayaArtifact[];
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  runTask: (task: string) => void;
  isTasking: boolean;
}) {
  const primaryTask = character.taskSkills[0];

  if (artifacts.length === 0 && primaryTask) {
    return (
      <div className="glass panel-grain animate-rise relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border-[#f5a45d]/30 bg-gradient-to-br from-[#f5a45d]/[0.1] via-[#f5a45d]/[0.04] to-transparent p-5 md:flex-row md:items-center md:gap-5 md:p-6">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f5a45d]/20 text-[#f5a45d]">
          <Wand2 size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-label text-[#f5a45d]">
            Next · best action
          </p>
          <p className="mt-1 font-display text-[18px] leading-snug text-[#f7ead2] md:text-[20px]">
            Ask {character.name} to {primaryTask.label.toLowerCase()}.
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-[#a39378]">
            Proves the product loop: talk → task → artifact → Life Trace update.
          </p>
        </div>
        <button
          onClick={() => runTask(primaryTask.prompt)}
          disabled={isTasking}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-[#ffd3a0] via-[#f5a45d] to-[#c97b36] px-5 py-3 text-[13px] font-semibold text-[#0a0806] shadow-[0_14px_40px_-14px_rgba(245,164,93,0.7)] transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70"
        >
          {isTasking ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Run it
          <ArrowRight size={13} />
        </button>
      </div>
    );
  }

  if (activeTab !== "trace") {
    return (
      <div className="glass panel-grain animate-rise relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border-[#9fb07f]/25 bg-gradient-to-br from-[#9fb07f]/[0.1] via-[#9fb07f]/[0.03] to-transparent p-5 md:flex-row md:items-center md:gap-5 md:p-6">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#9fb07f]/20 text-[#9fb07f]">
          <Layers size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-label text-[#9fb07f]">
            Trace · updated
          </p>
          <p className="mt-1 font-display text-[17px] leading-snug text-[#f7ead2] md:text-[19px]">
            See how MAYA made the latest artifact.
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-[#a39378]">
            {artifacts.length} saved · {character.lifeTrace.length} trace events
          </p>
        </div>
        <button
          onClick={() => setActiveTab("trace")}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#9fb07f]/40 bg-[#9fb07f]/10 px-5 py-3 text-[13px] font-semibold text-[#c9d6ae] transition hover:border-[#9fb07f]/70 hover:bg-[#9fb07f]/15"
        >
          Open Life Trace <ArrowRight size={13} />
        </button>
      </div>
    );
  }

  return null;
}

function useTypewriter(target: string, speed = 45) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(target.slice(0, i));
      if (i >= target.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [target, speed]);
  return typed;
}

function HeroStrip({
  character,
  onReset,
  onExport,
  onShare,
  relationship,
  avatarMode,
}: {
  character: MayaCharacter;
  onReset: () => void;
  onExport: () => void;
  onShare: () => void;
  relationship: (typeof relationshipOptions)[number];
  avatarMode: AvatarMode;
}) {
  const typedName = useTypewriter(character.name, 62);
  const RelIcon = relationship.icon;
  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="glass panel-grain relative overflow-hidden rounded-3xl">
        <AvatarStage
          character={character}
          size="hero"
          avatarMode={avatarMode}
          relationshipMode={relationship.key}
        />
        <div className="pointer-events-none absolute bottom-5 right-5 z-10">
          <div className="glass flex items-center gap-3 rounded-2xl px-3 py-2 backdrop-blur">
            <div className="relative size-11 overflow-hidden rounded-xl border border-[#f5a45d]/35 bg-[#0a0806]">
              <img
                src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(character.slug)}&backgroundColor=1f1812,27221b`}
                alt={`${character.name} portrait`}
                className="size-full object-cover"
              />
            </div>
            <div className="leading-tight">
              <p className="font-display text-[13px] text-[#f7ead2]">{character.name}</p>
              <p className="font-mono text-[9px] uppercase tracking-label text-[#8f7f64]">
                portrait · dicebear
              </p>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute left-5 right-5 top-5 z-10 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#9fb07f]/30 bg-[#9fb07f]/15 px-3 py-1 text-[10px] uppercase tracking-label text-[#c9d6ae] backdrop-blur">
            <span className="live-dot" />
            Avatar · compiled
          </span>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border hairline bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-label text-[#decaa6] backdrop-blur">
            {character.avatar.traits.slice(0, 3).join(" · ")}
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border hairline bg-black/45 px-3 py-1 font-mono text-[10px] uppercase tracking-label text-[#8f7f64] backdrop-blur">
          Head tracks cursor · Three.js
        </div>
      </div>

      <div className="glass panel-grain relative rounded-3xl p-7 md:p-8">
        <div className="ember-glow-blob absolute -right-10 top-0 size-64 opacity-50" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-label text-[#9fb07f]">
              <span className="live-dot" />
              Life manifest · complete
            </span>
            <button
              onClick={onReset}
              className="relative z-10 inline-flex items-center gap-2 rounded-full border border-[#f5a45d]/25 bg-[#f5a45d]/10 px-4 py-2 text-[11px] uppercase tracking-label text-[#f5a45d] transition hover:border-[#f5a45d]/60 hover:bg-[#f5a45d]/15 hover:text-[#f7ead2]"
            >
              <RefreshCw size={11} /> Edit seed
            </button>
          </div>
          <h1 className="hero-title mt-7 text-5xl md:text-6xl">
            {typedName}
            {typedName.length < character.name.length && <span className="caret" />}
          </h1>
          <p className="mt-3 text-[14px] text-[#a39378]">
            {character.role}
            {character.age ? ` · ${character.age}` : ""} · {character.city}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#f5a45d]/30 bg-[#f5a45d]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-label text-[#f5a45d]">
            <RelIcon size={11} />
            Mode · {relationship.label}
          </div>
          <p className="mt-6 max-w-xl text-[16px] leading-[1.75] text-[#f7ead2]">
            {character.essence}
          </p>
          <div className="mt-7 grid grid-cols-2 gap-4 border-t hairline pt-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-label text-[#a39378]">
                Domain
              </p>
              <p className="mt-1.5 truncate font-mono text-[13px] text-[#decaa6]">
                {character.slug}.maya.local
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-label text-[#a39378]">
                Voice
              </p>
              <p className="mt-1.5 truncate text-[13px] text-[#decaa6]">
                {character.voice.split(".")[0]}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-xl border hairline bg-white/[0.03] px-3.5 py-2 text-[12px] text-[#decaa6] transition hover:border-[#f5a45d]/40 hover:bg-[#f5a45d]/[0.06] hover:text-[#f7ead2]"
            >
              <Download size={12} /> Export JSON
            </button>
            <button
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-xl border hairline bg-white/[0.03] px-3.5 py-2 text-[12px] text-[#decaa6] transition hover:border-[#f5a45d]/40 hover:bg-[#f5a45d]/[0.06] hover:text-[#f7ead2]"
            >
              <Share2 size={12} /> Share MAYA link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebsitePanel({ character }: { character: MayaCharacter }) {
  return (
    <div className="glass panel-grain relative overflow-hidden rounded-3xl">
      <div className="bg-gradient-to-br from-[#f7ead2] via-[#f1dfba] to-[#e6d0a4] p-7 text-[#1a130c] md:p-10">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-label text-[#7a6240]">
            {character.slug}.maya.local
          </span>
          <span className="font-mono text-[10px] uppercase tracking-label text-[#7a6240]">
            World Agent · v1
          </span>
        </div>
        <h2 className="mt-7 font-display text-4xl leading-[0.96] tracking-display md:text-5xl">
          {character.website.headline}
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-[#4f3b25]">
          {character.essence}
        </p>
        <img
          src="/monsoon-run.svg"
          alt={`${character.project.name} hero`}
          className="mt-8 aspect-[21/9] w-full rounded-2xl object-cover shadow-[0_30px_80px_-30px_rgba(0,0,0,0.4)]"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {character.website.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-[#d3bd91] bg-[#f3e2bf]/60 p-5 backdrop-blur"
            >
              <h3 className="font-display text-[20px]">{section.title}</h3>
              <p className="mt-3 text-[13px] leading-[1.7] text-[#4f3b25]">{section.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function LifePanel({ character }: { character: MayaCharacter }) {
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_0.9fr]">
      <SectionPanel title="Journal" badge="Journal Agent">
        {character.journal.map((entry, i) => (
          <article
            key={entry.title}
            className="animate-rise relative rounded-2xl border hairline bg-white/[0.025] p-5"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-label text-[#9fb07f]">
                {entry.date}
              </span>
              <BookOpenText size={13} className="text-[#8f7f64]" />
            </div>
            <h3 className="mt-3 font-display text-[22px] leading-tight">{entry.title}</h3>
            <p className="mt-3 text-[14px] leading-[1.75] text-[#c9b998]">{entry.body}</p>
          </article>
        ))}
      </SectionPanel>

      <SectionPanel title="Memories" badge="Memory Agent">
        {character.memories.map((memory, i) => (
          <article
            key={memory.title}
            className="animate-rise rounded-2xl border hairline bg-gradient-to-br from-[#f5a45d]/[0.06] to-transparent p-5"
            style={{ animationDelay: `${i * 80 + 120}ms` }}
          >
            <h3 className="font-display text-[18px]">{memory.title}</h3>
            <p className="mt-2.5 text-[13px] leading-[1.7] text-[#c9b998]">{memory.caption}</p>
          </article>
        ))}
      </SectionPanel>
    </div>
  );
}

function WorkPanel({
  character,
  artifacts,
  runTask,
  isTasking,
  latestTrace,
  onOpenTrace,
}: {
  character: MayaCharacter;
  artifacts: MayaArtifact[];
  runTask: (task: string) => void;
  isTasking: boolean;
  latestTrace?: MayaCharacter["lifeTrace"][number];
  onOpenTrace: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="glass panel-grain relative overflow-hidden rounded-3xl p-7 md:p-8">
        <div className="ember-glow-blob absolute -right-10 -top-10 size-64" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-label text-[#decaa6]">
              Current Project
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5a45d]/30 bg-[#f5a45d]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-label text-[#f5a45d]">
              {character.project.status.includes("Prototype") ? "prototype" : "concept"}
            </span>
          </div>
          <h2 className="hero-title mt-4 text-4xl md:text-5xl">{character.project.name}</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.8] text-[#c9b998]">
            {character.project.description}
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl border hairline bg-black/30">
            <div className="flex items-center justify-between border-b hairline bg-white/[0.02] px-5 py-3">
              <p className="font-mono text-[11px] uppercase tracking-label text-[#a39378]">
                Playable prompt
              </p>
              <div className="flex gap-1">
                <span className="size-2 rounded-full bg-[#f5a45d]/70" />
                <span className="size-2 rounded-full bg-[#9fb07f]/70" />
                <span className="size-2 rounded-full bg-white/15" />
              </div>
            </div>
            <div className="p-5">
              <p className="text-[14px] italic leading-[1.7] text-[#decaa6]">
                &ldquo;{character.project.playablePrompt}&rdquo;
              </p>
              <div className="relative mt-5 h-36 overflow-hidden rounded-xl border hairline bg-[#1f271d]">
                <div className="absolute inset-x-0 top-12 h-6 bg-[#46523c]" />
                <div className="absolute left-8 top-16 size-8 animate-drift rounded-lg bg-[#f5a45d]" />
                <div className="absolute left-24 top-[5.5rem] h-7 w-12 rounded-lg bg-[#7f6440]" />
                <div
                  className="absolute right-16 top-14 h-9 w-14 animate-drift rounded-lg bg-[#2c2117]"
                  style={{ animationDelay: "1.5s" }}
                />
                <div className="absolute bottom-5 left-1/2 h-10 w-6 -translate-x-1/2 rounded-lg bg-[#9fb07f]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SectionPanel title="Can do" badge="Task Agent">
        <div className="grid gap-3 md:grid-cols-3">
          {character.taskSkills.map((skill) => (
            <button
              key={skill.label}
              onClick={() => runTask(skill.prompt)}
              disabled={isTasking}
              className="group/task relative overflow-hidden rounded-2xl border hairline bg-white/[0.025] p-5 text-left transition hover:border-[#f5a45d]/50 hover:bg-[#f5a45d]/[0.05] disabled:cursor-wait disabled:opacity-60"
            >
              <span className="font-mono text-[10px] uppercase tracking-label text-[#a39378]">
                {skill.outputType}
              </span>
              <h3 className="mt-2 font-display text-[18px]">{skill.label}</h3>
              <p className="mt-2 text-[12.5px] leading-[1.65] text-[#c9b998]">{skill.prompt}</p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] uppercase tracking-label text-[#f5a45d] opacity-0 transition group-hover/task:opacity-100">
                {isTasking ? (
                  <>
                    <Loader2 size={11} className="animate-spin" /> Running…
                  </>
                ) : (
                  <>
                    Run task <ArrowRight size={11} />
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </SectionPanel>

      {latestTrace && artifacts.length > 0 && (
        <button
          onClick={onOpenTrace}
          className="flex w-full items-start gap-4 rounded-2xl border border-[#9fb07f]/25 bg-[#9fb07f]/[0.06] p-4 text-left transition hover:border-[#9fb07f]/50 hover:bg-[#9fb07f]/[0.1]"
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#9fb07f]/20 text-[#9fb07f]">
            <Layers size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-label text-[#9fb07f]">
              Latest trace event
            </p>
            <p className="mt-1 font-display text-[15px] text-[#f7ead2]">{latestTrace.agent}</p>
            <p className="mt-0.5 truncate text-[12px] text-[#a39378]">{latestTrace.artifact}</p>
          </div>
          <ArrowRight size={14} className="mt-1.5 shrink-0 text-[#9fb07f]" />
        </button>
      )}

      <SectionPanel title="Artifacts" badge={`${artifacts.length} saved`}>
        {artifacts.length === 0 ? (
          <div className="rounded-2xl border border-dashed hairline-strong p-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full border hairline bg-white/[0.03]">
              <Boxes size={18} className="text-[#8f7f64]" />
            </div>
            <p className="mt-4 text-[13px] leading-[1.65] text-[#a39378]">
              Ask {character.name} to do a task.
              <br />
              Saved outputs appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {artifacts.map((artifact, i) => (
              <article
                key={artifact.id}
                className="animate-rise relative overflow-hidden rounded-2xl border border-[#f5a45d]/25 bg-gradient-to-br from-[#f5a45d]/[0.08] to-transparent p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-label text-[#f5a45d]">
                    {artifact.type}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-label text-[#a39378]">
                    {artifact.createdBy}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[19px] leading-snug">{artifact.title}</h3>
                <div className="mt-3 space-y-2 text-[13px] leading-[1.7] text-[#c9b998]">
                  {artifact.content.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5 border-t hairline pt-4">
                  {artifact.usedContext.map((ctx) => (
                    <span
                      key={ctx}
                      className="rounded-full border hairline bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] uppercase tracking-label text-[#a39378]"
                    >
                      {ctx}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}

function TracePanel({ character }: { character: MayaCharacter }) {
  return (
    <SectionPanel title="Life Trace" badge="inspectable">
      <div className="space-y-3">
        {character.lifeTrace.map((trace, index) => {
          const Icon = agentIcons[index % agentIcons.length] ?? Code2;
          return (
            <div
              key={`${trace.agent}-${index}`}
              className="animate-rise relative flex gap-4 rounded-2xl border hairline bg-white/[0.02] p-5"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#f5a45d]/25 bg-[#f5a45d]/10 text-[#f5a45d]">
                <Icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-[17px]">{trace.agent}</h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9fb07f]/30 bg-[#9fb07f]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-label text-[#9fb07f]">
                    {trace.status}
                  </span>
                </div>
                <p className="mt-2 text-[13.5px] leading-[1.7] text-[#f7ead2]">{trace.artifact}</p>
                <p className="mt-2 text-[12.5px] leading-[1.7] text-[#a39378]">{trace.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionPanel>
  );
}

function ChatPanel({
  character,
  messages,
  input,
  setInput,
  sendMessage,
  isSending,
  demoPrompts,
  chatScrollRef,
  relationship,
  onRunTask,
  primaryTaskLabel,
  isTasking,
  voicePref,
  setVoicePref,
  speaking,
  cancelSpeak,
  speakText,
}: {
  character: MayaCharacter;
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  sendMessage: (m?: string) => void;
  isSending: boolean;
  demoPrompts: string[];
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  relationship: (typeof relationshipOptions)[number];
  onRunTask?: () => void;
  primaryTaskLabel?: string;
  isTasking: boolean;
  voicePref: VoicePreference;
  setVoicePref: (pref: VoicePreference) => void;
  speaking: boolean;
  cancelSpeak: () => void;
  speakText: (text: string) => void;
}) {
  const RelIcon = relationship.icon;
  const {
    supported: micSupported,
    listening,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition({
    onResult: (text) => {
      setInput(text);
      sendMessage(text);
    },
  });

  return (
    <div className="glass panel-grain mobile-chat flex min-h-[620px] flex-col rounded-3xl p-5 lg:min-h-[680px]">
      <div className="flex items-center gap-3 border-b hairline pb-4">
        <div className="relative">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#f5a45d]/25 to-[#9fb07f]/15">
            <MessageCircle size={18} className="text-[#f5a45d]" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[#0a0806] bg-[#9fb07f]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[20px] leading-tight">Talk to {character.name}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[10.5px] uppercase tracking-label text-[#9fb07f]">
            <RelIcon size={10} /> {relationship.label}
          </p>
        </div>
        <VoiceToggle
          voicePref={voicePref}
          setVoicePref={setVoicePref}
          speaking={speaking}
          cancelSpeak={cancelSpeak}
        />
      </div>

      <div className="mt-4 grid gap-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-label text-[#a39378]">
            Ask something
          </p>
          {onRunTask && primaryTaskLabel && (
            <button
              onClick={onRunTask}
              disabled={isTasking}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#f5a45d]/35 bg-[#f5a45d]/[0.08] px-2.5 py-1 font-mono text-[10px] uppercase tracking-label text-[#f5a45d] transition hover:border-[#f5a45d]/60 hover:bg-[#f5a45d]/[0.12] disabled:opacity-60"
            >
              {isTasking ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
              Quick task
            </button>
          )}
        </div>
        <div className="grid gap-1.5">
          {demoPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              title={prompt}
              className="rounded-xl border hairline bg-white/[0.025] px-3.5 py-2.5 text-left text-[12.5px] leading-snug text-[#c9b998] transition hover:border-[#f5a45d]/40 hover:bg-[#f5a45d]/[0.05] hover:text-[#f7ead2]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={chatScrollRef}
        className="scrollbar-thin mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border hairline bg-black/20 p-4"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`group/msg flex ${message.role === "you" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-[1.65] ${
                message.role === "you"
                  ? "rounded-br-sm bg-gradient-to-br from-[#f5a45d] to-[#c97b36] text-[#0a0806]"
                  : "rounded-bl-sm border hairline bg-white/[0.04] text-[#f7ead2]"
              }`}
            >
              {message.text}
              {message.role === "maya" && (
                <button
                  onClick={() => speakText(message.text)}
                  aria-label="Play voice"
                  className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border border-[#f5a45d]/30 bg-[#0a0806] text-[#f5a45d] opacity-0 transition group-hover/msg:opacity-100 hover:border-[#f5a45d]/60 hover:bg-[#f5a45d]/10"
                >
                  <Volume2 size={11} />
                </button>
              )}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border hairline bg-white/[0.04] px-4 py-3">
              <span className="type-dot" />
              <span className="type-dot" />
              <span className="type-dot" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border hairline bg-white/[0.04] p-1.5 pl-4 transition focus-within:border-[#f5a45d]/40">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          placeholder={listening ? "Listening…" : `Ask ${character.name} about ${character.project.name}…`}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-[#f7ead2] outline-none placeholder:text-[#6b5c45]"
        />
        {micSupported && (
          <button
            onClick={listening ? stopListening : startListening}
            aria-label={listening ? "Stop listening" : "Speak your message"}
            className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition ${
              listening
                ? "border-[#f5a45d]/60 bg-[#f5a45d]/20 text-[#f5a45d] shadow-[0_0_18px_0_rgba(245,164,93,0.35)]"
                : "hairline bg-white/[0.04] text-[#c9b998] hover:border-[#f5a45d]/40 hover:text-[#f5a45d]"
            }`}
          >
            {listening ? <Square size={12} fill="currentColor" /> : <Mic size={14} />}
          </button>
        )}
        <button
          onClick={() => sendMessage()}
          disabled={isSending || !input.trim()}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f5a45d] to-[#c97b36] text-[#0a0806] transition hover:scale-[1.03] disabled:cursor-wait disabled:opacity-60"
        >
          {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}

function VoiceToggle({
  voicePref,
  setVoicePref,
  speaking,
  cancelSpeak,
}: {
  voicePref: VoicePreference;
  setVoicePref: (pref: VoicePreference) => void;
  speaking: boolean;
  cancelSpeak: () => void;
}) {
  const options: { key: VoicePreference; label: string; title: string }[] = [
    { key: "off", label: "Off", title: "Voice off" },
    { key: "female", label: "F", title: "Female voice" },
    { key: "male", label: "M", title: "Male voice" },
  ];
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {speaking && (
        <button
          onClick={cancelSpeak}
          aria-label="Stop voice"
          className="grid size-7 place-items-center rounded-full border border-[#f5a45d]/40 bg-[#f5a45d]/15 text-[#f5a45d]"
        >
          <VolumeX size={12} />
        </button>
      )}
      <div className="flex items-center rounded-full border hairline bg-white/[0.04] p-0.5">
        {options.map((option) => {
          const active = option.key === voicePref;
          return (
            <button
              key={option.key}
              onClick={() => setVoicePref(option.key)}
              title={option.title}
              aria-label={option.title}
              className={`grid h-6 min-w-[22px] place-items-center rounded-full px-1.5 font-mono text-[10px] uppercase tracking-label transition ${
                active
                  ? option.key === "off"
                    ? "bg-white/[0.08] text-[#c9b998]"
                    : "bg-[#f5a45d]/20 text-[#f5a45d]"
                  : "text-[#8f7f64] hover:text-[#decaa6]"
              }`}
            >
              {option.key === "off" ? <VolumeX size={10} /> : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionPanel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass panel-grain relative rounded-3xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-label text-[#decaa6]">{title}</h2>
        {badge && (
          <span className="font-mono text-[10px] uppercase tracking-label text-[#8f7f64]">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
