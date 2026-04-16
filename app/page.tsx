"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  Boxes,
  Check,
  Code2,
  Download,
  Gamepad2,
  Globe2,
  Layers,
  Loader2,
  MessageCircle,
  NotebookPen,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  User,
  Wand2,
  Zap,
} from "lucide-react";
import { AvatarStage } from "@/app/avatar-stage";
import { arjun, demoSeeds, type MayaArtifact, type MayaCharacter } from "@/lib/maya-data";

type Message = { role: "maya" | "you"; text: string };
type TabId = "website" | "life" | "work" | "trace";

const defaultSeed =
  "Arjun, 28, indie game developer in Bengaluru, vegan, obsessed with Ghibli, dry humor, building a tiny monsoon game.";

const agentIcons = [User, Globe2, NotebookPen, Gamepad2, Wand2, Zap, MessageCircle];

const tabs: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "website", label: "Website", icon: Globe2 },
  { id: "life", label: "Life", icon: BookOpenText },
  { id: "work", label: "Work", icon: Boxes },
  { id: "trace", label: "Life Trace", icon: Layers },
];

export default function Home() {
  const [step, setStep] = useState<"create" | "manifest" | "inhabit">("create");
  const [activeAgent, setActiveAgent] = useState(0);
  const [seed, setSeed] = useState(defaultSeed);
  const [manifestSeed, setManifestSeed] = useState(defaultSeed);
  const [character, setCharacter] = useState<MayaCharacter>(arjun);
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
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | null>(null);

  const agents = useMemo(
    () =>
      character.lifeTrace.map((trace, index) => ({
        ...trace,
        icon: agentIcons[index] ?? Code2,
      })),
    [character.lifeTrace],
  );

  const demoPrompts = useMemo(
    () => [
      `What is ${character.project.name}?`,
      "What did you write in your journal?",
      "How did MAYA build your life?",
      `What is ${character.city} like in your world?`,
    ],
    [character.project.name, character.city],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
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

  async function manifestCharacter() {
    const nextSeed = seed.trim() || defaultSeed;
    setManifestSeed(nextSeed);
    setStep("manifest");
    setIsManifesting(true);

    try {
      const response = await fetch("/api/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: nextSeed }),
      });
      const data = await response.json();
      const nextCharacter = data.character as MayaCharacter;
      setCharacter(nextCharacter);
      setArtifacts(nextCharacter.artifacts);
      setMessages([
        {
          role: "maya",
          text: `Hey. I am ${nextCharacter.name}. MAYA just built my world, so ask me about ${nextCharacter.project.name}, my journal, or what I can make for you.`,
        },
      ]);
    } catch {
      setCharacter(arjun);
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
        body: JSON.stringify({ message: nextInput, character }),
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
          text: `I made an artifact: ${artifact.title}. It is now saved in my world and recorded in Life Trace.`,
        },
      ]);
      setActiveTab("work");
      showToast(`Artifact saved · ${artifact.title}`);
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
      showToast("Link copied to clipboard");
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
        aria-label="Go back to create"
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
      {step !== "create" && (
        <button
          onClick={onHome}
          className="rounded-full border border-[#f5a45d]/25 bg-[#f5a45d]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-label text-[#f5a45d] transition hover:border-[#f5a45d]/60 hover:bg-[#f5a45d]/15 md:hidden"
        >
          New life
        </button>
      )}
      <div className="hidden items-center gap-3 md:flex">
        {step !== "create" && (
          <button
            onClick={onHome}
            className="rounded-full border border-[#f5a45d]/25 bg-[#f5a45d]/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-label text-[#f5a45d] transition hover:border-[#f5a45d]/60 hover:bg-[#f5a45d]/15"
          >
            New life
          </button>
        )}
        <span className="inline-flex items-center gap-2 rounded-full border hairline bg-white/[0.03] px-3.5 py-1.5 text-[11px] uppercase tracking-label text-[#decaa6]">
          <span className="live-dot" />
          {statusLabel}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-label text-[#8f7f64]">
          Hackathon · 2025
        </span>
      </div>
    </header>
  );
}

