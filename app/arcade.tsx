"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Gamepad2, RotateCcw, Trophy } from "lucide-react";

type Cell = "X" | "O" | null;
type Status = "playing" | "win" | "loss" | "draw";

const WIN_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const LINES: Record<"win" | "loss" | "draw", string[]> = {
  win: [
    "Fair play. You dodged my blocks like they were puddles.",
    "Okay — rematch tonight. I'm tuning the pathfinding.",
    "That's a real win. No pity. Rude of you, honestly.",
  ],
  loss: [
    "Called it. Puddle physics are easier than this.",
    "Monsoon Run prepared me well. One more?",
    "Four hours of stubbornness showing up on the board.",
  ],
  draw: [
    "A draw. Honest work.",
    "Symmetrical. Ghibli would approve.",
    "Both of us avoiding risk — classic indie dev energy.",
  ],
};

export function TicTacToe({
  characterName,
  onEnd,
}: {
  characterName: string;
  onEnd?: (text: string) => void;
}) {
  const [board, setBoard] = useState<Cell[]>(() => Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [status, setStatus] = useState<Status>("playing");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState({ you: 0, them: 0, draws: 0 });

  useEffect(() => {
    if (status !== "playing") return;
    const winner = checkWinner(board);
    if (winner === "X") {
      setStatus("win");
      setScore((s) => ({ ...s, you: s.you + 1 }));
      const m = pick(LINES.win);
      setMessage(m);
      onEnd?.(m);
      return;
    }
    if (winner === "O") {
      setStatus("loss");
      setScore((s) => ({ ...s, them: s.them + 1 }));
      const m = pick(LINES.loss);
      setMessage(m);
      onEnd?.(m);
      return;
    }
    if (board.every((c) => c !== null)) {
      setStatus("draw");
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
      const m = pick(LINES.draw);
      setMessage(m);
      onEnd?.(m);
    }
  }, [board, status, onEnd]);

  useEffect(() => {
    if (status !== "playing" || turn !== "O") return;
    const id = window.setTimeout(() => {
      const move = chooseAIMove(board);
      if (move === -1) return;
      setBoard((b) => {
        const next = [...b];
        next[move] = "O";
        return next;
      });
      setTurn("X");
    }, 420);
    return () => window.clearTimeout(id);
  }, [turn, status, board]);

  const handleClick = useCallback(
    (i: number) => {
      if (status !== "playing" || turn !== "X") return;
      if (board[i]) return;
      setBoard((b) => {
        const next = [...b];
        next[i] = "X";
        return next;
      });
      setTurn("O");
    },
    [status, turn, board],
  );

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setStatus("playing");
    setMessage(null);
  }, []);

  const winningLine = useMemo(() => {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[b] === board[c]) return line;
    }
    return null;
  }, [board]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-[#f5a45d]/15 text-[#f5a45d]">
            <Gamepad2 size={14} />
          </div>
          <div>
            <p className="font-display text-[16px] leading-tight">Tic-Tac-Toe</p>
            <p className="font-mono text-[10px] uppercase tracking-label text-[#8f7f64]">
              you (×) vs {characterName.toLowerCase()} (○)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-label text-[#a39378]">
          <span className="rounded-full border hairline bg-white/[0.03] px-2.5 py-1">
            you <span className="text-[#f5a45d]">{score.you}</span>
          </span>
          <span className="rounded-full border hairline bg-white/[0.03] px-2.5 py-1">
            {characterName.toLowerCase()} <span className="text-[#9fb07f]">{score.them}</span>
          </span>
          <span className="rounded-full border hairline bg-white/[0.03] px-2.5 py-1">
            draws <span className="text-[#decaa6]">{score.draws}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border hairline bg-black/30 p-2">
        {board.map((cell, i) => {
          const isWinning = winningLine?.includes(i) ?? false;
          const disabled = status !== "playing" || turn !== "X" || cell !== null;
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={disabled}
              className={`flex aspect-square items-center justify-center rounded-xl border font-display text-5xl transition ${
                isWinning
                  ? "border-[#f5a45d]/70 bg-[#f5a45d]/15 shadow-[0_0_30px_-5px_rgba(245,164,93,0.55)]"
                  : "hairline bg-white/[0.035] hover:border-[#f5a45d]/40 hover:bg-[#f5a45d]/[0.06]"
              } disabled:cursor-not-allowed`}
              aria-label={`Cell ${i + 1}${cell ? ` (${cell})` : ""}`}
            >
              {cell === "X" && <span className="text-[#f5a45d]">×</span>}
              {cell === "O" && <span className="text-[#9fb07f]">○</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border hairline bg-white/[0.02] p-3">
        <div className="min-w-0 flex-1">
          {status === "playing" ? (
            <p className="text-[13px] text-[#c9b998]">
              {turn === "X" ? "Your move." : `${characterName} is thinking…`}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-[13px] text-[#f7ead2]">
              {status === "win" && <Trophy size={12} className="shrink-0 text-[#f5a45d]" />}
              <span>{message}</span>
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#f5a45d]/30 bg-[#f5a45d]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-label text-[#f5a45d] transition hover:border-[#f5a45d]/60 hover:bg-[#f5a45d]/15"
        >
          <RotateCcw size={11} /> New game
        </button>
      </div>
    </div>
  );
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function checkWinner(board: Cell[]): Cell {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  return null;
}

function chooseAIMove(board: Cell[]): number {
  for (let i = 0; i < 9; i += 1) {
    if (!board[i]) {
      const test = [...board];
      test[i] = "O";
      if (checkWinner(test) === "O") return i;
    }
  }
  for (let i = 0; i < 9; i += 1) {
    if (!board[i]) {
      const test = [...board];
      test[i] = "X";
      if (checkWinner(test) === "X") return i;
    }
  }
  if (!board[4]) return 4;
  const oppositePairs = [
    [0, 8],
    [2, 6],
  ];
  for (const [a, b] of oppositePairs) {
    if (board[a] === "X" && !board[b]) return b;
    if (board[b] === "X" && !board[a]) return a;
  }
  const emptyCorners = [0, 2, 6, 8].filter((i) => !board[i]);
  if (emptyCorners.length) return pick(emptyCorners);
  const emptyEdges = [1, 3, 5, 7].filter((i) => !board[i]);
  if (emptyEdges.length) return emptyEdges[0];
  return -1;
}
