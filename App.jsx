import { useState, useRef, useCallback } from 'react'

// ── カラーパレット ──
const COLORS = [
  '#e53935','#d81b60','#8e24aa','#5e35b1','#1e88e5',
  '#00897b','#43a047','#f4511e','#fb8c00','#fdd835',
  '#6d4c41','#546e7a','#00acc1','#7cb342','#c0ca33',
  '#039be5','#3949ab','#ec407a','#26a69a','#ffca28',
  '#ef5350','#ab47bc','#42a5f5','#26c6da','#66bb6a',
  '#ff7043','#8d6e63','#78909c','#ffa726','#d4e157',
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── プリセットパターン生成 ──
function makePreset(type, people) {
  if (type === 'long') {
    const tables = []
    const perTable = 8, perSide = 4
    const tCount = Math.ceil(people / perTable)
    let sid = 1
    for (let t = 0; t < tCount; t++) {
      const seats = []
      for (let side = 0; side < 2; side++)
        for (let pos = 0; pos < perSide && sid <= people; pos++)
          seats.push({ id: sid++, side, pos })
      tables.push({ id: t, type: 'long', x: 40 + t * 160, y: 80, seats })
    }
    return tables
  }
  if (type === 'round') {
    const tables = []
    const perTable = 6
    const tCount = Math.ceil(people / perTable)
    let sid = 1
    const cols = Math.min(tCount, 3)
    for (let t = 0; t < tCount; t++) {
      const seats = []
      const col = t % cols, row = Math.floor(t / cols)
      for (let pos = 0; pos < perTable && sid <= people; pos++)
        seats.push({ id: sid++, pos })
      tables.push({ id: t, type: 'round', x: 80 + col * 160, y: 80 + row * 160, seats })
    }
    return tables
  }
  if (type === 'u') {
    const top = Math.ceil(people / 3)
    const left = Math.floor((people - top) / 2)
    const right = people - top - left
    const tables = [
      { id: 0, type: 'u-top',   x: 80,  y: 40,  seats: Array.from({length: top},   (_, i) => ({ id: i+1,           pos: i, total: top })) },
      { id: 1, type: 'u-left',  x: 40,  y: 120, seats: Array.from({length: left},  (_, i) => ({ id: top+i+1,       pos: i, total: left })) },
      { id: 2, type: 'u-right', x: 240, y: 120, seats: Array.from({length: right}, (_, i) => ({ id: top+left+i+1,  pos: i, total: right })) },
    ]
    return tables
  }
  if (type === 'island') {
    const tables = []
    const perTable = 4
    const tCount = Math.ceil(people / perTable)
    let sid = 1
    const cols = Math.min(tCount, 3)
    for (let t = 0; t < tCount; t++) {
      const seats = []
      const col = t % cols, row = Math.floor(t / cols)
      for (let pos = 0; pos < perTable && sid <= people; pos++)
        seats.push({ id: sid++, pos })
      tables.push({ id: t, type: 'island', x: 60 + col * 140, y: 60 + row * 140, seats })
    }
    return tables
  }
  return []
}

// ── SVGテーブル描画 ──
function TableSVG({ table, assignments, highlight, selected, onClick }) {
  const { type, x, y, seats } = table
  const anyA = (sid) => assignments.find(a => a.seat === sid)
  const isHi = (sid) => highlight === sid

  const SeatRect = ({ sx, sy, sw, sh, seat, vert }) => {
    const a = anyA(seat.id)
    const hi = isHi(seat.id)
    const col = a ? COLORS[(a.person - 1) % COLORS.length] : '#fff'
    const rw = vert ? sh : sw, rh = vert ? sw : sh
    return (
      <g>
        {hi && <rect x={sx-2} y={sy-2} width={rw+4} height={rh+4} rx={4} fill="none" stroke="#f44336" strokeWidth={2.5}>
          <animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite"/>
        </rect>}
        <rect x={sx} y={sy} width={rw} height={rh} rx={3}
          fill={col} stroke={a ? col : '#c5cae9'} strokeWidth={1.5}
          style={{ transition: 'fill 0.3s' }}/>
        <text x={sx+rw/2} y={sy+rh/2+3.5} textAnchor="middle"
          fill={a ? '#fff' : '#9fa8da'} fontSize={7} fontWeight={700} fontFamily="monospace">
          {a ? `P${a.person}` : seat.id}
        </text>
      </g>
    )
  }

  if (type === 'long') {
    const TW = 120, TH = 38, SW = 25, SH = 18, SGAP = 5
    const sp = TW / 4
    return (
      <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <rect x={x} y={y+SH+SGAP} width={TW} height={TH} rx={5}
          fill={selected ? '#e8eaf6' : '#eef0fb'} stroke={selected ? '#5c6bc0' : '#9fa8da'} strokeWidth={selected ? 2 : 1.5}/>
        <text x={x+TW/2} y={y+SH+SGAP+TH/2+4} textAnchor="middle"
          fill="#7986cb" fontSize={8} fontFamily="monospace" fontWeight={700}>LONG</text>
        {seats.map(seat => {
          const sx = x + sp * seat.pos + sp/2 - SW/2
          const sy = seat.side === 0 ? y : y + SH + SGAP*2 + TH
          return <SeatRect key={seat.id} sx={sx} sy={sy} sw={SW} sh={SH} seat={seat}/>
        })}
      </g>
    )
  }

  if (type === 'round') {
    const CR = 28, SR = 11
    return (
      <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <circle cx={x+CR} cy={y+CR} r={CR}
          fill={selected ? '#e8eaf6' : '#eef0fb'} stroke={selected ? '#5c6bc0' : '#9fa8da'} strokeWidth={selected ? 2 : 1.5}/>
        <text x={x+CR} y={y+CR+4} textAnchor="middle"
          fill="#7986cb" fontSize={8} fontFamily="monospace" fontWeight={700}>RND</text>
        {seats.map(seat => {
          const angle = (seat.pos / 6) * Math.PI * 2 - Math.PI / 2
          const sx = x + CR + Math.cos(angle) * (CR + SR + 4) - SR
          const sy = y + CR + Math.sin(angle) * (CR + SR + 4) - SR
          return <SeatRect key={seat.id} sx={sx} sy={sy} sw={SR*2} sh={SR*2} seat={seat}/>
        })}
      </g>
    )
  }

  if (type === 'island') {
    const TW = 60, TH = 40, SW = 22, SH = 16
    const px = [
      [x+TW/4-SW/2, y-SH-4], [x+3*TW/4-SW/2, y-SH-4],
      [x+TW/4-SW/2, y+TH+4], [x+3*TW/4-SW/2, y+TH+4],
    ]
    return (
      <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <rect x={x} y={y} width={TW} height={TH} rx={5}
          fill={selected ? '#e8eaf6' : '#eef0fb'} stroke={selected ? '#5c6bc0' : '#9fa8da'} strokeWidth={selected ? 2 : 1.5}/>
        <text x={x+TW/2} y={y+TH/2+4} textAnchor="middle"
          fill="#7986cb" fontSize={7} fontFamily="monospace" fontWeight={700}>ISL</text>
        {seats.map((seat, i) => i < px.length
          ? <SeatRect key={seat.id} sx={px[i][0]} sy={px[i][1]} sw={SW} sh={SH} seat={seat}/>
          : null
        )}
      </g>
    )
  }

  if (type === 'u-top' || type === 'u-left' || type === 'u-right') {
    const isVert = type !== 'u-top'
    const TW = type === 'u-top' ? 200 : 14
    const TH = type === 'u-top' ? 14 : 120
    const SW = 22, SH = 16
    return (
      <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <rect x={x} y={y} width={TW} height={TH} rx={4}
          fill={selected ? '#e8eaf6' : '#eef0fb'} stroke={selected ? '#5c6bc0' : '#9fa8da'} strokeWidth={selected ? 2 : 1.5}/>
        {seats.map(seat => {
          let sx, sy
          if (type === 'u-top') {
            const sp = TW / Math.max(seat.total, 1)
            sx = x + sp * seat.pos + sp/2 - SW/2
            sy = y - SH - 5
          } else if (type === 'u-left') {
            const sp = TH / Math.max(seat.total, 1)
            sx = x - SH - 5
            sy = y + sp * seat.pos + sp/2 - SW/2
          } else {
            const sp = TH / Math.max(seat.total, 1)
            sx = x + TW + 5
            sy = y + sp * seat.pos + sp/2 - SW/2
          }
          return <SeatRect key={seat.id} sx={sx} sy={sy} sw={SW} sh={SH} seat={seat} vert={isVert}/>
        })}
      </g>
    )
  }

  return null
}

// ── カスタム配置エディタ ──
function LayoutEditor({ tables, setTables, people }) {
  const [selected, setSelected] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [dragOff, setDragOff] = useState({ x: 0, y: 0 })
  const svgRef = useRef()
  const SVG_W = 500, SVG_H = 340

  const totalSeats = tables.reduce((s, t) => s + t.seats.length, 0)

  function addTable(type) {
    const existing = tables.filter(t => t.type === type || t.type.startsWith(type))
    const id = Date.now()
    const perTable = type === 'long' ? 8 : type === 'round' ? 6 : 4
    const remaining = people - totalSeats
    if (remaining <= 0) return
    const count = Math.min(perTable, remaining)
    let startId = totalSeats + 1
    const seats = []

    if (type === 'long') {
      for (let side = 0; side < 2; side++)
        for (let pos = 0; pos < 4 && seats.length < count; pos++)
          seats.push({ id: startId++, side, pos })
      setTables([...tables, { id, type: 'long', x: 40, y: 60, seats }])
    } else if (type === 'round') {
      for (let pos = 0; pos < count; pos++) seats.push({ id: startId++, pos })
      setTables([...tables, { id, type: 'round', x: 80, y: 80, seats }])
    } else if (type === 'island') {
      for (let pos = 0; pos < count; pos++) seats.push({ id: startId++, pos })
      setTables([...tables, { id, type: 'island', x: 60, y: 80, seats }])
    }
  }

  function removeTable(id) {
    // Remove table and reassign seat IDs sequentially
    const next = tables.filter(t => t.id !== id)
    let sid = 1
    const renumbered = next.map(t => ({
      ...t,
      seats: t.seats.map(s => ({ ...s, id: sid++ }))
    }))
    setTables(renumbered)
    setSelected(null)
  }

  function onSvgMouseDown(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (SVG_W / rect.width)
    const my = (e.clientY - rect.top) * (SVG_H / rect.height)
    // find hit table (reverse for top-most)
    for (let i = tables.length - 1; i >= 0; i--) {
      const t = tables[i]
      let hit = false
      const pad = 60
      if (mx >= t.x - pad && mx <= t.x + 200 && my >= t.y - pad && my <= t.y + 160) hit = true
      if (hit) {
        setSelected(t.id)
        setDragging(t.id)
        setDragOff({ x: mx - t.x, y: my - t.y })
        e.preventDefault()
        return
      }
    }
    setSelected(null)
  }

  function onSvgMouseMove(e) {
    if (!dragging) return
    const rect = svgRef.current.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (SVG_W / rect.width)
    const my = (e.clientY - rect.top) * (SVG_H / rect.height)
    setTables(prev => prev.map(t => t.id === dragging
      ? { ...t, x: Math.max(10, Math.min(SVG_W - 80, mx - dragOff.x)), y: Math.max(10, Math.min(SVG_H - 80, my - dragOff.y)) }
      : t
    ))
  }

  function onSvgMouseUp() { setDragging(null) }

  // seat count adjustment for selected table
  function adjustSeats(delta) {
    setTables(prev => {
      const idx = prev.findIndex(t => t.id === selected)
      if (idx < 0) return prev
      const t = prev[idx]
      const currentCount = t.seats.length
      const newCount = Math.max(1, currentCount + delta)
      const maxForType = t.type === 'long' ? 8 : t.type === 'round' ? 6 : 4
      if (delta > 0 && totalSeats >= people) return prev
      if (delta > 0 && currentCount >= maxForType) return prev

      let seats
      if (delta > 0) {
        const newSeat = { id: 0, pos: currentCount } // will renumber
        if (t.type === 'long') {
          const side = Math.floor(currentCount / 4)
          const pos = currentCount % 4
          seats = [...t.seats, { id: 0, side, pos }]
        } else {
          seats = [...t.seats, { id: 0, pos: currentCount }]
        }
      } else {
        seats = t.seats.slice(0, newCount)
      }

      const next = [...prev]
      next[idx] = { ...t, seats }
      // Renumber all seats globally
      let sid = 1
      return next.map(tb => ({ ...tb, seats: tb.seats.map(s => ({ ...s, id: sid++ })) }))
    })
  }

  const selectedTable = tables.find(t => t.id === selected)

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#90a4ae', alignSelf: 'center', marginRight: 4 }}>追加:</span>
        {[
          { type: 'long',   label: '⬛ 長テーブル', max: 8 },
          { type: 'round',  label: '⭕ 丸テーブル', max: 6 },
          { type: 'island', label: '🟦 島テーブル', max: 4 },
        ].map(({ type, label }) => (
          <button key={type} onClick={() => addTable(type)}
            disabled={totalSeats >= people}
            style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: totalSeats >= people ? '#f5f5f5' : '#e8eaf6',
              color: totalSeats >= people ? '#bdbdbd' : '#5c6bc0',
              border: '1.5px solid #c5cae9',
            }}>
            {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: totalSeats === people ? '#43a047' : '#f57c00', fontWeight: 700, alignSelf: 'center' }}>
          {totalSeats}/{people} 席
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1.5px solid #c5cae9', background: '#f8f9ff', userSelect: 'none' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: '100%', display: 'block', cursor: dragging ? 'grabbing' : 'default', touchAction: 'none' }}
          onMouseDown={onSvgMouseDown}
          onMouseMove={onSvgMouseMove}
          onMouseUp={onSvgMouseUp}
          onMouseLeave={onSvgMouseUp}
          onTouchStart={e => {
            const t = e.touches[0]
            onSvgMouseDown({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => e.preventDefault() })
          }}
          onTouchMove={e => {
            const t = e.touches[0]
            onSvgMouseMove({ clientX: t.clientX, clientY: t.clientY })
          }}
          onTouchEnd={onSvgMouseUp}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width={20} height={20} patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8eaf6" strokeWidth={0.5}/>
            </pattern>
          </defs>
          <rect width={SVG_W} height={SVG_H} fill="url(#grid)"/>

          {tables.length === 0 && (
            <text x={SVG_W/2} y={SVG_H/2} textAnchor="middle" fill="#c5cae9" fontSize={13} fontFamily="sans-serif">
              上のボタンでテーブルを追加してください
            </text>
          )}

          {tables.map(t => (
            <TableSVG key={t.id} table={t} assignments={[]} highlight={null}
              selected={selected === t.id}
              onClick={() => setSelected(selected === t.id ? null : t.id)}
            />
          ))}
        </svg>

        {/* Selected table controls */}
        {selectedTable && (
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            background: '#fff', borderRadius: 10, padding: '6px 12px',
            boxShadow: '0 2px 12px #0002', border: '1.5px solid #e8eaf6',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
          }}>
            <span style={{ color: '#7986cb', fontWeight: 700 }}>
              {selectedTable.type === 'long' ? '長テーブル' : selectedTable.type === 'round' ? '丸テーブル' : '島テーブル'}
              　{selectedTable.seats.length}席
            </span>
            <button onClick={() => adjustSeats(-1)} style={btnSm}>－</button>
            <button onClick={() => adjustSeats(+1)} style={btnSm}>＋</button>
            <button onClick={() => removeTable(selected)}
              style={{ ...btnSm, background: '#ffebee', color: '#e53935', border: '1px solid #ffcdd2' }}>
              削除
            </button>
            <span style={{ color: '#c5cae9', fontSize: 10 }}>ドラッグで移動</span>
          </div>
        )}
      </div>
    </div>
  )
}

