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

const DEFAULT_START = { r: 0,         c: 0         }
const DEFAULT_END   = { r: ROWS - 1,  c: COLS - 1  }

// ── Maze generation (Recursive Backtracking) ──────────────────

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

  // Extra-passage pass: randomly remove ~30% of remaining interior walls so
  // the maze has more open areas and multiple viable paths, making the
  // visual difference between BFS and DFS more pronounced.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r > 0 && cells[r][c].top && Math.random() < 0.3) {
        cells[r][c].top = false
        cells[r - 1][c].bottom = false
      }
      if (c > 0 && cells[r][c].left && Math.random() < 0.3) {
        cells[r][c].left = false
        cells[r][c - 1].right = false
      }
    }
  }

  return cells
}

// ── Algorithm trace ───────────────────────────────────────────
// Pre-computes every animation frame, the final path, and peak frontier size.
// For DFS, directions are pushed in reverse so dirOrder[0] is explored first.

function traceAlgorithm(cells, algo, dirOrder, startCell, endCell) {
  const startKey = key(startCell.r, startCell.c)
  const endKey   = key(endCell.r,   endCell.c)

  const visited = new Set([startKey])
  const parent  = new Map([[startKey, null]])
  const frames  = []
  let ds = [{ r: startCell.r, c: startCell.c }]
  let peakFrontier = 1

  const snap = () =>
    frames.push({
      visited:  new Set(visited),
      frontier: new Set(ds.map(({ r, c }) => key(r, c))),
    })

  snap()

  // Reverse for DFS so that the first item in dirOrder is popped (explored) first
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

  // Reconstruct path end → start
  const path = new Set()
  if (parent.has(endKey)) {
    let cur = endKey
    while (cur !== null) {
      path.add(cur)
      cur = parent.get(cur) ?? null
    }
  }

  return { frames, path, peakFrontier, nodesExpanded: visited.size }
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
            the <strong>shortest path</strong> in an unweighted maze. The search fans out
            evenly from the start like a ripple on water.
          </p>
        </div>
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
          <h2 className="font-semibold text-purple-800">Depth-First Search (DFS)</h2>
          <p className="mt-2 text-sm leading-relaxed text-purple-700">
            DFS commits fully to one branch before backtracking and trying the next.
            It uses a <strong>stack</strong> (last-in, first-out) and is memory-efficient,
            but does <strong>not guarantee the shortest path</strong> — it tends to
            snake deep into the maze before reversing.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Click "Set Start" or "Set End" above the maze to choose custom start and end
          cells. Drag the direction labels to control which neighbours each algorithm
          explores first. Run the same maze with BFS then DFS to compare the search
          shapes and path lengths.
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

function ComplexityDashboard({ stats }) {
  const { nodesExpanded, peakFrontier, pathLength, time } = stats
  const efficiencyPct = nodesExpanded > 0
    ? Math.round((pathLength / nodesExpanded) * 100)
    : 0
  const efficiencyLabel =
    efficiencyPct >= 50 ? 'Highly efficient' :
    efficiencyPct >= 20 ? 'Moderately efficient' :
                          'Exploration-heavy'
  const efficiencyColor =
    efficiencyPct >= 50 ? 'text-green-600' :
    efficiencyPct >= 20 ? 'text-yellow-600' :
                          'text-orange-600'

  const cards = [
    {
      accent: 'border-blue-200 bg-blue-50',
      icon: '⏱',
      iconColor: 'text-blue-500',
      title: 'Time Complexity',
      main: `${nodesExpanded} nodes expanded`,
      note: 'Theoretical: O(V + E) for both BFS and DFS',
    },
    {
      accent: 'border-purple-200 bg-purple-50',
      icon: '📦',
      iconColor: 'text-purple-500',
      title: 'Space Complexity',
      main: `Peak frontier: ${peakFrontier}`,
      note: 'Theoretical: O(V) worst case; BFS frontier tends to be larger on wide graphs',
    },
    {
      accent: 'border-green-200 bg-green-50',
      icon: '📐',
      iconColor: 'text-green-500',
      title: 'Path Efficiency',
      main: `${pathLength} steps · ${efficiencyPct}%`,
      note: null,
      extra: <span className={`text-xs font-semibold ${efficiencyColor}`}>{efficiencyLabel}</span>,
    },
    {
      accent: 'border-gray-200 bg-gray-50',
      icon: '🕐',
      iconColor: 'text-gray-500',
      title: 'Wall-clock Time',
      main: `${time} ms`,
      note: 'Includes animation overhead — not a pure algorithm benchmark',
    },
  ]

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 max-w-xl">
      {cards.map(({ accent, icon, iconColor, title, main, note, extra }) => (
        <div key={title} className={`rounded-xl border-2 p-4 ${accent}`}>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${iconColor}`}>{icon}</span>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          </div>
          <p className="mt-2 text-sm font-bold text-gray-900">{main}</p>
          {extra && <div className="mt-1">{extra}</div>}
          {note && <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{note}</p>}
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function SearchGame() {
  const [showTutorial, setShowTutorial] = useState(true)
  const [cells, setCells]     = useState(generateMaze)
  const [algo, setAlgo]       = useState('BFS')
  const [dirOrder, setDirOrder] = useState(['Up', 'Right', 'Down', 'Left'])
  const [speed, setSpeed]     = useState(1)

  const [startCell, setStartCell] = useState(DEFAULT_START)
  const [endCell, setEndCell]     = useState(DEFAULT_END)
  const [placingMode, setPlacingMode] = useState(null) // null | 'start' | 'end'

  const [frames, setFrames]   = useState([])
  const [path, setPath]       = useState(new Set())
  const [frameIdx, setFrameIdx] = useState(-1)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [stats, setStats]     = useState(null)

  const intervalRef  = useRef(null)
  const startTimeRef = useRef(null)
  const dragFrom     = useRef(null)

  const frame = frames[frameIdx] ?? { visited: new Set(), frontier: new Set() }

  const startKey = key(startCell.r, startCell.c)
  const endKey   = key(endCell.r,   endCell.c)
  const canRun   = !running && !finished && startKey !== endKey

  // ── Cell colour ──────────────────────────────────────────────

  const cellBg = (r, c) => {
    const k = key(r, c)
    if (k === startKey) return '#22c55e'           // start: green-500
    if (k === endKey)   return '#ef4444'           // end: red-500
    if (finished && path.has(k)) return '#86efac' // path: green-300
    if (frame.frontier.has(k))   return '#fde047' // frontier: yellow-300
    if (frame.visited.has(k))    return '#bfdbfe' // visited: blue-200
    return '#ffffff'
  }

  // Render top+left borders per cell; right/bottom only on outer edge.
  // Each wall is drawn exactly once — no doubled borders.
  const cellStyle = (r, c, cell) => ({
    width: 32,
    height: 32,
    boxSizing: 'border-box',
    backgroundColor: cellBg(r, c),
    borderStyle: 'solid',
    borderColor: '#374151',
    borderTopWidth:    cell.top    ? 2 : 0,
    borderLeftWidth:   cell.left   ? 2 : 0,
    borderRightWidth:  c === COLS - 1 && cell.right  ? 2 : 0,
    borderBottomWidth: r === ROWS - 1 && cell.bottom ? 2 : 0,
    cursor: placingMode ? 'crosshair' : 'default',
  })

  // ── Animation loop ───────────────────────────────────────────

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setFrameIdx(i => {
        if (i >= frames.length - 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          setFinished(true)
          return i
        }
        return i + 1
      })
    }, SPEEDS[speed].ms)
    return () => clearInterval(intervalRef.current)
  }, [running, frames, speed])

  // ── Handlers ─────────────────────────────────────────────────

  const handleCellClick = (r, c) => {
    if (!placingMode || running || finished) return
    if (placingMode === 'start') {
      setStartCell({ r, c })
      setPlacingMode(null)
    } else {
      setEndCell({ r, c })
      setPlacingMode(null)
    }
  }

  const handleStart = () => {
    if (!canRun) return
    const result = traceAlgorithm(cells, algo, dirOrder, startCell, endCell)
    setFrames(result.frames)
    setPath(result.path)
    setFrameIdx(0)
    setStats({
      nodesExpanded: result.nodesExpanded,
      peakFrontier:  result.peakFrontier,
      pathLength:    result.path.size,
      time: null,    // filled when animation ends
    })
    startTimeRef.current = performance.now()
    setRunning(true)

    // Capture elapsed time when animation finishes via a one-shot check
    const pathSize    = result.path.size
    const expanded    = result.nodesExpanded
    const peakF       = result.peakFrontier
    const totalFrames = result.frames.length
    // Store refs so the interval callback can set final time
    startTimeRef._meta = { pathSize, expanded, peakF, totalFrames }
  }

  // Set wall-clock time once animation finishes
  useEffect(() => {
    if (finished && stats && stats.time === null) {
      setStats(s => ({
        ...s,
        time: Math.round(performance.now() - startTimeRef.current),
      }))
    }
  }, [finished])

  const handleReset = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setFinished(false)
    setFrameIdx(-1)
    setFrames([])
    setPath(new Set())
    setStats(null)
    setPlacingMode(null)
  }

  const handleNewMaze = () => {
    handleReset()
    setCells(generateMaze())
    setStartCell(DEFAULT_START)
    setEndCell(DEFAULT_END)
  }

  // Drag-to-reorder direction priority
  const onDragStart = (i) => { dragFrom.current = i }
  const onDragOver = (e, i) => {
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
            {['BFS', 'DFS'].map(a => (
              <button
                key={a}
                onClick={() => !running && setAlgo(a)}
                className={`px-5 py-2 text-sm font-medium transition-colors ${
                  algo === a
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Direction priority */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Direction Priority{' '}
            <span className="normal-case font-normal">(drag to reorder)</span>
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

        {/* Speed slider */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Speed — <span className="normal-case font-normal">{SPEEDS[speed].label}</span>
          </p>
          <input
            type="range"
            min={0}
            max={SPEEDS.length - 1}
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="w-32 accent-blue-600"
          />
        </div>

        {/* Action buttons */}
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleNewMaze}
            disabled={running}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            New Maze
          </button>
          <button
            onClick={handleStart}
            disabled={!canRun}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            Start
          </button>
          <button
            onClick={handleReset}
            disabled={frameIdx === -1}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Set Start / Set End ── */}
      <div className="mt-4 flex items-center gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Place:</p>
        {[
          { mode: 'start', label: 'Set Start', active: 'bg-green-600 text-white', inactive: 'border border-green-300 text-green-700 hover:bg-green-50' },
          { mode: 'end',   label: 'Set End',   active: 'bg-red-500 text-white',   inactive: 'border border-red-300 text-red-600 hover:bg-red-50' },
        ].map(({ mode, label, active, inactive }) => (
          <button
            key={mode}
            disabled={running || finished}
            onClick={() => setPlacingMode(p => p === mode ? null : mode)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
              placingMode === mode ? active : inactive
            }`}
          >
            {label}
          </button>
        ))}
        {placingMode && (
          <p className="text-xs text-gray-400 italic">
            Click any cell on the maze to place the {placingMode} point
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
            {row.map((cell, c) => (
              <div
                key={c}
                style={cellStyle(r, c, cell)}
                onClick={() => handleCellClick(r, c)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── Complexity Dashboard (shown after algorithm finishes) ── */}
      {stats && stats.time !== null && (
        <ComplexityDashboard stats={stats} />
      )}
    </div>
  )
}
