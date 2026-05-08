"use client";
import { useEffect, useMemo, useState } from "react";

const W=6,H=5,SAVE_KEY="mathcraft_v8_save";

const CAMPAIGN=[
 {boss:{name:"Cave Troll",emoji:"🪨",hp:10},tables:[1,2,5],theme:"Stone Caves"},
 {boss:{name:"Lava Dragon",emoji:"🐲",hp:15},tables:[1,2,3,4,5,6],theme:"Lava Fortress"},
 {boss:{name:"Ender King",emoji:"👑",hp:20},tables:[1,2,3,4,5,6,7,8,9,10],theme:"End Realm"},
];

const MONSTERS=[
 {name:"Zombie",emoji:"🧟",hp:3},
 {name:"Spider",emoji:"🕷️",hp:3},
 {name:"Skeleton",emoji:"💀",hp:4},
 {name:"Creeper",emoji:"🧨",hp:4},
];

const BLOCKS=[
 {type:"stone",emoji:"🪨",resource:"stone"},
 {type:"iron",emoji:"⛓️",resource:"iron"},
 {type:"diamond",emoji:"💎",resource:"diamonds"},
];

const WEAPONS=[
 {name:"Wooden Sword",emoji:"🪵⚔️",damage:1,cost:{}},
 {name:"Stone Sword",emoji:"🪨⚔️",damage:2,cost:{stone:4}},
 {name:"Iron Sword",emoji:"⚔️",damage:4,cost:{iron:3,stone:2}},
 {name:"Diamond Sword",emoji:"💎⚔️",damage:7,cost:{diamonds:2,iron:2}},
];

const pick=a=>a[Math.floor(Math.random()*a.length)];
const key=(x,y)=>`${x},${y}`;
const adjacent=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1;

function emptyStats(){
 const s={};
 for(let i=1;i<=10;i++)s[i]={attempts:0,correct:0,wrong:0,streak:0};
 return s;
}

function chooseTable(tables,stats){
 const weighted=tables.map(t=>{
  const s=stats[t]||{attempts:0,correct:0,wrong:0,streak:0};
  const acc=s.attempts? s.correct/s.attempts : .5;
  let w=1;
  if(acc<0.7)w+=5;
  if(s.wrong>2)w+=3;
  if(s.streak>=4&&acc>.85)w-=2;
  return {t,w:Math.max(1,w)};
 });
 const total=weighted.reduce((a,b)=>a+b.w,0);
 let r=Math.random()*total;
 for(const item of weighted){r-=item.w;if(r<=0)return item.t;}
 return pick(tables);
}

function makeProblem(tables,stats){
 const b=chooseTable(tables,stats);
 const a=Math.floor(Math.random()*10)+1;
 return {a,b,answer:a*b,table:b};
}

function updateStats(stats,q,correct){
 const current=stats[q.table]||{attempts:0,correct:0,wrong:0,streak:0};
 return {
  ...stats,
  [q.table]:{
   attempts:current.attempts+1,
   correct:current.correct+(correct?1:0),
   wrong:current.wrong+(correct?0:1),
   streak:correct?current.streak+1:0
  }
 }
}

function mastery(stats,t){
 const s=stats[t]||{attempts:0,correct:0,wrong:0,streak:0};
 if(s.attempts<3)return "new";
 const acc=s.correct/s.attempts;
 if(acc>.85&&s.streak>=4)return "strong";
 if(acc<.6)return "practice";
 return "building";
}

function world(stage,boss=false){
 const w={},used=new Set(["0,0"]);
 function place(o){
  let x,y;
  do{x=Math.floor(Math.random()*W);y=Math.floor(Math.random()*H);}
  while(used.has(key(x,y)));
  used.add(key(x,y));
  w[key(x,y)]={...o};
 }
 for(let i=0;i<7;i++)place({kind:"block",...pick(BLOCKS)});
 if(boss){
  const b=CAMPAIGN[stage].boss;
  place({kind:"monster",...b,currentHp:b.hp,maxHp:b.hp,isBoss:true});
 } else {
  for(let i=0;i<3;i++){
   const m=pick(MONSTERS);
   place({kind:"monster",...m,currentHp:m.hp,maxHp:m.hp});
  }
 }
 return w;
}

