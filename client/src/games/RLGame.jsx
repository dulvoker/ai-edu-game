import { useState, useRef, useEffect, useCallback } from 'react'

// ── Grid config ──────────────────────────────────────────────

const SIZE = 8
const START = [0, 0]
const GOAL = [7, 7]
const OBSTACLES = [
  [1, 3], [2, 5], [3, 1], [3, 6],
  [4, 3], [5, 5], [6, 2], [6, 6],
]
const isObstacle = (r, c) => OBSTACLES.some(([or, oc]) => or === r && oc === c)
const isGoal = (r, c) => r === GOAL[0] && c === GOAL[1]

const ACTIONS = [
  { name: 'up',    dr: -1, dc: 0 },
  { name: 'right', dr: 0,  dc: 1 },
  { name: 'down',  dr: 1,  dc: 0 },
  { name: 'left',  dr: 0,  dc: -1 },
]

// ── Q-learning hyperparameters (fixed) ──────────────────────────

const ALPHA = 0.1
const GAMMA = 0.9
const EPSILON_DECAY = 0.01
const EPSILON_MIN = 0.05
const MAX_STEPS = 100
const TOTAL_EPISODES = 200

const key = (r, c) => `${r},${c}`

function makeQTable() {
  const q = {}
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      q[key(r, c)] = [0, 0, 0, 0]
    }
  }
  return q
}

function step(r, c, actionIdx, rewards) {
  const { dr, dc } = ACTIONS[actionIdx]
  let nr = r + dr
  let nc = c + dc

  if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || isObstacle(nr, nc)) {
    // bump into a wall, the grid edge, or an obstacle: stay in place, pay the obstacle cost
    return { nr: r, nc: c, reward: rewards.obstacle, done: false }
  }
  if (isGoal(nr, nc)) {
    return { nr, nc, reward: rewards.goal, done: true }
  }
  return { nr, nc, reward: rewards.step, done: false }
}

function trainAgent(rewards) {
  const q = makeQTable()
  let epsilon = 1.0
  const history = []

  for (let ep = 0; ep < TOTAL_EPISODES; ep++) {
    let [r, c] = START
    let totalReward = 0
    let steps = 0
    let reached = false

    for (let s = 0; s < MAX_STEPS; s++) {
      const state = key(r, c)
      let actionIdx
      if (Math.random() < epsilon) {
        actionIdx = Math.floor(Math.random() * ACTIONS.length)
      } else {
        const qs = q[state]
        const maxQ = Math.max(...qs)
        const bestActions = qs.map((v, i) => (v === maxQ ? i : -1)).filter(i => i !== -1)
        actionIdx = bestActions[Math.floor(Math.random() * bestActions.length)]
      }

      const { nr, nc, reward, done } = step(r, c, actionIdx, rewards)
      const nextState = key(nr, nc)
      const maxNextQ = Math.max(...q[nextState])
      q[state][actionIdx] += ALPHA * (reward + GAMMA * maxNextQ - q[state][actionIdx])

      totalReward += reward
      steps += 1
      r = nr
      c = nc

      if (done) {
        reached = true
        break
      }
    }

    history.push({ episode: ep, reward: totalReward, steps, reached })
    epsilon = Math.max(EPSILON_MIN, epsilon - EPSILON_DECAY)
  }

  return { q, history }
}

function greedyPath(q) {
  let [r, c] = START
  const path = [[r, c]]
  const visited = new Set([key(r, c)])

  for (let s = 0; s < MAX_STEPS; s++) {
    const qs = q[key(r, c)]
    const maxQ = Math.max(...qs)
    const bestActions = qs.map((v, i) => (v === maxQ ? i : -1)).filter(i => i !== -1)
    const actionIdx = bestActions[Math.floor(Math.random() * bestActions.length)]
    const { dr, dc } = ACTIONS[actionIdx]
    let nr = r + dr
    let nc = c + dc
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || isObstacle(nr, nc)) {
      nr = r
      nc = c
    }
    r = nr
    c = nc
    path.push([r, c])
    if (isGoal(r, c)) return { path, success: true }
    if (visited.has(key(r, c))) return { path, success: false } // stuck in a loop
    visited.add(key(r, c))
  }
  return { path, success: false }
}

// ── Tutorial ──────────────────────────────────────────────────

