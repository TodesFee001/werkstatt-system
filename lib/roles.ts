export type AppRole =
  | 'Admin'
  | 'Werkstattmeister'
  | 'Werkstatt'
  | 'Serviceannahme'
  | 'Buchhaltung'
  | 'Lager'
  | 'Behördenvertreter'
  | 'Unbekannt'

export function hatRolle(
  aktuelleRolle: string | null | undefined,
  erlaubteRollen: AppRole[]
) {
  if (!aktuelleRolle) return false
  return erlaubteRollen.includes(aktuelleRolle as AppRole)
}

export function istAdmin(rolle: string | null | undefined) {
  return rolle === 'Admin'
}

export function istWerkstattmeister(rolle: string | null | undefined) {
  return rolle === 'Werkstattmeister'
}

export function istBehoerdenvertreter(rolle: string | null | undefined) {
  return rolle === 'Behördenvertreter'
}