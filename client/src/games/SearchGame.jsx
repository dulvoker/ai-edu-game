import { useState, useEffect, useRef } from 'react'

// ── Constants ─────────────────────────────────────────────────

const ROWS = 6
const COLS = 6

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
      if (r < 0.7) return 1
      if (r < 0.9) return 3
      return 5
    })
  )
}

// ── Visualisation traces ──────────────────────────────────────

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

// ── Test Yourself — pure helpers ──────────────────────────────
// Mirror the exact algorithm logic so "next cell" in test mode
// matches what the visualisation would show at the same step.

function initTestState(algo, cells, weights, startCell) {
  const sk = key(startCell.r, startCell.c)
  if (algo === 'Dijkstra') {
    const cost = weights[startCell.r][startCell.c]
    return {
      settled:       new Set(),
      pq:            [{ r: startCell.r, c: startCell.c, cost }],
      dist:          { [sk]: cost },
      parent:        new Map([[sk, null]]),
      steps:         0,
      firstTry:      0,
      wrongThisStep: false,
      feedback:      null,
      showHint:      false,
      done:          false,
    }
  }
  return {
    discovered:    new Set([sk]),
    ds:            [{ r: startCell.r, c: startCell.c }],
    parent:        new Map([[sk, null]]),
    steps:         0,
    firstTry:      0,
    wrongThisStep: false,
    feedback:      null,
    showHint:      false,
    done:          false,
  }
}

function getNextCell(ts, algo) {
  if (!ts || ts.done) return null
  // Guard against stale state from previous algo (effect hasn't reinit yet)
  if (algo === 'Dijkstra') {
    if (!ts.pq || !ts.settled) return null
    const open = ts.pq.filter(e => !ts.settled.has(key(e.r, e.c)))
    if (!open.length) return null
    return open.reduce((m, e) => e.cost < m.cost ? e : m)
  }
  if (!ts.ds) return null
  if (algo === 'BFS') return ts.ds[0] ?? null
  return ts.ds[ts.ds.length - 1] ?? null  // DFS: top of stack
}

