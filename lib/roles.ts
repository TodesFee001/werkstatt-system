export type AppRole =
  | 'Admin'
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

  if (aktuelleRolle === 'Behördenvertreter') {
    return true
  }

  return erlaubteRollen.includes(aktuelleRolle as AppRole)
}

export function istAdmin(rolle: string | null | undefined) {
  return rolle === 'Admin'
}

export function istBehoerdenvertreter(rolle: string | null | undefined) {
  return rolle === 'Behördenvertreter'
}

export function istReadOnlyRolle(rolle: string | null | undefined) {
  return rolle === 'Behördenvertreter'
}