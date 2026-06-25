import { useState, useEffect, useMemo, useRef } from 'react'

const NODE_R = 22

// ── Tree generation ───────────────────────────────────────────

function buildRandomTree() {
  const count = 7 + Math.floor(Math.random() * 3) // 7-9 nodes

  // Unique values 1-99 via partial Fisher-Yates shuffle
  const pool99 = Array.from({ length: 99 }, (_, i) => i + 1)
  for (let i = pool99.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool99[i], pool99[j]] = [pool99[j], pool99[i]]
  }
  const values = pool99.slice(0, count)

  let nextId = 0
  const mkNode = v => ({ id: nextId++, value: v, left: null, right: null, x: 0, y: 0 })
  const nodes = values.map(mkNode)

  // Pool-based random insertion: each node goes to a random parent with a free slot
  const pool = [nodes[0]]
  for (let i = 1; i < nodes.length; i++) {
    const pi = Math.floor(Math.random() * pool.length)
    const p = pool[pi]
    if (!p.left && !p.right) {
      if (Math.random() < 0.5) p.left = nodes[i]
      else p.right = nodes[i]
    } else if (!p.left) {
      p.left = nodes[i]
      pool.splice(pi, 1) // parent is now full
    } else {
      p.right = nodes[i]
      pool.splice(pi, 1)
    }
    pool.push(nodes[i])
  }

  return nodes[0]
}

