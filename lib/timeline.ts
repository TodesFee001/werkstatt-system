import { supabase } from '@/lib/supabase'

export async function timelineEintrag(
  serviceauftragId: string,
  typ: string,
  titel: string,
  beschreibung?: string | null
) {
  try {
    const sessionRes = await supabase.auth.getSession()
    const userId = sessionRes.data.session?.user?.id || null

    let benutzername: string | null = null

    if (userId) {
      const profilRes = await supabase
        .from('benutzerprofile')
        .select('benutzername')
        .eq('id', userId)
        .maybeSingle()

      benutzername =
        (profilRes.data as { benutzername?: string } | null)?.benutzername || null
    }

    await supabase.from('serviceauftrag_timeline').insert({
      serviceauftrag_id: serviceauftragId,
      typ,
      titel,
      beschreibung: beschreibung || null,
      benutzer_id: userId,
      benutzername,
    })
  } catch {
    // Timeline darf UI nicht blockieren
  }
}