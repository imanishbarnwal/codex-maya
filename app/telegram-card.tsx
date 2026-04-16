"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, Send } from "lucide-react";

type Status = "sending" | "sent" | "failed";

export function TelegramSend({
  recipient,
  text,
  fromName,
}: {
  recipient: string;
  text: string;
  fromName: string;
}) {
  const [status, setStatus] = useState<Status>("sending");
  const [to, setTo] = useState<string>(recipient);
  const [error, setError] = useState<string | null>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    (async () => {
      try {
        const res = await fetch("/api/telegram/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipient, message: text, from: fromName }),
        });
        const data = await res.json();
        if (data.ok) {
          setStatus("sent");
          if (data.to) setTo(data.to);
        } else {
          setStatus("failed");
          setError(data.reason || "Could not send.");
        }
      } catch {
        setStatus("failed");
        setError("Network error.");
      }
    })();
  }, [recipient, text, fromName]);

  const statusNode =
    status === "sending" ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7fb3d4]/30 bg-[#7fb3d4]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7fb3d4]">
        <Loader2 size={10} className="animate-spin" /> Sending
      </span>
    ) : status === "sent" ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9fb07f]/35 bg-[#9fb07f]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9fb07f]">
        <Check size={10} /> Sent
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e67650]/40 bg-[#e67650]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#e67650]">
        <AlertCircle size={10} /> Failed
      </span>
    );

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-[#7fb3d4]/15 text-[#7fb3d4]">
            <Send size={14} />
          </div>
          <div>
            <p className="font-display text-[15px] leading-tight">Telegram message</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#8f7f64]">
              to {to.toLowerCase()}
            </p>
          </div>
        </div>
        {statusNode}
      </div>
      <div className="rounded-xl border hairline bg-black/25 p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#8f7f64]">
          Message
        </p>
        <p className="mt-1 text-[13.5px] leading-[1.55] text-[#f7ead2]">{text}</p>
      </div>
      {status === "failed" && error && (
        <p className="text-[12px] leading-snug text-[#e67650]">{error}</p>
      )}
      {status === "sent" && (
        <p className="text-[11.5px] leading-snug text-[#9fb07f]">
          Delivered via @arjunmaya_bot. Check their Telegram to confirm.
        </p>
      )}
    </div>
  );
}
