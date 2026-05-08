"use client";

import { useEffect, useMemo, useState } from "react";

const W = 6;
const H = 5;
const TABLES = [1, 2, 5, 10];

const MONSTERS = [
  { name: "Zombie", emoji: "🧟", hp: 2 },
  { name: "Spider", emoji: "🕷️", hp: 2 },
  { name: "Skeleton", emoji: "💀", hp: 3 },
  { name: "Creeper", emoji: "🧨", hp: 3 },
];

const BOSS = { name: "Dungeon Boss", emoji: "🐉", hp: 9 };

const BLOCKS = [
  { type: "stone", emoji: "🪨", resource: "stone" },
  { type: "iron", emoji: "⛓️", resource: "iron" },
  { type: "diamond", emoji: "💎", resource: "diamonds" },
];

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function pos(x, y) { return `${x},${y}`; }
function parsePos(k) { return k.split(",").map(Number); }
function adjacent(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1; }

function problem() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = pick(TABLES);
  return { a, b, answer: a * b };
}

function makeWorld(level, mode) {
  const objects = {};
  const used = new Set([pos(0, 0)]);

  function place(obj) {
    let x, y;
    do {
      x = Math.floor(Math.random() * W);
      y = Math.floor(Math.random() * H);
    } while (used.has(pos(x, y)));
    used.add(pos(x, y));
    objects[pos(x, y)] = { ...obj, id: Math.random().toString(36).slice(2) };
  }

  for (let i = 0; i < 7; i++) place({ kind: "block", ...pick(BLOCKS) });

  if (mode === "boss") {
    place({ kind: "monster", ...BOSS, currentHp: BOSS.hp + level, isBoss: true });
  } else {
    for (let i = 0; i < 3; i++) {
      const m = pick(MONSTERS);
      place({ kind: "monster", ...m, currentHp: m.hp + Math.floor(level / 3), isBoss: false });
    }
  }

  return objects;
}