function CreateStep({
  seed,
  setSeed,
  isManifesting,
  onManifest,
}: {
  seed: string;
  setSeed: (v: string) => void;
  isManifesting: boolean;
  onManifest: () => void;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(event: MouseEvent) {
      const rect = heroRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (event.clientX - cx) / rect.width;
      const ny = (event.clientY - cy) / rect.height;
      setParallax({ x: nx, y: ny });

      const btn = ctaRef.current;
      if (!btn) return;
      const br = btn.getBoundingClientRect();
      const dist = Math.hypot(event.clientX - (br.left + br.width / 2), event.clientY - (br.top + br.height / 2));
      if (dist < 140) {
        const mx = (event.clientX - (br.left + br.width / 2)) * 0.18;
        const my = (event.clientY - (br.top + br.height / 2)) * 0.18;
        btn.style.transform = `translate(${mx}px, ${my}px)`;
      } else {
        btn.style.transform = "translate(0, 0)";
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const titleLetters = "Describe a person.".split("");
  const titleLetters2 = "Codex builds".split("");
  const titleLetters3 = "their world.".split("");

  return (
    <section
      ref={heroRef}
      className="mx-auto grid max-w-7xl items-center gap-12 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-20"
    >
      <div className="relative">
        <div
          className="orb-bokeh -left-20 -top-10 size-[26rem] animate-drift"
          style={{
            background: "radial-gradient(circle, rgba(245,164,93,0.42), transparent 65%)",
            transform: `translate(${parallax.x * -30}px, ${parallax.y * -20}px)`,
            transition: "transform 180ms ease-out",
          }}
        />
        <div
          className="orb-bokeh left-[28%] top-[45%] size-64 opacity-70"
          style={{
            background: "radial-gradient(circle, rgba(159,176,127,0.38), transparent 65%)",
            transform: `translate(${parallax.x * 22}px, ${parallax.y * 28}px)`,
            transition: "transform 220ms ease-out",
          }}
        />

        <div className="relative animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border hairline bg-white/[0.035] px-3.5 py-1.5 text-[11px] uppercase tracking-label text-[#decaa6] backdrop-blur">
            <span className="live-dot" />
            A Codex hackathon demo
          </span>
          <h1 className="hero-title letter-rise mt-8 text-[clamp(3.2rem,7.5vw,6.4rem)] font-light">
            <span className="block">
              {titleLetters.map((ch, i) => (
                <span key={`t1-${i}`} style={{ animationDelay: `${i * 32}ms` }}>
                  {ch === " " ? "\u00a0" : ch}
                </span>
              ))}
            </span>
            <span className="ember-anim block italic">
              {titleLetters2.map((ch, i) => (
                <span
                  key={`t2-${i}`}
                  className="letter-rise"
                  style={{ animationDelay: `${titleLetters.length * 32 + i * 32}ms` }}
                >
                  {ch === " " ? "\u00a0" : ch}
                </span>
              ))}
            </span>
            <span className="block">
              {titleLetters3.map((ch, i) => (
                <span
                  key={`t3-${i}`}
                  style={{
                    animationDelay: `${(titleLetters.length + titleLetters2.length) * 32 + i * 32}ms`,
                  }}
                >
                  {ch === " " ? "\u00a0" : ch}
                </span>
              ))}
            </span>
          </h1>
          <p
            className="animate-fade mt-7 max-w-xl text-[17px] leading-[1.75] text-[#c9b998]"
            style={{ animationDelay: "0.9s" }}
          >
            MAYA turns one paragraph into a living digital presence — website,
            journal, memories, project, and conversation context. Seven agents
            manifest a life you can actually talk to.
          </p>
          <div
            className="animate-fade mt-7 max-w-xl rounded-r-xl border-l-2 border-[#f5a45d] bg-gradient-to-r from-[#f5a45d]/[0.08] to-transparent py-3.5 pl-5 pr-4"
            style={{ animationDelay: "1.1s" }}
          >
            <p className="font-display text-[17px] italic text-[#f7ead2]">
              Not a chatbot. A Codex-built life. The conversation is just the
              interface.
            </p>
          </div>
          <div
            className="animate-fade mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "1.3s" }}
          >
            <button
              ref={ctaRef}
              onClick={onManifest}
              disabled={isManifesting}
              className="magnetic-cta group inline-flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#ffd3a0] via-[#f5a45d] to-[#c97b36] px-7 py-4 text-[15px] font-semibold text-[#0a0806] shadow-[0_20px_60px_-20px_rgba(245,164,93,0.6)] transition-shadow hover:shadow-[0_30px_100px_-20px_rgba(245,164,93,0.85)] disabled:opacity-70"
            >
              <Sparkles size={16} />
              {isManifesting ? "Manifesting…" : "Manifest Life"}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
            <span className="font-mono text-[11px] uppercase tracking-label text-[#8f7f64]">
              7 agents · ~5 seconds · inspectable
            </span>
          </div>
        </div>
      </div>

      <div
        className="animate-rise relative"
        style={{
          animationDelay: "0.3s",
          transform: `translate(${parallax.x * 12}px, ${parallax.y * 8}px)`,
          transition: "transform 260ms ease-out",
        }}
      >
        <div
          className="orb-bokeh -right-16 top-16 size-80 opacity-60"
          style={{
            background: "radial-gradient(circle, rgba(245,164,93,0.38), transparent 65%)",
          }}
        />
        <div className="glass panel-grain relative rounded-3xl p-1.5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)]">
          <div className="relative rounded-[22px] bg-[#100c08]/70 p-6 md:p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-label text-[#a39378]">
                Character Seed
              </span>
              <span className="font-mono text-[11px] text-[#8f7f64]">
                {seed.length} / 500
              </span>
            </div>
            <textarea
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              maxLength={500}
              placeholder="Describe the person. Codex builds the rest."
              className="scrollbar-thin mt-5 min-h-[230px] w-full resize-none bg-transparent font-display text-[22px] leading-[1.55] text-[#f7ead2] outline-none placeholder:text-[#554733]"
            />
            <div className="mt-5 border-t hairline pt-5">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-label text-[#a39378]">
                Presets
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
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="glass-soft rounded-xl px-4 py-3.5">
            <p className="font-mono text-[11px] uppercase tracking-label text-[#a39378]">
              Output
            </p>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-[#f7ead2]">
              Website · Journal · Project · Memories · Chat
            </p>
          </div>
          <div className="glass-soft rounded-xl px-4 py-3.5">
            <p className="font-mono text-[11px] uppercase tracking-label text-[#a39378]">
              Engine
            </p>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-[#f7ead2]">
              7 Codex agents · Inspectable Life Trace
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ManifestStep({
  character,
  manifestSeed,
  agents,
  activeAgent,
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
}) {
  const pct = Math.min((activeAgent / agents.length) * 100, 100);

  return (
    <section className="mx-auto max-w-7xl py-12">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border hairline bg-white/[0.03] px-3.5 py-1.5 text-[11px] uppercase tracking-label text-[#decaa6]">
          <Loader2 size={12} className="animate-spin text-[#f5a45d]" />
          Manifesting
        </span>
        <h2 className="hero-title mt-5 text-5xl md:text-7xl">
          Codex is building <span className="ember-anim italic">{character.name}</span>.
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
                  {complete && (
                    <Check size={16} className="shrink-0 text-[#9fb07f]" />
                  )}
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
}) {
  return (
    <section className="animate-fade mx-auto max-w-7xl space-y-6 py-6">
      <HeroStrip
        character={character}
        onReset={onReset}
        onExport={onExport}
        onShare={onShare}
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-5">
          <div className="glass panel-grain flex items-center gap-1.5 rounded-2xl p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition ${
                    active
                      ? "bg-gradient-to-br from-[#f5a45d]/20 to-[#f5a45d]/5 text-[#f7ead2] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-[#a39378] hover:text-[#decaa6]"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
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
          />
        </aside>
      </div>
    </section>
  );
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
}: {
  character: MayaCharacter;
  onReset: () => void;
  onExport: () => void;
  onShare: () => void;
}) {
  const typedName = useTypewriter(character.name, 62);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="glass panel-grain relative overflow-hidden rounded-3xl">
        <AvatarStage character={character} size="hero" />
        <div className="pointer-events-none absolute left-5 right-5 top-5 z-10 flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#9fb07f]/30 bg-[#9fb07f]/15 px-3 py-1 text-[10px] uppercase tracking-label text-[#c9d6ae] backdrop-blur">
            <span className="live-dot" />
            Avatar Agent · compiled
          </span>
          <span className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border hairline bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-label text-[#decaa6] backdrop-blur">
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
              <Share2 size={12} /> Share mini-site
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
              <p className="mt-3 text-[13px] leading-[1.7] text-[#4f3b25]">
                {section.body}
              </p>
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
            <h3 className="mt-3 font-display text-[22px] leading-tight">
              {entry.title}
            </h3>
            <p className="mt-3 text-[14px] leading-[1.75] text-[#c9b998]">
              {entry.body}
            </p>
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
            <p className="mt-2.5 text-[13px] leading-[1.7] text-[#c9b998]">
              {memory.caption}
            </p>
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
}: {
  character: MayaCharacter;
  artifacts: MayaArtifact[];
  runTask: (task: string) => void;
  isTasking: boolean;
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
          <h2 className="hero-title mt-4 text-4xl md:text-5xl">
            {character.project.name}
          </h2>
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
              <p className="mt-2 text-[12.5px] leading-[1.65] text-[#c9b998]">
                {skill.prompt}
              </p>
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
                <h3 className="mt-3 font-display text-[19px] leading-snug">
                  {artifact.title}
                </h3>
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
      <div className="relative space-y-3">
        <div className="absolute bottom-3 left-[22px] top-3 w-px bg-gradient-to-b from-[#f5a45d]/40 via-[#9fb07f]/30 to-transparent" />
        {character.lifeTrace.map((trace, index) => {
          const Icon = agentIcons[index] ?? Code2;
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
                <p className="mt-2 text-[13.5px] leading-[1.7] text-[#f7ead2]">
                  {trace.artifact}
                </p>
                <p className="mt-2 text-[12.5px] leading-[1.7] text-[#a39378]">
                  {trace.detail}
                </p>
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
}: {
  character: MayaCharacter;
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  sendMessage: (m?: string) => void;
  isSending: boolean;
  demoPrompts: string[];
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="glass panel-grain flex min-h-[680px] flex-col rounded-3xl p-5">
      <div className="flex items-center gap-3 border-b hairline pb-4">
        <div className="relative">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#f5a45d]/25 to-[#9fb07f]/15">
            <MessageCircle size={18} className="text-[#f5a45d]" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[#0a0806] bg-[#9fb07f]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[20px] leading-tight">
            Talk to {character.name}
          </h2>
          <p className="truncate font-mono text-[10.5px] uppercase tracking-label text-[#9fb07f]">
            Grounded · journal · project · {character.city}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <p className="font-mono text-[10px] uppercase tracking-label text-[#a39378]">
          Ask something
        </p>
        <div className="grid gap-1.5">
          {demoPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="truncate rounded-xl border hairline bg-white/[0.025] px-3.5 py-2.5 text-left text-[12.5px] text-[#c9b998] transition hover:border-[#f5a45d]/40 hover:bg-[#f5a45d]/[0.05] hover:text-[#f7ead2]"
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
            className={`flex ${message.role === "you" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-[1.65] ${
                message.role === "you"
                  ? "rounded-br-sm bg-gradient-to-br from-[#f5a45d] to-[#c97b36] text-[#0a0806]"
                  : "rounded-bl-sm border hairline bg-white/[0.04] text-[#f7ead2]"
              }`}
            >
              {message.text}
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
          placeholder={`Ask ${character.name} about ${character.project.name}…`}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-[#f7ead2] outline-none placeholder:text-[#6b5c45]"
        />
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
        <h2 className="font-mono text-[11px] uppercase tracking-label text-[#decaa6]">
          {title}
        </h2>
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
