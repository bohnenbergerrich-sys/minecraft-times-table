"use client";

import { useEffect, useState } from "react";

const SIZE = 5;

const BOSSES = [
  { id: "troll", name: "Cave Troll", emoji: "👹" },
  { id: "dragon", name: "Lava Dragon", emoji: "🐉" },
  { id: "king", name: "Ender King", emoji: "💀" },
];

const START_ITEMS = [
  { id: "gem-1", x: 0, y: 0, type: "gem", emoji: "💎", label: "Gem" },
  { id: "wood-1", x: 4, y: 0, type: "wood", emoji: "🪵", label: "Wood" },
  { id: "monster-1", x: 1, y: 1, type: "monster", emoji: "🧟", label: "Goblin" },
  { id: "gem-2", x: 3, y: 1, type: "gem", emoji: "💎", label: "Gem" },
  { id: "rock-1", x: 0, y: 2, type: "rock", emoji: "🪨", label: "Rock" },
  { id: "monster-2", x: 4, y: 2, type: "monster", emoji: "☠️", label: "Skeleton" },
  { id: "gem-3", x: 2, y: 3, type: "gem", emoji: "💎", label: "Gem" },
  { id: "monster-3", x: 1, y: 4, type: "monster", emoji: "🧟", label: "Goblin" },
  { id: "rock-2", x: 3, y: 4, type: "rock", emoji: "🪨", label: "Rock" },
];

function newQuestion() {
  const a = Math.ceil(Math.random() * 10);
  const b = Math.ceil(Math.random() * 10);
  return { a, b, answer: a * b };
}

