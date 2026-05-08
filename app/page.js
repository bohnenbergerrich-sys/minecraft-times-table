
"use client";
import {useState,useEffect,useMemo} from "react";

const CAMPAIGN=[
 {boss:{name:"Cave Troll",emoji:"🪨",hp:8},tables:[1,2,5],theme:"Stone Caves"},
 {boss:{name:"Lava Dragon",emoji:"🐲",hp:12},tables:[3,4,6],theme:"Lava Fortress"},
 {boss:{name:"Ender King",emoji:"👑",hp:16},tables:[7,8,9],theme:"End Realm"},
];

const MONSTERS=[
 {name:"Zombie",emoji:"🧟",hp:2},
 {name:"Spider",emoji:"🕷️",hp:2},
 {name:"Skeleton",emoji:"💀",hp:3},
];

const BLOCKS=[
 {type:"stone",emoji:"🪨",resource:"stone"},
 {type:"iron",emoji:"⛓️",resource:"iron"},
 {type:"diamond",emoji:"💎",resource:"diamonds"},
];

const W=6,H=5;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const k=(x,y)=>`${x},${y}`;

function problem(tables){
 const a=Math.floor(Math.random()*10)+1;
 const b=pick(tables);
 return {a,b,answer:a*b};
}

function world(stage,boss=false){
 const w={},used=new Set(["0,0"]);
 function place(o){
  let x,y;
  do{
   x=Math.floor(Math.random()*W);
   y=Math.floor(Math.random()*H);
  }while(used.has(k(x,y)));
  used.add(k(x,y));
  w[k(x,y)]={...o};
 }
 for(let i=0;i<7;i++)place({kind:"block",...pick(BLOCKS)});
 if(boss){
  place({kind:"monster",...CAMPAIGN[stage].boss,currentHp:CAMPAIGN[stage].boss.hp,isBoss:true});
 } else {
  for(let i=0;i<3;i++){
   const m=pick(MONSTERS);
   place({kind:"monster",...m,currentHp:m.hp});
  }
 }
 return w;
}

