import { useState, useEffect, useMemo, useRef, Fragment } from 'react'

const NODE_R = 22

const SPEEDS = [
  { label: 'Slow',         ms: 700  },
  { label: 'Normal',       ms: 350  },
  { label: 'Fast',         ms: 100  },
  { label: 'Step by step', ms: null },
]

// ── Tree generation ───────────────────────────────────────────

function buildRandomTree() {
  const count = 7 + Math.floor(Math.random() * 3) // 7-9 nodes

  const pool99 = Array.from({ length: 99 }, (_, i) => i + 1)
  for (let i = pool99.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool99[i], pool99[j]] = [pool99[j], pool99[i]]
  }
  const values = pool99.slice(0, count)

  let nextId = 0
  const mkNode = v => ({ id: nextId++, value: v, left: null, right: null, x: 0, y: 0 })
  const nodes = values.map(mkNode)

  const pool = [nodes[0]]
  for (let i = 1; i < nodes.length; i++) {
    const pi = Math.floor(Math.random() * pool.length)
    const p = pool[pi]
    if (!p.left && !p.right) {
      if (Math.random() < 0.5) p.left = nodes[i]
      else p.right = nodes[i]
    } else if (!p.left) {
      p.left = nodes[i]; pool.splice(pi, 1)
    } else {
      p.right = nodes[i]; pool.splice(pi, 1)
    }
    pool.push(nodes[i])
  }
  return nodes[0]
}

function layoutTree(root) {
  const H = 60, V = 68, TOP = 30
  let leafIdx = 0
  function place(n, depth) {
    if (!n) return
    place(n.left,  depth + 1)
    place(n.right, depth + 1)
    n.y = depth * V + TOP
    if (!n.left && !n.right) {
      n.x = leafIdx * H + H / 2; leafIdx++
    } else {
      const lx = n.left?.x ?? null, rx = n.right?.x ?? null
      n.x = lx !== null && rx !== null ? (lx + rx) / 2 : (lx ?? rx)
    }
  }
  place(root, 0)
}

function generateTree() {
  const root = buildRandomTree()
  layoutTree(root)
  return root
}

// ── Traversal trace ───────────────────────────────────────────
// Simulates the call stack explicitly. Each frame is snapped at
// the moment a node is visited, capturing what's still pending.

function traceTraversal(root, type) {
  const frames  = []
  const visited = []
  const stack   = root ? [{ op: 'call', node: root }] : []

  while (stack.length) {
    const { op, node } = stack.pop()
    if (!node) continue

    if (op === 'call') {
      if (type === 'inorder') {
        // Left → Root → Right  (push reversed: right, visit, left)
        if (node.right) stack.push({ op: 'call',  node: node.right })
        stack.push({ op: 'visit', node })
        if (node.left)  stack.push({ op: 'call',  node: node.left  })
      } else if (type === 'preorder') {
        // Root → Left → Right  (push reversed: right, left, visit)
        if (node.right) stack.push({ op: 'call',  node: node.right })
        if (node.left)  stack.push({ op: 'call',  node: node.left  })
        stack.push({ op: 'visit', node })
      } else {
        // Postorder: Left → Right → Root  (push reversed: visit, right, left)
        stack.push({ op: 'visit', node })
        if (node.right) stack.push({ op: 'call',  node: node.right })
        if (node.left)  stack.push({ op: 'call',  node: node.left  })
      }
    } else {
      // Visit event: snap the remaining stack (top → bottom)
      visited.push(node.id)
      frames.push({
        visited: [...visited],
        current: node.id,
        pending: [...stack].reverse().filter(s => s.node),
      })
    }
  }

  return frames
}

// ── Tree helpers ──────────────────────────────────────────────

function gatherNodes(root) {
  const out = []
  function dfs(n) { if (!n) return; out.push(n); dfs(n.left); dfs(n.right) }
  dfs(root)
  return out
}