function clamp(n) {
  return Math.max(0, Math.min(SIZE - 1, n));
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function stepToward(monster, player, occupied) {
  const options = [];

  if (monster.x < player.x) options.push({ ...monster, x: monster.x + 1 });
  if (monster.x > player.x) options.push({ ...monster, x: monster.x - 1 });
  if (monster.y < player.y) options.push({ ...monster, y: monster.y + 1 });
  if (monster.y > player.y) options.push({ ...monster, y: monster.y - 1 });

  const legal = options
    .map((o) => ({ ...o, x: clamp(o.x), y: clamp(o.y) }))
    .filter((o) => !occupied.some((p) => p.x === o.x && p.y === o.y && p.id !== monster.id))
    .sort((a, b) => distance(a, player) - distance(b, player));

  return legal[0] || monster;
}

export default function Page() {
  const [player, setPlayer] = useState({ x: 2, y: 2 });
  const [items, setItems] = useState(START_ITEMS);
  const [question, setQuestion] = useState(newQuestion());
  const [answer, setAnswer] = useState("");
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState("Clear the dungeon to awaken the boss.");
  const [lives, setLives] = useState(3);
  const [gems, setGems] = useState(0);
  const [wood, setWood] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [bossIndex, setBossIndex] = useState(0);
  const [bossAwake, setBossAwake] = useState(false);
  const [bossHP, setBossHP] = useState(3);
  const [gallery, setGallery] = useState([]);
  const [showGallery, setShowGallery] = useState(false);

  const boss = BOSSES[bossIndex];
  const progressText = `${START_ITEMS.length - items.length}/${START_ITEMS.length} cleared`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mathcraft-v10-gallery");
      if (saved) setGallery(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mathcraft-v10-gallery", JSON.stringify(gallery));
    } catch {}
  }, [gallery]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowUp") move(0, -1);
      if (e.key === "ArrowDown") move(0, 1);
      if (e.key === "ArrowLeft") move(-1, 0);
      if (e.key === "ArrowRight") move(1, 0);
      if (e.key === "Enter" && (pending || bossAwake)) submit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function itemAt(x, y) {
    return items.find((it) => it.x === x && it.y === y);
  }

  function isAdjacent(x, y) {
    return Math.abs(player.x - x) + Math.abs(player.y - y) === 1;
  }

  function monsterPressure(reason) {
    if (bossAwake) return;

    let attacked = false;

    setItems((current) => {
      const monsters = current.filter((it) => it.type === "monster");
      const nonMonsters = current.filter((it) => it.type !== "monster");
      const movedMonsters = [];

      for (const monster of monsters) {
        const next = stepToward(monster, player, [...nonMonsters, ...movedMonsters, ...monsters]);
        if (distance(next, player) === 0 || distance(next, player) === 1) {
          attacked = true;
        }
        movedMonsters.push(next);
      }

      return [...nonMonsters, ...movedMonsters];
    });

    if (attacked) {
      setLives((l) => Math.max(0, l - 1));
      setMessage(`💥 A monster attacks! You lose one heart. ${reason}`);
    } else {
      setMessage(`👣 The monsters move closer. ${reason}`);
    }
  }

  function countSolvedPuzzle() {
    setSolvedCount((count) => {
      const next = count + 1;
      if (next % 2 === 0) {
        setTimeout(() => monsterPressure("They move after every two puzzles."), 0);
      }
      return next;
    });
  }

  function move(dx, dy) {
    if (pending || showGallery) return;

    const next = { x: clamp(player.x + dx), y: clamp(player.y + dy) };
    if (next.x === player.x && next.y === player.y) return;

    setPlayer(next);

    const target = itemAt(next.x, next.y);
    if (target) {
      setPending(target);
      setQuestion(newQuestion());
      setAnswer("");
      setMessage(`${target.emoji} ${target.label}: solve to clear it.`);
      return;
    }

    setMessage(bossAwake ? `Face the ${boss.name}!` : "Keep exploring...");
  }

  function tapTile(x, y) {
    if (pending || showGallery) return;
    if (x === player.x && y === player.y) return;

    if (isAdjacent(x, y)) {
      move(x - player.x, y - player.y);
    } else {
      setMessage("Tap a glowing neighbouring square to move.");
    }
  }

  function maybeAwakenBoss(nextItems) {
    if (nextItems.length === 0 && !bossAwake) {
      setBossAwake(true);
      setBossHP(3);
      setMessage(`⚔️ THE ${boss.name.toUpperCase()} HAS AWAKENED!`);
    }
  }

  function submit() {
    const numeric = parseInt(answer, 10);
    if (Number.isNaN(numeric)) return;

    const correct = numeric === question.answer;

    if (correct) {
      countSolvedPuzzle();

      if (bossAwake && !pending) {
        const nextHP = bossHP - 1;
        setBossHP(nextHP);

        if (nextHP <= 0) {
          const newGallery = gallery.some((g) => g.id === boss.id)
            ? gallery
            : [...gallery, boss];

          setGallery(newGallery);
          setShowGallery(true);
          setMessage(`🏆 ${boss.name} defeated!`);
          resetDungeon();
        } else {
          setMessage(`💥 Direct hit! ${boss.name} has ${nextHP} HP left.`);
        }
      } else if (pending) {
        if (pending.type === "gem") setGems((g) => g + 1);
        if (pending.type === "wood") setWood((w) => w + 1);

        const nextItems = items.filter((it) => it.id !== pending.id);
        setItems(nextItems);
        setPending(null);
        setMessage(`✅ Solved & cleared ${pending.emoji} ${pending.label}.`);
        maybeAwakenBoss(nextItems);
      }
    } else {
      setLives((l) => Math.max(0, l - 1));
      monsterPressure("Wrong answers make them move immediately.");
      setMessage("❌ Not quite. A monster moves closer!");
    }

    setQuestion(newQuestion());
    setAnswer("");
  }

  function resetDungeon() {
    const nextBossIndex = (bossIndex + 1) % BOSSES.length;
    setItems(START_ITEMS);
    setPlayer({ x: 2, y: 2 });
    setPending(null);
    setBossAwake(false);
    setBossHP(3);
    setBossIndex(nextBossIndex);
    setLives(3);
    setSolvedCount(0);
  }

  function bossFightQuestion() {
    setPending(null);
    setQuestion(newQuestion());
    setAnswer("");
    setMessage(`Answer to attack the ${boss.name}!`);
  }

  const canAttackBoss = bossAwake && !pending;

  return (
    <main className="page">
      <section className="top">
        <div>
          <div className="title">MathCraft v0.10.3</div>
          <div className="subtitle">Clear treasures and monsters. Survive monster pressure.</div>
        </div>
        <button className="galleryButton" onClick={() => setShowGallery(true)}>🏆</button>
      </section>

      <section className="hud">
        <span>❤️ {lives}</span>
        <span>💎 {gems}</span>
        <span>🪵 {wood}</span>
        <span>🧹 {progressText}</span>
      </section>

      <section className={bossAwake ? "bossCard awake" : "bossCard sleeping"}>
        <div className="bossEmoji">{bossAwake ? boss.emoji : "❔"}</div>
        <div>
          <div className="bossName">{bossAwake ? boss.name : "Dungeon Boss Hidden"}</div>
          <div className="bossHint">
            {bossAwake ? `Boss HP: ${bossHP}/3` : "Clear every monster and treasure to reveal it."}
          </div>
          <div className="bar"><div style={{ width: `${bossAwake ? (bossHP / 3) * 100 : 100}%` }} /></div>
        </div>
      </section>

      <section className="board">
        {Array.from({ length: SIZE * SIZE }).map((_, i) => {
          const x = i % SIZE;
          const y = Math.floor(i / SIZE);
          const here = player.x === x && player.y === y;
          const it = itemAt(x, y);
          const adjacent = isAdjacent(x, y);

          return (
            <button
              key={i}
              className={`tile ${here ? "player" : ""} ${adjacent ? "adjacent" : ""} ${it?.type === "monster" ? "monsterTile" : ""}`}
              onClick={() => tapTile(x, y)}
            >
              {here ? "🧙" : it ? it.emoji : ""}
            </button>
          );
        })}
      </section>

      <section className="controls">
        <button onClick={() => move(0, -1)}>⬆️</button>
        <div>
          <button onClick={() => move(-1, 0)}>⬅️</button>
          <button onClick={() => move(1, 0)}>➡️</button>
        </div>
        <button onClick={() => move(0, 1)}>⬇️</button>
      </section>

      <section className="message">{message}</section>

      {(pending || canAttackBoss) && (
        <section className="questionPanel">
          <div className="challenge">
            {pending ? `${pending.emoji} Clear ${pending.label}` : `${boss.emoji} Attack ${boss.name}`}
          </div>
          <div className="question">{question.a} × {question.b} = ?</div>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            inputMode="numeric"
            autoFocus
          />
          <button onClick={submit}>{pending ? "Solve & Clear" : "Solve & Attack"}</button>
          {canAttackBoss && <button className="secondary" onClick={bossFightQuestion}>New boss question</button>}
        </section>
      )}

      {showGallery && (
        <section className="overlay">
          <div className="gallery">
            <h2>🏆 Monster Gallery</h2>
            <p>Defeated dungeon monsters are added here.</p>
            <div className="galleryGrid">
              {BOSSES.map((b) => {
                const won = gallery.some((g) => g.id === b.id);
                return (
                  <div className={`slot ${won ? "won" : ""}`} key={b.id}>
                    <div className="slotEmoji">{won ? b.emoji : "❓"}</div>
                    <div>{won ? b.name : "Empty Slot"}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowGallery(false)}>Continue Adventure</button>
          </div>
        </section>
      )}
    </main>
  );
}
