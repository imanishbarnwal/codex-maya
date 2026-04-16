"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoicePreference = "female" | "male" | "off";

type SRInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean; length: number }>;
};

type SpeechRecognitionErrorEvent = { error: string };

type WindowWithSR = Window & {
  SpeechRecognition?: new () => SRInstance;
  webkitSpeechRecognition?: new () => SRInstance;
};

export function useSpeechRecognition({
  onResult,
  lang = "en-US",
}: {
  onResult: (text: string) => void;
  lang?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef<SRInstance | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as WindowWithSR;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const r = new Ctor();
    r.lang = lang;
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (event) => {
      const results = event.results;
      let transcript = "";
      for (let i = 0; i < results.length; i += 1) {
        transcript += results[i][0].transcript;
      }
      const trimmed = transcript.trim();
      if (trimmed) onResultRef.current(trimmed);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    return () => {
      try {
        r.abort();
      } catch {
        // ignore
      }
      recogRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const r = recogRef.current;
    if (!r) return;
    try {
      r.start();
      setListening(true);
    } catch {
      // already started or blocked
    }
  }, []);

  const stop = useCallback(() => {
    const r = recogRef.current;
    if (!r) return;
    try {
      r.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setVoices(list);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speak = useCallback(
    (text: string, voice?: SpeechSynthesisVoice) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (voice) utter.voice = voice;
      utter.rate = 1.04;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    },
    [],
  );

  const cancel = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { voices, speaking, speak, cancel };
}

const FEMALE_HINTS = [
  "female",
  "samantha",
  "victoria",
  "karen",
  "susan",
  "allison",
  "ava",
  "zoe",
  "joanna",
  "kendra",
  "kimberly",
  "salli",
  "nicole",
  "emma",
  "amy",
  "tessa",
  "fiona",
  "moira",
  "serena",
  "veena",
  "yuna",
  "zira",
  "catherine",
  "anna",
  "google uk english female",
  "google us english",
];

const MALE_HINTS = [
  "male",
  "daniel",
  "alex",
  "fred",
  "tom",
  "aaron",
  "arthur",
  "bruce",
  "ralph",
  "reed",
  "albert",
  "oliver",
  "george",
  "lee",
  "jorge",
  "diego",
  "david",
  "mark",
  "rishi",
  "google uk english male",
];

export function pickVoice(
  voices: SpeechSynthesisVoice[],
  preference: VoicePreference,
): SpeechSynthesisVoice | undefined {
  if (preference === "off" || !voices.length) return undefined;
  const isEn = (voice: SpeechSynthesisVoice) =>
    voice.lang.toLowerCase().startsWith("en");
  const findByHints = (hints: string[]) =>
    voices.find(
      (v) => isEn(v) && hints.some((n) => v.name.toLowerCase().includes(n)),
    );
  if (preference === "female") {
    return findByHints(FEMALE_HINTS) || voices.find(isEn) || voices[0];
  }
  return findByHints(MALE_HINTS) || voices.find(isEn) || voices[0];
}
