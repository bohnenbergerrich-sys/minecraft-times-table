"use client";

import { useEffect, useState } from "react";

const SIZE = 5;
const BOSSES = [
  { id: "troll", name: "Cave Troll", emoji: "👹" },
  { id: "dragon", name: "Lava Dragon", emoji: "🐉" },
  { id: "king", name: "Ender King", emoji: "💀" },
];
const START_ITEMS = [
  { x: 0, y: 0, type: "gem", emoji: "💎", label: "Gem" },
  { x: 4, y: 0, type: "wood", emoji: "🪵", label: "Wood" },
  { x: 1, y: 1, type: "monster", emoji: "🧟", label: "Goblin" },
  { x: 3, y: 1, type: "gem", emoji: "💎", label: "Gem" },
  { x: 0, y: 2, type: "rock", emoji: "🪨", label: "Rock" },
  { x: 4, y: 2, type: "monster", emoji: "☠️", label: "Skeleton" },
  { x: 2, y: 3, type: "gem", emoji: "💎", label: "Gem" },
  { x: 1, y: 4, type: "monster", emoji: "🧟", label: "Goblin" },
  { x: 3, y: 4, type: "rock", emoji: "🪨", label: "Rock" },
];

function newQuestion() {
  const a = Math.ceil(Math.random() * 10);
  const b = Math.ceil(Math.random() * 10);
  return { a, b, answer: a * b };
}
function clamp(n) { return Math.max(0, Math.min(SIZE - 1, n)); }