function Tutorial({ onDismiss }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Reinforcement Learning</h1>
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-800">What's going on here?</h2>
          <p className="mt-2 text-sm leading-relaxed text-blue-700">
            An <strong>agent</strong> (🤖) is a little program that lives in a grid world and has to decide
            which direction to move, one step at a time. Every time it moves, it gets a <strong>reward</strong> —
            a number that says how good or bad that move was, like +10 for reaching the goal or −5 for hitting a wall.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-800">What does Q-learning do?</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            The agent plays hundreds of practice rounds ("episodes"). Each time, it remembers which moves led
            to good rewards and which led to bad ones, gradually building a table of "how good is this move,
            from this square?" Over time it stops wandering randomly and starts taking the smartest path to the goal.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-800">What you'll do</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            You'll set the reward structure, train the agent, and then watch it navigate the grid using
            what it learned — plus see a graph of how its performance improved over training.
          </p>
        </div>
      </div>
      <button onClick={onDismiss}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors">
        Got it, let's play
      </button>
    </div>
  )
}

// ── Reward slider ────────────────────────────────────────────

function RewardSlider({ label, value, min, max, step: stepSize, onChange, note }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-semibold text-gray-700">
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={stepSize}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-blue-600"
      />
      <p className="mt-1 text-xs text-gray-400 leading-relaxed">{note}</p>
    </div>
  )
}

// ── Episode reward graph (SVG bars) ─────────────────────────────

function EpisodeGraph({ history }) {
  if (!history || history.length === 0) return null
  const w = 640
  const h = 160
  const padL = 34
  const padB = 18
  const padT = 8
  const innerW = w - padL - 6
  const innerH = h - padT - padB

  const rewards = history.map(h2 => h2.reward)
  const min = Math.min(...rewards)
  const max = Math.max(...rewards)
  const range = max - min || 1
  const barW = innerW / history.length

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white p-3">
      <svg width={w} height={h} style={{ display: 'block' }}>
        {/* axes */}
        <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#e5e7eb" />
        <line x1={padL} y1={h - padB} x2={w - 6} y2={h - padB} stroke="#e5e7eb" />
        <text x={4} y={padT + 4} fontSize="9" fill="#9ca3af">{max.toFixed(0)}</text>
        <text x={4} y={h - padB} fontSize="9" fill="#9ca3af">{min.toFixed(0)}</text>
        <text x={w - 60} y={h - 2} fontSize="9" fill="#9ca3af">episode →</text>

        {history.map((pt, i) => {
          const barH = ((pt.reward - min) / range) * innerH
          const x = padL + i * barW
          const y = h - padB - barH
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={Math.max(barW - 0.5, 0.5)}
              height={Math.max(barH, 0.5)}
              fill={pt.reached ? '#60a5fa' : '#d1d5db'}
            />
          )
        })}
      </svg>
      <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-400 inline-block" /> reached goal</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-gray-300 inline-block" /> did not reach goal</span>
      </div>
    </div>
  )
}

// ── Grid ─────────────────────────────────────────────────────

const CELL = 44

