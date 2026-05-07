"use client";

import { useState } from "react";

const monsters = [
  { name: "Zombie", emoji: "🧟", hearts: 2 },
  { name: "Spider", emoji: "🕷️", hearts: 2 },
  { name: "Skeleton", emoji: "💀", hearts: 3 },
  { name: "Creeper", emoji: "🧨", hearts: 3 },
  { name: "Enderman", emoji: "👾", hearts: 4 },
];

const weapons = [
  { name: "Wooden Sword", emoji: "🪵⚔️", damage: 1 },
  { name: "Stone Sword", emoji: "🪨⚔️", damage: 1 },
  { name: "Iron Sword", emoji: "⚔️", damage: 2 },
  { name: "Bow", emoji: "🏹", damage: 2 },
  { name: "Diamond Sword", emoji: "💎⚔️", damage: 3 },
  { name: "TNT", emoji: "🧨", damage: 4 },
];

const tables = [1, 2, 5, 10];

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function newProblem() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = pick(tables);
  return { a, b, answer: a * b };
}

function newMonster(level) {
  const monster = pick(monsters);
  const bonus = Math.floor(level / 3);
  return {
    ...monster,
    maxHearts: monster.hearts + bonus,
    currentHearts: monster.hearts + bonus,
  };
}

function hearts(n) {
  return "❤️".repeat(Math.max(0, n));
}

export default function Home() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [monster, setMonster] = useState(() => newMonster(1));
  const [problem, setProblem] = useState(() => newProblem());
  const [answer, setAnswer] = useState("");
  const [weapon, setWeapon] = useState(null);
  const [message, setMessage] = useState(
    "A monster appeared! Solve the crafting recipe to unlock a weapon."
  );

  function craftWeapon() {
    if (Number(answer) === problem.answer) {
      const nextWeapon = weapons[Math.min(Math.floor(score / 3), weapons.length - 1)];
      setWeapon(nextWeapon);
      setScore(score + 1);
      setStreak(streak + 1);
      setMessage(`✅ Correct! You crafted ${nextWeapon.emoji} ${nextWeapon.name}. Now attack!`);
      setAnswer("");
    } else {
      setStreak(0);
      setMessage("🔧 The recipe fizzled. Check the pattern and try again.");
    }
  }

  function attack() {
    if (!weapon) {
      setMessage("You need to craft a weapon first by solving the 1x1 recipe.");
      return;
    }

    const remaining = monster.currentHearts - weapon.damage;

    if (remaining <= 0) {
      const newLevel = level + 1;
      setLevel(newLevel);
      setMonster(newMonster(newLevel));
      setProblem(newProblem());
      setWeapon(null);
      setMessage(`🏆 You defeated the ${monster.name}! A new monster appears...`);
    } else {
      setMonster({ ...monster, currentHearts: remaining });
      setProblem(newProblem());
      setWeapon(null);
      setMessage(`💥 Hit! The ${monster.name} has ${remaining} hearts left. Craft another weapon!`);
    }
  }

  function skipMonster() {
    setMonster(newMonster(level));
    setProblem(newProblem());
    setWeapon(null);
    setAnswer("");
    setMessage("New monster loaded. Time to craft!");
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#052e16,#064e3b,#111827)",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: 24,
    }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ fontSize: 44, marginBottom: 8 }}>Minecraft Monster 1x1</h1>
        <p style={{ fontSize: 20, color: "#bbf7d0" }}>
          Solve multiplication recipes. Craft weapons. Defeat monsters.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginTop: 28,
        }}>
          <section style={cardStyle}>
            <div style={{ fontSize: 90 }}>{monster.emoji}</div>
            <h2 style={{ fontSize: 34, margin: "8px 0" }}>{monster.name}</h2>
            <p style={{ fontSize: 28, margin: "8px 0" }}>{hearts(monster.currentHearts)}</p>
            <p style={{ color: "#bbf7d0" }}>Level {level} monster</p>
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: 28 }}>Crafting Recipe</h2>
            <p style={{ fontSize: 22, color: "#bbf7d0" }}>
              Solve this to craft your weapon:
            </p>
            <div style={{ fontSize: 72, fontWeight: "bold", margin: "18px 0" }}>
              {problem.a} × {problem.b} = ?
            </div>

            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && craftWeapon()}
              placeholder="Answer"
              style={inputStyle}
            />

            <button onClick={craftWeapon} style={greenButtonStyle}>Craft weapon</button>
          </section>
        </div>

        <section style={{ ...cardStyle, marginTop: 20 }}>
          <h2 style={{ fontSize: 28 }}>Your Weapon</h2>
          {weapon ? (
            <>
              <div style={{ fontSize: 64 }}>{weapon.emoji}</div>
              <p style={{ fontSize: 24 }}>{weapon.name} — damage {weapon.damage}</p>
              <button onClick={attack} style={attackButtonStyle}>Attack monster!</button>
            </>
          ) : (
            <p style={{ fontSize: 22, color: "#bbf7d0" }}>No weapon yet. Solve the recipe first.</p>
          )}
        </section>

        <section style={{
          marginTop: 20,
          background: "#111827",
          borderRadius: 20,
          padding: 20,
          border: "1px solid #374151",
        }}>
          <p style={{ fontSize: 22 }}>{message}</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
            <p><strong>Score:</strong> {score}</p>
            <p><strong>Streak:</strong> {streak}</p>
            <p><strong>Tables:</strong> ×1 ×2 ×5 ×10</p>
          </div>
          <button onClick={skipMonster} style={smallButtonStyle}>New monster</button>
        </section>
      </div>
    </main>
  );
}

const cardStyle = {
  background: "#0f172a",
  border: "2px solid #22c55e",
  borderRadius: 24,
  padding: 28,
  boxShadow: "0 20px 60px rgba(0,0,0,.35)",
  textAlign: "center",
};

const inputStyle = {
  fontSize: 32,
  padding: 16,
  width: "100%",
  maxWidth: 240,
  borderRadius: 16,
  border: "none",
  textAlign: "center",
  marginRight: 12,
};

const greenButtonStyle = {
  fontSize: 24,
  padding: "16px 28px",
  borderRadius: 16,
  border: "none",
  background: "#22c55e",
  color: "#052e16",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: 12,
};

const attackButtonStyle = {
  ...greenButtonStyle,
  background: "#f97316",
  color: "white",
};

const smallButtonStyle = {
  marginTop: 12,
  fontSize: 16,
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid #22c55e",
  background: "transparent",
  color: "#bbf7d0",
  cursor: "pointer",
};
