import { useState, useEffect, useRef } from 'react'

// ── Constants ─────────────────────────────────────────────────

const ROWS = 15
const COLS = 15

const SPEEDS = [
  { label: 'Slow',   ms: 200 },
  { label: 'Normal', ms: 100 },
  { label: 'Fast',   ms: 30  },
]

const DIRS = {
  Up:    { dr: -1, dc:  0, wall: 'top',    opp: 'bottom' },
  Right: { dr:  0, dc:  1, wall: 'right',  opp: 'left'   },
  Down:  { dr:  1, dc:  0, wall: 'bottom', opp: 'top'    },
  Left:  { dr:  0, dc: -1, wall: 'left',   opp: 'right'  },
}

const key = (r, c) => `${r},${c}`
const DEFAULT_START = { r: 0,        c: 0        }
const DEFAULT_END   = { r: ROWS - 1, c: COLS - 1 }

const TERRAIN = {
  1: { label: 'Grass',    color: '#dcfce7' },
  3: { label: 'Water',    color: '#dbeafe' },
  5: { label: 'Mountain', color: '#fed7aa' },
}

// ── Maze generation ───────────────────────────────────────────

function generateMaze() {
  const cells = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ top: true, right: true, bottom: true, left: true }))
  )
  const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  const stack = [{ r: 0, c: 0 }]
  seen[0][0] = true

  while (stack.length) {
    const cur = stack[stack.length - 1]
    const avail = Object.values(DIRS).filter(({ dr, dc }) => {
      const nr = cur.r + dr, nc = cur.c + dc
      return nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !seen[nr][nc]
    })
    if (!avail.length) { stack.pop(); continue }
    const { dr, dc, wall, opp } = avail[Math.floor(Math.random() * avail.length)]
    const nr = cur.r + dr, nc = cur.c + dc
    cells[cur.r][cur.c][wall] = false
    cells[nr][nc][opp] = false
    seen[nr][nc] = true
    stack.push({ r: nr, c: nc })
  }

  // Extra-passage pass: remove ~30% of remaining interior walls for more open areas.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r > 0 && cells[r][c].top && Math.random() < 0.3) {
        cells[r][c].top = false; cells[r - 1][c].bottom = false
      }
      if (c > 0 && cells[r][c].left && Math.random() < 0.3) {
        cells[r][c].left = false; cells[r][c - 1].right = false
      }
    }
  }

  return cells
}

function generateWeights() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => {
      const r = Math.random()
      if (r < 0.7) return 1  // Grass  70%
      if (r < 0.9) return 3  // Water  20%
      return 5                // Mountain 10%
    })
  )
}

// ── Algorithm traces ──────────────────────────────────────────

function traceSearchAlgorithm(cells, algo, dirOrder, startCell, endCell) {
  const startKey = key(startCell.r, startCell.c)
  const endKey   = key(endCell.r,   endCell.c)
  const visited  = new Set([startKey])
  const parent   = new Map([[startKey, null]])
  const frames   = []
  let ds = [{ r: startCell.r, c: startCell.c }]
  let peakFrontier = 1

  const snap = () => frames.push({
    visited:  new Set(visited),
    frontier: new Set(ds.map(({ r, c }) => key(r, c))),
  })
  snap()

  const exploreOrder = algo === 'DFS' ? [...dirOrder].reverse() : dirOrder

  while (ds.length) {
    const { r, c } = algo === 'BFS' ? ds.shift() : ds.pop()
    if (key(r, c) === endKey) break
    for (const d of exploreOrder) {
      const { dr, dc, wall } = DIRS[d]
      if (cells[r][c][wall]) continue
      const nr = r + dr, nc = c + dc
      const nk = key(nr, nc)
      if (visited.has(nk)) continue
      visited.add(nk)
      parent.set(nk, key(r, c))
      ds.push({ r: nr, c: nc })
    }
    if (ds.length > peakFrontier) peakFrontier = ds.length
    snap()
  }

  const path = new Set()
  if (parent.has(endKey)) {
    let cur = endKey
    while (cur !== null) { path.add(cur); cur = parent.get(cur) ?? null }
  }

  return { frames, path, peakFrontier, nodesExpanded: visited.size }
}

