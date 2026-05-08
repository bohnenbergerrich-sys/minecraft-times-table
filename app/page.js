"use client";

import { useEffect, useMemo, useState } from "react";

const WIDTH = 6;
const HEIGHT = 5;
const tables = [1, 2, 5, 10];

const monsters = [
  { type: "zombie", name: "Zombie", emoji: "🧟", hp: 2 },
  { type: "spider", name: "Spider", emoji: "🕷️", hp: 2 },
  { type: "skeleton", name: "Skeleton", emoji: "💀", hp: 3 },
  { type: "creeper", name: "Creeper", emoji: "🧨", hp: 3 },
];

const boss = { type: "boss", name: "Dungeon Boss", emoji: "🐉", hp: 8 };

const blockTypes = [
  { type: "stone", emoji: "🪨", resource: "stone" },
  { type: "iron", emoji: "⛓️", resource: "iron" },
  { type: "diamond", emoji: "💎", resource: "diamonds" },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function key(x, y) {
  return `${x},${y}`;
}

function newProblem() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = pick(tables);
  return { a, b, answer: a * b };
}

function adjacent(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

function makeWorld(level = 1, bossMode = false) {
  const objects = {};
  const used = new Set([key(0, 0)]);

  function place(obj) {
    let x, y;
    do {
      x = Math.floor(Math.random() * WIDTH);
      y = Math.floor(Math.random() * HEIGHT);
    } while (used.has(key(x, y)));
    used.add(key(x, y));
    objects[key(x, y)] = { ...obj, id: `${Date.now()}-${Math.random()}` };
  }

  for (let i = 0; i < 8; i++) place({ kind: "block", ...pick(blockTypes) });

  if (bossMode) {
    place({ kind: "monster", ...boss, currentHp: boss.hp + level, isBoss: true });
  } else {
    for (let i = 0; i < 3 + Math.floor(level / 3); i++) {
      const m = pick(monsters);
      place({
        kind: "monster",
        ...m,
        currentHp: m.hp + Math.floor(level / 4),
        isBoss: false,
      });
    }
  }

  return objects;
}

export default function Home() {
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [turns, setTurns] = useState(0);
  const [bossMode, setBossMode] = useState(false);
  const [world, setWorld] = useState(() => makeWorld(1, false));
  const [selected, setSelected] = useState(null);
  const [problem, setProblem] = useState(() => newProblem());
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState(
    "Use the arrow keys to run around. Mine blocks. Fight monsters. Every action needs a 1x1 recipe."
  );
  const [inventory, setInventory] = useState({
    stone: 0,
    iron: 0,
    diamonds: 0,
    monsters: 0,
    bosses: 0,
    scares: 0,
  });
  const [effect, setEffect] = useState(null);

  const selectedObject = selected ? world[key(selected.x, selected.y)] : null;

  const remainingMonsters = useMemo(
    () => Object.values(world).filter((o) => o.kind === "monster").length,
    [world]
  );

  const damage = 1 + Math.floor(inventory.iron / 2) + inventory.diamonds;

  function canMoveTo(x, y) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return false;
    return !world[key(x, y)];
  }

  function move(dx, dy) {
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (canMoveTo(nx, ny)) {
      setPlayer({ x: nx, y: ny });
      setSelected(null);
      setMessage("You moved through the dungeon. Find something to mine or fight.");
    } else if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
      setSelected({ x: nx, y: ny });
      const obj = world[key(nx, ny)];
      if (obj?.kind === "block") setMessage(`You bumped into ${obj.emoji}. Solve the recipe to mine it.`);
      if (obj?.kind === "monster") setMessage(`${obj.emoji} ${obj.name} blocks your way. Solve the recipe to attack!`);
    }
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowUp") move(0, -1);
      if (e.key === "ArrowDown") move(0, 1);
      if (e.key === "ArrowLeft") move(-1, 0);
      if (e.key === "ArrowRight") move(1, 0);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function selectTile(x, y) {
    const obj = world[key(x, y)];

    if (!obj) {
      if (adjacent(player, { x, y })) {
        setPlayer({ x, y });
        setSelected(null);
        setMessage("Moved one step.");
      } else {
        setMessage("Use arrow keys, or click an empty square next to you.");
      }
      return;
    }

    setSelected({ x, y });
    if (obj.kind === "block") setMessage(`${obj.emoji} Mine this block by solving ${problem.a} × ${problem.b}.`);
    if (obj.kind === "monster") setMessage(`${obj.emoji} Attack the ${obj.name} by solving ${problem.a} × ${problem.b}.`);
  }

  function advanceTurn(currentWorld = world) {
    const nextTurn = turns + 1;
    setTurns(nextTurn);

    if (nextTurn % 2 !== 0) return;

    const occupied = new Set([key(player.x, player.y)]);
    Object.entries(currentWorld).forEach(([pos, obj]) => {
      if (obj.kind !== "monster") occupied.add(pos);
    });

    const movedWorld = { ...currentWorld };
    let scareHappened = false;

    Object.entries(currentWorld).forEach(([pos, obj]) => {
      if (obj.kind !== "monster") return;

      const [x, y] = pos.split(",").map(Number);

      if (adjacent({ x, y }, player)) {
        scareHappened = true;
        return;
      }

      const options = [
        { x: x + Math.sign(player.x - x), y },
        { x, y: y + Math.sign(player.y - y) },
      ].filter((p) => p.x >= 0 && p.x < WIDTH && p.y >= 0 && p.y < HEIGHT);

      const moveTo = options.find((p) => !occupied.has(key(p.x, p.y)) && !movedWorld[key(p.x, p.y)]);

      if (moveTo) {
        delete movedWorld[pos];
        movedWorld[key(moveTo.x, moveTo.y)] = obj;
        occupied.add(key(moveTo.x, moveTo.y));
      }
    });

    if (scareHappened) {
      setInventory((inv) => ({ ...inv, scares: inv.scares + 1 }));
      setPlayer({ x: 0, y: 0 });
      setSelected(null);
      setMessage("😱 A monster reached you! You escaped back to the dungeon entrance.");
      setEffect({ type: "scare", at: player });
      setTimeout(() => setEffect(null), 450);
    }

    setWorld(movedWorld);
  }

  function solveAction() {
    if (!selectedObject) {
      setMessage("Choose a block or monster first.");
      return;
    }

    if (Number(answer) !== problem.answer) {
      setMessage("🔧 Not quite. The recipe fizzled — try again.");
      setEffect({ type: "shake", at: selected });
      setTimeout(() => setEffect(null), 450);
      return;
    }

    const tileKey = key(selected.x, selected.y);
    let nextWorld = { ...world };

    if (selectedObject.kind === "block") {
      delete nextWorld[tileKey];
      setInventory((inv) => ({
        ...inv,
        [selectedObject.resource]: inv[selectedObject.resource] + 1,
      }));
      setScore((s) => s + 1);
      setMessage(`💥 You smashed ${selectedObject.emoji} and collected ${selectedObject.resource}!`);
      setEffect({ type: "explode", at: selected });
    }

    if (selectedObject.kind === "monster") {
      const newHp = selectedObject.currentHp - damage;

      if (newHp <= 0) {
        delete nextWorld[tileKey];

        if (selectedObject.isBoss) {
          setInventory((inv) => ({ ...inv, bosses: inv.bosses + 1 }));
          setScore((s) => s + 10);
          setBossMode(false);
          setMessage(`🏆 You defeated the ${selectedObject.name}! The dungeon is clear. Open the next level!`);
        } else {
          setInventory((inv) => ({ ...inv, monsters: inv.monsters + 1 }));
          setScore((s) => s + 2);
          setMessage(`⚔️ You defeated the ${selectedObject.name}!`);
        }

        setEffect({ type: "boom", at: selected });
      } else {
        nextWorld[tileKey] = { ...selectedObject, currentHp: newHp };
        setScore((s) => s + 1);
        setMessage(`⚔️ Hit! ${selectedObject.name} has ${newHp} hearts left.`);
        setEffect({ type: "hit", at: selected });
      }
    }

    setWorld(nextWorld);
    setAnswer("");
    setSelected(null);
    setProblem(newProblem());
    advanceTurn(nextWorld);
    setTimeout(() => setEffect(null), 500);
  }

  function startBossBattle() {
    setBossMode(true);
    setPlayer({ x: 0, y: 0 });
    setWorld(makeWorld(level, true));
    setSelected(null);
    setProblem(newProblem());
    setMessage("🐉 Boss battle! Mine resources, then defeat the Dungeon Boss.");
  }

  function nextLevel() {
    const next = level + 1;
    setLevel(next);
    setBossMode(false);
    setPlayer({ x: 0, y: 0 });
    setWorld(makeWorld(next, false));
    setSelected(null);
    setProblem(newProblem());
    setMessage(`Level ${next}! New dungeon generated. Monsters now move every two correct actions.`);
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#052e16,#064e3b,#111827)", color: "white", fontFamily: "Arial, sans-serif", padding: 22 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <h1 style={{ fontSize: 44, margin: "0 0 8px" }}>MathCraft Dungeon</h1>
        <p style={{ fontSize: 19, color: "#bbf7d0" }}>
          Run with arrow keys. Mine blocks. Fight moving monsters. Defeat the boss.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 20, alignItems: "start", marginTop: 22 }}>
          <section style={{ background: "#0f172a", border: "2px solid #22c55e", borderRadius: 24, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>{bossMode ? "🐉 Boss Dungeon" : "🧭 Dungeon Board"}</h2>
              <strong>Level {level}</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `repeat(${WIDTH}, 1fr)`, gap: 10 }}>
              {Array.from({ length: WIDTH * HEIGHT }).map((_, i) => {
                const x = i % WIDTH;
                const y = Math.floor(i / WIDTH);
                const obj = world[key(x, y)];
                const isPlayer = player.x === x && player.y === y;
                const isSelected = selected && selected.x === x && selected.y === y;
                const hasEffect = effect && effect.at?.x === x && effect.at?.y === y;

                return (
                  <div
                    key={i}
                    onClick={() => selectTile(x, y)}
                    style={{
                      ...tileStyle,
                      outline: isSelected ? "4px solid #facc15" : "none",
                      transform: hasEffect ? "scale(1.1) rotate(-2deg)" : "scale(1)",
                      transition: "transform .18s ease, outline .18s ease",
                      background: obj?.kind === "block"
                        ? "linear-gradient(135deg,#6b7280,#374151)"
                        : obj?.kind === "monster"
                        ? obj.isBoss
                          ? "linear-gradient(135deg,#7c2d12,#111827)"
                          : "linear-gradient(135deg,#7f1d1d,#111827)"
                        : tileStyle.background,
                    }}
                  >
                    {isPlayer ? "🧍" : obj ? obj.emoji : ""}
                  </div>
                );
              })}
            </div>

            <p style={{ color: "#bbf7d0", marginTop: 14 }}>
              Monsters move every two correct actions. If they reach you, you escape back to the entrance.
            </p>
          </section>

          <aside style={{ display: "grid", gap: 16 }}>
            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>🧮 Action Recipe</h2>
              <p style={{ color: "#bbf7d0" }}>
                {selectedObject
                  ? selectedObject.kind === "monster"
                    ? `Attack ${selectedObject.name}${selectedObject.currentHp ? ` — HP ${selectedObject.currentHp}` : ""}`
                    : `Mine ${selectedObject.resource}`
                  : "Select a block or monster"}
              </p>
              <div style={{ fontSize: 54, fontWeight: "bold", margin: "14px 0" }}>{problem.a} × {problem.b} = ?</div>
              <input value={answer} onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={(e) => e.key === "Enter" && solveAction()} placeholder="Answer" style={inputStyle} />
              <button onClick={solveAction} style={buttonStyle}>{selectedObject?.kind === "monster" ? "Attack!" : "Mine!"}</button>
            </section>

            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>🎒 Inventory</h2>
              <p>🪨 Stone: {inventory.stone}</p>
              <p>⛓️ Iron: {inventory.iron}</p>
              <p>💎 Diamonds: {inventory.diamonds}</p>
              <p>👾 Monsters defeated: {inventory.monsters}</p>
              <p>🐉 Bosses defeated: {inventory.bosses}</p>
              <p>😱 Escapes: {inventory.scares}</p>
              <p>⭐ Score: {score}</p>
              <p>⚔️ Damage: {damage}</p>
              <p>⏱️ Turn: {turns}</p>
            </section>

            <section style={panelStyle}>
              <p style={{ fontSize: 18 }}>{message}</p>
              {!bossMode && inventory.monsters > 0 && inventory.monsters % 3 === 0 && (
                <button onClick={startBossBattle} style={orangeButtonStyle}>Open boss battle</button>
              )}
              {remainingMonsters === 0 && bossMode && (
                <button onClick={nextLevel} style={buttonStyle}>Open next dungeon</button>
              )}
              {remainingMonsters === 0 && !bossMode && (
                <button onClick={nextLevel} style={buttonStyle}>Skip to next dungeon</button>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

const tileStyle = {
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
};

const panelStyle = {
  background: "#0f172a",
  border: "2px solid #22c55e",
  borderRadius: 22,
  padding: 20,
  boxShadow: "0 16px 40px rgba(0,0,0,.25)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  fontSize: 30,
  padding: 14,
  textAlign: "center",
  borderRadius: 14,
  border: "none",
  marginBottom: 12,
};

const buttonStyle = {
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

const orangeButtonStyle = {
  ...buttonStyle,
  background: "#f97316",
  color: "white",
  marginBottom: 12,
};
