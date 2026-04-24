import { supabase } from './supabase'

export async function logAktion(
  tabelle: string,
  aktion: 'erstellt' | 'bearbeitet' | 'geloescht',
  datensatzId: string | null,
  titel: string,
  details: any = {}
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('aktivitaetslog').insert({
      benutzer_id: user?.id || null,
      benutzer_name: user?.email || 'System',
      rolle: 'unknown', // optional später erweitern
      aktion,
      tabelle,
      datensatz_id: datensatzId,
      titel,
      details,
    })
  } catch (err) {
    console.error('Logging Fehler:', err)
  }
}