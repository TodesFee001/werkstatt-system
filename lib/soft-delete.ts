import { supabase } from '@/lib/supabase'
import { logAktion } from '@/lib/activity-log'

const ERLAUBTE_TABELLEN = [
  'kunden',
  'fahrzeuge',
  'serviceauftraege',
  'rechnungen',
  'lagerartikel',
] as const

type SoftDeleteTable = (typeof ERLAUBTE_TABELLEN)[number]

export async function softDeleteDatensatz(params: {
  tabelle: SoftDeleteTable
  id: string
  titel: string
}) {
  const sessionRes = await supabase.auth.getSession()
  const userId = sessionRes.data.session?.user?.id || null

  const { error } = await supabase
    .from(params.tabelle)
    .update({
      ist_geloescht: true,
      geloescht_am: new Date().toISOString(),
      geloescht_von: userId,
    })
    .eq('id', params.id)

  if (error) {
    throw new Error(error.message)
  }

  await logAktion(
    params.tabelle,
    'geloescht',
    params.id,
    params.titel,
    {
      soft_delete: true,
      geloescht_am: new Date().toISOString(),
    }
  )
}

export async function restoreDatensatz(params: {
  tabelle: SoftDeleteTable
  id: string
  titel: string
}) {
  const { error } = await supabase
    .from(params.tabelle)
    .update({
      ist_geloescht: false,
      geloescht_am: null,
      geloescht_von: null,
    })
    .eq('id', params.id)

  if (error) {
    throw new Error(error.message)
  }

  await logAktion(
    params.tabelle,
    'bearbeitet',
    params.id,
    params.titel,
    {
      wiederhergestellt: true,
    }
  )
}