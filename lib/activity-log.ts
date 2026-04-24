import { supabase } from '@/lib/supabase'

export type LogAktion =
  | 'erstellt'
  | 'bearbeitet'
  | 'geloescht'
  | 'hochgeladen'
  | 'notiz_erstellt'
  | 'notiz_bearbeitet'
  | 'notiz_geloescht'
  | 'status_geaendert'

export async function logAktion(
  tabelle: string,
  aktion: LogAktion,
  datensatzId: string | null,
  titel: string,
  details: Record<string, unknown> = {}
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('aktivitaetslog').insert({
      benutzer_id: user?.id || null,
      benutzer_name: user?.email || 'System',
      rolle: 'unknown',
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