import { useEffect, useRef } from 'react'

// Deterministic pseudo-random graph (fixed seed, so it's a stable ambient
// illustration rather than visual noise on every reload).
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildGraph(w, h, n = 22) {
  const rand = mulberry32(42)
  const nodes = Array.from({ length: n }, () => ({ x: rand() * w, y: rand() * h * 0.92 + h * 0.04 }))
  const edges = []
  nodes.forEach((a, i) => {
    const dists = nodes
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
      .filter(o => o.j !== i)
      .sort((p, q) => p.d - q.d)
    for (let k = 0; k < 2; k++) {
      const j = dists[k].j
      const key = Math.min(i, j) + '-' + Math.max(i, j)
      if (!edges.some(e => e.key === key)) edges.push({ a: i, b: j, key })
    }
  })
  const adj = nodes.map(() => [])
  edges.forEach(e => { adj[e.a].push(e.b); adj[e.b].push(e.a) })
  return { nodes, edges, adj }
}

function bfsOrder(adj, start) {
  const seen = new Set([start])
  const order = [{ n: start, d: 0 }]
  const q = [start]
  const dist = { [start]: 0 }
  let head = 0
  while (head < q.length) {
    const u = q[head++]
    adj[u].forEach(v => {
      if (!seen.has(v)) {
        seen.add(v); dist[v] = dist[u] + 1
        order.push({ n: v, d: dist[v] })
        q.push(v)
      }
    })
  }
  return order
}

export default function GraphPulseCanvas({ width = 1200, height = 380, className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const { nodes, edges, adj } = buildGraph(width, height)
    const pulse = bfsOrder(adj, Math.floor(nodes.length * 0.15))
    const maxD = pulse.reduce((m, o) => Math.max(m, o.d), 1)
    const pulseByNode = new Map(pulse.map(o => [o.n, o.d]))

    const styles = getComputedStyle(document.documentElement)
    const ink = styles.getPropertyValue('--ink-faint').trim() || '#8B98A1'
    const accent = styles.getPropertyValue('--accent-bright').trim() || '#E8630C'

    let raf = null

    function draw(t) {
      ctx.clearRect(0, 0, width, height)
      const cycle = reduceMotion ? maxD * 0.5 : (t / 900) % (maxD + 6)

      ctx.lineWidth = 1
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b]
        const da = pulseByNode.get(e.a), db = pulseByNode.get(e.b)
        const lit = Math.abs(cycle - (da + db) / 2) < 1.1
        ctx.strokeStyle = lit ? accent : ink
        ctx.globalAlpha = lit ? 0.55 : 0.14
        ctx.beginPath()
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
        ctx.stroke()
      })

      pulse.forEach(o => {
        const p = nodes[o.n]
        const lit = Math.abs(cycle - o.d) < 1.3
        const r = lit ? 3.6 : 2.2
        ctx.globalAlpha = lit ? 0.95 : 0.28
        ctx.fillStyle = lit ? accent : ink
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1
    }

    if (reduceMotion) {
      draw(0)
    } else {
      const loop = (t) => { draw(t); raf = requestAnimationFrame(loop) }
      raf = requestAnimationFrame(loop)
    }

    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-hidden="true"
      className={className}
    />
  )
}