function Grid({ agentPos, trail }) {
  const trailSet = new Set(trail.map(([r, c]) => key(r, c)))
  const cells = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const isAgent = agentPos && agentPos[0] === r && agentPos[1] === c
      const isStart = r === START[0] && c === START[1]
      let content = ''
      let bg = 'bg-white'
      if (isObstacle(r, c)) {
        content = '🧱'
        bg = 'bg-gray-100'
      } else if (isGoal(r, c)) {
        content = '⭐'
        bg = 'bg-yellow-50'
      } else if (isStart) {
        bg = 'bg-blue-50'
      }
      if (trailSet.has(key(r, c)) && !isAgent) {
        bg = 'bg-blue-100'
      }
      if (isAgent) {
        content = '🤖'
        bg = 'bg-blue-200'
      }
      cells.push(
        <div key={key(r, c)}
          className={`flex items-center justify-center border border-gray-100 text-lg transition-colors duration-150 ${bg}`}
          style={{ width: CELL, height: CELL }}>
          {content}
        </div>
      )
    }
  }
  return (
    <div
      className="grid rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      style={{ gridTemplateColumns: `repeat(${SIZE}, ${CELL}px)`, width: CELL * SIZE }}>
      {cells}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function RLGame() {
  const [showTutorial, setShowTutorial] = useState(true)

  const [rewards, setRewards] = useState({ goal: 10, step: -1, obstacle: -5 })

  const [status, setStatus] = useState('idle') // idle | training | trained | watching
  const [qTable, setQTable] = useState(null)
  const [history, setHistory] = useState(null)
  const [best, setBest] = useState(null) // { path, success }

  const [speed, setSpeed] = useState(300)
  const [agentPos, setAgentPos] = useState(START)
  const [trail, setTrail] = useState([])
  const watchTimer = useRef(null)

  useEffect(() => () => clearInterval(watchTimer.current), [])

  const handleTrain = useCallback(() => {
    setStatus('training')
    // yield a tick so the button shows "training…" before the sync compute blocks
    setTimeout(() => {
      const { q, history: hist } = trainAgent(rewards)
      const bestResult = greedyPath(q)
      setQTable(q)
      setHistory(hist)
      setBest(bestResult)
      setStatus('trained')
      setAgentPos(START)
      setTrail([])
    }, 30)
  }, [rewards])

  const handleWatch = useCallback(() => {
    if (!qTable) return
    const { path } = greedyPath(qTable)
    clearInterval(watchTimer.current)
    setStatus('watching')
    setAgentPos(path[0])
    setTrail([path[0]])
    let i = 0
    watchTimer.current = setInterval(() => {
      i += 1
      if (i >= path.length) {
        clearInterval(watchTimer.current)
        setStatus('trained')
        return
      }
      setAgentPos(path[i])
      setTrail(prev => [...prev, path[i]])
    }, speed)
  }, [qTable, speed])

  const handleReset = useCallback(() => {
    clearInterval(watchTimer.current)
    setStatus('idle')
    setQTable(null)
    setHistory(null)
    setBest(null)
    setAgentPos(START)
    setTrail([])
  }, [])

  if (showTutorial) return <Tutorial onDismiss={() => setShowTutorial(false)} />

  const last20 = history ? history.slice(-20) : []
  const successCount = last20.filter(h => h.reached).length
  const successRate = last20.length ? Math.round((successCount / last20.length) * 100) : 0
  const successfulSteps = last20.filter(h => h.reached).map(h => h.steps)
  const avgSteps = successfulSteps.length
    ? (successfulSteps.reduce((a, b) => a + b, 0) / successfulSteps.length).toFixed(1)
    : null

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reinforcement Learning</h1>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-600 leading-relaxed">
        Set the reward structure below, then hit <strong>Train</strong> to run {TOTAL_EPISODES} episodes of
        Q-learning. Afterwards, click <strong>Watch Agent</strong> to see the learned policy in action.
      </div>

      <div className="mt-6 flex gap-6 items-start flex-wrap xl:flex-nowrap">
        {/* Grid */}
        <div className="flex-1 min-w-0">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Grid world</p>
          <Grid agentPos={agentPos} trail={trail} />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleTrain}
              disabled={status === 'training' || status === 'watching'}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {status === 'training' ? 'Training…' : 'Train'}
            </button>

            {(status === 'trained' || status === 'watching') && (
              <button
                onClick={handleWatch}
                disabled={status === 'watching'}
                className="rounded-lg bg-white border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {status === 'watching' ? 'Watching…' : 'Watch Agent'}
              </button>
            )}

            {status !== 'idle' && (
              <button
                onClick={handleReset}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                Reset
              </button>
            )}

            {(status === 'trained' || status === 'watching') && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-400">Speed</span>
                {[['Slow', 600], ['Normal', 300], ['Fast', 100]].map(([label, ms]) => (
                  <button key={label}
                    onClick={() => setSpeed(ms)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      speed === ms ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {history && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                Reward per episode
              </p>
              <EpisodeGraph history={history} />
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="shrink-0 space-y-4" style={{ width: 320 }}>
          {/* Reward structure */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Reward structure</p>

            <RewardSlider
              label="Reach goal"
              value={rewards.goal}
              min={1} max={20} step={1}
              onChange={(v) => setRewards(r => ({ ...r, goal: v }))}
              note="Higher = agent is more motivated to find the goal"
            />
            <RewardSlider
              label="Each step"
              value={rewards.step}
              min={-5} max={0} step={1}
              onChange={(v) => setRewards(r => ({ ...r, step: v }))}
              note="More negative = agent tries to find a shorter path"
            />
            <RewardSlider
              label="Hit obstacle"
              value={rewards.obstacle}
              min={-10} max={0} step={1}
              onChange={(v) => setRewards(r => ({ ...r, obstacle: v }))}
              note="More negative = agent avoids walls more carefully"
            />

            {status !== 'idle' && (
              <p className="text-xs text-gray-400 leading-relaxed">
                Rewards are locked in for this run — hit <strong>Reset</strong> to adjust them and retrain.
              </p>
            )}
          </div>

          {/* Stats */}
          {history && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Training stats</p>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Episodes trained</dt>
                  <dd className="font-mono font-semibold text-gray-800">{TOTAL_EPISODES}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Success rate</dt>
                  <dd className="font-mono font-semibold text-gray-800">
                    {successRate}% <span className="text-gray-400 font-normal">of last {last20.length}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Avg steps (successful)</dt>
                  <dd className="font-mono font-semibold text-gray-800">{avgSteps ?? '—'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Best path length</dt>
                  <dd className="font-mono font-semibold text-gray-800">
                    {best?.success ? best.path.length - 1 : '—'}
                  </dd>
                </div>
              </dl>
              {best && !best.success && (
                <p className="mt-3 text-xs text-amber-600 leading-relaxed">
                  The greedy policy doesn't reliably reach the goal yet — try lowering the step penalty or
                  training again.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
