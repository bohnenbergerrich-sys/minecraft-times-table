'use client';

import { useEffect, useMemo, useState } from 'react';

const VERSION = 'v0.9.0-mobile-first';
const GRID = 6;
const START_POS = { x: 0, y: 0 };

const BOSSES = [
  { name: 'Cave Troll', emoji: '🧌', hp: 20, tableBias: [2, 3, 4] },
  { name: 'Lava Dragon', emoji: '🐉', hp: 32, tableBias: [5, 6, 7] },
  { name: 'Ender King', emoji: '👑', hp: 45, tableBias: [8, 9, 10, 11, 12] },
];

const TILE_TYPES = {
  empty: { emoji: '', label: 'Floor' },
  rock: { emoji: '🪨', label: 'Rock' },
  wood: { emoji: '🪵', label: 'Wood' },
  gem: { emoji: '💎', label: 'Gem' },
  monster: { emoji: '🧟', label: 'Monster' },
  boss: { emoji: '👑', label: 'Boss' },
  chest: { emoji: '🎁', label: 'Chest' },
};

const makeStats = () => {
  const stats = {};
  for (let i = 1; i <= 12; i++) stats[i] = { attempts: 0, correct: 0, wrong: 0, streak: 0 };
  return stats;
};

const initialState = () => ({
  player: START_POS,
  lives: 3,
  stars: 0,
  wood: 0,
  stone: 0,
  gems: 0,
  weapon: { name: 'Wooden Sword', power: 4, emoji: '⚔️' },
  bossIndex: 0,
  bossHp: BOSSES[0].hp,
  trophies: [],
  stats: makeStats(),
  log: ['Welcome to MathCraft. Tap a glowing tile to move or act.'],
  boardSeed: 1,
});

function rand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function makeBoard(seed, bossIndex) {
  const board = Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => ({ type: 'empty' })));
  board[0][0] = { type: 'base' };
  const items = [
    ['rock', 5], ['wood', 5], ['gem', 4], ['monster', 4], ['chest', 2]
  ];
  let s = seed * 17 + bossIndex * 101;
  for (const [type, count] of items) {
    for (let i = 0; i < count; i++) {
      let placed = false;
      let tries = 0;
      while (!placed && tries < 80) {
        tries++;
        s += 1;
        const x = Math.floor(rand(s) * GRID);
        const y = Math.floor(rand(s + 99) * GRID);
        if ((x === 0 && y === 0) || board[y][x].type !== 'empty') continue;
        board[y][x] = { type };
        placed = true;
      }
    }
  }
  board[GRID - 1][GRID - 1] = { type: 'boss' };
  return board;
}

function keyOf(pos) { return `${pos.x},${pos.y}`; }
function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function adjacent(a, b) { return dist(a, b) === 1; }

function pickQuestion(stats, boss) {
  const tables = Object.keys(stats).map(Number);
  const weighted = [];
  for (const t of tables) {
    const s = stats[t];
    let weight = 3;
    if (s.attempts === 0) weight += 4;
    weight += s.wrong * 2;
    if (s.streak >= 3) weight -= 2;
    if (boss.tableBias.includes(t)) weight += 2;
    for (let i = 0; i < Math.max(1, weight); i++) weighted.push(t);
  }
  const a = weighted[Math.floor(Math.random() * weighted.length)] || 2;
  const b = Math.floor(Math.random() * 12) + 1;
  return { a, b, answer: a * b };
}