export default function Home() {
  const [level, setLevel] = useState(1);
  const [mode, setMode] = useState("normal");
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [world, setWorld] = useState(() => makeWorld(1, "normal"));
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState(() => problem());
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("Use arrow keys. Bump into blocks or monsters, solve the recipe, then mine or attack.");
  const [inv, setInv] = useState({ stone: 0, iron: 0, diamonds: 0, monsters: 0, bosses: 0, scares: 0 });
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState(0);
  const [effect, setEffect] = useState(null);

  const selectedObj = selected ? world[pos(selected.x, selected.y)] : null;
  const damage = 1 + Math.floor(inv.iron / 2) + inv.diamonds;
  const monstersLeft = useMemo(() => Object.values(world).filter(o => o.kind === "monster").length, [world]);

  function movePlayer(dx, dy) {
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) return;

    const obj = world[pos(nx, ny)];
    if (obj) {
      setSelected({ x: nx, y: ny });
      setMsg(obj.kind === "monster" ? `${obj.emoji} ${obj.name} blocks your way. Solve to attack!` : `${obj.emoji} ${obj.resource} block. Solve to mine!`);
      return;
    }

    setPlayer({ x: nx, y: ny });
    setSelected(null);
    setMsg("Moved. Find a block or monster.");
  }

  useEffect(() => {
    function onKey(e) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowUp") movePlayer(0, -1);
      if (e.key === "ArrowDown") movePlayer(0, 1);
      if (e.key === "ArrowLeft") movePlayer(-1, 0);
      if (e.key === "ArrowRight") movePlayer(1, 0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function clickTile(x, y) {
    const obj = world[pos(x, y)];
    if (!obj) {
      if (adjacent(player, { x, y })) {
        setPlayer({ x, y });
        setSelected(null);
        setMsg("Moved one step.");
      } else setMsg("Click an adjacent empty square or use arrow keys.");
      return;
    }
    setSelected({ x, y });
    setMsg(obj.kind === "monster" ? `${obj.emoji} Attack ${obj.name}.` : `${obj.emoji} Mine ${obj.resource}.`);
  }

  function moveMonsters(nextWorld) {
    const moved = { ...nextWorld };
    let scared = false;

    for (const [k, obj] of Object.entries(nextWorld)) {
      if (obj.kind !== "monster" || !moved[k]) continue;
      const [x, y] = parsePos(k);

      if (adjacent({ x, y }, player)) {
        scared = true;
        continue;
      }

      const options = [
        { x: x + Math.sign(player.x - x), y },
        { x, y: y + Math.sign(player.y - y) },
      ].filter(p => p.x >= 0 && p.x < W && p.y >= 0 && p.y < H);

      const dest = options.find(p => !moved[pos(p.x, p.y)] && !(p.x === player.x && p.y === player.y));
      if (dest) {
        delete moved[k];
        moved[pos(dest.x, dest.y)] = obj;
      }
    }

    if (scared) {
      setPlayer({ x: 0, y: 0 });
      setInv(v => ({ ...v, scares: v.scares + 1 }));
      setMsg("😱 A monster reached you! You ran back to the entrance.");
    } else {
      setMsg("👹 The monsters moved closer...");
    }

    return moved;
  }

  function checkForBoss(nextWorld) {
    const left = Object.values(nextWorld).filter(o => o.kind === "monster").length;
    if (mode === "normal" && left === 0) {
      setMode("boss");
      setPlayer({ x: 0, y: 0 });
      setWorld(makeWorld(level, "boss"));
      setSelected(null);
      setQ(problem());
      setMsg("🐉 BOSS BATTLE! The Dungeon Boss appeared automatically.");
      return true;
    }
    return false;
  }

  function solve() {
    if (!selectedObj) {
      setMsg("Select a block or monster first.");
      return;
    }

    if (Number(answer) !== q.answer) {
      setMsg("🔧 Recipe fizzled. Try again.");
      setEffect(selected);
      setTimeout(() => setEffect(null), 400);
      return;
    }

    let next = { ...world };
    const k = pos(selected.x, selected.y);

    if (selectedObj.kind === "block") {
      delete next[k];
      setInv(v => ({ ...v, [selectedObj.resource]: v[selectedObj.resource] + 1 }));
      setScore(s => s + 1);
    }

    if (selectedObj.kind === "monster") {
      const hp = selectedObj.currentHp - damage;
      if (hp <= 0) {
        delete next[k];

        if (selectedObj.isBoss) {
          setInv(v => ({ ...v, bosses: v.bosses + 1 }));
          setScore(s => s + 10);
          const newLevel = level + 1;
          setLevel(newLevel);
          setMode("normal");
          setPlayer({ x: 0, y: 0 });
          setWorld(makeWorld(newLevel, "normal"));
          setSelected(null);
          setQ(problem());
          setAnswer("");
          setMsg(`🏆 Boss defeated! Level ${newLevel} begins.`);
          return;
        }

        setInv(v => ({ ...v, monsters: v.monsters + 1 }));
        setScore(s => s + 3);
      } else {
        next[k] = { ...selectedObj, currentHp: hp };
        setScore(s => s + 1);
      }
    }

    setAnswer("");
    setSelected(null);
    setQ(problem());
    setTurn(t => t + 1);

    if (checkForBoss(next)) return;
    setWorld(moveMonsters(next));
  }

  function resetDungeon() {
    setPlayer({ x: 0, y: 0 });
    setWorld(makeWorld(level, mode));
    setSelected(null);
    setQ(problem());
    setMsg("Dungeon reset.");
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#052e16,#064e3b,#111827)", color: "white", fontFamily: "Arial, sans-serif", padding: 22 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <h1 style={{ fontSize: 44, margin: "0 0 8px" }}>MathCraft Dungeon</h1>
        <p style={{ fontSize: 19, color: "#bbf7d0" }}>Now with visible moving monsters and automatic boss battles.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 20, alignItems: "start", marginTop: 22 }}>
          <section style={panel}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>{mode === "boss" ? "🐉 Boss Dungeon" : "🧭 Dungeon Board"}</h2>
              <strong>Level {level} · Turn {turn}</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `repeat(${W}, 1fr)`, gap: 10 }}>
              {Array.from({ length: W * H }).map((_, i) => {
                const x = i % W;
                const y = Math.floor(i / W);
                const obj = world[pos(x, y)];
                const isPlayer = player.x === x && player.y === y;
                const isSelected = selected && selected.x === x && selected.y === y;
                const hasEffect = effect && effect.x === x && effect.y === y;

                return (
                  <div
                    key={i}
                    onClick={() => clickTile(x, y)}
                    style={{
                      ...tile,
                      outline: isSelected ? "4px solid #facc15" : "none",
                      transform: hasEffect ? "scale(1.12) rotate(-3deg)" : "scale(1)",
                      background: obj?.kind === "block"
                        ? "linear-gradient(135deg,#6b7280,#374151)"
                        : obj?.kind === "monster"
                        ? obj.isBoss
                          ? "linear-gradient(135deg,#991b1b,#431407)"
                          : "linear-gradient(135deg,#7f1d1d,#111827)"
                        : tile.background,
                    }}
                  >
                    {isPlayer ? "🧍" : obj ? obj.emoji : ""}
                  </div>
                );
              })}
            </div>
          </section>

          <aside style={{ display: "grid", gap: 16 }}>
            <section style={panel}>
              <h2 style={{ marginTop: 0 }}>🧮 Action Recipe</h2>
              <p style={{ color: "#bbf7d0" }}>{selectedObj ? selectedObj.kind === "monster" ? `Attack ${selectedObj.name} — HP ${selectedObj.currentHp}` : `Mine ${selectedObj.resource}` : "Select a block or monster"}</p>
              <div style={{ fontSize: 54, fontWeight: "bold", margin: "14px 0" }}>{q.a} × {q.b} = ?</div>
              <input value={answer} onChange={e => setAnswer(e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={e => e.key === "Enter" && solve()} placeholder="Answer" style={input} />
              <button onClick={solve} style={button}>{selectedObj?.kind === "monster" ? "Attack!" : "Mine!"}</button>
            </section>

            <section style={panel}>
              <h2 style={{ marginTop: 0 }}>🎒 Inventory</h2>
              <p>🪨 Stone: {inv.stone}</p>
              <p>⛓️ Iron: {inv.iron}</p>
              <p>💎 Diamonds: {inv.diamonds}</p>
              <p>👾 Monsters defeated: {inv.monsters}</p>
              <p>🐉 Bosses defeated: {inv.bosses}</p>
              <p>😱 Escapes: {inv.scares}</p>
              <p>⭐ Score: {score}</p>
              <p>⚔️ Damage: {damage}</p>
              <p>👹 Monsters left: {monstersLeft}</p>
            </section>

            <section style={panel}>
              <p style={{ fontSize: 18 }}>{msg}</p>
              <button onClick={resetDungeon} style={smallButton}>Reset current dungeon</button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

const panel = {
  background: "#0f172a",
  border: "2px solid #22c55e",
  borderRadius: 22,
  padding: 20,
  boxShadow: "0 16px 40px rgba(0,0,0,.25)",
};

const tile = {
  width: "100%",
  aspectRatio: "1 / 1",
  borderRadius: 14,
  border: "2px solid #14532d",
  background: "linear-gradient(135deg,#166534,#052e16)",
  color: "white",
  fontSize: 42,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "inset 0 0 18px rgba(0,0,0,.35)",
  userSelect: "none",
  transition: "all .2s ease",
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  fontSize: 30,
  padding: 14,
  textAlign: "center",
  borderRadius: 14,
  border: "none",
  marginBottom: 12,
};

const button = {
  width: "100%",
  fontSize: 22,
  padding: "14px 18px",
  borderRadius: 14,
  border: "none",
  background: "#22c55e",
  color: "#052e16",
  fontWeight: "bold",
  cursor: "pointer",
};

const smallButton = {
  ...button,
  fontSize: 16,
  marginTop: 12,
  background: "transparent",
  color: "#bbf7d0",
  border: "1px solid #22c55e",
};