export default function Home(){
 const [stage,setStage]=useState(0);
 const [bossMode,setBossMode]=useState(false);
 const [worldState,setWorldState]=useState(()=>world(0,false));
 const [player,setPlayer]=useState({x:0,y:0});
 const [selected,setSelected]=useState(null);
 const [stats,setStats]=useState(()=>emptyStats());
 const [q,setQ]=useState(()=>makeProblem(CAMPAIGN[0].tables,emptyStats()));
 const [answer,setAnswer]=useState("");
 const [inventory,setInventory]=useState({stone:0,iron:0,diamonds:0,trophies:[]});
 const [weaponIndex,setWeaponIndex]=useState(0);
 const [score,setScore]=useState(0);
 const [message,setMessage]=useState("Use arrow keys, tap a green square, or use the D-pad.");
 const [lives,setLives]=useState(3);
 const [campaignComplete,setCampaignComplete]=useState(false);
 const [lastMove,setLastMove]=useState(null);

 const weapon=WEAPONS[weaponIndex];
 const selectedObj=selected?worldState[key(selected.x,selected.y)]:null;
 const tables=CAMPAIGN[stage].tables;

 useEffect(()=>{
  try{
   const raw=localStorage.getItem(SAVE_KEY);
   if(raw){
    const s=JSON.parse(raw);
    setStage(s.stage||0);
    setBossMode(s.bossMode||false);
    setWorldState(s.worldState||world(0,false));
    setPlayer(s.player||{x:0,y:0});
    setStats(s.stats||emptyStats());
    setInventory(s.inventory||{stone:0,iron:0,diamonds:0,trophies:[]});
    setWeaponIndex(s.weaponIndex||0);
    setScore(s.score||0);
    setLives(s.lives||3);
    setCampaignComplete(s.campaignComplete||false);
   }
  }catch{}
 },[]);

 useEffect(()=>{
  localStorage.setItem(SAVE_KEY,JSON.stringify({
   stage,bossMode,worldState,player,stats,inventory,weaponIndex,score,lives,campaignComplete
  }));
 },[stage,bossMode,worldState,player,stats,inventory,weaponIndex,score,lives,campaignComplete]);

 useEffect(()=>{
  function onKey(e){
   if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))e.preventDefault();
   if(e.key==="ArrowUp")move(0,-1);
   if(e.key==="ArrowDown")move(0,1);
   if(e.key==="ArrowLeft")move(-1,0);
   if(e.key==="ArrowRight")move(1,0);
  }
  window.addEventListener("keydown",onKey);
  return ()=>window.removeEventListener("keydown",onKey);
 });

 function isReachable(x,y){
  return adjacent(player,{x,y})&&!worldState[key(x,y)];
 }

 function move(dx,dy){
  if(campaignComplete)return;
  const nx=player.x+dx,ny=player.y+dy;
  if(nx<0||ny<0||nx>=W||ny>=H)return;
  const obj=worldState[key(nx,ny)];
  if(obj){setSelected({x:nx,y:ny});setMessage(obj.kind==="monster"?`${obj.emoji} blocks your way. Solve to attack.`:`${obj.emoji} blocks your way. Solve to mine.`);return;}
  setPlayer({x:nx,y:ny});
  setLastMove({x:nx,y:ny});
  setSelected(null);
  setMessage("Moved. Tap a block or monster, or keep exploring.");
  setTimeout(()=>setLastMove(null),250);
 }

 function clickTile(x,y){
  if(campaignComplete)return;
  const obj=worldState[key(x,y)];
  if(obj){setSelected({x,y});return;}
  if(isReachable(x,y)){
   setPlayer({x,y});
   setLastMove({x,y});
   setSelected(null);
   setMessage("Moved by touch.");
   setTimeout(()=>setLastMove(null),250);
  } else {
   setMessage("Tap a glowing green square next to the player, or use the D-pad.");
  }
 }

 function moveMonsters(next){
  const moved={...next};

  for(const [p,obj] of Object.entries(next)){
   if(obj.kind!=="monster")continue;
   const [x,y]=p.split(",").map(Number);

   if(Math.abs(player.x-x)+Math.abs(player.y-y)===1){
    const newLives=lives-1;
    setLives(newLives);

    if(newLives<=0){
      setLives(3);
      setPlayer({x:0,y:0});
      setWorldState(world(stage,bossMode));
      setSelected(null);
      setMessage("💀 Monsters overwhelmed you! Back to base.");
      return next;
    } else {
      setMessage(`😱 Monster attack! Lost 1 life.`);
    }
   }

   const opts=[
    {x:x+Math.sign(player.x-x),y},
    {x,y:y+Math.sign(player.y-y)}
   ];

   for(const o of opts){
    if(o.x<0||o.y<0||o.x>=W||o.y>=H)continue;
    const target=key(o.x,o.y);
    if(!moved[target]&&!(o.x===player.x&&o.y===player.y)){
      delete moved[p];
      moved[target]=obj;
      break;
    }
   }
  }
  return moved;
 }

 function summonBoss(){
  setBossMode(true);
  setWorldState(world(stage,true));
  setPlayer({x:0,y:0});
  setSelected(null);
  setMessage(`🐉 ${CAMPAIGN[stage].boss.name} has appeared!`);
 }

 function nextStage(){
  if(stage===2){
   setCampaignComplete(true);
   setMessage("🏆 Campaign complete!");
   return;
  }
  const n=stage+1;
  setStage(n);
  setBossMode(false);
  setWorldState(world(n,false));
  setPlayer({x:0,y:0});
  setSelected(null);
  setQ(makeProblem(CAMPAIGN[n].tables,stats));
 }

 function solve(){
  if(!selectedObj)return;

  const correct=Number(answer)===q.answer;
  const updated=updateStats(stats,q,correct);
  setStats(updated);

  if(!correct){
   setMessage(`❌ Wrong! Monsters move closer. Correct answer: ${q.answer}`);
   setWorldState(moveMonsters(worldState));
   setQ(makeProblem(tables,updated));
   setAnswer("");
   return;
  }

  let next={...worldState};
  const p=key(selected.x,selected.y);

  if(selectedObj.kind==="block"){
   delete next[p];
   setInventory(v=>({...v,[selectedObj.resource]:v[selectedObj.resource]+1}));
   setScore(s=>s+1);
  }

  if(selectedObj.kind==="monster"){
   const hit=Math.random()<0.2 ? weapon.damage*2 : weapon.damage;
   const hp=selectedObj.currentHp-hit;

   if(hp<=0){
    delete next[p];

    if(selectedObj.isBoss){
      setInventory(v=>({...v,trophies:[...v.trophies,{name:selectedObj.name,emoji:selectedObj.emoji}]}));
      setTimeout(nextStage,700);
    } else {
      setScore(s=>s+5);
    }
   } else {
    next[p]={...selectedObj,currentHp:hp};
   }
  }

  const remaining=Object.values(next).filter(o=>o.kind==="monster").length;

  if(!bossMode&&remaining===0){
    setWorldState(next);
    setTimeout(summonBoss,500);
  } else {
    setWorldState(moveMonsters(next));
  }

  setSelected(null);
  setAnswer("");
  setQ(makeProblem(tables,updated));
 }

 function craft(i){
  if(i<=weaponIndex)return;
  const w=WEAPONS[i];
  const ok=Object.entries(w.cost).every(([r,a])=>inventory[r]>=a);
  if(!ok){setMessage(`Need more resources for ${w.name}`);return;}
  const next={...inventory};
  Object.entries(w.cost).forEach(([r,a])=>next[r]-=a);
  setInventory(next);
  setWeaponIndex(i);
 }

 function reset(){
  localStorage.removeItem(SAVE_KEY);
  location.reload();
 }

 const practice=tables.filter(t=>mastery(stats,t)==="practice");
 const strong=tables.filter(t=>mastery(stats,t)==="strong");

 return <main style={styles.main}>
  <div style={styles.container}>
   <h1 style={styles.title}>MathCraft v8</h1>
   <p style={styles.subtitle}>Mobile controls + tap-to-move + adaptive learning</p>

   <div style={styles.topbar}>
    <div>{"❤️".repeat(lives)}</div>
    <div>⚔️ {weapon.emoji} {weapon.name}</div>
    <div>⭐ {score}</div>
   </div>

   <div style={styles.layout}>
    <section style={styles.panel}>
      <p style={{color:"#bbf7d0",marginTop:0}}>Tap glowing green squares to move. Tap monsters or blocks to select.</p>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${W},1fr)`,gap:10}}>
      {Array.from({length:W*H}).map((_,i)=>{
       const x=i%W,y=Math.floor(i/W);
       const obj=worldState[key(x,y)];
       const isPlayer=player.x===x&&player.y===y;
       const isSelected=selected&&selected.x===x&&selected.y===y;
       const reachable=isReachable(x,y);
       const moved=lastMove&&lastMove.x===x&&lastMove.y===y;

       return <div key={i} onClick={()=>clickTile(x,y)} style={{
        ...styles.tile,
        outline:isSelected?"4px solid gold":reachable?"4px solid #86efac":"none",
        transform:moved?"scale(1.08)":"scale(1)",
        background:obj?.kind==="monster"
         ? obj.isBoss
          ? "linear-gradient(135deg,#991b1b,#431407)"
          : "linear-gradient(135deg,#7f1d1d,#111827)"
         : obj?.kind==="block"
          ? "linear-gradient(135deg,#6b7280,#374151)"
          : reachable
           ? "linear-gradient(135deg,#22c55e,#166534)"
           : styles.tile.background
       }}>
        {isPlayer?"🧍":obj?obj.emoji:reachable?"·":""}

        {obj?.kind==="monster" &&
          <div style={styles.hpOuter}>
            <div style={{...styles.hpInner,width:`${(obj.currentHp/obj.maxHp)*100}%`}}/>
          </div>
        }
       </div>
      })}
      </div>

      <div style={styles.dpad}>
        <div></div>
        <button style={styles.dpadBtn} onClick={()=>move(0,-1)}>⬆️</button>
        <div></div>
        <button style={styles.dpadBtn} onClick={()=>move(-1,0)}>⬅️</button>
        <button style={styles.dpadBtn} onClick={()=>move(0,1)}>⬇️</button>
        <button style={styles.dpadBtn} onClick={()=>move(1,0)}>➡️</button>
      </div>
    </section>

    <aside style={{display:"grid",gap:16}}>
      <section style={styles.panel}>
       <h2>🧮 Action</h2>
       <div style={styles.question}>{q.a} × {q.b} = ?</div>
       <input value={answer} onChange={e=>setAnswer(e.target.value.replace(/[^0-9]/g,""))} onKeyDown={e=>e.key==="Enter"&&solve()} style={styles.input}/>
       <button onClick={solve} style={styles.button}>Solve</button>
      </section>

      <section style={styles.panel}>
       <h2>🧠 Adaptive Engine</h2>
       <p>Needs practice: {practice.length?practice.map(t=>`×${t}`).join(", "):"none"}</p>
       <p>Strong tables: {strong.length?strong.map(t=>`×${t}`).join(", "):"building..."}</p>
       <div style={styles.tableGrid}>
       {tables.map(t=>{
        const m=mastery(stats,t);
        return <div key={t} style={{...styles.mastery,background:m==="strong"?"#14532d":m==="practice"?"#7f1d1d":"#1f2937"}}>
         <strong>×{t}</strong><small>{m}</small>
        </div>
       })}
       </div>
      </section>

      <section style={styles.panel}>
       <h2>⚔️ Weapons</h2>
       {WEAPONS.map((w,i)=><button key={w.name} onClick={()=>craft(i)} style={styles.smallButton}>{i<=weaponIndex?"Unlocked":"Craft"} {w.emoji} {w.name}</button>)}
      </section>

      <section style={styles.panel}>
       <h2>🏆 Boss Gallery</h2>
       {[0,1,2].map(i=>{
        const t=inventory.trophies[i];
        return <div key={i} style={{padding:12,borderRadius:12,marginBottom:10,background:t?"#14532d":"#1f2937"}}>
         {t?`${t.emoji} ${t.name}`:"Locked Trophy"}
        </div>
       })}
      </section>

      <section style={styles.panel}>
       <p>{message}</p>
       <button onClick={reset} style={styles.resetButton}>Reset campaign</button>
      </section>
    </aside>
   </div>
  </div>
 </main>
}

const styles={
 main:{minHeight:"100vh",background:"linear-gradient(135deg,#052e16,#111827)",color:"white",fontFamily:"Arial",padding:16},
 container:{maxWidth:1200,margin:"0 auto"},
 title:{fontSize:"clamp(32px,6vw,46px)",marginBottom:6},
 subtitle:{color:"#bbf7d0",fontSize:"clamp(16px,3vw,20px)"},
 topbar:{display:"flex",gap:14,fontSize:"clamp(18px,4vw,22px)",marginBottom:18,flexWrap:"wrap"},
 layout:{display:"grid",gridTemplateColumns:"minmax(0,1.2fr) minmax(300px,.8fr)",gap:20},
 panel:{background:"#0f172a",border:"2px solid #22c55e",borderRadius:22,padding:16},
 tile:{position:"relative",width:"100%",aspectRatio:"1/1",borderRadius:14,border:"2px solid #14532d",background:"linear-gradient(135deg,#166534,#052e16)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"clamp(28px,6vw,42px)",cursor:"pointer",transition:"all .18s ease",touchAction:"manipulation"},
 hpOuter:{position:"absolute",bottom:6,left:8,right:8,height:7,borderRadius:8,background:"#111827",overflow:"hidden"},
 hpInner:{height:"100%",background:"#ef4444"},
 question:{fontSize:"clamp(40px,8vw,58px)",fontWeight:"bold",margin:"16px 0"},
 input:{width:"100%",boxSizing:"border-box",fontSize:30,padding:14,textAlign:"center",borderRadius:14,border:"none",marginBottom:12},
 button:{width:"100%",fontSize:22,padding:"14px 18px",borderRadius:14,border:"none",background:"#22c55e",color:"#052e16",fontWeight:"bold"},
 smallButton:{width:"100%",marginTop:8,padding:10,borderRadius:12,border:"1px solid #22c55e",background:"transparent",color:"#bbf7d0"},
 resetButton:{width:"100%",marginTop:12,padding:10,borderRadius:12,border:"1px solid #ef4444",background:"transparent",color:"#fecaca"},
 tableGrid:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8},
 mastery:{borderRadius:10,padding:8,display:"grid",gap:3},
 dpad:{display:"grid",gridTemplateColumns:"repeat(3,64px)",gap:8,justifyContent:"center",marginTop:18},
 dpadBtn:{width:64,height:54,borderRadius:16,border:"2px solid #22c55e",background:"#052e16",color:"white",fontSize:24}
}