export default function Page() {
  const [game, setGame] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mathcraft-v090');
      if (saved) setGame(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem('mathcraft-v090', JSON.stringify(game));
  }, [game, hydrated]);

  const boss = BOSSES[game.bossIndex];
  const board = useMemo(() => makeBoard(game.boardSeed, game.bossIndex), [game.boardSeed, game.bossIndex]);
  const movable = useMemo(() => {
    const set = new Set();
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    dirs.forEach(([dx, dy]) => {
      const p = { x: game.player.x + dx, y: game.player.y + dy };
      if (p.x >= 0 && p.y >= 0 && p.x < GRID && p.y < GRID) set.add(keyOf(p));
    });
    return set;
  }, [game.player]);

  function tileAt(pos) { return board[pos.y]?.[pos.x] || { type: 'empty' }; }

  function appendLog(text) {
    setGame(g => ({ ...g, log: [text, ...g.log].slice(0, 3) }));
  }

  function tapTile(x, y) {
    const pos = { x, y };
    if (!adjacent(game.player, pos)) {
      setFeedback('Tap one of the glowing neighbour tiles.');
      return;
    }
    const tile = tileAt(pos);
    setSelected(pos);
    if (tile.type === 'empty' || tile.type === 'base') {
      setGame(g => ({ ...g, player: pos }));
      setFeedback('Moved.');
      return;
    }
    setQuestion({ ...pickQuestion(game.stats, boss), target: pos, type: tile.type });
    setAnswer('');
    setFeedback('Solve to act!');
  }

  function monsterPressure(wasWrong = false) {
    setGame(g => {
      let lives = g.lives;
      let player = g.player;
      let log = g.log;
      if (wasWrong) {
        lives -= 1;
        log = ['A monster attacks! Lose one life.', ...log].slice(0, 3);
      }
      if (lives <= 0) {
        lives = 3;
        player = START_POS;
        log = ['Back to base! Take a breath and try again.', ...log].slice(0, 3);
      }
      return { ...g, lives, player, log };
    });
  }

  function solve() {
    if (!question) return;
    const value = Number(answer);
    if (!Number.isFinite(value)) return;
    const correct = value === question.answer;
    setGame(g => {
      const stats = { ...g.stats, [question.a]: { ...g.stats[question.a] } };
      stats[question.a].attempts += 1;
      if (correct) {
        stats[question.a].correct += 1;
        stats[question.a].streak += 1;
      } else {
        stats[question.a].wrong += 1;
        stats[question.a].streak = 0;
      }
      if (!correct) return { ...g, stats };

      let next = { ...g, stats, player: question.target, stars: g.stars + 1 };
      if (question.type === 'wood') next.wood += 1;
      if (question.type === 'rock') next.stone += 1;
      if (question.type === 'gem') next.gems += 1;
      if (question.type === 'chest') { next.gems += 1; next.wood += 1; }
      if (question.type === 'monster') next.stars += 2;
      if (question.type === 'boss') {
        const newHp = Math.max(0, g.bossHp - g.weapon.power);
        next.bossHp = newHp;
        if (newHp === 0) {
          const trophy = `${boss.emoji} ${boss.name}`;
          const nextBoss = Math.min(g.bossIndex + 1, BOSSES.length - 1);
          next.trophies = Array.from(new Set([...g.trophies, trophy]));
          next.bossIndex = nextBoss;
          next.bossHp = BOSSES[nextBoss].hp;
          next.boardSeed = g.boardSeed + 1;
          next.player = START_POS;
          next.log = [`Boss defeated: ${boss.name}!`, ...g.log].slice(0, 3);
        }
      }
      if (next.wood >= 2 && next.stone >= 2 && next.weapon.power < 7) {
        next.weapon = { name: 'Stone Sword', power: 7, emoji: '🗡️' };
        next.wood -= 2; next.stone -= 2;
      }
      if (next.gems >= 3 && next.weapon.power < 10) {
        next.weapon = { name: 'Diamond Sword', power: 10, emoji: '💎⚔️' };
        next.gems -= 3;
      }
      next.log = [`Correct! ${TILE_TYPES[question.type]?.label || 'Action'} cleared.`, ...(next.log || g.log)].slice(0, 3);
      return next;
    });

    if (!correct) {
      setFeedback(`Not quite. ${question.a} × ${question.b} = ${question.answer}`);
      monsterPressure(true);
    } else {
      setFeedback('Great!');
      setQuestion(null);
      setSelected(null);
    }
  }

  const weakTables = Object.entries(game.stats).filter(([,s]) => s.wrong > 0 || s.streak < 2).slice(0, 5).map(([t]) => t);
  const strongTables = Object.entries(game.stats).filter(([,s]) => s.streak >= 3).map(([t]) => t);

  return (
    <main>
      <div className="phoneShell">
        <header className="topbar">
          <div>
            <div className="title">MathCraft</div>
            <div className="version">{VERSION}</div>
          </div>
          <button className="smallBtn" onClick={() => setShowHelp(true)}>?</button>
        </header>

        <section className="statusBar">
          <span>{'❤️'.repeat(game.lives)}</span>
          <span>{game.weapon.emoji} {game.weapon.name}</span>
          <span>⭐ {game.stars}</span>
        </section>

        <section className="bossBar">
          <div><b>{boss.emoji} {boss.name}</b></div>
          <div className="hpTrack"><div className="hpFill" style={{ width: `${(game.bossHp / boss.hp) * 100}%` }} /></div>
        </section>

        <section className="boardWrap">
          <div className="board">
            {board.map((row, y) => row.map((tile, x) => {
              const pos = { x, y };
              const isPlayer = game.player.x === x && game.player.y === y;
              const canMove = movable.has(keyOf(pos));
              const isSelected = selected?.x === x && selected?.y === y;
              return (
                <button key={`${x}-${y}`} className={`tile ${canMove ? 'move' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => tapTile(x, y)}>
                  <span>{isPlayer ? '🧍' : (tile.type === 'base' ? '🏠' : TILE_TYPES[tile.type]?.emoji)}</span>
                </button>
              );
            }))}
          </div>
        </section>

        <section className={`actionSheet ${question ? 'open' : ''}`}>
          {question ? (
            <>
              <div className="sheetLabel">{TILE_TYPES[question.type]?.emoji} Action challenge</div>
              <div className="sum">{question.a} × {question.b} = ?</div>
              <div className="answerRow">
                <input inputMode="numeric" value={answer} onChange={e => setAnswer(e.target.value.replace(/[^0-9]/g, ''))} autoFocus />
                <button onClick={solve}>Solve</button>
              </div>
            </>
          ) : (
            <div className="hint">Tap a glowing tile. Solve questions to mine, fight, and collect.</div>
          )}
        </section>

        <nav className="bottomNav">
          <button onClick={() => setShowProgress(true)}>🧠 Progress</button>
          <button onClick={() => appendLog('Crafting happens automatically when you have enough resources.')}>🛠️ Craft</button>
          <button onClick={() => setGame(g => ({ ...g, boardSeed: g.boardSeed + 1, player: START_POS }))}>🗺️ New room</button>
        </nav>

        <section className="miniLog">
          <div>{feedback || game.log[0]}</div>
          <div className="resources">🪵 {game.wood} · 🪨 {game.stone} · 💎 {game.gems}</div>
        </section>
      </div>

      {showProgress && <Modal title="Adaptive Engine" onClose={() => setShowProgress(false)}>
        <p>The game gives more practice to tables that need it and reduces tables with strong streaks.</p>
        <div className="chips"><b>Needs practice:</b> {weakTables.length ? weakTables.map(t => <span key={t}>×{t}</span>) : 'None yet'}</div>
        <div className="chips"><b>Strong:</b> {strongTables.length ? strongTables.map(t => <span key={t}>×{t}</span>) : 'Build a 3-answer streak'}</div>
      </Modal>}
      {showHelp && <Modal title="How to play" onClose={() => setShowHelp(false)}>
        <p>Tap a glowing neighbouring square to move. If the square has a rock, wood, gem, monster, chest, or boss, answer a multiplication question to act.</p>
        <p>Wrong answers cost a life, but there is no shame: when lives run out, you go back to base and continue.</p>
      </Modal>}
      <style jsx global>{styles}</style>
    </main>
  );
}

function Modal({ title, children, onClose }) {
  return <div className="modalBackdrop" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modalHead"><h2>{title}</h2><button onClick={onClose}>×</button></div>
      {children}
    </div>
  </div>;
}

const styles = `
*{box-sizing:border-box} html,body{margin:0;background:#07130e;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif} button,input{font:inherit}
main{min-height:100dvh;background:linear-gradient(180deg,#042512,#07130e);display:flex;justify-content:center}.phoneShell{width:100%;max-width:520px;min-height:100dvh;padding:12px;display:grid;grid-template-rows:auto auto auto 1fr auto auto auto;gap:8px}.topbar{display:flex;justify-content:space-between;align-items:center;padding:6px 4px}.title{font-size:clamp(24px,7vw,36px);font-weight:900;line-height:1}.version{font-size:12px;opacity:.7;margin-top:3px}.smallBtn{width:38px;height:38px;border-radius:999px;border:2px solid #2ecc71;background:#102018;color:#fff;font-weight:900}.statusBar,.bossBar,.miniLog{background:rgba(9,20,34,.82);border:2px solid rgba(46,204,113,.55);border-radius:18px;padding:10px}.statusBar{display:flex;gap:10px;align-items:center;justify-content:space-between;font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden}.bossBar{display:grid;gap:6px}.hpTrack{height:12px;background:#243044;border-radius:20px;overflow:hidden}.hpFill{height:100%;background:linear-gradient(90deg,#22c55e,#facc15,#ef4444);border-radius:20px}.boardWrap{min-height:0;display:flex;align-items:center;justify-content:center}.board{width:min(94vw,500px);aspect-ratio:1/1;display:grid;grid-template-columns:repeat(6,1fr);gap:7px;padding:8px;border:3px solid #2ecc71;border-radius:24px;background:rgba(2,10,20,.75);box-shadow:0 16px 40px rgba(0,0,0,.35)}.tile{border:0;border-radius:18px;background:linear-gradient(145deg,#0d5a2d,#08391d);box-shadow:inset 0 -6px 0 rgba(0,0,0,.25),0 2px 0 rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:clamp(26px,9vw,48px);min-width:0;min-height:0;color:#fff}.tile.move{outline:4px solid #66ff99;animation:pulse 1.1s infinite}.tile.selected{outline:4px solid #facc15}@keyframes pulse{50%{filter:brightness(1.35);transform:scale(1.03)}}.actionSheet{background:rgba(9,20,34,.95);border:2px solid rgba(46,204,113,.55);border-radius:22px;padding:12px;min-height:66px}.actionSheet.open{border-color:#66ff99}.sheetLabel{font-weight:800;opacity:.9}.sum{font-size:clamp(36px,12vw,56px);font-weight:950;margin:2px 0 8px}.answerRow{display:grid;grid-template-columns:1fr 120px;gap:10px}.answerRow input{height:54px;border-radius:16px;border:0;padding:0 16px;font-size:28px;font-weight:900}.answerRow button,.bottomNav button{border:0;border-radius:16px;background:#27c463;color:#06120b;font-weight:950}.bottomNav{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.bottomNav button{min-height:48px;font-size:14px}.hint{font-weight:700;opacity:.88}.miniLog{font-size:13px;display:flex;justify-content:space-between;gap:8px}.resources{white-space:nowrap;font-weight:900}.modalBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center;padding:14px;z-index:10}.modal{width:100%;max-width:520px;background:#101827;border:2px solid #2ecc71;border-radius:24px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.45)}.modalHead{display:flex;justify-content:space-between;align-items:center}.modal h2{margin:0;font-size:24px}.modalHead button{width:38px;height:38px;border-radius:50%;border:0;background:#23304a;color:#fff;font-size:24px}.chips{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.chips span{background:#173b29;border:1px solid #2ecc71;border-radius:999px;padding:6px 10px;font-weight:900}@media (min-width:760px){.phoneShell{max-width:760px}.board{width:min(66vh,560px)}.statusBar{font-size:16px}.bottomNav button{font-size:16px}}
`;