function traceDijkstra(cells, weights, startCell, endCell) {
  const startKey = key(startCell.r, startCell.c)
  const endKey   = key(endCell.r,   endCell.c)
  const dist     = { [startKey]: weights[startCell.r][startCell.c] }
  const parent   = new Map([[startKey, null]])
  const settled  = new Set()
  const frames   = []
  let pq = [{ r: startCell.r, c: startCell.c, cost: weights[startCell.r][startCell.c] }]
  let peakFrontier = 1

  const openKeys = () => new Set(pq.map(({ r, c }) => key(r, c)).filter(k => !settled.has(k)))
  const snap = () => frames.push({ visited: new Set(settled), frontier: openKeys() })
  snap()

  while (pq.length) {
    pq.sort((a, b) => a.cost - b.cost)
    const { r, c, cost } = pq.shift()
    const k = key(r, c)
    if (settled.has(k)) continue
    settled.add(k)
    if (k === endKey) break

    for (const { dr, dc, wall } of Object.values(DIRS)) {
      if (cells[r][c][wall]) continue
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      const nk = key(nr, nc)
      if (settled.has(nk)) continue
      const newCost = cost + weights[nr][nc]
      if (dist[nk] === undefined || newCost < dist[nk]) {
        dist[nk] = newCost
        parent.set(nk, k)
        pq.push({ r: nr, c: nc, cost: newCost })
      }
    }

    const openSize = pq.filter(e => !settled.has(key(e.r, e.c))).length
    if (openSize > peakFrontier) peakFrontier = openSize
    snap()
  }

  const path = new Set()
  let totalCost = 0
  if (parent.has(endKey)) {
    let cur = endKey
    while (cur !== null) {
      path.add(cur)
      const [pr, pc] = cur.split(',').map(Number)
      totalCost += weights[pr][pc]
      cur = parent.get(cur) ?? null
    }
  }

  return { frames, path, peakFrontier, nodesExpanded: settled.size, totalCost }
}

// ── Tutorial ──────────────────────────────────────────────────

function Tutorial({ onDismiss }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Search Algorithms</h1>
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-800">Breadth-First Search (BFS)</h2>
          <p className="mt-2 text-sm leading-relaxed text-blue-700">
            BFS explores every neighbour at the current distance before going further.
            It uses a <strong>queue</strong> (first-in, first-out) and is guaranteed to find
            the <strong>shortest path</strong> in an unweighted maze.
          </p>
        </div>
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
          <h2 className="font-semibold text-purple-800">Depth-First Search (DFS)</h2>
          <p className="mt-2 text-sm leading-relaxed text-purple-700">
            DFS commits fully to one branch before backtracking. It uses a <strong>stack</strong>
            (last-in, first-out) and does <strong>not guarantee the shortest path</strong>.
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-800">Dijkstra's Algorithm</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-700">
            Dijkstra finds the <strong>lowest-cost path</strong> in a weighted graph. It always
            expands the cell with the smallest cumulative cost so far — guaranteed optimal even
            when terrain varies. Switch to Dijkstra to explore a terrain-cost maze.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Click "Set Start" or "Set End" to place custom endpoints. Drag direction labels
          (BFS / DFS only) to control neighbour priority.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Got it, let's play
      </button>
    </div>
  )
}

// ── Complexity Dashboard ──────────────────────────────────────

