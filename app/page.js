export default function Page() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#062b16",
      color: "white",
      padding: 16,
      fontFamily: "Arial"
    }}>
      <h1>MathCraft v0.10</h1>
      <p>Dungeon Bosses + Monster Gallery</p>

      <div style={{
        background:"#200909",
        border:"3px solid #ff4d4d",
        borderRadius:20,
        padding:20,
        marginBottom:20,
        textAlign:"center"
      }}>
        <div style={{fontSize:72}}>👹</div>
        <h2>Cave Troll</h2>
        <p>The dungeon boss has awakened!</p>
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(5,1fr)",
        gap:8,
        marginBottom:20
      }}>
        {Array.from({length:25}).map((_,i)=>(
          <div key={i} style={{
            aspectRatio:"1",
            background:i===12 ? "#1ec95c" : "#157a37",
            borderRadius:16,
            border:"2px solid #3cff84",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            fontSize:30
          }}>
            {i===12 ? "🧙" : ""}
          </div>
        ))}
      </div>

      <div style={{
        background:"#091a38",
        borderRadius:20,
        padding:16
      }}>
        <div style={{
          fontSize:42,
          textAlign:"center",
          marginBottom:12
        }}>
          2 × 3 = ?
        </div>

        <input
          style={{
            width:"100%",
            padding:16,
            fontSize:28,
            borderRadius:12,
            marginBottom:12,
            boxSizing:"border-box"
          }}
        />

        <button style={{
          width:"100%",
          padding:16,
          borderRadius:14,
          background:"#29c45a",
          color:"black",
          border:"none",
          fontSize:24,
          fontWeight:"bold"
        }}>
          Solve
        </button>
      </div>

      <div style={{
        marginTop:24,
        background:"#10203d",
        borderRadius:24,
        padding:20
      }}>
        <h2>🏆 Monster Gallery</h2>

        <div style={{
          display:"grid",
          gap:16
        }}>
          <div style={{
            background:"#1c325f",
            borderRadius:18,
            padding:16,
            textAlign:"center"
          }}>
            <div style={{fontSize:50}}>👹</div>
            <div>Cave Troll</div>
          </div>

          <div style={{
            background:"#1c325f",
            borderRadius:18,
            padding:16,
            textAlign:"center"
          }}>
            <div style={{fontSize:50}}>❓</div>
            <div>Unknown Monster</div>
          </div>

          <div style={{
            background:"#1c325f",
            borderRadius:18,
            padding:16,
            textAlign:"center"
          }}>
            <div style={{fontSize:50}}>❓</div>
            <div>Unknown Monster</div>
          </div>
        </div>
      </div>
    </main>
  );
}
