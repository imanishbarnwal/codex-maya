"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Code2,
  Gamepad2,
  Globe2,
  MessageCircle,
  NotebookPen,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AvatarStage } from "@/app/avatar-stage";
import { arjun } from "@/lib/maya-data";

type Message = {
  role: "maya" | "you";
  text: string;
};

const defaultSeed =
  "Arjun, 28, indie game developer in Bengaluru, vegan, obsessed with Ghibli, dry humor, building a tiny monsoon game.";

const agents = arjun.lifeTrace.map((trace, index) => ({
  ...trace,
  icon: [Sparkles, Globe2, NotebookPen, Gamepad2, MessageCircle][index],
}));

const demoPrompts = [
  "What is Monsoon Run?",
  "What did you write yesterday?",
  "How did MAYA build your life?",
  "What is Bengaluru like in your game?",
];

export default function Home() {
  const [step, setStep] = useState<"create" | "manifest" | "inhabit">("create");
  const [activeAgent, setActiveAgent] = useState(0);
  const [seed, setSeed] = useState(defaultSeed);
  const [manifestSeed, setManifestSeed] = useState(defaultSeed);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "maya",
      text: "Hey. I was just tuning puddle physics for Monsoon Run. What did you want to ask?",
    },
  ]);
  const [input, setInput] = useState("");

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
  }, [step]);

  function manifestArjun() {
    setManifestSeed(seed.trim() || defaultSeed);
    setStep("manifest");
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
        body: JSON.stringify({ message: nextInput }),
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

  return (
    <main className="min-h-screen overflow-hidden px-6 py-6 md:px-10">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full border border-[#f5a45d]/40 bg-[#f5a45d]/15">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-xl font-semibold tracking-[0.3em]">MAYA</p>
            <p className="text-xs uppercase tracking-[0.35em] text-[#d3bd91]">
              Codex-built lives
            </p>
          </div>
        </div>
        <p className="hidden rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#e8d7b8] md:block">
          Describe a person. Codex builds their world.
        </p>
      </header>

      {step === "create" && (
        <section className="mx-auto grid max-w-7xl items-center gap-12 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <div className="animate-rise">
            <p className="mb-5 inline-flex rounded-full border border-[#9fb07f]/30 bg-[#9fb07f]/10 px-4 py-2 text-sm text-[#c9d6ae]">
              A Codex hackathon demo
            </p>
            <h1 className="max-w-4xl text-6xl leading-[0.92] tracking-[-0.06em] md:text-8xl">
              Not a chatbot. A life Codex can build.
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-8 text-[#decaa6]">
              MAYA turns one paragraph into a living digital presence: website,
              journal, memories, project, and conversation context.
            </p>
            <p className="mt-5 max-w-2xl border-l-2 border-[#f5a45d] pl-5 text-lg leading-8 text-[#f7ead2]">
              The conversation is just the interface.
            </p>
            <button
              onClick={manifestArjun}
              className="mt-10 inline-flex items-center gap-3 rounded-lg bg-[#f5a45d] px-7 py-4 text-lg font-semibold text-[#120f0b] shadow-2xl shadow-[#f5a45d]/25 transition hover:scale-[1.02]"
            >
              Manifest Arjun <ArrowRight size={20} />
            </button>
          </div>

          <div className="relative rounded-lg border border-white/10 bg-[#1f1912]/80 p-5 shadow-2xl shadow-black/30 backdrop-blur">
            <label className="text-sm uppercase tracking-[0.3em] text-[#d3bd91]">
              Character Seed
            </label>
            <textarea
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              className="mt-4 min-h-72 w-full resize-none rounded-lg border border-white/10 bg-black/20 p-6 text-xl leading-8 text-[#f7ead2] outline-none"
            />
            <div className="mt-5 grid gap-3 text-sm text-[#decaa6] md:grid-cols-2">
              <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                Output: website, journal, project, memories, chat context.
              </p>
              <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                Engine: 5 Codex agents with inspectable Life Trace.
              </p>
            </div>
          </div>
        </section>
      )}

      {step === "manifest" && (
        <section className="mx-auto max-w-6xl py-14">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.45em] text-[#d3bd91]">
              Manifesting
            </p>
            <h2 className="mt-4 text-5xl tracking-[-0.05em] md:text-7xl">
              Codex is building Arjun.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#decaa6]">
              {manifestSeed}
            </p>
          </div>

          <div className="mx-auto mt-10 h-2 max-w-3xl overflow-hidden rounded-lg bg-white/10">
            <div
              className="h-full rounded-lg bg-[#f5a45d] transition-all duration-500"
              style={{ width: `${Math.min((activeAgent / agents.length) * 100, 100)}%` }}
            />
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-5">
            {agents.map((agent, index) => {
              const complete = index < activeAgent;
              const working = index === activeAgent;
              const Icon = agent.icon;

              return (
                <div
                  key={agent.agent}
                  className={`min-h-64 rounded-lg border p-5 transition duration-500 ${
                    complete
                      ? "border-[#f5a45d]/50 bg-[#f5a45d]/15"
                      : working
                        ? "border-[#9fb07f]/60 bg-[#9fb07f]/15"
                        : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="mb-8 flex items-center justify-between">
                    <Icon size={18} />
                    {complete ? <Check size={18} /> : <span className="size-2 rounded-full bg-white/30" />}
                  </div>
                  <h3 className="text-xl">{agent.agent}</h3>
                  <p className="mt-4 text-sm leading-6 text-[#decaa6]">
                    {complete
                      ? agent.artifact
                      : working
                        ? "Writing files, shaping memory, preparing context..."
                        : "Waiting for worker slot."}
                  </p>
                  <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[#d3bd91]">
                    {complete ? agent.status : working ? "running" : "queued"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {step === "inhabit" && (
        <section className="mx-auto grid max-w-7xl gap-6 py-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border border-white/10 bg-[#1f1912]/75 p-5">
            <div className="mb-5 flex flex-col justify-between gap-4 rounded-lg border border-[#9fb07f]/30 bg-[#9fb07f]/10 p-5 md:flex-row md:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#c9d6ae]">
                  Life Built
                </p>
                <p className="mt-2 max-w-3xl text-xl leading-8">
                  MAYA is not a chatbot. It is a Codex-built life. The
                  conversation is just the interface.
                </p>
              </div>
              <button
                onClick={() => setStep("create")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm text-[#f7ead2]"
              >
                <RefreshCw size={16} /> Edit seed
              </button>
            </div>

            <div className="rounded-lg bg-[#f7ead2] p-7 text-[#120f0b]">
              <p className="text-sm uppercase tracking-[0.35em] text-[#7f6440]">
                arjun.maya.local
              </p>
              <div className="mt-5 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
                <div>
                  <h2 className="text-5xl leading-none tracking-[-0.05em]">
                    {arjun.website.headline}
                  </h2>
                  <p className="mt-5 max-w-3xl text-lg leading-8 text-[#4f3b25]">
                    {arjun.essence}
                  </p>
                  <div className="mt-6 grid gap-3 text-sm text-[#4f3b25] sm:grid-cols-2">
                    <p className="rounded-lg border border-[#d3bd91] p-4">
                      Avatar generated from seed traits: Bengaluru, Ghibli,
                      vegan indie dev, monsoon-game builder.
                    </p>
                    <p className="rounded-lg border border-[#d3bd91] p-4">
                      Runtime-ready: this procedural body can later be swapped
                      for an API-generated rig.
                    </p>
                  </div>
                </div>
                <AvatarStage character={arjun} />
              </div>
              <img
                src="/monsoon-run.svg"
                alt="Monsoon Run cyclist crossing a rainy Bengaluru street"
                className="mt-7 aspect-video w-full rounded-lg object-cover"
              />
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {arjun.website.sections.map((section) => (
                  <article key={section.title} className="rounded-lg bg-[#ead8b8] p-5">
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#4f3b25]">{section.body}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Panel title="Journal">
                {arjun.journal.map((entry) => (
                  <div key={entry.title} className="rounded-lg bg-white/[0.05] p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#d3bd91]">{entry.date}</p>
                    <h3 className="mt-2 text-xl">{entry.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#decaa6]">{entry.body}</p>
                  </div>
                ))}
              </Panel>

              <Panel title="Project">
                <div className="rounded-lg border border-[#f5a45d]/30 bg-[#f5a45d]/10 p-5">
                  <p className="text-3xl">{arjun.project.name}</p>
                  <p className="mt-3 leading-7 text-[#decaa6]">{arjun.project.description}</p>
                  <div className="mt-6 overflow-hidden rounded-lg bg-black/30 p-5 text-center">
                    <p className="text-sm text-[#d3bd91]">{arjun.project.playablePrompt}</p>
                    <div className="relative mt-5 h-32 rounded-lg border border-white/10 bg-[#1f271d]">
                      <div className="absolute inset-x-0 top-10 h-6 bg-[#46523c]" />
                      <div className="absolute left-8 top-14 size-8 rounded-lg bg-[#f5a45d]" />
                      <div className="absolute left-24 top-20 h-7 w-12 rounded-lg bg-[#7f6440]" />
                      <div className="absolute right-16 top-12 h-9 w-14 rounded-lg bg-[#2c2117]" />
                      <div className="absolute bottom-4 left-1/2 h-10 w-6 -translate-x-1/2 rounded-lg bg-[#9fb07f]" />
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel title="Memories">
                {arjun.memories.map((memory) => (
                  <div key={memory.title} className="rounded-lg bg-white/[0.05] p-4">
                    <h3 className="text-xl">{memory.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#decaa6]">{memory.caption}</p>
                  </div>
                ))}
              </Panel>

              <Panel title="Life Trace">
                {arjun.lifeTrace.map((trace) => (
                  <div key={trace.agent} className="flex gap-3 rounded-lg bg-white/[0.05] p-4">
                    <Code2 className="mt-1 shrink-0 text-[#9fb07f]" size={16} />
                    <div>
                      <h3>{trace.agent}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#decaa6]">{trace.artifact}</p>
                      <p className="mt-2 text-xs leading-5 text-[#d3bd91]">{trace.detail}</p>
                    </div>
                  </div>
                ))}
              </Panel>
            </div>
          </div>

          <aside className="flex min-h-[720px] flex-col rounded-lg border border-white/10 bg-[#120f0b]/80 p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-lg bg-[#9fb07f]/20">
                <MessageCircle size={20} />
              </div>
              <div>
                <h2 className="text-2xl">Talk to Arjun</h2>
                <p className="text-sm text-[#d3bd91]">Context: journal + project + city</p>
              </div>
            </div>
            <div className="mb-4 grid gap-2">
              {demoPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-[#decaa6] transition hover:border-[#f5a45d]/50"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex-1 space-y-3 overflow-auto rounded-lg bg-black/20 p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-lg p-4 text-sm leading-6 ${
                    message.role === "you"
                      ? "ml-10 bg-[#f5a45d] text-[#120f0b]"
                      : "mr-10 bg-white/[0.06] text-[#f7ead2]"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage();
                }}
                placeholder="Ask about his game, journal, or Bengaluru..."
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-5 py-3 outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isSending}
                className="rounded-lg bg-[#f5a45d] px-5 font-semibold text-[#120f0b] disabled:cursor-wait disabled:opacity-60"
              >
                {isSending ? "..." : "Send"}
              </button>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <h2 className="mb-4 text-sm uppercase tracking-[0.35em] text-[#d3bd91]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