export default function Home(){
 const [stage,setStage]=useState(0);
 const [bossMode,setBossMode]=useState(false);
 const [player,setPlayer]=useState({x:0,y:0});
 const [worldState,setWorldState]=useState(()=>world(0,false));
 const [selected,setSelected]=useState(null);
 const [answer,setAnswer]=useState("");
 const [message,setMessage]=useState("Defeat all monsters to summon the boss.");
 const [inventory,setInventory]=useState({stone:0,iron:0,diamonds:0,trophies:[]});
 const [score,setScore]=useState(0);
 const [q,setQ]=useState(()=>problem(CAMPAIGN[0].tables));

 const selectedObj=selected?worldState[k(selected.x,selected.y)]:null;
 const damage=1+Math.floor(inventory.iron/2)+inventory.diamonds*2;

 const monstersLeft=useMemo(()=>Object.values(worldState).filter(o=>o.kind==="monster").length,[worldState]);

 useEffect(()=>{
  function keyMove(e){
   if(e.key==="ArrowUp")move(0,-1);
   if(e.key==="ArrowDown")move(0,1);
   if(e.key==="ArrowLeft")move(-1,0);
   if(e.key==="ArrowRight")move(1,0);
  }
  window.addEventListener("keydown",keyMove);
  return ()=>window.removeEventListener("keydown",keyMove);
 });

 function move(dx,dy){
  const nx=player.x+dx,ny=player.y+dy;
  if(nx<0||ny<0||nx>=W||ny>=H)return;
  const obj=worldState[k(nx,ny)];
  if(obj){
   setSelected({x:nx,y:ny});
   return;
  }
  setPlayer({x:nx,y:ny});
 }

 function clickTile(x,y){
  const obj=worldState[k(x,y)];
  if(obj)setSelected({x,y});
 }

 function moveMonsters(next){
  const moved={...next};
  for(const [keyPos,obj] of Object.entries(next)){
   if(obj.kind!=="monster")continue;
   const [x,y]=keyPos.split(",").map(Number);
   const opts=[
    {x:x+Math.sign(player.x-x),y},
    {x,y:y+Math.sign(player.y-y)}
   ];
   for(const o of opts){
    if(o.x<0||o.y<0||o.x>=W||o.y>=H)continue;
    if(!moved[k(o.x,o.y)] && !(o.x===player.x&&o.y===player.y)){
      delete moved[keyPos];
      moved[k(o.x,o.y)]=obj;
      break;
    }
   }
  }
  return moved;
 }

 function nextStage(){
  if(stage===2){
   setMessage("🏆 Campaign complete!");
   return;
  }
  const n=stage+1;
  setStage(n);
  setBossMode(false);
  setWorldState(world(n,false));
  setPlayer({x:0,y:0});
  setQ(problem(CAMPAIGN[n].tables));
 }

 function solve(){
  if(!selectedObj)return;

  if(Number(answer)!==q.answer){
   setMessage("❌ Wrong answer");
   return;
  }

  let next={...worldState};
  const keyPos=k(selected.x,selected.y);

  if(selectedObj.kind==="block"){
   delete next[keyPos];
   setInventory(v=>({...v,[selectedObj.resource]:v[selectedObj.resource]+1}));
  }

  if(selectedObj.kind==="monster"){
   const hp=selectedObj.currentHp-damage;

   if(hp<=0){
    delete next[keyPos];

    if(selectedObj.isBoss){
      setInventory(v=>({
       ...v,
       trophies:[...v.trophies,{
        name:selectedObj.name,
        emoji:selectedObj.emoji,
        theme:CAMPAIGN[stage].theme
       }]
      }));
      setTimeout(nextStage,800);
    } else {
      setScore(s=>s+5);
    }

   } else {
    next[keyPos]={...selectedObj,currentHp:hp};
   }
  }

  const remaining=Object.values(next).filter(o=>o.kind==="monster").length;

  if(!bossMode && remaining===0){
    setBossMode(true);
    setWorldState(world(stage,true));
    setMessage(`🐉 ${CAMPAIGN[stage].boss.name} appeared!`);
  } else {
    setWorldState(moveMonsters(next));
  }

  setSelected(null);
  setAnswer("");
  setQ(problem(CAMPAIGN[stage].tables));
 }

 return <main style={{minHeight:"100vh",background:"linear-gradient(135deg,#052e16,#111827)",color:"white",fontFamily:"Arial",padding:20}}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <h1>MathCraft Campaign</h1>
   <p>{CAMPAIGN[stage].theme} · Stage {stage+1}/3</p>

   <div style={{display:"grid",gridTemplateColumns:"1.2fr .8fr",gap:20}}>

    <section style={panel}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${W},1fr)`,gap:10}}>
      {Array.from({length:W*H}).map((_,i)=>{
       const x=i%W,y=Math.floor(i/W);
       const obj=worldState[k(x,y)];
       const isPlayer=player.x===x&&player.y===y;
       const isSelected=selected&&selected.x===x&&selected.y===y;

       return <div key={i} onClick={()=>clickTile(x,y)} style={{
        ...tile,
        outline:isSelected?"4px solid gold":"none",
        background:obj?.kind==="monster"
         ? obj.isBoss
          ? "linear-gradient(135deg,#991b1b,#431407)"
          : "linear-gradient(135deg,#7f1d1d,#111827)"
         : obj?.kind==="block"
          ? "linear-gradient(135deg,#6b7280,#374151)"
          : tile.background
       }}>
        {isPlayer?"🧍":obj?obj.emoji:""}
       </div>
      })}
      </div>
    </section>

    <aside style={{display:"grid",gap:16}}>
      <section style={panel}>
       <h2>🧮 Action</h2>
       <div style={{fontSize:54,fontWeight:"bold",margin:"16px 0"}}>
        {q.a} × {q.b} = ?
       </div>
       <input value={answer} onChange={e=>setAnswer(e.target.value.replace(/[^0-9]/g,""))} style={input}/>
       <button onClick={solve} style={button}>Solve</button>
      </section>

      <section style={panel}>
       <h2>🎒 Inventory</h2>
       <p>🪨 Stone: {inventory.stone}</p>
       <p>⛓️ Iron: {inventory.iron}</p>
       <p>💎 Diamonds: {inventory.diamonds}</p>
       <p>⚔️ Damage: {damage}</p>
       <p>👹 Monsters Left: {monstersLeft}</p>
       <p>⭐ Score: {score}</p>
      </section>

      <section style={panel}>
       <h2>🏆 Boss Gallery</h2>
       {[0,1,2].map(i=>{
        const t=inventory.trophies[i];
        return <div key={i} style={{
         padding:12,
         borderRadius:12,
         marginBottom:10,
         background:t?"#14532d":"#1f2937"
        }}>
         {t ? <>
          <div style={{fontSize:30}}>{t.emoji}</div>
          <strong>{t.name}</strong>
          <div>{t.theme}</div>
         </> : "Locked Boss Trophy"}
        </div>
       })}
      </section>

      <section style={panel}>
       <p>{message}</p>
      </section>

    </aside>

   </div>
  </div>
 </main>
}

const panel={
 background:"#0f172a",
 border:"2px solid #22c55e",
 borderRadius:22,
 padding:20
}

const tile={
 width:"100%",
 aspectRatio:"1/1",
 borderRadius:14,
 border:"2px solid #14532d",
 background:"linear-gradient(135deg,#166534,#052e16)",
 display:"flex",
 alignItems:"center",
 justifyContent:"center",
 fontSize:42,
 cursor:"pointer"
}

const input={
 width:"100%",
 boxSizing:"border-box",
 fontSize:30,
 padding:14,
 textAlign:"center",
 borderRadius:14,
 border:"none",
 marginBottom:12
}

const button={
 width:"100%",
 fontSize:22,
 padding:"14px 18px",
 borderRadius:14,
 border:"none",
 background:"#22c55e",
 color:"#052e16",
 fontWeight:"bold",
 cursor:"pointer"
}