export default function Page() {
  const [player, setPlayer] = useState({ x: 2, y: 2 });
  const [items, setItems] = useState(START_ITEMS);
  const [question, setQuestion] = useState(newQuestion());
  const [answer, setAnswer] = useState("");
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState("Clear treasures and monsters to awaken the dungeon boss.");
  const [lives, setLives] = useState(3);
  const [gems, setGems] = useState(0);
  const [wood, setWood] = useState(0);
  const [bossIndex, setBossIndex] = useState(0);
  const [bossAwake, setBossAwake] = useState(false);
  const [bossHP, setBossHP] = useState(3);
  const [gallery, setGallery] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const boss = BOSSES[bossIndex];

  useEffect(() => {
    try { const saved = localStorage.getItem("mathcraft-v10-gallery"); if (saved) setGallery(JSON.parse(saved)); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("mathcraft-v10-gallery", JSON.stringify(gallery)); } catch {} }, [gallery]);
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

  function itemAt(x, y) { return items.find((it) => it.x === x && it.y === y); }
  function isAdjacent(x, y) { return Math.abs(player.x - x) + Math.abs(player.y - y) === 1; }
  function awakenIfCleared(nextItems) {
    if (nextItems.length === 0 && !bossAwake) {
      setBossAwake(true); setBossHP(3); setPending(null);
      setMessage(`⚔️ THE ${boss.name.toUpperCase()} HAS AWAKENED! Answer questions to defeat it.`);
    }
  }
  function move(dx, dy) {
    if (showGallery || pending) return;
    const next = { x: clamp(player.x + dx), y: clamp(player.y + dy) };
    if (next.x === player.x && next.y === player.y) return;
    setPlayer(next);
    const target = itemAt(next.x, next.y);
    if (target) {
      setPending(target); setQuestion(newQuestion()); setAnswer("");
      setMessage(`${target.emoji} ${target.label}: solve to clear it.`);
    } else {
      setMessage(bossAwake ? `Face the ${boss.name}!` : "Keep clearing the dungeon...");
    }
  }
  function tapTile(x, y) {
    if (showGallery || pending) return;
    if (isAdjacent(x, y)) move(x - player.x, y - player.y);
    else setMessage("Tap a glowing neighbouring square, or use arrow keys.");
  }
  function resetDungeon() {
    setItems(START_ITEMS); setPlayer({ x: 2, y: 2 }); setPending(null); setBossAwake(false); setBossHP(3); setLives(3);
    setBossIndex((i) => (i + 1) % BOSSES.length);
  }
  function submit() {
    const numeric = parseInt(answer, 10);
    if (Number.isNaN(numeric)) return;
    if (numeric === question.answer) {
      if (pending) {
        if (pending.type === "gem") setGems((g) => g + 1);
        if (pending.type === "wood") setWood((w) => w + 1);
        const nextItems = items.filter((it) => !(it.x === pending.x && it.y === pending.y));
        setItems(nextItems); setPending(null); setMessage(`✅ Cleared ${pending.emoji} ${pending.label}.`); awakenIfCleared(nextItems);
      } else if (bossAwake) {
        const nextHP = bossHP - 1; setBossHP(nextHP);
        if (nextHP <= 0) {
          setGallery((old) => old.some((g) => g.id === boss.id) ? old : [...old, boss]);
          setMessage(`🏆 ${boss.name} defeated!`); setShowGallery(true); resetDungeon();
        } else setMessage(`💥 Direct hit! ${boss.name} has ${nextHP} HP left.`);
      }
    } else {
      setLives((l) => Math.max(0, l - 1)); setMessage("❌ Not quite. Try the next one — no shame, keep going.");
    }
    setQuestion(newQuestion()); setAnswer("");
  }

  return <main className="page">
    <section className="top"><div><div className="title">MathCraft v0.10.2</div><div className="subtitle">Clear the dungeon. Awaken the boss. Fill the gallery.</div></div><button className="galleryButton" onClick={() => setShowGallery(true)}>🏆</button></section>
    <section className="hud"><span>❤️ {lives}</span><span>💎 {gems}</span><span>🪵 {wood}</span><span>🧹 {START_ITEMS.length - items.length}/{START_ITEMS.length}</span></section>
    <section className={bossAwake ? "bossCard awake" : "bossCard sleeping"}><div className="bossEmoji">{bossAwake ? boss.emoji : "❔"}</div><div className="bossText"><div className="bossName">{bossAwake ? boss.name : "Dungeon Boss Hidden"}</div><div className="bossHint">{bossAwake ? `Boss HP: ${bossHP}/3` : "Clear every treasure and monster to reveal it."}</div><div className="bar"><div style={{ width: `${bossAwake ? (bossHP / 3) * 100 : 100}%` }} /></div></div></section>
    <section className="board">{Array.from({ length: SIZE * SIZE }).map((_, i) => { const x = i % SIZE; const y = Math.floor(i / SIZE); const here = player.x === x && player.y === y; const it = itemAt(x, y); const adjacent = isAdjacent(x, y); return <button key={i} className={`tile ${here ? "player" : ""} ${adjacent ? "adjacent" : ""}`} onClick={() => tapTile(x, y)}>{here ? "🧙" : it ? it.emoji : ""}</button>; })}</section>
    <section className="controls"><button onClick={() => move(0, -1)}>⬆️</button><div><button onClick={() => move(-1, 0)}>⬅️</button><button onClick={() => move(1, 0)}>➡️</button></div><button onClick={() => move(0, 1)}>⬇️</button></section>
    <section className="message">{message}</section>
    {(pending || bossAwake) && <section className="questionPanel"><div className="challenge">{pending ? `${pending.emoji} Clear ${pending.label}` : `${boss.emoji} Attack ${boss.name}`}</div><div className="question">{question.a} × {question.b} = ?</div><input value={answer} onChange={(e) => setAnswer(e.target.value)} inputMode="numeric" autoFocus /><button onClick={submit}>{pending ? "Solve & Clear" : "Solve & Attack"}</button></section>}
    {showGallery && <section className="overlay"><div className="gallery"><h2>🏆 Monster Gallery</h2><p>Defeated dungeon monsters are added here.</p><div className="galleryGrid">{BOSSES.map((b) => { const won = gallery.some((g) => g.id === b.id); return <div className={`slot ${won ? "won" : ""}`} key={b.id}><div className="slotEmoji">{won ? b.emoji : "❓"}</div><div>{won ? b.name : "Empty Slot"}</div></div>; })}</div><button onClick={() => setShowGallery(false)}>Continue Adventure</button></div></section>}
  </main>;
}
