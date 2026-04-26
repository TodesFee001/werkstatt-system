type Props = {
  status: string | null | undefined
}

export default function StatusBadge({ status }: Props) {
  const value = status || 'unbekannt'
  const lower = value.toLowerCase()

  let className = 'badge'

  if (
    lower.includes('bezahlt') ||
    lower.includes('abgeschlossen') ||
    lower.includes('freigegeben') ||
    lower.includes('aktiv') ||
    lower.includes('bestaetigt')
  ) {
    className += ' badge-success'
  } else if (
    lower.includes('offen') ||
    lower.includes('angefragt') ||
    lower.includes('entwurf') ||
    lower.includes('geplant') ||
    lower.includes('in_arbeit')
  ) {
    className += ' badge-warning'
  } else if (
    lower.includes('storniert') ||
    lower.includes('abgelehnt') ||
    lower.includes('überfällig') ||
    lower.includes('ueberfaellig') ||
    lower.includes('konflikt') ||
    lower.includes('verschoben')
  ) {
    className += ' badge-danger'
  } else {
    className += ' badge-info'
  }

  return <span className={className}>{value}</span>
}