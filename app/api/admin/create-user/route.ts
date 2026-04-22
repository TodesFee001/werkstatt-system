import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            'Server-Konfiguration unvollständig. Prüfe NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY und SUPABASE_SERVICE_ROLE_KEY in .env.local',
        },
        { status: 500 }
      )
    }

    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Nicht autorisiert: Authorization Header fehlt.' },
        { status: 401 }
      )
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: authUserError,
    } = await anonClient.auth.getUser()

    if (authUserError || !user) {
      return NextResponse.json(
        {
          error:
            authUserError?.message ||
            'Nicht autorisiert: Benutzer konnte nicht ermittelt werden.',
        },
        { status: 401 }
      )
    }

    const { data: adminProfil, error: adminProfilError } = await anonClient
      .from('benutzerprofile')
      .select('id, rolle, aktiv')
      .eq('id', user.id)
      .single()

    if (adminProfilError || !adminProfil) {
      return NextResponse.json(
        { error: adminProfilError?.message || 'Admin-Profil konnte nicht geladen werden.' },
        { status: 403 }
      )
    }

    if (!adminProfil.aktiv) {
      return NextResponse.json(
        { error: 'Dein Benutzer ist deaktiviert.' },
        { status: 403 }
      )
    }

    if (adminProfil.rolle !== 'Admin') {
      return NextResponse.json(
        { error: 'Nur Admin darf Benutzer anlegen.' },
        { status: 403 }
      )
    }

    const body = await req.json()

    const benutzernameInput = String(body?.benutzername || '')
    const passwort = String(body?.passwort || '')
    const rolle = String(body?.rolle || 'Werkstatt')

    const benutzername = normalizeUsername(benutzernameInput)

    if (!benutzername) {
      return NextResponse.json({ error: 'Benutzername ist erforderlich.' }, { status: 400 })
    }

    if (passwort.length < 6) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen lang sein.' },
        { status: 400 }
      )
    }

    const erlaubteRollen = [
      'Admin',
      'Werkstatt',
      'Serviceannahme',
      'Buchhaltung',
      'Lager',
      'Behördenvertreter',
    ]

    if (!erlaubteRollen.includes(rolle)) {
      return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 })
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const authEmail = `${benutzername}@internal.local`

    const { data: bestehendesProfil } = await serviceClient
      .from('benutzerprofile')
      .select('id')
      .eq('benutzername', benutzername)
      .maybeSingle()

    if (bestehendesProfil) {
      return NextResponse.json(
        { error: `Der Benutzername "${benutzername}" existiert bereits.` },
        { status: 400 }
      )
    }

    const { data: createdUser, error: createError } =
      await serviceClient.auth.admin.createUser({
        email: authEmail,
        password: passwort,
        email_confirm: true,
      })

    if (createError || !createdUser.user) {
      return NextResponse.json(
        { error: createError?.message || 'Auth-Benutzer konnte nicht erstellt werden.' },
        { status: 400 }
      )
    }

    const { error: profilError } = await serviceClient.from('benutzerprofile').insert({
      id: createdUser.user.id,
      benutzername,
      auth_email: authEmail,
      rolle,
      aktiv: true,
    })

    if (profilError) {
      await serviceClient.auth.admin.deleteUser(createdUser.user.id)
      return NextResponse.json(
        { error: `Benutzerprofil konnte nicht erstellt werden: ${profilError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Benutzer ${benutzername} wurde erstellt.`,
      user_id: createdUser.user.id,
      benutzername,
      rolle,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unbekannter Serverfehler.' },
      { status: 500 }
    )
  }
}