"use client";

import { useState } from "react";

const missions = [
  ["⛏️", "iron mines", "iron blocks"],
  ["⚡", "redstone towers", "redstone sparks"],
  ["🚂", "minecarts", "wheels"],
  ["🤖", "robot factories", "robots"],
  ["💎", "diamond drills", "diamonds"],
];

function newMission() {
  const mission = missions[Math.floor(Math.random() * missions.length)];
  const a = Math.floor(Math.random() * 10) + 1;
  const b = [1, 2, 5, 10][Math.floor(Math.random() * 4)];
  return { mission, a, b, answer: a * b };
}

export default function Home() {
  const [problem, setProblem] = useState(newMission());
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("Power the grid by solving 1x1 missions!");

  function check() {
    if (Number(answer) === problem.answer) {
      setScore(score + 1);
      setMessage("✅ Great engineering! Machine powered.");
      setAnswer("");
      setTimeout(() => setProblem(newMission()), 600);
    } else {
      setMessage("🔧 Good try. Inspect the machine and try again.");
    }
  }

  const [icon, machine, output] = problem.mission;

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#052e16,#064e3b,#111827)",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: "24px"
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 44, marginBottom: 8 }}>
          Minecraft Multiplication Power Grid
        </h1>

        <p style={{ fontSize: 20, color: "#bbf7d0" }}>
          Build machines. Power redstone. Practice the 1x1.
        </p>

        <div style={{
          marginTop: 32,
          background: "#0f172a",
          border: "2px solid #22c55e",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,.35)"
        }}>
          <div style={{ fontSize: 56 }}>{icon}</div>

          <h2 style={{ fontSize: 32, marginTop: 8 }}>
            Mission: {machine}
          </h2>

          <p style={{ fontSize: 22 }}>
            Each {machine.slice(0, -1)} makes <strong>{problem.b}</strong> {output}.
          </p>

          <p style={{ fontSize: 22 }}>
            How many {output} do <strong>{problem.a}</strong> {machine} make?
          </p>

          <div style={{
            fontSize: 72,
            fontWeight: "bold",
            marginTop: 24,
            marginBottom: 24
          }}>
            {problem.a} × {problem.b} = ?
          </div>

          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Type answer"
            style={{
              fontSize: 32,
              padding: 16,
              width: "100%",
              maxWidth: 260,
              borderRadius: 16,
              border: "none",
              textAlign: "center",
              marginRight: 12
            }}
          />

          <button
            onClick={check}
            style={{
              fontSize: 24,
              padding: "16px 28px",
              borderRadius: 16,
              border: "none",
              background: "#22c55e",
              color: "#052e16",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: 12
            }}
          >
            Power it!
          </button>

          <p style={{ fontSize: 22, marginTop: 24 }}>
            {message}
          </p>
        </div>

        <div style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 8
        }}>
          {Array.from({ length: problem.answer }).map((_, i) => (
            <div key={i} style={{
              height: 30,
              borderRadius: 6,
              background: "linear-gradient(135deg,#bef264,#16a34a)",
              border: "1px solid #14532d"
            }} />
          ))}
        </div>

        <div style={{
          marginTop: 32,
          background: "#111827",
          borderRadius: 20,
          padding: 20,
          border: "1px solid #374151"
        }}>
          <h2>Score: {score}</h2>
          <p>Unlocked: {score >= 3 ? "Redstone Lamp ⚡" : "Workbench 🧰"}</p>
          <p>Current tables: ×1, ×2, ×5, ×10</p>
        </div>
      </div>
    </main>
  );
}
