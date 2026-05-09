'use client'

type Props = {
  status: string | null | undefined
}

export default function StatusBadge({ status }: Props) {
  const value = String(status || 'unbekannt').toLowerCase()

  const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
    offen: {
      label: 'Offen',
      bg: 'rgba(156,163,175,0.18)',
      color: '#e5e7eb',
      border: 'rgba(156,163,175,0.45)',
    },
    angenommen: {
      label: 'Angenommen',
      bg: 'rgba(37,99,235,0.18)',
      color: '#bfdbfe',
      border: 'rgba(37,99,235,0.45)',
    },
    in_arbeit: {
      label: 'In Arbeit',
      bg: 'rgba(245,158,11,0.18)',
      color: '#fde68a',
      border: 'rgba(245,158,11,0.45)',
    },
    wartet: {
      label: 'Wartet',
      bg: 'rgba(234,88,12,0.18)',
      color: '#fed7aa',
      border: 'rgba(234,88,12,0.45)',
    },
    wartet_auf_freigabe: {
      label: 'Wartet auf Freigabe',
      bg: 'rgba(168,85,247,0.18)',
      color: '#e9d5ff',
      border: 'rgba(168,85,247,0.45)',
    },
    fertig: {
      label: 'Fertig',
      bg: 'rgba(22,163,74,0.18)',
      color: '#bbf7d0',
      border: 'rgba(22,163,74,0.45)',
    },
    abgeschlossen: {
      label: 'Abgeschlossen',
      bg: 'rgba(22,163,74,0.22)',
      color: '#dcfce7',
      border: 'rgba(22,163,74,0.55)',
    },
    archiviert: {
      label: 'Archiviert',
      bg: 'rgba(75,85,99,0.22)',
      color: '#d1d5db',
      border: 'rgba(75,85,99,0.55)',
    },
    kritisch: {
      label: 'Kritisch',
      bg: 'rgba(220,38,38,0.2)',
      color: '#fecaca',
      border: 'rgba(220,38,38,0.55)',
    },
    bezahlt: {
      label: 'Bezahlt',
      bg: 'rgba(22,163,74,0.2)',
      color: '#bbf7d0',
      border: 'rgba(22,163,74,0.55)',
    },
    teilbezahlt: {
      label: 'Teilbezahlt',
      bg: 'rgba(245,158,11,0.18)',
      color: '#fde68a',
      border: 'rgba(245,158,11,0.45)',
    },
    ueberfaellig: {
      label: 'Überfällig',
      bg: 'rgba(220,38,38,0.2)',
      color: '#fecaca',
      border: 'rgba(220,38,38,0.55)',
    },
  }

  const item = map[value] || {
    label: status || 'Unbekannt',
    bg: 'rgba(107,114,128,0.18)',
    color: '#e5e7eb',
    border: 'rgba(107,114,128,0.45)',
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: 999,
        background: item.bg,
        color: item.color,
        border: `1px solid ${item.border}`,
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      {item.label}
    </span>
  )
}