function gatherEdges(root) {
  const out = []
  function dfs(n) {
    if (!n) return
    if (n.left)  { out.push({ p: n, c: n.left,  side: 'L' }); dfs(n.left)  }
    if (n.right) { out.push({ p: n, c: n.right, side: 'R' }); dfs(n.right) }
  }
  dfs(root)
  return out
}

function inorder(n,   acc = []) { if (!n) return acc; inorder(n.left, acc); acc.push(n.id); inorder(n.right, acc); return acc }
function preorder(n,  acc = []) { if (!n) return acc; acc.push(n.id); preorder(n.left, acc); preorder(n.right, acc); return acc }
function postorder(n, acc = []) { if (!n) return acc; postorder(n.left, acc); postorder(n.right, acc); acc.push(n.id); return acc }

const TRAV_FNS  = { inorder, preorder, postorder }

const STEP_STYLES = {
  left:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', hint: 'recurse' },
  root:  { bg: '#fefce8', border: '#fde047', text: '#92400e', hint: 'visit'   },
  right: { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9', hint: 'recurse' },
}

const TRAV_META = {
  inorder: {
    label: 'Inorder',
    steps: [
      { label: 'Left subtree',  ...STEP_STYLES.left  },
      { label: 'Root',          ...STEP_STYLES.root  },
      { label: 'Right subtree', ...STEP_STYLES.right },
    ],
  },
  preorder: {
    label: 'Preorder',
    steps: [
      { label: 'Root',          ...STEP_STYLES.root  },
      { label: 'Left subtree',  ...STEP_STYLES.left  },
      { label: 'Right subtree', ...STEP_STYLES.right },
    ],
  },
  postorder: {
    label: 'Postorder',
    steps: [
      { label: 'Left subtree',  ...STEP_STYLES.left  },
      { label: 'Right subtree', ...STEP_STYLES.right },
      { label: 'Root',          ...STEP_STYLES.root  },
    ],
  },
}

// ── Call Stack Display ────────────────────────────────────────

function CallStackDisplay({ pending }) {
  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm" style={{ width: 160 }}>
      <div className="border-b border-gray-100 bg-gray-50 px-3 py-2.5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Call Stack</p>
        <p className="mt-0.5 text-xs text-gray-400">top → bottom</p>
      </div>

      <div className="max-h-80 space-y-1.5 overflow-y-auto p-2">
        {pending.length === 0 ? (
          <p className="py-3 text-center text-xs italic text-gray-300">done</p>
        ) : pending.map(({ op, node }, i) => {
          const isNext    = i === 0
          const isVisit   = op === 'visit'
          return (
            <div
              key={i}
              style={{
                backgroundColor: isNext ? (isVisit ? '#fefce8' : '#eff6ff') : '#f9fafb',
                borderColor:     isNext ? (isVisit ? '#fde047' : '#93c5fd') : '#f3f4f6',
                transform:       isNext ? 'scale(1.03)' : 'scale(1)',
                transition:      'all 0.15s ease',
              }}
              className="flex items-center gap-2 rounded-xl border px-2.5 py-1.5"
            >
              <span style={{ fontSize: 10, color: isVisit ? '#ca8a04' : '#3b82f6', fontWeight: 800 }}>
                {isVisit ? '→' : '⤷'}
              </span>
              <div>
                <p style={{ fontSize: 9, color: '#9ca3af', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isVisit ? 'visit' : 'call'}
                </p>
                <p className="font-mono text-xs font-semibold" style={{ color: isNext ? '#1f2937' : '#6b7280' }}>
                  {node.value}
                </p>
              </div>
              {isNext && (
                <span style={{ marginLeft: 'auto', fontSize: 9, color: isVisit ? '#ca8a04' : '#3b82f6', fontWeight: 700 }}>
                  next
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tutorial ──────────────────────────────────────────────────

function Tutorial({ onDismiss }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Tree Traversals</h1>
      <p className="mt-2 text-gray-500">Watch the algorithm animate, then predict the visit order yourself.</p>
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-800">Inorder — Left → Root → Right</h2>
          <p className="mt-1 text-sm leading-relaxed text-blue-700">
            Recurse left, visit the root, then recurse right.
            On a binary search tree, this visits nodes in sorted ascending order.
          </p>
        </div>
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
          <h2 className="font-semibold text-purple-800">Preorder — Root → Left → Right</h2>
          <p className="mt-1 text-sm leading-relaxed text-purple-700">
            Visit the root first, then recurse left, then right.
            Useful for copying or serialising a tree structure.
          </p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-5">
          <h2 className="font-semibold text-green-800">Postorder — Left → Right → Root</h2>
          <p className="mt-1 text-sm leading-relaxed text-green-700">
            Recurse both subtrees before visiting the root.
            Useful for deleting a tree or evaluating expression trees bottom-up.
          </p>
        </div>
        <p className="text-sm text-gray-400">
          The <strong>Call Stack</strong> panel shows exactly what the recursion has queued up at each step.
        </p>
      </div>
      <button onClick={onDismiss} className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors">
        Got it, let's play
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function TreeTraversalGame() {
  const [showTutorial, setShowTutorial] = useState(true)
  const [tree, setTree]               = useState(generateTree)
  const [traversal, setTraversal]     = useState('inorder')

  // 'vis' → watch animation; 'predict' → click nodes; 'result' → see score
  const [phase, setPhase]             = useState('vis')

  // Vis mode
  const [visFrameIdx, setVisFrameIdx] = useState(-1)
  const [visRunning,  setVisRunning]  = useState(false)
  const [visFinished, setVisFinished] = useState(false)
  const [visSpeed,    setVisSpeed]    = useState(1)

  // Test mode
  const [prediction, setPrediction]   = useState([])
  const [animStep,   setAnimStep]     = useState(-1)

  const intervalRef = useRef(null)
  const timerRef    = useRef(null)

  // ── Derived ───────────────────────────────────────────────────

  const nodes   = useMemo(() => gatherNodes(tree), [tree])
  const edges   = useMemo(() => gatherEdges(tree), [tree])
  const nodeMap = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes])
  const correct = useMemo(() => TRAV_FNS[traversal](tree), [tree, traversal])
  const total   = nodes.length

  const visFrames = useMemo(() => traceTraversal(tree, traversal), [tree, traversal])
  const visFrame  = visFrames[visFrameIdx] ?? { visited: [], current: null, pending: [] }

  const svgW = useMemo(() => Math.max(...nodes.map(n => n.x)) + NODE_R + 28, [nodes])
  const svgH = useMemo(() => Math.max(...nodes.map(n => n.y)) + NODE_R + 20, [nodes])

  const isStepMode   = SPEEDS[visSpeed].ms === null
  const isStepping   = isStepMode && visFrameIdx >= 0 && !visFinished
  const canBeginVis  = visFrameIdx === -1 && !visRunning && !visFinished
  const canNextStep  = isStepping && visFrameIdx < visFrames.length - 1

  // ── Effects ───────────────────────────────────────────────────

  // Vis auto-play loop
  useEffect(() => {
    if (phase !== 'vis' || !visRunning || isStepMode) return
    intervalRef.current = setInterval(() => {
      setVisFrameIdx(i => {
        if (i >= visFrames.length - 1) {
          clearInterval(intervalRef.current)
          setVisRunning(false)
          setVisFinished(true)
          return i
        }
        return i + 1
      })
    }, SPEEDS[visSpeed].ms)
    return () => clearInterval(intervalRef.current)
  }, [phase, visRunning, visSpeed, visFrames, isStepMode])

  // Result animated playback
  useEffect(() => {
    if (phase !== 'result') { setAnimStep(-1); return }
    const t = setTimeout(() => setAnimStep(0), 500)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (animStep < 0 || animStep >= correct.length) return
    timerRef.current = setTimeout(() => setAnimStep(s => s + 1), 600)
    return () => clearTimeout(timerRef.current)
  }, [animStep, correct.length])

  // ── Node visual helpers ───────────────────────────────────────

  const nodeFill = (nid) => {
    if (phase === 'vis' && visFrameIdx >= 0) {
      if (nid === visFrame.current)            return '#fde047'
      if (visFrame.visited.includes(nid))      return '#bfdbfe'
      return '#ffffff'
    }
    if (phase === 'result' && animStep >= 0) {
      const i = correct.indexOf(nid)
      if (i < animStep)   return '#bfdbfe'
      if (i === animStep) return '#fde047'
    }
    if (phase === 'predict' && prediction.includes(nid)) return '#bbf7d0'
    return '#ffffff'
  }

  const nodeStroke = (nid) => {
    if (phase === 'vis' && visFrameIdx >= 0) {
      if (nid === visFrame.current)            return '#ca8a04'
      if (visFrame.visited.includes(nid))      return '#3b82f6'
      return '#d1d5db'
    }
    if (phase === 'result' && animStep >= 0) {
      const i = correct.indexOf(nid)
      if (i < animStep)   return '#3b82f6'
      if (i === animStep) return '#ca8a04'
    }
    if (phase === 'predict' && prediction.includes(nid)) return '#16a34a'
    return '#d1d5db'
  }

  // ── Handlers ─────────────────────────────────────────────────

  const resetVis = () => {
    clearInterval(intervalRef.current)
    setVisFrameIdx(-1)
    setVisRunning(false)
    setVisFinished(false)
  }

  const changeTraversal = (type) => {
    clearTimeout(timerRef.current)
    clearInterval(intervalRef.current)
    setTraversal(type)
    setPrediction([])
    setPhase('vis')
    setAnimStep(-1)
    resetVis()
  }

  const handleBeginVis = () => {
    setVisFrameIdx(0)
    setVisFinished(false)
    if (!isStepMode) setVisRunning(true)
  }

  const handleNextVisStep = () => {
    const next = visFrameIdx + 1
    if (next >= visFrames.length - 1) {
      setVisFrameIdx(visFrames.length - 1)
      setVisFinished(true)
    } else {
      setVisFrameIdx(next)
    }
  }

  const handleEnterTest = () => {
    setPrediction([])
    setPhase('predict')
    setAnimStep(-1)
  }

  const handleBackToVis = () => {
    clearTimeout(timerRef.current)
    setPhase('vis')
    setPrediction([])
    setAnimStep(-1)
    resetVis()
  }

  const handleNodeClick = (nid) => {
    if (phase !== 'predict' || prediction.includes(nid)) return
    setPrediction(p => [...p, nid])
  }

  const handleCheck = () => {
    if (prediction.length === total) setPhase('result')
  }

  const handleTryAgain = () => {
    clearTimeout(timerRef.current)
    setPrediction([])
    setPhase('predict')
    setAnimStep(-1)
  }

  const handleNewTree = () => {
    clearTimeout(timerRef.current)
    clearInterval(intervalRef.current)
    setTree(generateTree())
    setPrediction([])
    setPhase('vis')
    setAnimStep(-1)
    setVisFrameIdx(-1)
    setVisRunning(false)
    setVisFinished(false)
  }

  const score = phase === 'result'
    ? correct.filter((id, i) => prediction[i] === id).length : 0

  if (showTutorial) return <Tutorial onDismiss={() => setShowTutorial(false)} />

  // ── Render ────────────────────────────────────────────────────

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Tree Traversals</h1>
      <p className="mt-1 text-sm text-gray-400">
        {phase === 'vis'
          ? 'Step 1 — Watch the traversal'
          : 'Step 2 — Test yourself'}
      </p>

      {/* ── Traversal selector ── */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Traversal type</p>
        <div className="flex overflow-hidden rounded-lg border border-gray-200 w-fit">
          {Object.entries(TRAV_META).map(([type, { label }]) => (
            <button
              key={type}
              onClick={() => changeTraversal(type)}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                traversal === type ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Traversal order banner */}
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
          {TRAV_META[traversal].steps.map((step, i, arr) => (
            <Fragment key={i}>
              <div className="flex flex-col items-center rounded-lg px-3 py-1.5"
                style={{ backgroundColor: step.bg, border: `1px solid ${step.border}` }}>
                <span className="text-xs font-bold" style={{ color: step.text }}>{step.label}</span>
                <span style={{ fontSize: 9, color: step.text, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {step.hint}
                </span>
              </div>
              {i < arr.length - 1 && (
                <span className="text-base font-light text-gray-300">→</span>
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* ── Speed selector + action buttons (vis mode) ── */}
      {phase === 'vis' && (
        <div className="mt-4 flex flex-wrap items-end gap-6">
          {/* Speed */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Speed</p>
            <div className="flex overflow-hidden rounded-lg border border-gray-200">
              {SPEEDS.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => setVisSpeed(i)}
                  disabled={visRunning || isStepping}
                  className={`px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
                    visSpeed === i ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={handleNewTree}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              New Tree
            </button>
            <button onClick={resetVis} disabled={visFrameIdx === -1}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              Reset
            </button>

            {isStepping && (
              <>
                <span className="px-2 text-xs text-gray-400 tabular-nums">
                  {visFrameIdx + 1} / {visFrames.length}
                </span>
                <button onClick={handleNextVisStep} disabled={!canNextStep}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors">
                  Next step →
                </button>
              </>
            )}
            {!isStepping && (
              <button onClick={handleBeginVis} disabled={!canBeginVis}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors">
                {isStepMode ? 'Begin' : 'Run Visualisation'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Back to visualisation (test phases) ── */}
      {(phase === 'predict' || phase === 'result') && (
        <div className="mt-4 flex gap-2">
          <button onClick={handleBackToVis}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            ← Watch again
          </button>
          <button onClick={handleNewTree}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            New Tree
          </button>
        </div>
      )}

      {/* ── SVG tree + Call Stack panel ── */}
      <div className="mt-5 flex gap-6 items-start">
        <div className="inline-block">
          <svg width={svgW} height={svgH} style={{ overflow: 'visible' }}>
            {/* Edges */}
            {edges.map(({ p, c, side }, i) => {
              const singleChild = !p.left || !p.right
              const midX = (p.x + c.x) / 2, midY = (p.y + c.y) / 2
              return (
                <g key={i}>
                  <line x1={p.x} y1={p.y} x2={c.x} y2={c.y} stroke="#d1d5db" strokeWidth={2} />
                  {singleChild && (
                    <text x={midX + (side === 'L' ? -10 : 10)} y={midY}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={10} fontWeight={700} fill="#9ca3af"
                      style={{ userSelect: 'none' }}>
                      {side}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const clickable  = phase === 'predict' && !prediction.includes(node.id)
              const clickOrder = prediction.indexOf(node.id)
              return (
                <g key={node.id} onClick={() => handleNodeClick(node.id)}
                  style={{ cursor: clickable ? 'pointer' : 'default' }}>
                  <circle cx={node.x} cy={node.y} r={NODE_R}
                    fill={nodeFill(node.id)} stroke={nodeStroke(node.id)} strokeWidth={2.5} />
                  <text x={node.x} y={node.y}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={13} fontWeight={600} fill="#111827"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {node.value}
                  </text>
                  {/* Visit-order badge (vis mode) */}
                  {phase === 'vis' && visFrameIdx >= 0 && visFrame.visited.includes(node.id) && (
                    <text x={node.x + NODE_R - 5} y={node.y - NODE_R + 7}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={9} fontWeight={700} fill="#1d4ed8"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {visFrame.visited.indexOf(node.id) + 1}
                    </text>
                  )}
                  {/* Predict click-order badge */}
                  {clickOrder >= 0 && phase === 'predict' && (
                    <text x={node.x + NODE_R - 5} y={node.y - NODE_R + 7}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={9} fontWeight={700} fill="#166534"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {clickOrder + 1}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Call Stack — visible during vis animation */}
        {phase === 'vis' && visFrameIdx >= 0 && (
          <CallStackDisplay pending={visFrame.pending} />
        )}
      </div>

      {/* ── Post-animation CTA ── */}
      {phase === 'vis' && visFinished && (
        <div className="mt-5 flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 max-w-lg">
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">Traversal complete!</p>
            <p className="mt-0.5 text-xs text-blue-600">
              Now predict the visit order yourself — click nodes one by one.
            </p>
          </div>
          <button onClick={handleEnterTest}
            className="shrink-0 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Test Yourself →
          </button>
        </div>
      )}

      {/* ── Predict phase ── */}
      {phase === 'predict' && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
            Your prediction — click nodes in visit order
          </p>
          <div className="flex flex-wrap gap-1.5 min-h-[2.5rem]">
            {prediction.map((nid, i) => (
              <span key={i} className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 border-green-400 bg-green-100 text-sm font-bold text-green-800">
                {nodeMap[nid]?.value}
              </span>
            ))}
            {Array.from({ length: total - prediction.length }).map((_, i) => (
              <span key={`ph${i}`} className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-300">?</span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setPrediction(p => p.slice(0, -1))} disabled={!prediction.length}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              ← Undo
            </button>
            <button onClick={() => setPrediction([])} disabled={!prediction.length}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              Clear
            </button>
            {prediction.length === total && (
              <button onClick={handleCheck}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                Check my prediction →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Result phase ── */}
      {phase === 'result' && (
        <div className="mt-4 max-w-xl">
          <div className="flex items-baseline gap-2 mb-5">
            <span className={`text-4xl font-bold ${
              score === total ? 'text-green-600' :
              score >= Math.ceil(total / 2) ? 'text-yellow-600' : 'text-red-500'
            }`}>{score}/{total}</span>
            <span className="text-sm font-medium text-gray-500">correct positions</span>
            {score === total && <span className="text-sm text-green-600 font-semibold">Perfect!</span>}
          </div>

          {/* Side-by-side comparison */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 w-28 shrink-0">Your answer</span>
              <div className="flex flex-wrap gap-1">
                {prediction.map((nid, i) => (
                  <span key={i} className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold border-2 ${
                    prediction[i] === correct[i]
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-red-100 border-red-400 text-red-700'
                  }`}>{nodeMap[nid]?.value}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 w-28 shrink-0">Correct order</span>
              <div className="flex flex-wrap gap-1">
                {correct.map((nid, i) => (
                  <span key={i} className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold border-2 ${
                    prediction[i] === correct[i]
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-blue-100 border-blue-400 text-blue-800'
                  }`}>{nodeMap[nid]?.value}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Animated playback */}
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Animated playback</p>
            <div className="flex flex-wrap gap-1.5 min-h-[2.5rem]">
              {correct.map((nid, i) => {
                const revealed  = animStep >= 0 && i <= animStep
                const isCurrent = i === animStep
                return (
                  <span key={i} className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold border-2 transition-all duration-300 ${
                    !revealed  ? 'border-gray-200 bg-gray-50 text-gray-300' :
                    isCurrent  ? 'border-yellow-500 bg-yellow-200 text-yellow-900 scale-110' :
                                 'border-blue-400 bg-blue-100 text-blue-800'
                  }`}>
                    {revealed ? nodeMap[nid]?.value : '·'}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button onClick={handleTryAgain}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Try Again
            </button>
            <button onClick={handleNewTree}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              New Tree
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
