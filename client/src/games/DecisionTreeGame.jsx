import { useState } from 'react'

// ── Data ──────────────────────────────────────────────────────

// DIFFICULTY (for future adaptive system):
// Easy:   2 features (hasWings, isLarge), 6 creatures
// Normal: 3 features (hasWings, isLarge, hasClaws), 8 creatures ← current
// Hard:   4 features (hasWings, isLarge, hasClaws, hasPoison), 10 creatures

const FEATURES = [
  { key: 'hasWings', label: 'Wings', icon: '🪶' },
  { key: 'isLarge',  label: 'Large', icon: '📏' },
  { key: 'hasClaws', label: 'Claws', icon: '🦶' },
]

// Hidden rule: dangerous if hasWings || (isLarge && hasClaws)
// All 8 combinations of 3 binary features are covered.
const CREATURES = [
  { id: 1, emoji: '🐇', name: 'Rabbit',   hasWings: false, isLarge: false, hasClaws: false, label: 'safe'      },
  { id: 2, emoji: '🦔', name: 'Hedgehog', hasWings: false, isLarge: false, hasClaws: true,  label: 'safe'      },
  { id: 3, emoji: '🐘', name: 'Elephant', hasWings: false, isLarge: true,  hasClaws: false, label: 'safe'      },
  { id: 4, emoji: '🦁', name: 'Lion',     hasWings: false, isLarge: true,  hasClaws: true,  label: 'dangerous' },
  { id: 5, emoji: '🐝', name: 'Bee',      hasWings: true,  isLarge: false, hasClaws: false, label: 'dangerous' },
  { id: 6, emoji: '🦅', name: 'Eagle',    hasWings: true,  isLarge: false, hasClaws: true,  label: 'dangerous' },
  { id: 7, emoji: '🦢', name: 'Swan',     hasWings: true,  isLarge: true,  hasClaws: false, label: 'dangerous' },
  { id: 8, emoji: '🐉', name: 'Dragon',   hasWings: true,  isLarge: true,  hasClaws: true,  label: 'dangerous' },
]

// ── Tree utilities ────────────────────────────────────────────

function classify(node, creature) {
  if (!node) return null
  if (node.type === 'leaf') return node.label
  return classify(creature[node.feature] ? node.yes : node.no, creature)
}

function isComplete(node) {
  if (!node) return false
  if (node.type === 'leaf') return true
  return isComplete(node.yes) && isComplete(node.no)
}

function countNodes(node) {
  if (!node) return 0
  if (node.type === 'leaf') return 1
  return 1 + countNodes(node.yes) + countNodes(node.no)
}

// ── Tutorial ──────────────────────────────────────────────────

