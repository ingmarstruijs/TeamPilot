/**
 * Canvas rendering for “share lineup as image”.
 */

import { benchEligiblePlayers } from '@/utils/playerStatus'

export const GUEST_MARK_COLOR = '#f59e0b'

export function playerInitials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function shortFirstName(name, max = 8) {
  const first = String(name ?? '').trim().split(/\s+/)[0] || ''
  if (!first) return ''
  return first.length > max ? `${first.slice(0, max - 1)}.` : first
}

export function benchForShare(players, slots) {
  const onField = new Set((slots ?? []).map(s => s.playerId).filter(Boolean))
  return benchEligiblePlayers(players).filter(p => !onField.has(p.id))
}

export function fieldPlayersForShare(slots, playersMap) {
  return (slots ?? []).reduce((list, slot) => {
    if (!slot?.playerId) return list
    const player = playersMap?.[slot.playerId]
    if (player) list.push(player)
    return list
  }, [])
}

function rdRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function hexLum(hex) {
  if (!hex || hex.length < 7) return 0.5
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function drawShirtFill(ctx, shirt, cx, cy, r) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  if (shirt.style === 'solid') {
    ctx.fillStyle = shirt.primary
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  } else if (shirt.style === 'gradient') {
    const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r)
    g.addColorStop(0, shirt.primary)
    g.addColorStop(1, shirt.secondary)
    ctx.fillStyle = g
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  } else if (shirt.style === 'halves' || shirt.style === 'halves-v') {
    ctx.fillStyle = shirt.primary
    ctx.fillRect(cx - r, cy - r, r, r * 2)
    ctx.fillStyle = shirt.secondary
    ctx.fillRect(cx, cy - r, r, r * 2)
  } else if (shirt.style === 'halves-h') {
    ctx.fillStyle = shirt.primary
    ctx.fillRect(cx - r, cy - r, r * 2, r)
    ctx.fillStyle = shirt.secondary
    ctx.fillRect(cx - r, cy, r * 2, r)
  } else if (shirt.style === 'stripes') {
    const sw = r * 2 / 4
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? shirt.primary : shirt.secondary
      ctx.fillRect(cx - r + i * sw, cy - r, sw, r * 2)
    }
  } else if (shirt.style === 'sash') {
    ctx.fillStyle = shirt.primary
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = shirt.secondary
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.4, cy - r)
    ctx.lineTo(cx + r * 0.7, cy - r)
    ctx.lineTo(cx + r * 0.4, cy + r)
    ctx.lineTo(cx - r * 0.7, cy + r)
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillStyle = shirt.primary
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawShirtCircle(ctx, shirt, cx, cy, r, ini) {
  drawShirtFill(ctx, shirt, cx, cy, r)
  ctx.strokeStyle = 'rgba(255,255,255,.75)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  const lP = hexLum(shirt.primary)
  const lS = shirt.style === 'solid' ? lP : hexLum(shirt.secondary)
  const avgL = shirt.style === 'solid' ? lP : (lP + lS) / 2
  ctx.fillStyle = avgL > 0.55 ? '#111' : '#fff'
  ctx.font = `bold ${Math.round(r * 0.7)}px system-ui,sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ini, cx, cy)
}

function drawGuestRing(ctx, cx, cy, r) {
  ctx.save()
  ctx.strokeStyle = GUEST_MARK_COLOR
  ctx.lineWidth = 2
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawGuestPill(ctx, cx, top, label) {
  ctx.font = 'bold 9px system-ui,sans-serif'
  const w = Math.max(28, ctx.measureText(label).width + 8)
  const h = 13
  ctx.fillStyle = GUEST_MARK_COLOR
  rdRect(ctx, cx - w / 2, top, w, h, 4)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, cx, top + h / 2)
  return h
}

/**
 * @param {object} opts
 * @returns {HTMLCanvasElement}
 */
export function drawLineupShareCanvas({
  lineupName = 'Opstelling',
  teamName = '',
  periodLabel = '',
  guestLabel = 'Gast',
  shirt,
  slots = [],
  playersMap = {},
  bench = [],
  flipped = true,
  opponentSlots = [],
  opponentShirt = null,
} = {}) {
  const kit = shirt ?? { style: 'solid', primary: '#059669', secondary: '#ffffff' }
  const SCALE = 3
  const W = 540
  const PITCH_H = Math.round(W * 8 / 5)
  const PAD = 16
  const HEADER_H = 64
  const COLS = 3
  const BENCH_ROW = 40
  const BENCH_H = bench.length ? Math.ceil(bench.length / COLS) * BENCH_ROW + 52 : 0
  const TOTAL_H = HEADER_H + PITCH_H + BENCH_H

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = TOTAL_H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  const teamColor = kit.primary
  const title = periodLabel ? `${lineupName} · ${periodLabel}` : lineupName

  ctx.fillStyle = teamColor
  ctx.fillRect(0, 0, W, HEADER_H)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 22px system-ui,sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(title, 16, HEADER_H / 2)
  if (teamName) {
    ctx.font = '17px system-ui,sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,.75)'
    ctx.textAlign = 'right'
    ctx.fillText(teamName, W - 16, HEADER_H / 2)
  }

  const py = HEADER_H
  ctx.fillStyle = '#1a7a47'
  ctx.fillRect(0, py, W, PITCH_H)
  ctx.fillStyle = 'rgba(0,0,0,.04)'
  const stripeH = PITCH_H / 8
  for (let i = 0; i < 8; i += 2) ctx.fillRect(0, py + i * stripeH, W, stripeH)

  const mx = PAD
  const my = py + PAD
  const mw = W - PAD * 2
  const mh = PITCH_H - PAD * 2
  ctx.strokeStyle = 'rgba(255,255,255,.65)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(mx, my, mw, mh)
  ctx.beginPath()
  ctx.moveTo(mx, my + mh / 2)
  ctx.lineTo(mx + mw, my + mh / 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(mx + mw / 2, my + mh / 2, mw * 0.15, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(mx + mw / 2, my + mh / 2, 2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,.65)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.5)'
  ctx.lineWidth = 1
  const paw = mw * 0.56
  const pax = mx + mw * 0.22
  const pah = mh * 0.175
  ctx.strokeRect(pax, my, paw, pah)
  ctx.strokeRect(mx + mw * 0.35, my, mw * 0.30, mh * 0.075)
  ctx.strokeRect(pax, my + mh - pah, paw, pah)
  ctx.strokeRect(mx + mw * 0.35, my + mh - mh * 0.075, mw * 0.30, mh * 0.075)
  const gx = mx + mw * 0.375
  const gw = mw * 0.25
  ctx.fillStyle = 'rgba(255,255,255,.15)'
  ctx.fillRect(gx, py, gw, PAD)
  ctx.strokeRect(gx, py, gw, PAD)
  ctx.fillRect(gx, my + mh, gw, PAD)
  ctx.strokeRect(gx, my + mh, gw, PAD)

  if (opponentShirt && opponentSlots.length) {
    const opp = opponentShirt
    for (const slot of opponentSlots) {
      const dY = flipped ? 100 - slot.y : slot.y
      const cx = mx + (slot.x / 100) * mw
      const cy = my + (dY / 100) * mh
      const r = 24
      drawShirtFill(ctx, opp, cx, cy, r)
      ctx.strokeStyle = 'rgba(255,255,255,.55)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
      const lP = hexLum(opp.primary)
      const lS = opp.style === 'solid' ? lP : hexLum(opp.secondary)
      const avgL = opp.style === 'solid' ? lP : (lP + lS) / 2
      ctx.fillStyle = avgL > 0.55 ? '#111' : '#fff'
      ctx.font = `bold ${Math.round(r * 0.65)}px system-ui,sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(slot.number), cx, cy)
    }
  }

  for (const slot of slots) {
    if (!slot?.playerId) continue
    const player = playersMap[slot.playerId]
    if (!player) continue
    const ini = playerInitials(player.name)
    const dY = flipped ? 100 - slot.y : slot.y
    const cx = mx + (slot.x / 100) * mw
    const cy = my + (dY / 100) * mh
    const r = 28
    ctx.shadowColor = 'rgba(0,0,0,.35)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetY = 2
    drawShirtCircle(ctx, kit, cx, cy, r, ini)
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    if (player.guest) drawGuestRing(ctx, cx, cy, r)
    let labelTop = cy + r + 4
    if (player.guest) {
      labelTop += drawGuestPill(ctx, cx, labelTop, guestLabel) + 3
    }
    const first = shortFirstName(player.name, 8)
    ctx.font = 'bold 15px system-ui,sans-serif'
    ctx.textAlign = 'center'
    const lw = ctx.measureText(first).width + 10
    ctx.fillStyle = 'rgba(0,0,0,.6)'
    rdRect(ctx, cx - lw / 2, labelTop, lw, 20, 4)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'middle'
    ctx.fillText(first, cx, labelTop + 10)
  }

  if (bench.length) {
    const by = HEADER_H + PITCH_H
    ctx.fillStyle = '#f0fdf4'
    ctx.fillRect(0, by, W, BENCH_H)
    ctx.fillStyle = '#059669'
    ctx.font = 'bold 11px system-ui,sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('BANK', 16, by + 18)
    const colW = (W - 16) / COLS
    bench.forEach((player, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const bx = 8 + col * colW
      const byRow = by + 36 + row * BENCH_ROW
      const cw = colW - 8
      const ch = 28
      ctx.shadowColor = 'rgba(0,0,0,.08)'
      ctx.shadowBlur = 3
      ctx.shadowOffsetY = 1
      ctx.fillStyle = '#fff'
      rdRect(ctx, bx, byRow, cw, ch, 14)
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
      if (player.guest) {
        ctx.strokeStyle = GUEST_MARK_COLOR
        ctx.lineWidth = 1.5
        ctx.setLineDash([3, 2])
        rdRect(ctx, bx + 0.75, byRow + 0.75, cw - 1.5, ch - 1.5, 13)
        ctx.stroke()
        ctx.setLineDash([])
      }
      const ar = 11
      const ax = bx + ar + 4
      const ay = byRow + ch / 2
      ctx.shadowColor = 'rgba(0,0,0,.15)'
      ctx.shadowBlur = 2
      drawShirtCircle(ctx, kit, ax, ay, ar, playerInitials(player.name))
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
      if (player.guest) drawGuestRing(ctx, ax, ay, ar)
      const first = shortFirstName(player.name, 10)
      ctx.fillStyle = '#1e293b'
      ctx.font = '500 14px system-ui,sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(first, ax + ar + 4, ay)
      if (player.guest) {
        ctx.font = 'bold 9px system-ui,sans-serif'
        const pillW = Math.max(28, ctx.measureText(guestLabel).width + 8)
        const px = bx + cw - pillW - 8
        ctx.fillStyle = GUEST_MARK_COLOR
        rdRect(ctx, px, ay - 7, pillW, 14, 4)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.fillText(guestLabel, px + pillW / 2, ay)
      }
    })
  }

  return canvas
}
