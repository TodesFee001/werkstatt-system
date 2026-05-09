import { supabase } from '@/lib/supabase'

export async function lagerBestandAnpassen(params: {
  lagerartikelId: string
  menge: number
  bewegung: 'entnahme' | 'rueckbuchung' | 'korrektur' | 'zugang'
  grund: string
  serviceauftragId?: string | null
}) {
  const artikelRes = await supabase
    .from('lagerartikel')
    .select('id, bestand')
    .eq('id', params.lagerartikelId)
    .maybeSingle()

  if (artikelRes.error) {
    throw new Error(artikelRes.error.message)
  }

  if (!artikelRes.data) {
    throw new Error('Lagerartikel nicht gefunden.')
  }

  const alterBestand = Number(artikelRes.data.bestand || 0)

  let neuerBestand = alterBestand

  if (params.bewegung === 'entnahme') {
    neuerBestand = alterBestand - Number(params.menge || 0)
  }

  if (params.bewegung === 'rueckbuchung' || params.bewegung === 'zugang') {
    neuerBestand = alterBestand + Number(params.menge || 0)
  }

  if (params.bewegung === 'korrektur') {
    neuerBestand = Number(params.menge || 0)
  }

  const updateRes = await supabase
    .from('lagerartikel')
    .update({
      bestand: neuerBestand,
    })
    .eq('id', params.lagerartikelId)

  if (updateRes.error) {
    throw new Error(updateRes.error.message)
  }

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

  const bewegungRes = await supabase.from('lagerbewegungen').insert({
    lagerartikel_id: params.lagerartikelId,
    bewegung: params.bewegung,
    menge: Number(params.menge || 0),
    alter_bestand: alterBestand,
    neuer_bestand: neuerBestand,
    grund: params.grund,
    serviceauftrag_id: params.serviceauftragId || null,
    benutzer_id: userId,
    benutzername,
  })

  if (bewegungRes.error) {
    throw new Error(bewegungRes.error.message)
  }

  return {
    alterBestand,
    neuerBestand,
  }
}