function Tutorial({ onDismiss }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Decision Trees</h1>
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-800">What is a Decision Tree?</h2>
          <p className="mt-2 text-sm leading-relaxed text-blue-700">
            A decision tree classifies things by asking a series of yes/no questions about their
            features. Each <strong>internal node</strong> tests one feature and routes left or
            right; each <strong>leaf node</strong> gives a final verdict. The challenge is
            choosing which features to test — and in what order — so every creature lands in
            the correct leaf.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-800">Worked Example</h2>
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg border border-red-200 bg-red-50 p-3 text-center">
              <div className="text-3xl">🐝</div>
              <p className="mt-1 text-xs font-semibold text-gray-800">Bee</p>
              <p className="text-xs text-gray-500">Has wings</p>
              <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Dangerous
              </span>
            </div>
            <div className="flex-1 rounded-lg border border-green-200 bg-green-50 p-3 text-center">
              <div className="text-3xl">🐇</div>
              <p className="mt-1 text-xs font-semibold text-gray-800">Rabbit</p>
              <p className="text-xs text-gray-500">No wings</p>
              <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Safe
              </span>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-700">Ask: "Has wings?"</p>
            <p className="mt-1 text-gray-600">
              → Yes ⟹ <span className="font-semibold text-red-600">Dangerous</span>
            </p>
            <p className="text-gray-600">
              → No &nbsp;⟹ <span className="font-semibold text-green-600">Safe</span>
            </p>
            <p className="mt-2 text-xs text-gray-400">One question perfectly separates these two.</p>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          In the game you'll classify 8 creatures using up to 3 features. Look at which
          creatures are dangerous and try to spot the pattern — then encode it as a tree.
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

// ── Creature Card ─────────────────────────────────────────────

function CreatureCard({ creature, correct }) {
  const border =
    correct === null ? 'border-gray-200' :
    correct          ? 'border-green-400 bg-green-50' :
                       'border-red-400 bg-red-50'

  return (
    <div className={`rounded-lg border-2 p-2.5 transition-colors ${border}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{creature.emoji}</span>
        <div>
          <p className="text-xs font-semibold text-gray-800 leading-tight">
            {creature.name}
            {correct !== null && (
              <span className={`ml-1 ${correct ? 'text-green-600' : 'text-red-500'}`}>
                {correct ? '✓' : '✗'}
              </span>
            )}
          </p>
          <span className={`text-xs font-medium ${
            creature.label === 'safe' ? 'text-green-600' : 'text-red-600'
          }`}>
            {creature.label === 'safe' ? 'Safe' : 'Dangerous'}
          </span>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {FEATURES.map(f => (
          <span
            key={f.key}
            className={`rounded px-1.5 py-0.5 text-xs ${
              creature[f.key]
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-300 line-through'
            }`}
          >
            {f.icon} {f.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Node Picker ───────────────────────────────────────────────
// Rendered at every empty slot in the tree.

function NodePicker({ creatures, usedFeatures, onUpdate }) {
  const available = FEATURES.filter(f => !usedFeatures.includes(f.key))

  return (
    <div className="space-y-2.5 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-3">
      <p className="text-xs text-gray-400">
        {creatures.length === 0
          ? 'No creatures reach this branch.'
          : `${creatures.length} creature${creatures.length !== 1 ? 's' : ''}: ${creatures.map(c => c.emoji).join('')}`}
      </p>

      {available.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Split on:</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map(f => (
              <button
                key={f.key}
                onClick={() => onUpdate({ type: 'split', feature: f.key, yes: null, no: null })}
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
              >
                {f.icon} {f.label}?
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-500">Classify as:</p>
        <div className="flex gap-1.5">
          <button
            onClick={() => onUpdate({ type: 'leaf', label: 'safe' })}
            className="flex-1 rounded-md border border-green-200 bg-green-50 px-2 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
          >
            ✅ Safe
          </button>
          <button
            onClick={() => onUpdate({ type: 'leaf', label: 'dangerous' })}
            className="flex-1 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
          >
            ⚠️ Dangerous
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tree Node View ────────────────────────────────────────────
// Recursive component. Each node receives its subtree + the creatures
// that reach it, so it can show partitioned counts and emojis.

function TreeNodeView({ node, creatures, usedFeatures = [], onUpdate }) {
  if (!node) {
    return (
      <NodePicker
        creatures={creatures}
        usedFeatures={usedFeatures}
        onUpdate={onUpdate}
      />
    )
  }

  if (node.type === 'leaf') {
    const safe = node.label === 'safe'
    return (
      <div className={`flex items-center justify-between rounded-lg border-2 px-3 py-2 ${
        safe ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
      }`}>
        <span className={`text-sm font-semibold ${safe ? 'text-green-700' : 'text-red-700'}`}>
          {safe ? '✅ Safe' : '⚠️ Dangerous'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {creatures.length} creature{creatures.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => onUpdate(null)}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  // Split node
  const feat = FEATURES.find(f => f.key === node.feature)
  const yes = creatures.filter(c => c[node.feature])
  const no = creatures.filter(c => !c[node.feature])
  const newUsed = [...usedFeatures, node.feature]

  return (
    <div>
      <div className="flex items-center justify-between rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-2">
        <span className="text-sm font-semibold text-blue-700">
          {feat.icon} {feat.label}?
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-400">{creatures.length} creatures</span>
          <button
            onClick={() => onUpdate(null)}
            className="text-xs text-blue-200 hover:text-blue-500 transition-colors"
            title="Remove subtree"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="ml-3 mt-1.5 space-y-3 border-l-2 border-gray-200 pl-3">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">
            Yes ({yes.length}) {yes.map(c => c.emoji).join('')}
          </p>
          <TreeNodeView
            node={node.yes}
            creatures={yes}
            usedFeatures={newUsed}
            onUpdate={n => onUpdate({ ...node, yes: n })}
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">
            No ({no.length}) {no.map(c => c.emoji).join('')}
          </p>
          <TreeNodeView
            node={node.no}
            creatures={no}
            usedFeatures={newUsed}
            onUpdate={n => onUpdate({ ...node, no: n })}
          />
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function DecisionTreeGame() {
  const [showTutorial, setShowTutorial] = useState(true)
  const [tree, setTree] = useState(null)
  const [results, setResults] = useState(null)  // { map: Map<id, bool>, correct: number }

  const handleCheck = () => {
    const map = new Map()
    let correct = 0
    for (const c of CREATURES) {
      const ok = classify(tree, c) === c.label
      map.set(c.id, ok)
      if (ok) correct++
    }
    setResults({ map, correct })
  }

  const handleReset = () => {
    setTree(null)
    setResults(null)
  }

  const complete = isComplete(tree)
  const perfect = results?.correct === CREATURES.length

  if (showTutorial) return <Tutorial onDismiss={() => setShowTutorial(false)} />

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Decision Trees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Build a tree that correctly classifies all 8 creatures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {results && (
            <span className={`text-sm font-semibold ${
              perfect ? 'text-green-600' : 'text-orange-600'
            }`}>
              {results.correct}/{CREATURES.length} correct
            </span>
          )}
          <button
            onClick={handleCheck}
            disabled={!complete}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            title={complete ? '' : 'Complete all branches first'}
          >
            Check
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Success banner */}
      {perfect && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-800">
            🎉 Perfect! All {CREATURES.length} creatures correctly classified.
          </p>
          <p className="mt-0.5 text-sm text-green-700">
            Tree size: {countNodes(tree)} node{countNodes(tree) !== 1 ? 's' : ''}.
            Can you do it with fewer?
          </p>
        </div>
      )}

      {/* Wrong answer nudge */}
      {results && !perfect && (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-medium text-orange-800">
            {CREATURES.length - results.correct} creature{CREATURES.length - results.correct !== 1 ? 's' : ''} misclassified.
            Adjust the tree and try again.
          </p>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Left: creatures */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Creatures
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CREATURES.map(c => (
              <CreatureCard
                key={c.id}
                creature={c}
                correct={results ? results.map.get(c.id) : null}
              />
            ))}
          </div>
        </div>

        {/* Right: tree builder */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Decision Tree
          </p>
          <TreeNodeView
            node={tree}
            creatures={CREATURES}
            onUpdate={setTree}
          />
        </div>
      </div>
    </div>
  )
}