function ComplexityDashboard({ stats, isDijkstra }) {
  const { nodesExpanded, peakFrontier, pathLength, totalCost, time } = stats
  const efficiencyPct = nodesExpanded > 0
    ? Math.round((pathLength / nodesExpanded) * 100) : 0
  const efficiencyLabel =
    efficiencyPct >= 50 ? 'Highly efficient' :
    efficiencyPct >= 20 ? 'Moderately efficient' : 'Exploration-heavy'
  const efficiencyColor =
    efficiencyPct >= 50 ? 'text-green-600' :
    efficiencyPct >= 20 ? 'text-yellow-600' : 'text-orange-600'

  const complexityNote = isDijkstra
    ? 'Theoretical: O((V + E) log V) with a priority queue'
    : 'Theoretical: O(V + E) for both BFS and DFS'

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 max-w-xl">
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg text-blue-500">⏱</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Time Complexity</p>
        </div>
        <p className="mt-2 text-sm font-bold text-gray-900">{nodesExpanded} nodes expanded</p>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{complexityNote}</p>
      </div>

      <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg text-purple-500">📦</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Space Complexity</p>
        </div>
        <p className="mt-2 text-sm font-bold text-gray-900">Peak frontier: {peakFrontier}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
          Theoretical: O(V) worst case; BFS frontier tends to be larger on wide graphs
        </p>
      </div>

      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg text-green-500">📐</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Path Efficiency</p>
        </div>
        <p className="mt-2 text-sm font-bold text-gray-900">{pathLength} steps · {efficiencyPct}%</p>
        {isDijkstra && totalCost != null && (
          <p className="mt-0.5 text-sm font-semibold text-amber-700">Total path cost: {totalCost}</p>
        )}
        <span className={`text-xs font-semibold ${efficiencyColor}`}>{efficiencyLabel}</span>
      </div>

      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg text-gray-500">🕐</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Wall-clock Time</p>
        </div>
        <p className="mt-2 text-sm font-bold text-gray-900">{time} ms</p>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
          Includes animation overhead — not a pure algorithm benchmark
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function SearchGame() {
  const [showTutorial, setShowTutorial] = useState(true)
  const [algo, setAlgo]       = useState('BFS')
  const [dirOrder, setDirOrder] = useState(['Up', 'Right', 'Down', 'Left'])
  const [speed, setSpeed]     = useState(1)
  const [placingMode, setPlacingMode] = useState(null)

  // ── Unweighted (BFS / DFS) state ─────────────────────────────
  const [uwCells,    setUwCells]    = useState(generateMaze)
  const [uwStart,    setUwStart]    = useState(DEFAULT_START)
  const [uwEnd,      setUwEnd]      = useState(DEFAULT_END)
  const [uwFrames,   setUwFrames]   = useState([])
  const [uwPath,     setUwPath]     = useState(new Set())
  const [uwFrameIdx, setUwFrameIdx] = useState(-1)
  const [uwRunning,  setUwRunning]  = useState(false)
  const [uwFinished, setUwFinished] = useState(false)
  const [uwStats,    setUwStats]    = useState(null)

  // ── Dijkstra (weighted) state ─────────────────────────────────
  const [dkCells,    setDkCells]    = useState(generateMaze)
  const [dkWeights,  setDkWeights]  = useState(generateWeights)
  const [dkStart,    setDkStart]    = useState(DEFAULT_START)
  const [dkEnd,      setDkEnd]      = useState(DEFAULT_END)
  const [dkFrames,   setDkFrames]   = useState([])
  const [dkPath,     setDkPath]     = useState(new Set())
  const [dkFrameIdx, setDkFrameIdx] = useState(-1)
  const [dkRunning,  setDkRunning]  = useState(false)
  const [dkFinished, setDkFinished] = useState(false)
  const [dkStats,    setDkStats]    = useState(null)

  const intervalRef  = useRef(null)
  const startTimeRef = useRef(null)
  const dragFrom     = useRef(null)

  // ── Active-mode aliases ───────────────────────────────────────
  const isDijkstra = algo === 'Dijkstra'
  const cells      = isDijkstra ? dkCells    : uwCells
  const startCell  = isDijkstra ? dkStart    : uwStart
  const endCell    = isDijkstra ? dkEnd      : uwEnd
  const frames     = isDijkstra ? dkFrames   : uwFrames
  const path       = isDijkstra ? dkPath     : uwPath
  const frameIdx   = isDijkstra ? dkFrameIdx : uwFrameIdx
  const running    = isDijkstra ? dkRunning  : uwRunning
  const finished   = isDijkstra ? dkFinished : uwFinished
  const stats      = isDijkstra ? dkStats    : uwStats

  const setStartCell = isDijkstra ? setDkStart : setUwStart
  const setEndCell   = isDijkstra ? setDkEnd   : setUwEnd

  const startKey   = key(startCell.r, startCell.c)
  const endKey     = key(endCell.r,   endCell.c)
  const canRun     = !running && !finished && startKey !== endKey
  const anyRunning = uwRunning || dkRunning

  const frame = frames[frameIdx] ?? { visited: new Set(), frontier: new Set() }

  // ── Animation loops ───────────────────────────────────────────

  useEffect(() => {
    if (isDijkstra || !uwRunning) return
    intervalRef.current = setInterval(() => {
      setUwFrameIdx(i => {
        if (i >= uwFrames.length - 1) {
          clearInterval(intervalRef.current)
          setUwRunning(false)
          setUwFinished(true)
          return i
        }
        return i + 1
      })
    }, SPEEDS[speed].ms)
    return () => clearInterval(intervalRef.current)
  }, [isDijkstra, uwRunning, uwFrames, speed])

  useEffect(() => {
    if (!isDijkstra || !dkRunning) return
    intervalRef.current = setInterval(() => {
      setDkFrameIdx(i => {
        if (i >= dkFrames.length - 1) {
          clearInterval(intervalRef.current)
          setDkRunning(false)
          setDkFinished(true)
          return i
        }
        return i + 1
      })
    }, SPEEDS[speed].ms)
    return () => clearInterval(intervalRef.current)
  }, [isDijkstra, dkRunning, dkFrames, speed])

  // Capture wall-clock time once each mode finishes
  useEffect(() => {
    if (uwFinished && uwStats && uwStats.time === null)
      setUwStats(s => s ? { ...s, time: Math.round(performance.now() - startTimeRef.current) } : s)
  }, [uwFinished])

  useEffect(() => {
    if (dkFinished && dkStats && dkStats.time === null)
      setDkStats(s => s ? { ...s, time: Math.round(performance.now() - startTimeRef.current) } : s)
  }, [dkFinished])

  // ── Cell colour ───────────────────────────────────────────────

  const cellBg = (r, c) => {
    const k = key(r, c)
    if (k === startKey) return '#22c55e'
    if (k === endKey)   return '#ef4444'
    if (finished && path.has(k)) return '#86efac'
    if (frame.frontier.has(k))   return '#fde047'
    if (frame.visited.has(k))    return '#bfdbfe'
    if (isDijkstra)              return TERRAIN[dkWeights[r][c]].color
    return '#ffffff'
  }

  const cellStyle = (r, c, cell) => ({
    width: 32, height: 32,
    boxSizing: 'border-box',
    position: 'relative',
    backgroundColor: cellBg(r, c),
    borderStyle: 'solid',
    borderColor: '#374151',
    borderTopWidth:    cell.top    ? 2 : 0,
    borderLeftWidth:   cell.left   ? 2 : 0,
    borderRightWidth:  c === COLS - 1 && cell.right  ? 2 : 0,
    borderBottomWidth: r === ROWS - 1 && cell.bottom ? 2 : 0,
    cursor: placingMode ? 'crosshair' : 'default',
  })

  // ── Handlers ─────────────────────────────────────────────────

  const handleAlgoChange = (newAlgo) => {
    if (anyRunning) return
    setAlgo(newAlgo)
    setPlacingMode(null)
  }

  const handleCellClick = (r, c) => {
    if (!placingMode || running || finished) return
    if (placingMode === 'start') setStartCell({ r, c })
    else setEndCell({ r, c })
    setPlacingMode(null)
  }

  const handleStart = () => {
    if (!canRun) return
    startTimeRef.current = performance.now()
    if (isDijkstra) {
      const result = traceDijkstra(dkCells, dkWeights, dkStart, dkEnd)
      setDkFrames(result.frames)
      setDkPath(result.path)
      setDkFrameIdx(0)
      setDkStats({ nodesExpanded: result.nodesExpanded, peakFrontier: result.peakFrontier, pathLength: result.path.size, totalCost: result.totalCost, time: null })
      setDkRunning(true)
    } else {
      const result = traceSearchAlgorithm(uwCells, algo, dirOrder, uwStart, uwEnd)
      setUwFrames(result.frames)
      setUwPath(result.path)
      setUwFrameIdx(0)
      setUwStats({ nodesExpanded: result.nodesExpanded, peakFrontier: result.peakFrontier, pathLength: result.path.size, totalCost: null, time: null })
      setUwRunning(true)
    }
  }

  const handleReset = () => {
    clearInterval(intervalRef.current)
    setPlacingMode(null)
    if (isDijkstra) {
      setDkRunning(false); setDkFinished(false)
      setDkFrameIdx(-1); setDkFrames([]); setDkPath(new Set()); setDkStats(null)
    } else {
      setUwRunning(false); setUwFinished(false)
      setUwFrameIdx(-1); setUwFrames([]); setUwPath(new Set()); setUwStats(null)
    }
  }

  const handleNewMaze = () => {
    handleReset()
    if (isDijkstra) {
      setDkCells(generateMaze()); setDkWeights(generateWeights())
      setDkStart(DEFAULT_START); setDkEnd(DEFAULT_END)
    } else {
      setUwCells(generateMaze())
      setUwStart(DEFAULT_START); setUwEnd(DEFAULT_END)
    }
  }

  const onDragStart = (i) => { dragFrom.current = i }
  const onDragOver  = (e, i) => {
    e.preventDefault()
    if (dragFrom.current === null || dragFrom.current === i) return
    const from = dragFrom.current
    setDirOrder(o => {
      const next = [...o]
      const [item] = next.splice(from, 1)
      next.splice(i, 0, item)
      return next
    })
    dragFrom.current = i
  }
  const onDragEnd = () => { dragFrom.current = null }

  // ── Render ────────────────────────────────────────────────────

  if (showTutorial) return <Tutorial onDismiss={() => setShowTutorial(false)} />

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Search Algorithms</h1>

      {/* ── Controls ── */}
      <div className="mt-6 flex flex-wrap items-end gap-6">

        {/* Algorithm toggle */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Algorithm</p>
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            {['BFS', 'DFS', 'Dijkstra'].map(a => (
              <button
                key={a}
                onClick={() => handleAlgoChange(a)}
                disabled={anyRunning}
                className={`px-5 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                  algo === a ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Direction priority — hidden for Dijkstra */}
        {!isDijkstra ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Direction Priority <span className="normal-case font-normal">(drag to reorder)</span>
            </p>
            <div className="flex gap-2">
              {dirOrder.map((dir, i) => (
                <div
                  key={dir}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDragEnd={onDragEnd}
                  className="cursor-grab select-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 active:cursor-grabbing transition-colors"
                >
                  {dir}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Direction Priority</p>
            <p className="text-xs italic text-gray-400 max-w-56">
              Dijkstra picks the lowest-cost cell next, not based on direction order
            </p>
          </div>
        )}

        {/* Speed slider */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Speed — <span className="normal-case font-normal">{SPEEDS[speed].label}</span>
          </p>
          <input
            type="range" min={0} max={SPEEDS.length - 1} value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="w-32 accent-blue-600"
          />
        </div>

        {/* Action buttons */}
        <div className="ml-auto flex gap-2">
          <button onClick={handleNewMaze} disabled={anyRunning}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            New Maze
          </button>
          <button onClick={handleStart} disabled={!canRun}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors">
            Start
          </button>
          <button onClick={handleReset} disabled={frameIdx === -1}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* ── Set Start / Set End ── */}
      <div className="mt-4 flex items-center gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Place:</p>
        {[
          { mode: 'start', label: 'Set Start', active: 'bg-green-600 text-white',   inactive: 'border border-green-300 text-green-700 hover:bg-green-50' },
          { mode: 'end',   label: 'Set End',   active: 'bg-red-500 text-white',     inactive: 'border border-red-300 text-red-600 hover:bg-red-50' },
        ].map(({ mode, label, active, inactive }) => (
          <button
            key={mode}
            disabled={running || finished}
            onClick={() => setPlacingMode(p => p === mode ? null : mode)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${placingMode === mode ? active : inactive}`}
          >
            {label}
          </button>
        ))}
        {placingMode && (
          <p className="text-xs italic text-gray-400">
            Click any cell to place the {placingMode} point
          </p>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        {[
          ['#22c55e', 'Start'],
          ['#ef4444', 'End'],
          ['#bfdbfe', 'Visited'],
          ['#fde047', 'Frontier'],
          ['#86efac', 'Path'],
          ...(isDijkstra
            ? Object.entries(TERRAIN).map(([cost, { label, color }]) => [color, `${label} (cost ${cost})`])
            : []
          ),
        ].map(([bg, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span style={{ backgroundColor: bg }} className="inline-block h-3 w-3 rounded-sm border border-gray-200" />
            {label}
          </span>
        ))}
      </div>

      {/* ── Maze ── */}
      <div className="mt-3 inline-block select-none">
        {cells.map((row, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {row.map((cell, c) => {
              const k = key(r, c)
              const isMarked = k === startKey || k === endKey ||
                (finished && path.has(k)) || frame.frontier.has(k) || frame.visited.has(k)
              return (
                <div key={c} style={cellStyle(r, c, cell)} onClick={() => handleCellClick(r, c)}>
                  {isDijkstra && (
                    <span style={{
                      position: 'absolute', bottom: 1, right: 2,
                      fontSize: 7, lineHeight: 1,
                      pointerEvents: 'none', userSelect: 'none',
                      color: isMarked ? 'rgba(0,0,0,0.2)' : '#9ca3af',
                    }}>
                      {dkWeights[r][c]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Complexity Dashboard ── */}
      {stats && stats.time !== null && (
        <ComplexityDashboard stats={stats} isDijkstra={isDijkstra} />
      )}
    </div>
  )
}