const btnSm = {
  padding: '3px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700,
  background: '#e8eaf6', color: '#5c6bc0', border: '1px solid #c5cae9', cursor: 'pointer'
}

// ── メインアプリ ──
export default function App() {
  const [screen, setScreen] = useState('setup') // setup | roulette | result
  const [people, setPeople] = useState(8)
  const [layoutMode, setLayoutMode] = useState('preset') // preset | custom
  const [presetType, setPresetType] = useState('long')
  const [customTables, setCustomTables] = useState([])
  const [currentPerson, setCurrentPerson] = useState(1)
  const [assignments, setAssignments] = useState([])
  const [remainingSeats, setRemainingSeats] = useState([])
  const [spinning, setSpinning] = useState(false)
  const [displaySeat, setDisplaySeat] = useState(null)
  const [finalSeat, setFinalSeat] = useState(null)
  const [rouletteTables, setRouletteTables] = useState([])
  const iRef = useRef(null)

  const previewTables = layoutMode === 'preset'
    ? makePreset(presetType, people)
    : customTables

  const totalCustomSeats = customTables.reduce((s, t) => s + t.seats.length, 0)
  const canStart = layoutMode === 'preset' || totalCustomSeats === people

  function startRoulette() {
    const tables = layoutMode === 'preset' ? makePreset(presetType, people) : customTables
    const allSeats = tables.flatMap(t => t.seats.map(s => s.id))
    setRouletteTables(tables)
    setRemainingSeats(shuffle(allSeats))
    setAssignments([])
    setCurrentPerson(1)
    setDisplaySeat(null)
    setFinalSeat(null)
    setScreen('roulette')
  }

  function spin() {
    if (spinning || finalSeat) return
    setSpinning(true)
    let count = 0
    const total = 25 + Math.floor(Math.random() * 15)
    iRef.current = setInterval(() => {
      setDisplaySeat(remainingSeats[count % remainingSeats.length])
      count++
      if (count >= total) {
        clearInterval(iRef.current)
        const picked = remainingSeats[(count - 1) % remainingSeats.length]
        setDisplaySeat(picked)
        setFinalSeat(picked)
        setSpinning(false)
      }
    }, 55)
  }

  function next() {
    const newA = [...assignments, { person: currentPerson, seat: finalSeat }]
    const newR = remainingSeats.filter(s => s !== finalSeat)
    setAssignments(newA)
    setRemainingSeats(newR)
    if (currentPerson >= people) {
      setScreen('result')
    } else {
      setCurrentPerson(p => p + 1)
      setDisplaySeat(null)
      setFinalSeat(null)
    }
  }

  const pColor = COLORS[(currentPerson - 1) % COLORS.length]

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Noto+Sans+JP:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#f0f4ff;min-height:100%;}
        button{cursor:pointer;border:none;font-family:inherit;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{0%{transform:scale(0.5);opacity:0}65%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        .fade-up{animation:fadeUp 0.35s ease forwards;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#c5cae9;border-radius:2px}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#5c6bc0;cursor:pointer;box-shadow:0 2px 6px #5c6bc044;}
      `}</style>

      {/* ── SETUP ── */}
      {screen === 'setup' && (
        <div style={S.page}>
          <div style={S.topBar}>
            <span style={{ fontSize: 34 }}>🍺</span>
            <div>
              <div style={S.appName}>SEAT ROULETTE</div>
              <div style={S.appSub}>飲み会の座席をランダム決定</div>
            </div>
          </div>

          {/* 人数 */}
          <div style={S.card}>
            <div style={S.cardTitle}>👥 参加人数</div>
            <div style={S.bigNum}>{people}<span style={S.unit}>人</span></div>
            <input type="range" min={2} max={30} value={people}
              style={{ width: '100%', marginTop: 8, background: `linear-gradient(90deg,#5c6bc0 ${(people-2)/28*100}%,#e8eaf6 ${(people-2)/28*100}%)` }}
              onChange={e => {
                setPeople(Number(e.target.value))
                setCustomTables([])
              }}/>
            <div style={S.sliderEnds}><span>2人</span><span>30人</span></div>
            <div style={S.chips}>
              {[4,6,8,10,12,16,20,24,30].map(n => (
                <button key={n} onClick={() => { setPeople(n); setCustomTables([]) }}
                  style={{ ...S.chip, ...(people === n ? S.chipA : {}) }}>{n}</button>
              ))}
            </div>
          </div>

          {/* 配置モード */}
          <div style={S.card}>
            <div style={S.cardTitle}>🪑 テーブル配置</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[['preset','プリセット'], ['custom','カスタム']].map(([m, label]) => (
                <button key={m} onClick={() => setLayoutMode(m)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontWeight: 700, fontSize: 13,
                    background: layoutMode === m ? '#5c6bc0' : '#f0f4ff',
                    color: layoutMode === m ? '#fff' : '#90a4ae',
                    border: `1.5px solid ${layoutMode === m ? '#5c6bc0' : '#e8eaf6'}` }}>
                  {m === 'preset' ? '🗂️ ' : '✏️ '}{label}
                </button>
              ))}
            </div>

            {layoutMode === 'preset' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { id: 'long',   icon: '⬛', name: '長テーブル', desc: '両サイドに席' },
                  { id: 'round',  icon: '⭕', name: '丸テーブル', desc: '6人囲み' },
                  { id: 'u',      icon: '🔲', name: 'コの字',     desc: 'U字型配置' },
                  { id: 'island', icon: '🟦', name: '島テーブル', desc: '4人テーブル' },
                ].map(p => (
                  <button key={p.id} onClick={() => setPresetType(p.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      padding: '12px 6px', borderRadius: 12, fontFamily: 'inherit',
                      background: presetType === p.id ? '#e8eaf6' : '#f8f9ff',
                      border: `2px solid ${presetType === p.id ? '#5c6bc0' : '#e8eaf6'}` }}>
                    <span style={{ fontSize: 22 }}>{p.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: presetType === p.id ? '#5c6bc0' : '#455a64' }}>{p.name}</span>
                    <span style={{ fontSize: 10, color: '#90a4ae' }}>{p.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {layoutMode === 'custom' && (
              <LayoutEditor tables={customTables} setTables={setCustomTables} people={people}/>
            )}
          </div>

          {/* Preview */}
          {(layoutMode === 'preset' || totalCustomSeats > 0) && (
            <div style={S.card}>
              <div style={S.cardTitle}>📐 配置プレビュー</div>
              <div style={{ marginTop: 10, overflowX: 'auto' }}>
                <svg viewBox="0 0 500 280" style={{ width: '100%', display: 'block', background: '#f8f9ff', borderRadius: 8 }}>
                  <defs>
                    <pattern id="pgrid" width={20} height={20} patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8eaf6" strokeWidth={0.5}/>
                    </pattern>
                  </defs>
                  <rect width={500} height={280} fill="url(#pgrid)"/>
                  {previewTables.map(t => (
                    <TableSVG key={t.id} table={t} assignments={[]} highlight={null} selected={false}/>
                  ))}
                </svg>
              </div>
            </div>
          )}

          <button onClick={startRoulette} disabled={!canStart}
            style={{ ...S.startBtn, opacity: canStart ? 1 : 0.5, cursor: canStart ? 'pointer' : 'not-allowed' }}>
            {!canStart
              ? `⚠️ あと ${people - totalCustomSeats} 席追加してください`
              : '🎲 スタート！'}
          </button>
        </div>
      )}

      {/* ── ROULETTE ── */}
      {screen === 'roulette' && (
        <div style={S.page}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 11, color: '#90a4ae', fontWeight: 700, letterSpacing: '0.1em' }}>NOW DECIDING</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: pColor, fontFamily: "'Nunito',sans-serif", lineHeight: 1 }}>
                Person {currentPerson}
              </div>
            </div>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 28, color: '#455a64' }}>
              {currentPerson}<span style={{ color: '#b0bec5', fontSize: 14 }}>/{people}</span>
            </div>
          </div>

          <div style={S.progTrack}>
            <div style={{ ...S.prog, width: `${(currentPerson-1)/people*100}%`, background: pColor }}/>
          </div>

          <div style={S.dots}>
            {Array.from({ length: people }, (_, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0, transition: 'all 0.2s',
                background: i < currentPerson-1 ? COLORS[i%COLORS.length] : i === currentPerson-1 ? pColor : '#e8eaf6',
                transform: i === currentPerson-1 ? 'scale(1.5)' : 'scale(1)',
                boxShadow: i === currentPerson-1 ? `0 0 8px ${pColor}88` : 'none',
              }}/>
            ))}
          </div>

          <div style={{
            ...S.seatBox,
            borderColor: finalSeat ? pColor : '#e8eaf6',
            background: finalSeat ? pColor + '0d' : '#fff',
            boxShadow: finalSeat ? `0 4px 24px ${pColor}22` : '0 2px 12px #0001',
          }}>
            {!displaySeat && <div style={{ color: '#c5cae9', fontWeight: 700, fontSize: 15 }}>▼ スピン！</div>}
            {displaySeat && (
              <div key={`${displaySeat}-${!spinning}`} style={{
                fontFamily: "'Nunito',sans-serif", fontSize: 88, fontWeight: 900,
                color: finalSeat ? pColor : '#455a64', lineHeight: 1,
                animation: finalSeat ? 'popIn 0.4s cubic-bezier(.34,1.4,.64,1) forwards' : undefined,
                filter: spinning ? 'blur(2px)' : 'none', transition: 'color 0.2s,filter 0.1s',
              }}>
                {displaySeat}
                <span style={{ fontSize: 18, color: finalSeat ? pColor+'99' : '#b0bec5', marginLeft: 2 }}>番</span>
              </div>
            )}
          </div>

          {!finalSeat ? (
            <button onClick={spin} disabled={spinning} style={{
              ...S.actionBtn, color: '#fff',
              background: spinning ? '#e0e0e0' : pColor,
              boxShadow: spinning ? 'none' : `0 4px 16px ${pColor}55`,
            }}>
              {spinning ? 'スピン中...' : '🎲 スピン！'}
            </button>
          ) : (
            <button onClick={next} style={{
              ...S.actionBtn, background: '#fff',
              border: `2px solid ${pColor}`, color: pColor,
              boxShadow: `0 4px 16px ${pColor}22`,
            }}>
              {currentPerson >= people ? '✅ 結果を見る' : '次の人へ →'}
            </button>
          )}

          <div style={S.card}>
            <div style={S.cardTitle}>📐 テーブル配置</div>
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
              <svg viewBox="0 0 500 280" style={{ width: '100%', display: 'block', background: '#f8f9ff', borderRadius: 8 }}>
                <defs>
                  <pattern id="rgrid" width={20} height={20} patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8eaf6" strokeWidth={0.5}/>
                  </pattern>
                </defs>
                <rect width={500} height={280} fill="url(#rgrid)"/>
                {rouletteTables.map(t => (
                  <TableSVG key={t.id} table={t} assignments={assignments} highlight={finalSeat} selected={false}/>
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {screen === 'result' && (
        <div style={S.page}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 40 }}>🎉</div>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 30, color: '#3949ab' }}>座席決定！</div>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>📐 テーブル配置図</div>
            <div style={{ overflowX: 'auto', marginTop: 10 }}>
              <svg viewBox="0 0 500 280" style={{ width: '100%', display: 'block', background: '#f8f9ff', borderRadius: 8 }}>
                <defs>
                  <pattern id="resgrid" width={20} height={20} patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8eaf6" strokeWidth={0.5}/>
                  </pattern>
                </defs>
                <rect width={500} height={280} fill="url(#resgrid)"/>
                {rouletteTables.map(t => (
                  <TableSVG key={t.id} table={t} assignments={assignments} highlight={null} selected={false}/>
                ))}
              </svg>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>📋 割り当て一覧</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 10, maxHeight: 300, overflowY: 'auto' }}>
              {assignments.map((a, i) => (
                <div key={i} className="fade-up" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 10, opacity: 0,
                  background: COLORS[(a.person-1)%COLORS.length] + '18',
                  border: `1.5px solid ${COLORS[(a.person-1)%COLORS.length]}44`,
                  animationDelay: `${i*25}ms`,
                }}>
                  <span style={{ fontWeight: 900, fontSize: 13, color: COLORS[(a.person-1)%COLORS.length] }}>P{a.person}</span>
                  <span style={{ fontSize: 10, color: '#90a4ae' }}>→</span>
                  <span style={{ fontWeight: 900, fontSize: 16, color: '#37474f', fontFamily: "'Nunito',sans-serif" }}>{a.seat}番</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setScreen('setup'); setCustomTables([]) }}
              style={{ ...S.actionBtn, flex: 1, background: '#f0f4ff', color: '#5c6bc0', border: '1.5px solid #c5cae9', fontSize: 14 }}>
              🔄 最初から
            </button>
            <button onClick={() => {
              setCurrentPerson(1); setAssignments([]); setDisplaySeat(null); setFinalSeat(null);
              const allSeats = rouletteTables.flatMap(t => t.seats.map(s => s.id))
              setRemainingSeats(shuffle(allSeats)); setScreen('roulette')
            }}
              style={{ ...S.actionBtn, flex: 1, background: '#5c6bc0', color: '#fff', fontSize: 14 }}>
              🎲 もう一度
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  root: { minHeight: '100vh', background: '#f0f4ff', display: 'flex', justifyContent: 'center', padding: '20px 16px', fontFamily: "'Noto Sans JP',sans-serif" },
  page: { width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 14 },
  topBar: { display: 'flex', alignItems: 'center', gap: 12 },
  appName: { fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 22, color: '#3949ab' },
  appSub: { fontSize: 12, color: '#90a4ae' },
  card: { background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 12px #3949ab10', border: '1px solid #e8eaf6' },
  cardTitle: { fontWeight: 700, fontSize: 13, color: '#7986cb', marginBottom: 6 },
  bigNum: { fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 54, color: '#3949ab', lineHeight: 1.1 },
  unit: { fontSize: 18, color: '#90a4ae', marginLeft: 4 },
  sliderEnds: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#b0bec5', marginTop: 4 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: { padding: '5px 12px', borderRadius: 20, background: '#f0f4ff', color: '#7986cb', fontSize: 13, fontWeight: 700, border: '1.5px solid #e8eaf6' },
  chipA: { background: '#5c6bc0', color: '#fff', border: '1.5px solid #5c6bc0' },
  startBtn: { background: 'linear-gradient(135deg,#5c6bc0,#7986cb)', color: '#fff', fontWeight: 900, fontSize: 17, padding: '16px 0', borderRadius: 14, boxShadow: '0 4px 20px #5c6bc044', fontFamily: "'Nunito',sans-serif" },
  progTrack: { height: 6, background: '#e8eaf6', borderRadius: 3, overflow: 'hidden' },
  prog: { height: '100%', borderRadius: 3, transition: 'width 0.5s ease' },
  dots: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  seatBox: { height: 165, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 20, border: '2px solid', transition: 'all 0.35s' },
  actionBtn: { fontWeight: 900, fontSize: 17, padding: '14px 0', borderRadius: 14, fontFamily: "'Nunito',sans-serif", transition: 'all 0.2s' },
}
