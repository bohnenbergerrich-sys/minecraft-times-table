"use client";

import { useEffect, useMemo, useState } from "react";

const W = 6;
const H = 5;
const SAVE_KEY = "mathcraft_v5_save";

const CAMPAIGN = [
  {
    boss: { name: "Cave Troll", emoji: "🪨", hp: 10 },
    tables: [1, 2, 5],
    theme: "Stone Caves",
    intro: "The Cave Troll wakes beneath the mountain..."
  },
  {
    boss: { name: "Lava Dragon", emoji: "🐲", hp: 15 },
    tables: [3, 4, 6],
    theme: "Lava Fortress",
    intro: "The Lava Dragon rises from the magma..."
  },
  {
    boss: { name: "Ender King", emoji: "👑", hp: 20 },
    tables: [7, 8, 9],
    theme: "End Realm",
    intro: "The Ender King opens the final gate..."
  }
];

const MONSTERS = [
  { name: "Zombie", emoji: "🧟", hp: 3 },
  { name: "Spider", emoji: "🕷️", hp: 3 },
  { name: "Skeleton", emoji: "💀", hp: 4 },
  { name: "Creeper", emoji: "🧨", hp: 4 },
];

const BLOCKS = [
  { type: "stone", emoji: "🪨", resource: "stone" },
  { type: "iron", emoji: "⛓️", resource: "iron" },
  { type: "diamond", emoji: "💎", resource: "diamonds" },
];

const WEAPONS = [
  { name: "Wooden Sword", emoji: "🪵⚔️", damage: 1, cost: {} },
  { name: "Stone Sword", emoji: "🪨⚔️", damage: 2, cost: { stone: 4 } },
  { name: "Iron Sword", emoji: "⚔️", damage: 4, cost: { iron: 3, stone: 2 } },
  { name: "Diamond Sword", emoji: "💎⚔️", damage: 7, cost: { diamonds: 2, iron: 2 } },
];

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function key(x, y) { return `${x},${y}`; }
function adjacent(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1; }

function makeProblem(tables) {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = pick(tables);
  return { a, b, answer: a * b };
}

function makeWorld(stage, bossMode = false) {
  const world = {};
  const used = new Set(["0,0"]);

  function place(obj) {
    let x, y;
    do {
      x = Math.floor(Math.random() * W);
      y = Math.floor(Math.random() * H);
    } while (used.has(key(x, y)));

    used.add(key(x, y));
    world[key(x, y)] = { ...obj, id: Math.random().toString(36).slice(2) };
  }

  for (let i = 0; i < 7; i++) place({ kind: "block", ...pick(BLOCKS) });

  if (bossMode) {
    place({
      kind: "monster",
      ...CAMPAIGN[stage].boss,
      currentHp: CAMPAIGN[stage].boss.hp,
      maxHp: CAMPAIGN[stage].boss.hp,
      isBoss: true
    });
  } else {
    for (let i = 0; i < 3; i++) {
      const m = pick(MONSTERS);
      place({
        kind: "monster",
        ...m,
        currentHp: m.hp + Math.floor(stage / 2),
        maxHp: m.hp + Math.floor(stage / 2),
        isBoss: false
      });
    }
  }

  return world;
}

function canAfford(resources, cost) {
  return Object.entries(cost).every(([r, amount]) => resources[r] >= amount);
}

function payCost(resources, cost) {
  const next = { ...resources };
  Object.entries(cost).forEach(([r, amount]) => { next[r] -= amount; });
  return next;
}

