import { supabase } from '@/lib/supabase'

export async function holeAktuelleRolle() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return null

  const { data: profil, error: profilError } = await supabase
    .from('benutzerprofile')
    .select('rolle_id')
    .eq('id', session.user.id)
    .single()

  if (profilError || !profil?.rolle_id) return null

  const { data: rolle, error: rollenError } = await supabase
    .from('rollen')
    .select('name')
    .eq('id', profil.rolle_id)
    .single()

  if (rollenError || !rolle?.name) return null

  return rolle.name as string
}