function stepTestState(ts, algo, dirOrder, cells, weights, endKey) {
  const next = getNextCell(ts, algo)
  if (!next) return ts
  const { r, c } = next
  const k = key(r, c)
  const isDone = k === endKey

  if (algo === 'Dijkstra') {
    const newSettled = new Set(ts.settled)
    newSettled.add(k)
    let newPq = ts.pq.filter(e => key(e.r, e.c) !== k)
    const newDist = { ...ts.dist }
    const newParent = new Map(ts.parent)

    if (!isDone) {
      for (const { dr, dc, wall } of Object.values(DIRS)) {
        if (cells[r][c][wall]) continue
        const nr = r + dr, nc = c + dc
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
        const nk = key(nr, nc)
        if (newSettled.has(nk)) continue
        const newCost = ts.dist[k] + weights[nr][nc]
        if (newDist[nk] === undefined || newCost < newDist[nk]) {
          newDist[nk] = newCost
          newParent.set(nk, k)
          newPq.push({ r: nr, c: nc, cost: newCost })
        }
      }
    }
    return { ...ts, settled: newSettled, pq: newPq, dist: newDist, parent: newParent, done: isDone }
  }

  // BFS / DFS
  const newDiscovered = new Set(ts.discovered)
  const newDs = algo === 'BFS' ? ts.ds.slice(1) : ts.ds.slice(0, -1)
  const newParent = new Map(ts.parent)

  if (!isDone) {
    const exploreOrder = algo === 'DFS' ? [...dirOrder].reverse() : dirOrder
    for (const d of exploreOrder) {
      const { dr, dc, wall } = DIRS[d]
      if (cells[r][c][wall]) continue
      const nr = r + dr, nc = c + dc
      const nk = key(nr, nc)
      if (newDiscovered.has(nk)) continue
      newDiscovered.add(nk)
      newParent.set(nk, k)
      newDs.push({ r: nr, c: nc })
    }
  }
  return { ...ts, discovered: newDiscovered, ds: newDs, parent: newParent, done: isDone }
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
            expands the cell with the smallest cumulative cost — guaranteed optimal even when
            terrain varies.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Use <strong>Visualisation</strong> mode to watch the algorithm animate, or
          <strong> Test Yourself</strong> to predict each step and score yourself.
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

// ── Frontier Panel ────────────────────────────────────────────

function FrontierPanel({ ts, algo, isDijkstra }) {
  if (!ts) return null

  let items = []
  if (isDijkstra) {
    if (!ts.pq || !ts.settled) return null  // guard stale state
    const seen = new Set()
    items = ts.pq
      .filter(e => !ts.settled.has(key(e.r, e.c)))
      .sort((a, b) => a.cost - b.cost)
      .filter(e => { const k = key(e.r, e.c); if (seen.has(k)) return false; seen.add(k); return true })
  } else {
    if (!ts.ds) return null  // guard stale state
    items = algo === 'BFS' ? ts.ds : [...ts.ds].reverse()
  }

  const label = isDijkstra ? 'Priority Queue' : algo === 'BFS' ? 'Queue' : 'Stack'
  const sub   = isDijkstra ? 'sorted by cost' : algo === 'BFS' ? 'front → back' : 'top → bottom'

  return (
    <div className="w-48 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-xs text-gray-400 mb-2">{sub}</p>
      {items.length === 0 ? (
        <p className="text-xs italic text-gray-300">empty</p>
      ) : (
        <div className="space-y-1 max-h-[26rem] overflow-y-auto pr-1">
          {items.map((e, i) => (
            <div key={i} className={`rounded px-2 py-1 text-xs font-mono flex items-center justify-between ${
              i === 0
                ? 'bg-yellow-50 border border-yellow-300 text-yellow-800 font-semibold'
                : 'bg-gray-50 border border-gray-100 text-gray-500'
            }`}>
              <span>({e.r},{e.c})</span>
              {isDijkstra && <span className="text-gray-400 ml-1">·{e.cost}</span>}
              {i === 0 && <span className="ml-1 text-yellow-500 text-xs">next</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function SearchGame() {
  const [showTutorial, setShowTutorial] = useState(true)
  const [gameMode, setGameMode]   = useState('vis')   // 'vis' | 'test'
  const [algo, setAlgo]           = useState('BFS')
  const [dirOrder, setDirOrder]   = useState(['Up', 'Right', 'Down', 'Left'])
  const [speed, setSpeed]         = useState(1)
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

  // ── Test Yourself state ───────────────────────────────────────
  const [testState, setTestState] = useState(null)

  const intervalRef  = useRef(null)
  const startTimeRef = useRef(null)
  const dragFrom     = useRef(null)

  // ── Active-mode aliases ───────────────────────────────────────
  const isDijkstra = algo === 'Dijkstra'
  const cells      = isDijkstra ? dkCells    : uwCells
  const weights    = isDijkstra ? dkWeights  : null
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

  const visFrame = frames[frameIdx] ?? { visited: new Set(), frontier: new Set() }

  // ── Test state init / reset when relevant things change ───────
  useEffect(() => {
    if (gameMode !== 'test') { setTestState(null); return }
    if (startKey === endKey) return
    setTestState(initTestState(algo, cells, weights, startCell))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, algo, uwCells, dkCells, dkWeights, uwStart, uwEnd, dkStart, dkEnd])

  // ── Auto-clear test feedback after 800ms ──────────────────────
  useEffect(() => {
    if (!testState?.feedback) return
    const t = setTimeout(
      () => setTestState(s => s ? { ...s, feedback: null } : s),
      800
    )
    return () => clearTimeout(t)
  }, [testState?.feedback])

  // ── Visualisation animation loops ─────────────────────────────

  useEffect(() => {
    if (isDijkstra || !uwRunning) return
    intervalRef.current = setInterval(() => {
      setUwFrameIdx(i => {
        if (i >= uwFrames.length - 1) {
          clearInterval(intervalRef.current); setUwRunning(false); setUwFinished(true); return i
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
          clearInterval(intervalRef.current); setDkRunning(false); setDkFinished(true); return i
        }
        return i + 1
      })
    }, SPEEDS[speed].ms)
    return () => clearInterval(intervalRef.current)
  }, [isDijkstra, dkRunning, dkFrames, speed])

  useEffect(() => {
    if (uwFinished && uwStats && uwStats.time === null)
      setUwStats(s => s ? { ...s, time: Math.round(performance.now() - startTimeRef.current) } : s)
  }, [uwFinished])

  useEffect(() => {
    if (dkFinished && dkStats && dkStats.time === null)
      setDkStats(s => s ? { ...s, time: Math.round(performance.now() - startTimeRef.current) } : s)
  }, [dkFinished])

  // ── Derived for test mode ─────────────────────────────────────

  const nextCell = (gameMode === 'test' && testState && !testState.done)
    ? getNextCell(testState, algo) : null

  // Reconstruct path when test is done
  const testPath = (() => {
    if (!testState?.done) return null
    const p = new Set()
    let cur = endKey
    while (cur !== null && testState.parent.has(cur)) {
      p.add(cur)
      cur = testState.parent.get(cur) ?? null
    }
    return p
  })()

  // ── Cell colour ───────────────────────────────────────────────

  const visCellBg = (r, c) => {
    const k = key(r, c)
    if (k === startKey) return '#22c55e'
    if (k === endKey)   return '#ef4444'
    if (finished && path.has(k))     return '#86efac'
    if (visFrame.frontier.has(k))    return '#fde047'
    if (visFrame.visited.has(k))     return '#bfdbfe'
    if (isDijkstra) return TERRAIN[dkWeights[r][c]].color
    return '#ffffff'
  }

  const testCellBg = (r, c) => {
    const k = key(r, c)
    if (k === startKey) return '#22c55e'
    if (k === endKey)   return '#ef4444'
    if (testState?.done && testPath?.has(k)) return '#86efac'
    if (!testState) return isDijkstra ? TERRAIN[dkWeights[r][c]].color : '#ffffff'
    // Guard: testState may still hold prior-algo shape between algo switch and effect reinit
    if (isDijkstra) {
      if (!testState.settled || !testState.pq) return TERRAIN[dkWeights[r][c]].color
      if (testState.settled.has(k)) return '#bfdbfe'
      const inPq = testState.pq.some(e => key(e.r, e.c) === k) && !testState.settled.has(k)
      if (inPq) return '#fde047'
      return TERRAIN[dkWeights[r][c]].color
    }
    if (!testState.ds || !testState.discovered) return '#ffffff'
    const inDs = testState.ds.some(e => key(e.r, e.c) === k)
    if (inDs) return '#fde047'
    if (testState.discovered.has(k)) return '#bfdbfe'
    return '#ffffff'
  }

  const cellBg = (r, c) => gameMode === 'test' ? testCellBg(r, c) : visCellBg(r, c)

  const cellStyle = (r, c, cell) => {
    const isHint = testState?.showHint && nextCell && key(r, c) === key(nextCell.r, nextCell.c)
    return {
      width: 56, height: 56,
      boxSizing: 'border-box',
      position: 'relative',
      backgroundColor: cellBg(r, c),
      borderStyle: 'solid',
      borderColor: '#374151',
      borderTopWidth:    cell.top    ? 2 : 0,
      borderLeftWidth:   cell.left   ? 2 : 0,
      borderRightWidth:  c === COLS - 1 && cell.right  ? 2 : 0,
      borderBottomWidth: r === ROWS - 1 && cell.bottom ? 2 : 0,
      cursor: placingMode ? 'crosshair' : gameMode === 'test' && testState && !testState.done ? 'pointer' : 'default',
      outline: isHint ? '3px solid #d97706' : undefined,
      outlineOffset: isHint ? '-2px' : undefined,
    }
  }

  // ── Handlers ─────────────────────────────────────────────────

  const handleModeChange = (mode) => {
    if (anyRunning) return
    setGameMode(mode)
    setPlacingMode(null)
  }

  const handleAlgoChange = (newAlgo) => {
    if (anyRunning) return
    setAlgo(newAlgo)
    setPlacingMode(null)
  }

  const handleCellClick = (r, c) => {
    if (placingMode) {
      if (gameMode === 'vis' && (running || finished)) return
      if (placingMode === 'start') setStartCell({ r, c })
      else setEndCell({ r, c })
      setPlacingMode(null)
      return
    }
    if (gameMode === 'test' && testState && !testState.done) {
      handleTestGuess(r, c)
    }
  }

  const handleTestGuess = (r, c) => {
    if (!nextCell) return
    const clickedKey = key(r, c)
    const nextKey    = key(nextCell.r, nextCell.c)

    if (clickedKey === nextKey) {
      const advanced = stepTestState(testState, algo, dirOrder, cells, weights, endKey)
      const firstTryBonus = !testState.wrongThisStep && !testState.showHint ? 1 : 0
      setTestState({
        ...advanced,
        steps:         testState.steps + 1,
        firstTry:      testState.firstTry + firstTryBonus,
        wrongThisStep: false,
        feedback:      'correct',
        showHint:      false,
      })
    } else {
      if (testState.feedback === 'wrong') return  // debounce
      setTestState(s => s ? { ...s, wrongThisStep: true, feedback: 'wrong' } : s)
    }
  }

  const handleStart = () => {
    if (!canRun) return
    startTimeRef.current = performance.now()
    if (isDijkstra) {
      const result = traceDijkstra(dkCells, dkWeights, dkStart, dkEnd)
      setDkFrames(result.frames); setDkPath(result.path); setDkFrameIdx(0)
      setDkStats({ nodesExpanded: result.nodesExpanded, peakFrontier: result.peakFrontier, pathLength: result.path.size, totalCost: result.totalCost, time: null })
      setDkRunning(true)
    } else {
      const result = traceSearchAlgorithm(uwCells, algo, dirOrder, uwStart, uwEnd)
      setUwFrames(result.frames); setUwPath(result.path); setUwFrameIdx(0)
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

  const handleTryAgain = () => {
    if (startKey !== endKey)
      setTestState(initTestState(algo, cells, weights, startCell))
  }

  const onDragStart = (i) => { dragFrom.current = i }
  const onDragOver  = (e, i) => {
    e.preventDefault()
    if (dragFrom.current === null || dragFrom.current === i) return
    const from = dragFrom.current
    setDirOrder(o => { const n = [...o]; const [it] = n.splice(from, 1); n.splice(i, 0, it); return n })
    dragFrom.current = i
  }
  const onDragEnd = () => { dragFrom.current = null }

  // ── Render ────────────────────────────────────────────────────

  if (showTutorial) return <Tutorial onDismiss={() => setShowTutorial(false)} />

  const testDone    = testState?.done
  const testFeedback = testState?.feedback
  const accuracy    = testState?.steps > 0 ? Math.round((testState.firstTry / testState.steps) * 100) : 0

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Search Algorithms</h1>

      {/* ── Mode tabs ── */}
      <div className="mt-4 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {[['vis', 'Visualisation'], ['test', 'Test Yourself']].map(([m, label]) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            disabled={anyRunning}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
              gameMode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Controls row ── */}
      <div className="mt-5 flex flex-wrap items-end gap-6">

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

        {/* Direction priority */}
        {!isDijkstra ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Direction Priority <span className="normal-case font-normal">(drag to reorder)</span>
            </p>
            <div className="flex gap-2">
              {dirOrder.map((dir, i) => (
                <div
                  key={dir} draggable
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

        {/* Speed slider — visualisation only */}
        {gameMode === 'vis' && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Speed — <span className="normal-case font-normal">{SPEEDS[speed].label}</span>
            </p>
            <input type="range" min={0} max={SPEEDS.length - 1} value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-32 accent-blue-600" />
          </div>
        )}

        {/* Action buttons */}
        <div className="ml-auto flex gap-2">
          <button onClick={handleNewMaze} disabled={anyRunning}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            New Maze
          </button>
          {gameMode === 'vis' && <>
            <button onClick={handleStart} disabled={!canRun}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors">
              Start
            </button>
            <button onClick={handleReset} disabled={frameIdx === -1}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              Reset
            </button>
          </>}
          {gameMode === 'test' && testState && (
            <button onClick={handleTryAgain}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Try Again
            </button>
          )}
        </div>
      </div>

      {/* ── Set Start / Set End ── */}
      <div className="mt-4 flex items-center gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Place:</p>
        {[
          { mode: 'start', label: 'Set Start', active: 'bg-green-600 text-white',   inactive: 'border border-green-300 text-green-700 hover:bg-green-50' },
          { mode: 'end',   label: 'Set End',   active: 'bg-red-500 text-white',     inactive: 'border border-red-300 text-red-600 hover:bg-red-50' },
        ].map(({ mode, label, active, inactive }) => (
          <button key={mode}
            disabled={gameMode === 'vis' && (running || finished)}
            onClick={() => setPlacingMode(p => p === mode ? null : mode)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${placingMode === mode ? active : inactive}`}
          >
            {label}
          </button>
        ))}
        {placingMode && (
          <p className="text-xs italic text-gray-400">Click any cell to place the {placingMode} point</p>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        {[
          ['#22c55e', 'Start'], ['#ef4444', 'End'],
          ['#bfdbfe', 'Visited'], ['#fde047', 'Frontier'], ['#86efac', 'Path'],
          ...(isDijkstra
            ? Object.entries(TERRAIN).map(([cost, { label, color }]) => [color, `${label} (cost ${cost})`])
            : []),
        ].map(([bg, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span style={{ backgroundColor: bg }} className="inline-block h-3 w-3 rounded-sm border border-gray-200" />
            {label}
          </span>
        ))}
      </div>

      {/* ── Maze + Frontier Panel ── */}
      <div className="mt-3 flex gap-6 items-start">

        {/* Maze */}
        <div className="inline-block select-none">
          {cells.map((row, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {row.map((cell, c) => {
                const k = key(r, c)
                const isMarked = k === startKey || k === endKey ||
                  (finished && path.has(k)) || visFrame.frontier.has(k) || visFrame.visited.has(k)
                return (
                  <div key={c} style={cellStyle(r, c, cell)} onClick={() => handleCellClick(r, c)}>
                    {isDijkstra && (
                      <span style={{
                        position: 'absolute', bottom: 1, right: 2,
                        fontSize: 11, lineHeight: 1,
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

        {/* Frontier panel — test mode only */}
        {gameMode === 'test' && (
          <FrontierPanel ts={testState} algo={algo} isDijkstra={isDijkstra} />
        )}
      </div>

      {/* ── Test mode feedback & hint ── */}
      {gameMode === 'test' && testState && !testDone && (
        <div className="mt-3 flex items-center gap-4">
          {testFeedback === 'correct' && (
            <span className="text-sm font-semibold text-green-600">✓ Correct!</span>
          )}
          {testFeedback === 'wrong' && (
            <span className="text-sm font-semibold text-red-500">✗ Wrong — try again</span>
          )}
          {!testFeedback && (
            <span className="text-xs text-gray-400">
              Click the cell the algorithm visits next
            </span>
          )}
          <button
            onClick={() => setTestState(s => s ? { ...s, showHint: true, wrongThisStep: true } : s)}
            disabled={testState.showHint}
            className="ml-auto rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100 disabled:opacity-40 transition-colors"
          >
            Show hint
          </button>
        </div>
      )}

      {/* ── Test mode results ── */}
      {gameMode === 'test' && testDone && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 max-w-sm">
          <h3 className="font-semibold text-gray-900">Test complete!</h3>
          <div className="mt-3 space-y-1.5 text-sm">
            <p className="text-gray-600">
              Steps taken: <strong className="text-gray-900">{testState.steps}</strong>
            </p>
            <p className="text-gray-600">
              Correct on first try: <strong className="text-gray-900">{testState.firstTry} / {testState.steps}</strong>
            </p>
            <p className="text-gray-600">
              Accuracy: <strong className={accuracy === 100 ? 'text-green-600' : accuracy >= 70 ? 'text-yellow-600' : 'text-red-500'}>{accuracy}%</strong>
            </p>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {accuracy === 100
              ? 'Perfect! You think like the algorithm 🎯'
              : accuracy >= 70
              ? 'Great job! A few missteps 👍'
              : 'Keep practising — check the Visualisation mode for hints'}
          </p>
          <div className="mt-4 flex gap-2">
            <button onClick={handleTryAgain}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Try Again
            </button>
            <button onClick={handleNewMaze}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              New Maze
            </button>
          </div>
        </div>
      )}

      {/* ── Visualisation complexity dashboard ── */}
      {gameMode === 'vis' && stats && stats.time !== null && (
        <ComplexityDashboard stats={stats} isDijkstra={isDijkstra} />
      )}
    </div>
  )
}