function layoutTree(root) {
  const H = 60   // horizontal units per leaf slot
  const V = 68   // vertical units per depth level
  const TOP = 30 // top padding
  let leafIdx = 0

  // Post-order: assign children first, then center parent over them
  function place(n, depth) {
    if (!n) return
    place(n.left,  depth + 1)
    place(n.right, depth + 1)
    n.y = depth * V + TOP
    if (!n.left && !n.right) {
      n.x = leafIdx * H + H / 2
      leafIdx++
    } else {
      const lx = n.left?.x ?? null
      const rx = n.right?.x ?? null
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
    if (n.left)  { out.push([n, n.left]);  dfs(n.left)  }
    if (n.right) { out.push([n, n.right]); dfs(n.right) }
  }
  dfs(root)
  return out
}

function inorder(n, acc = []) {
  if (!n) return acc
  inorder(n.left, acc)
  acc.push(n.id)
  inorder(n.right, acc)
  return acc
}

function preorder(n, acc = []) {
  if (!n) return acc
  acc.push(n.id)
  preorder(n.left, acc)
  preorder(n.right, acc)
  return acc
}

function postorder(n, acc = []) {
  if (!n) return acc
  postorder(n.left, acc)
  postorder(n.right, acc)
  acc.push(n.id)
  return acc
}

const TRAV_FNS = { inorder, preorder, postorder }
const TRAV_META = {
  inorder:   { label: 'Inorder',   sub: 'Left → Root → Right' },
  preorder:  { label: 'Preorder',  sub: 'Root → Left → Right' },
  postorder: { label: 'Postorder', sub: 'Left → Right → Root' },
}

// ── Tutorial ──────────────────────────────────────────────────

function Tutorial({ onDismiss }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Tree Traversals</h1>
      <p className="mt-2 text-gray-500">
        Predict which order a traversal visits all nodes before seeing the animation.
      </p>
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-800">Inorder — Left → Root → Right</h2>
          <p className="mt-1 text-sm leading-relaxed text-blue-700">
            Recurse into the left subtree, visit the root, then recurse into the right.
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
          Click nodes in the order you think the traversal visits them, then hit
          "Check my prediction" to see the animated result.
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

// ── Main component ────────────────────────────────────────────

export default function TreeTraversalGame() {
  const [showTutorial, setShowTutorial] = useState(true)
  const [tree, setTree]           = useState(generateTree)
  const [traversal, setTraversal] = useState('inorder')
  const [phase, setPhase]         = useState('predict') // 'predict' | 'result'
  const [prediction, setPrediction] = useState([])      // node ids in click order
  const [animStep, setAnimStep]   = useState(-1)
  const timerRef = useRef(null)

  const nodes   = useMemo(() => gatherNodes(tree), [tree])
  const edges   = useMemo(() => gatherEdges(tree), [tree])
  const nodeMap = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes])
  const correct = useMemo(() => TRAV_FNS[traversal](tree), [tree, traversal])
  const total   = nodes.length

  const svgW = useMemo(() => Math.max(...nodes.map(n => n.x)) + NODE_R + 28, [nodes])
  const svgH = useMemo(() => Math.max(...nodes.map(n => n.y)) + NODE_R + 20, [nodes])

  // Begin animation shortly after entering result phase
  useEffect(() => {
    if (phase !== 'result') { setAnimStep(-1); return }
    const t = setTimeout(() => setAnimStep(0), 500)
    return () => clearTimeout(t)
  }, [phase])

  // Advance animation one step at a time
  useEffect(() => {
    if (animStep < 0 || animStep >= correct.length) return
    timerRef.current = setTimeout(() => setAnimStep(s => s + 1), 600)
    return () => clearTimeout(timerRef.current)
  }, [animStep, correct.length])

  // ── Node visual helpers ───────────────────────────────────────

  const nodeFill = (nid) => {
    if (phase === 'result' && animStep >= 0) {
      const i = correct.indexOf(nid)
      if (i < animStep)   return '#bfdbfe' // visited: blue-200
      if (i === animStep) return '#fde047' // current: yellow-300
    }
    if (phase === 'predict' && prediction.includes(nid)) return '#bbf7d0' // green-200
    return '#ffffff'
  }

  const nodeStroke = (nid) => {
    if (phase === 'result' && animStep >= 0) {
      const i = correct.indexOf(nid)
      if (i < animStep)   return '#3b82f6' // blue-500
      if (i === animStep) return '#ca8a04' // yellow-600
    }
    if (phase === 'predict' && prediction.includes(nid)) return '#16a34a' // green-600
    return '#d1d5db' // gray-300
  }

  // ── Handlers ─────────────────────────────────────────────────

  const changeTraversal = (type) => {
    clearTimeout(timerRef.current)
    setTraversal(type)
    setPrediction([])
    setPhase('predict')
    setAnimStep(-1)
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
    setTree(generateTree())
    setPrediction([])
    setPhase('predict')
    setAnimStep(-1)
  }

  const score = phase === 'result'
    ? correct.filter((id, i) => prediction[i] === id).length
    : 0

  if (showTutorial) return <Tutorial onDismiss={() => setShowTutorial(false)} />

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Tree Traversals</h1>
      <p className="mt-1 text-sm text-gray-500">
        Predict the {TRAV_META[traversal].label} visit order, then check your answer.
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
                traversal === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gray-400">{TRAV_META[traversal].sub}</p>
      </div>

      {/* ── SVG Tree ── */}
      <div className="mt-5 inline-block">
        <svg
          width={svgW} height={svgH}
          style={{ overflow: 'visible' }}
        >
          {/* Draw edges beneath nodes */}
          {edges.map(([p, c], i) => (
            <line
              key={i}
              x1={p.x} y1={p.y} x2={c.x} y2={c.y}
              stroke="#d1d5db" strokeWidth={2}
            />
          ))}

          {/* Draw nodes */}
          {nodes.map(node => {
            const clickable = phase === 'predict' && !prediction.includes(node.id)
            const clickOrder = prediction.indexOf(node.id)
            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                style={{ cursor: clickable ? 'pointer' : 'default' }}
              >
                <circle
                  cx={node.x} cy={node.y} r={NODE_R}
                  fill={nodeFill(node.id)}
                  stroke={nodeStroke(node.id)}
                  strokeWidth={2.5}
                />
                <text
                  x={node.x} y={node.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={13} fontWeight={600} fill="#111827"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.value}
                </text>
                {/* Small click-order badge in top-right of node */}
                {clickOrder >= 0 && phase === 'predict' && (
                  <text
                    x={node.x + NODE_R - 5} y={node.y - NODE_R + 7}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={9} fontWeight={700} fill="#166534"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {clickOrder + 1}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* ── Predict phase ── */}
      {phase === 'predict' && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
            Your prediction — click nodes in order
          </p>

          {/* Sequence row */}
          <div className="flex flex-wrap gap-1.5 min-h-[2.5rem]">
            {prediction.map((nid, i) => (
              <span key={i} className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 border-green-400 bg-green-100 text-sm font-bold text-green-800">
                {nodeMap[nid]?.value}
              </span>
            ))}
            {Array.from({ length: total - prediction.length }).map((_, i) => (
              <span key={`ph${i}`} className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-300">
                ?
              </span>
            ))}
          </div>

          {/* Controls */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setPrediction(p => p.slice(0, -1))}
              disabled={!prediction.length}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Undo
            </button>
            <button
              onClick={() => setPrediction([])}
              disabled={!prediction.length}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Clear
            </button>
            {prediction.length === total && (
              <button
                onClick={handleCheck}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Check my prediction →
              </button>
            )}
            <button
              onClick={handleNewTree}
              className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              New Tree
            </button>
          </div>
        </div>
      )}

      {/* ── Result phase ── */}
      {phase === 'result' && (
        <div className="mt-4 max-w-xl">
          {/* Score */}
          <div className="flex items-baseline gap-2 mb-5">
            <span className={`text-4xl font-bold ${
              score === total ? 'text-green-600' :
              score >= Math.ceil(total / 2) ? 'text-yellow-600' : 'text-red-500'
            }`}>
              {score}/{total}
            </span>
            <span className="text-sm font-medium text-gray-500">correct positions</span>
            {score === total && <span className="text-sm text-green-600 font-semibold">Perfect!</span>}
          </div>

          {/* Side-by-side comparison */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 w-28 shrink-0">
                Your answer
              </span>
              <div className="flex flex-wrap gap-1">
                {prediction.map((nid, i) => {
                  const match = prediction[i] === correct[i]
                  return (
                    <span key={i} className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold border-2 ${
                      match
                        ? 'bg-green-100 border-green-400 text-green-800'
                        : 'bg-red-100 border-red-400 text-red-700'
                    }`}>
                      {nodeMap[nid]?.value}
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 w-28 shrink-0">
                Correct order
              </span>
              <div className="flex flex-wrap gap-1">
                {correct.map((nid, i) => {
                  const match = prediction[i] === correct[i]
                  return (
                    <span key={i} className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold border-2 ${
                      match
                        ? 'bg-green-100 border-green-400 text-green-800'
                        : 'bg-blue-100 border-blue-400 text-blue-800'
                    }`}>
                      {nodeMap[nid]?.value}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Animated playback sequence */}
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
              Animated playback
            </p>
            <div className="flex flex-wrap gap-1.5 min-h-[2.5rem]">
              {correct.map((nid, i) => {
                const revealed = animStep >= 0 && i <= animStep
                const isCurrent = i === animStep
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold border-2 transition-all duration-300 ${
                      !revealed
                        ? 'border-gray-200 bg-gray-50 text-gray-300'
                        : isCurrent
                        ? 'border-yellow-500 bg-yellow-200 text-yellow-900 scale-110'
                        : 'border-blue-400 bg-blue-100 text-blue-800'
                    }`}
                  >
                    {revealed ? nodeMap[nid]?.value : '·'}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex gap-2">
            <button
              onClick={handleTryAgain}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleNewTree}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              New Tree
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