function makeInitialState() {
  return {
    stage: 0,
    bossMode: false,
    player: { x: 0, y: 0 },
    world: makeWorld(0, false),
    inventory: { stone: 0, iron: 0, diamonds: 0, trophies: [] },
    score: 0,
    weaponIndex: 0,
    campaignComplete: false
  };
}

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [stage, setStage] = useState(0);
  const [bossMode, setBossMode] = useState(false);
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [world, setWorld] = useState(() => makeWorld(0, false));
  const [selected, setSelected] = useState(null);
  const [answer, setAnswer] = useState("");
  const [q, setQ] = useState(() => makeProblem(CAMPAIGN[0].tables));
  const [inventory, setInventory] = useState({ stone: 0, iron: 0, diamonds: 0, trophies: [] });
  const [score, setScore] = useState(0);
  const [weaponIndex, setWeaponIndex] = useState(0);
  const [message, setMessage] = useState("Mine blocks, craft weapons, defeat monsters, and fill the 3-boss gallery.");
  const [effect, setEffect] = useState(null);
  const [floating, setFloating] = useState(null);
  const [bossIntro, setBossIntro] = useState(null);
  const [campaignComplete, setCampaignComplete] = useState(false);

  const selectedObj = selected ? world[key(selected.x, selected.y)] : null;
  const weapon = WEAPONS[weaponIndex];
  const monstersLeft = useMemo(() => Object.values(world).filter(o => o.kind === "monster").length, [world]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setStage(saved.stage ?? 0);
        setBossMode(saved.bossMode ?? false);
        setPlayer(saved.player ?? { x: 0, y: 0 });
        setWorld(saved.world ?? makeWorld(saved.stage ?? 0, saved.bossMode ?? false));
        setInventory(saved.inventory ?? { stone: 0, iron: 0, diamonds: 0, trophies: [] });
        setScore(saved.score ?? 0);
        setWeaponIndex(saved.weaponIndex ?? 0);
        setCampaignComplete(saved.campaignComplete ?? false);
        setQ(makeProblem(CAMPAIGN[saved.stage ?? 0].tables));
        setMessage("Saved campaign loaded.");
      }
    } catch (e) {
      console.warn("Could not load save", e);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const save = { stage, bossMode, player, world, inventory, score, weaponIndex, campaignComplete };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [loaded, stage, bossMode, player, world, inventory, score, weaponIndex, campaignComplete]);

  useEffect(() => {
    function onKey(e) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowUp") move(0, -1);
      if (e.key === "ArrowDown") move(0, 1);
      if (e.key === "ArrowLeft") move(-1, 0);
      if (e.key === "ArrowRight") move(1, 0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function move(dx, dy) {
    if (campaignComplete) return;
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) return;

    const obj = world[key(nx, ny)];
    if (obj) {
      setSelected({ x: nx, y: ny });
      setMessage(obj.kind === "monster" ? `${obj.emoji} ${obj.name} blocks your path.` : `${obj.emoji} Mine ${obj.resource}.`);
      return;
    }

    setPlayer({ x: nx, y: ny });
    setSelected(null);
  }

  function clickTile(x, y) {
    if (campaignComplete) return;
    const obj = world[key(x, y)];
    if (!obj) {
      if (adjacent(player, { x, y })) setPlayer({ x, y });
      return;
    }
    setSelected({ x, y });
  }

  function moveMonsters(next) {
    const moved = { ...next };

    for (const [p, obj] of Object.entries(next)) {
      if (obj.kind !== "monster") continue;
      const [x, y] = p.split(",").map(Number);

      const options = [
        { x: x + Math.sign(player.x - x), y },
        { x, y: y + Math.sign(player.y - y) }
      ];

      for (const o of options) {
        if (o.x < 0 || o.y < 0 || o.x >= W || o.y >= H) continue;
        const target = key(o.x, o.y);
        if (!moved[target] && !(o.x === player.x && o.y === player.y)) {
          delete moved[p];
          moved[target] = obj;
          break;
        }
      }
    }

    return moved;
  }

  function summonBoss() {
    setBossMode(true);
    setWorld(makeWorld(stage, true));
    setPlayer({ x: 0, y: 0 });
    setSelected(null);
    setBossIntro(CAMPAIGN[stage].intro);
    setMessage(`🐉 ${CAMPAIGN[stage].boss.name} has appeared!`);
    setTimeout(() => setBossIntro(null), 1600);
  }

  function nextStage() {
    if (stage === 2) {
      setCampaignComplete(true);
      setMessage("🏆 CAMPAIGN COMPLETE! All three boss trophies are unlocked.");
      return;
    }

    const next = stage + 1;
    setStage(next);
    setBossMode(false);
    setWorld(makeWorld(next, false));
    setPlayer({ x: 0, y: 0 });
    setSelected(null);
    setQ(makeProblem(CAMPAIGN[next].tables));
    setMessage(`Entering ${CAMPAIGN[next].theme}. New tables unlocked.`);
  }

  function solve() {
    if (campaignComplete) return;

    if (!selectedObj) {
      setMessage("Select a monster or block first.");
      return;
    }

    if (Number(answer) !== q.answer) {
      setMessage("🔧 Recipe fizzled. Try again.");
      setEffect(selected);
      setTimeout(() => setEffect(null), 350);
      return;
    }

    let next = { ...world };
    const p = key(selected.x, selected.y);

    if (selectedObj.kind === "block") {
      delete next[p];
      setInventory(v => ({ ...v, [selectedObj.resource]: v[selectedObj.resource] + 1 }));
      setScore(s => s + 1);
      setFloating({ at: selected, text: `+1 ${selectedObj.resource}` });
      setMessage(`⛏️ Collected ${selectedObj.resource}.`);
    }

    if (selectedObj.kind === "monster") {
      const critical = Math.random() < 0.18;
      const hit = critical ? weapon.damage * 2 : weapon.damage;
      const hp = selectedObj.currentHp - hit;

      setFloating({ at: selected, text: critical ? `CRIT -${hit}` : `-${hit}` });

      if (hp <= 0) {
        delete next[p];

        if (selectedObj.isBoss) {
          setInventory(v => ({
            ...v,
            trophies: [...v.trophies, {
              name: selectedObj.name,
              emoji: selectedObj.emoji,
              theme: CAMPAIGN[stage].theme,
              weapon: weapon.name
            }]
          }));
          setScore(s => s + 20);
          setMessage(`🏆 You defeated ${selectedObj.name}!`);
          setTimeout(nextStage, 900);
        } else {
          setScore(s => s + 5);
          setMessage(`⚔️ Defeated ${selectedObj.name}.`);
        }
      } else {
        next[p] = { ...selectedObj, currentHp: hp };
        setScore(s => s + 2);
        setMessage(`⚔️ Hit ${selectedObj.name}. HP ${hp}.`);
      }
    }

    setAnswer("");
    setSelected(null);
    setQ(makeProblem(CAMPAIGN[stage].tables));

    const remaining = Object.values(next).filter(o => o.kind === "monster").length;
    if (!bossMode && remaining === 0) {
      setWorld(next);
      setTimeout(summonBoss, 500);
    } else {
      setWorld(moveMonsters(next));
    }

    setTimeout(() => setFloating(null), 650);
  }

  function craftWeapon(i) {
    if (i <= weaponIndex) return;
    const target = WEAPONS[i];

    if (!canAfford(inventory, target.cost)) {
      setMessage(`Need resources for ${target.name}.`);
      return;
    }

    setInventory(v => ({ ...payCost(v, target.cost), trophies: v.trophies }));
    setWeaponIndex(i);
    setMessage(`Crafted ${target.emoji} ${target.name}!`);
  }

  function resetCampaign() {
    const fresh = makeInitialState();
    setStage(fresh.stage);
    setBossMode(fresh.bossMode);
    setPlayer(fresh.player);
    setWorld(fresh.world);
    setInventory(fresh.inventory);
    setScore(fresh.score);
    setWeaponIndex(fresh.weaponIndex);
    setCampaignComplete(false);
    setSelected(null);
    setAnswer("");
    setQ(makeProblem(CAMPAIGN[0].tables));
    setMessage("New campaign started.");
    localStorage.removeItem(SAVE_KEY);
  }

  return (
    <main style={styles.main}>
      {bossIntro && <div style={styles.overlay}><div style={styles.bossIntro}>⚠️ {bossIntro}</div></div>}

      <div style={styles.container}>
        <h1 style={styles.title}>MathCraft Campaign v5</h1>
        <p style={styles.subtitle}>Saved progress · weapons · health bars · boss intros · trophy gallery</p>

        <div style={styles.grid}>
          <section style={styles.panel}>
            <div style={styles.boardHeader}>
              <strong>{CAMPAIGN[stage].theme}</strong>
              <strong>Stage {stage + 1}/3</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `repeat(${W},1fr)`, gap: 10 }}>
              {Array.from({ length: W * H }).map((_, i) => {
                const x = i % W;
                const y = Math.floor(i / W);
                const obj = world[key(x, y)];
                const isPlayer = player.x === x && player.y === y;
                const isSelected = selected && selected.x === x && selected.y === y;
                const isEffect = effect && effect.x === x && effect.y === y;
                const isFloating = floating && floating.at.x === x && floating.at.y === y;

                return (
                  <div
                    key={i}
                    onClick={() => clickTile(x, y)}
                    style={{
                      ...styles.tile,
                      outline: isSelected ? "4px solid gold" : "none",
                      transform: isEffect ? "scale(1.08) rotate(-3deg)" : "scale(1)",
                      background: obj?.kind === "monster"
                        ? obj.isBoss
                          ? "linear-gradient(135deg,#991b1b,#431407)"
                          : "linear-gradient(135deg,#7f1d1d,#111827)"
                        : obj?.kind === "block"
                          ? "linear-gradient(135deg,#6b7280,#374151)"
                          : styles.tile.background
                    }}
                  >
                    {isFloating && <span style={styles.float}>{floating.text}</span>}
                    {isPlayer ? "🧍" : obj ? obj.emoji : ""}
                    {obj?.kind === "monster" && (
                      <div style={styles.hpBarOuter}>
                        <div style={{ ...styles.hpBarInner, width: `${Math.max(0, (obj.currentHp / obj.maxHp) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <aside style={{ display: "grid", gap: 16 }}>
            <section style={styles.panel}>
              <h2>🧮 Action</h2>
              <p style={styles.muted}>
                {selectedObj
                  ? selectedObj.kind === "monster"
                    ? `${selectedObj.name} HP ${selectedObj.currentHp}/${selectedObj.maxHp}`
                    : `Mine ${selectedObj.resource}`
                  : "Select something"}
              </p>
              <div style={styles.question}>{q.a} × {q.b} = ?</div>
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && solve()}
                style={styles.input}
              />
              <button onClick={solve} style={styles.button}>
                {selectedObj?.kind === "monster" ? "Attack!" : "Mine!"}
              </button>
            </section>

            <section style={styles.panel}>
              <h2>⚔️ Weapon</h2>
              <p style={{ fontSize: 24 }}>{weapon.emoji} {weapon.name}</p>
              <p>Damage: {weapon.damage}</p>
              {WEAPONS.map((w, i) => (
                <button
                  key={w.name}
                  onClick={() => craftWeapon(i)}
                  style={{
                    ...styles.smallButton,
                    opacity: i <= weaponIndex ? 0.55 : 1
                  }}
                >
                  {i <= weaponIndex ? "Unlocked" : "Craft"} {w.emoji} {w.name}
                </button>
              ))}
            </section>

            <section style={styles.panel}>
              <h2>🎒 Inventory</h2>
              <p>🪨 Stone: {inventory.stone}</p>
              <p>⛓️ Iron: {inventory.iron}</p>
              <p>💎 Diamonds: {inventory.diamonds}</p>
              <p>⭐ Score: {score}</p>
              <p>👹 Monsters Left: {monstersLeft}</p>
            </section>

            <section style={styles.panel}>
              <h2>🏆 Boss Gallery</h2>
              {[0, 1, 2].map(i => {
                const t = inventory.trophies[i];
                return (
                  <div key={i} style={{ ...styles.trophy, background: t ? "#14532d" : "#1f2937" }}>
                    {t ? (
                      <>
                        <div style={{ fontSize: 32 }}>{t.emoji}</div>
                        <strong>{t.name}</strong>
                        <div style={styles.muted}>{t.theme}</div>
                        <small>Defeated with {t.weapon}</small>
                      </>
                    ) : "Locked Boss Trophy"}
                  </div>
                );
              })}
            </section>

            <section style={styles.panel}>
              <p>{message}</p>
              <button onClick={resetCampaign} style={styles.resetButton}>Reset campaign</button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#052e16,#111827)",
    color: "white",
    fontFamily: "Arial",
    padding: 20
  },
  container: { maxWidth: 1200, margin: "0 auto" },
  title: { fontSize: 46, marginBottom: 6 },
  subtitle: { color: "#bbf7d0", fontSize: 20 },
  grid: { display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 20, marginTop: 20 },
  panel: { background: "#0f172a", border: "2px solid #22c55e", borderRadius: 22, padding: 20 },
  boardHeader: { display: "flex", justifyContent: "space-between", marginBottom: 14 },
  tile: {
    position: "relative",
    width: "100%",
    aspectRatio: "1/1",
    borderRadius: 14,
    border: "2px solid #14532d",
    background: "linear-gradient(135deg,#166534,#052e16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 42,
    cursor: "pointer",
    transition: "all .2s ease"
  },
  hpBarOuter: {
    position: "absolute",
    bottom: 6,
    left: 8,
    right: 8,
    height: 7,
    borderRadius: 8,
    background: "#111827",
    overflow: "hidden"
  },
  hpBarInner: { height: "100%", background: "#ef4444", transition: "width .25s ease" },
  float: {
    position: "absolute",
    top: -12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#facc15",
    textShadow: "0 2px 4px black",
    animation: "none"
  },
  muted: { color: "#bbf7d0" },
  question: { fontSize: 58, fontWeight: "bold", margin: "16px 0" },
  input: { width: "100%", boxSizing: "border-box", fontSize: 30, padding: 14, textAlign: "center", borderRadius: 14, border: "none", marginBottom: 12 },
  button: { width: "100%", fontSize: 22, padding: "14px 18px", borderRadius: 14, border: "none", background: "#22c55e", color: "#052e16", fontWeight: "bold", cursor: "pointer" },
  smallButton: { width: "100%", marginTop: 8, padding: 10, borderRadius: 12, border: "1px solid #22c55e", background: "transparent", color: "#bbf7d0", cursor: "pointer" },
  resetButton: { width: "100%", marginTop: 12, padding: 10, borderRadius: 12, border: "1px solid #ef4444", background: "transparent", color: "#fecaca", cursor: "pointer" },
  trophy: { padding: 12, borderRadius: 12, marginBottom: 10, border: "1px solid #374151" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", display: "grid", placeItems: "center", zIndex: 20 },
  bossIntro: { fontSize: 44, fontWeight: "bold", color: "#facc15", textAlign: "center", padding: 30 }
};
