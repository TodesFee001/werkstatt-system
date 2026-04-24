'use client'

import RoleGuard from '../components/RoleGuard'

type WikiSection = {
  title: string
  functionText: string[]
  employeeTasks: string[]
}

const sections: WikiSection[] = [
  {
    title: 'Dashboard',
    functionText: [
      'Zentrale Übersicht über offene Serviceaufträge, Termine, Rechnungen und kritische Lagerbestände.',
      'Dient als Startpunkt zur schnellen Einschätzung des Tagesgeschäfts.',
    ],
    employeeTasks: [
      'Offene Aufträge prüfen.',
      'Kritische Lagerartikel beachten.',
      'Anstehende Termine kontrollieren.',
      'Offene Rechnungen oder Hinweise weitergeben.',
    ],
  },
  {
    title: 'Kunden',
    functionText: [
      'Verwaltung aller Kundenstammdaten.',
      'Über die Kundenakte werden Fahrzeuge, Aufträge, Rechnungen, Zahlungen, Notizen und Anhänge gebündelt angezeigt.',
    ],
    employeeTasks: [
      'Vor Neuanlage prüfen, ob der Kunde bereits existiert.',
      'Kundendaten vollständig und korrekt eintragen.',
      'Telefonnummer und E-Mail aktuell halten.',
      'Interne Notizen nur sachlich und nachvollziehbar erfassen.',
    ],
  },
  {
    title: 'Fahrzeuge',
    functionText: [
      'Verwaltung aller Kundenfahrzeuge.',
      'Jedes Fahrzeug wird einem Kunden zugeordnet.',
      'Die Fahrzeugakte zeigt Fahrzeugdaten, Historie und Anhänge.',
    ],
    employeeTasks: [
      'Kunde über die Suchauswahl auswählen.',
      'Kennzeichen, Marke, Modell und FIN eintragen.',
      'Kilometerstand möglichst aktuell halten.',
      'Fahrzeugschein oder Bilder bei Bedarf als Anhang speichern.',
    ],
  },
  {
    title: 'Serviceaufträge',
    functionText: [
      'Zentrale Arbeitsseite für Werkstattaufträge.',
      'Hier werden Annahmedaten, Fahrzeugcheck, Status, Arbeitszeit, Material und Rechnungserstellung verwaltet.',
    ],
    employeeTasks: [
      'Kunde und Fahrzeug prüfen.',
      'Auftragsart und Fehlerbeschreibung erfassen.',
      'Fahrzeugannahme vollständig dokumentieren.',
      'Arbeitszeiten nachtragen.',
      'Verwendete Materialien eintragen.',
      'Status aktuell halten.',
      'Nach Fertigstellung Auftrag abschließen und Rechnung erstellen.',
    ],
  },
  {
    title: 'Termine',
    functionText: [
      'Erstellung und Verwaltung einzelner Werkstatttermine.',
      'Termine können mit Serviceauftrag, Mitarbeiter und Arbeitsplatz verbunden werden.',
    ],
    employeeTasks: [
      'Termin mit korrekter Start- und Endzeit anlegen.',
      'Serviceauftrag auswählen, falls vorhanden.',
      'Mitarbeiter und Arbeitsplatz zuweisen.',
      'Terminstatus aktuell halten.',
    ],
  },
  {
    title: 'Kalender / Planung',
    functionText: [
      'Kalenderansicht für Tages- und Monatsplanung.',
      'Termine können direkt im Kalender bearbeitet oder gelöscht werden.',
    ],
    employeeTasks: [
      'Tagesplanung morgens prüfen.',
      'Monatsansicht zur groben Auslastung nutzen.',
      'Termine bei Änderungen direkt aktualisieren.',
      'Doppelbelegungen von Mitarbeitern oder Arbeitsplätzen vermeiden.',
    ],
  },
  {
    title: 'Arbeitsplätze',
    functionText: [
      'Verwaltung der verfügbaren Werkstattplätze.',
      'Arbeitsplätze können Terminen zugeordnet werden.',
    ],
    employeeTasks: [
      'Arbeitsplätze sauber benennen.',
      'Nicht verfügbare Plätze nicht für Termine nutzen.',
      'Arbeitsplatzbelegung bei der Terminplanung beachten.',
    ],
  },
  {
    title: 'Schichten',
    functionText: [
      'Übersicht und Verwaltung von Mitarbeiterschichten.',
      'Dient der Personalplanung im Werkstattbetrieb.',
    ],
    employeeTasks: [
      'Schichten prüfen.',
      'Anwesenheiten und Zuständigkeiten beachten.',
      'Aufträge möglichst passenden Mitarbeitern zuweisen.',
    ],
  },
  {
    title: 'Lager',
    functionText: [
      'Verwaltung aller Lagerartikel.',
      'Artikel werden nach Artikelnummer sortiert.',
      'Bestände und Mindestbestände werden überwacht.',
    ],
    employeeTasks: [
      'Artikelnummer korrekt eintragen.',
      'Bestände aktuell halten.',
      'Materialverbrauch aus Serviceaufträgen beachten.',
      'Unterschrittene Mindestbestände melden oder nachbestellen.',
    ],
  },
  {
    title: 'Lagerwert',
    functionText: [
      'Übersicht über den finanziellen Wert des Lagerbestands.',
      'Dient der Kontrolle von Bestand, Einkaufspreisen und Gesamtwert.',
    ],
    employeeTasks: [
      'Auffällige Lagerwerte prüfen.',
      'Fehlerhafte Preise korrigieren lassen.',
      'Artikel nach Artikelnummer kontrollieren.',
    ],
  },
  {
    title: 'Angebote',
    functionText: [
      'Erstellung von Angeboten für Kunden.',
      'Angebote können mit Serviceaufträgen verbunden werden.',
    ],
    employeeTasks: [
      'Kunde und Serviceauftrag auswählen.',
      'Leistungen und Preise sauber eintragen.',
      'Angebot vor Weitergabe prüfen.',
    ],
  },
  {
    title: 'Rechnungen',
    functionText: [
      'Erstellung und Verwaltung von Rechnungen.',
      'Kosten können automatisch aus Serviceaufträgen übernommen werden.',
      'Manuelle Anpassungen bleiben möglich.',
    ],
    employeeTasks: [
      'Rechnung vorzugsweise aus abgeschlossenem Auftrag erstellen.',
      'Netto, Brutto und offenen Betrag prüfen.',
      'Rechnungsnummer kontrollieren.',
      'Fehlerhafte Rechnungen nur mit Berechtigung bearbeiten oder löschen.',
    ],
  },
  {
    title: 'Zahlungen',
    functionText: [
      'Erfassung und Übersicht aller Zahlungseingänge.',
      'Zahlungen aktualisieren den offenen Betrag einer Rechnung.',
    ],
    employeeTasks: [
      'Passende Rechnung auswählen.',
      'Zahlungsbetrag korrekt eintragen.',
      'Zahlungsart dokumentieren.',
      'Bei Teilzahlung Status prüfen.',
      'Vollständig bezahlte Rechnungen kontrollieren.',
    ],
  },
  {
    title: 'Offene Posten',
    functionText: [
      'Übersicht aller nicht vollständig bezahlten Rechnungen.',
      'Dient der Kontrolle offener Beträge.',
    ],
    employeeTasks: [
      'Offene Beträge regelmäßig prüfen.',
      'Überfällige Rechnungen an Buchhaltung melden.',
      'Zahlungseingänge zeitnah erfassen.',
    ],
  },
  {
    title: 'Forderungen',
    functionText: [
      'Kaufmännische Nachverfolgung offener und überfälliger Rechnungen.',
      'Forderungen werden nach Mahnstufen und Status betrachtet.',
    ],
    employeeTasks: [
      'Forderungsstatus prüfen.',
      'Mahnstufen nachvollziehen.',
      'Zahlungen oder Klärungen dokumentieren.',
    ],
  },
  {
    title: 'Mahnungen',
    functionText: [
      'Erstellung und Verwaltung von Mahnungen zu offenen Rechnungen.',
      'Mahnstufen werden mit Rechnungen und Forderungen verknüpft.',
    ],
    employeeTasks: [
      'Nur berechtigte Rechnungen mahnen.',
      'Mahnstufe prüfen.',
      'Zahlung prüfen, bevor weitere Maßnahmen erfolgen.',
      'Interne Notizen sauber dokumentieren.',
    ],
  },
  {
    title: 'Dokumente',
    functionText: [
      'Zentrale Übersicht aller hochgeladenen Anhänge.',
      'Dokumente können Kunden, Fahrzeugen, Serviceaufträgen oder Rechnungen zugeordnet sein.',
    ],
    employeeTasks: [
      'Dateien immer an der passenden Akte hochladen.',
      'Dateinamen sinnvoll wählen.',
      'Bemerkung eintragen, wenn der Inhalt nicht eindeutig ist.',
      'Keine unnötigen oder doppelten Dateien hochladen.',
    ],
  },
  {
    title: 'Suche',
    functionText: [
      'Zentrale Suchfunktion für relevante Systemdaten.',
      'Hilft beim schnellen Finden von Kunden, Fahrzeugen, Aufträgen oder Rechnungen.',
    ],
    employeeTasks: [
      'Suchbegriffe möglichst eindeutig eingeben.',
      'Vor Neuanlage immer zuerst suchen.',
      'Gefundene Datensätze prüfen, bevor neue erstellt werden.',
    ],
  },
  {
    title: 'Benachrichtigungen',
    functionText: [
      'Automatische Hinweise aus Lager, Rechnungen, Serviceaufträgen und Terminen.',
      'Hinweise werden nach Priorität und Neuheit sortiert.',
    ],
    employeeTasks: [
      'Neue Hinweise regelmäßig prüfen.',
      'Kritische Hinweise zuerst bearbeiten.',
      'Lager- und Zahlungswarnungen weitergeben.',
    ],
  },
]

const workflows = [
  {
    title: 'Ablauf mit Termin',
    steps: [
      'Kunden suchen oder neu anlegen.',
      'Fahrzeug suchen oder neu anlegen.',
      'Termin mit Startzeit, Endzeit, Mitarbeiter und Arbeitsplatz erstellen.',
      'Serviceauftrag erstellen und mit Kunde/Fahrzeug verbinden.',
      '( Fortsetzen wenn Termin fällig )'
      'Fahrzeugannahme im Serviceauftrag dokumentieren.',
      'Arbeitszeit und Material während der Bearbeitung eintragen.',
      'Status des Auftrags aktuell halten.',
      'Auftrag abschließen und Rechnung erstellen.',
      'Rechnung prüfen.',
      'Zahlung erfassen.',
    ],
  },
  {
    title: 'Ablauf ohne Termin',
    steps: [
      'Kunden suchen oder neu anlegen.',
      'Fahrzeug suchen oder neu anlegen.',
      'Serviceauftrag erstellen und mit Kunde/Fahrzeug verbinden.',
      'Fahrzeugannahme im Serviceauftrag dokumentieren.',
      'Arbeitszeit und Material während der Bearbeitung eintragen.',
      'Status des Auftrags aktuell halten.',
      'Auftrag abschließen und Rechnung erstellen.',
      'Rechnung prüfen.',
      'Zahlung erfassen.',
    ],
  },
  {
    title: 'Rechnungserstellung',
    steps: [
      'Serviceauftrag öffnen.',
      'Arbeitszeiten und Materialien prüfen.',
      'Auftrag abschließen und Rechnung erstellen.',
      'Automatisch erzeugte Rechnung in Rechnungen öffnen.',
      'Netto, Brutto, offenen Betrag und Rechnungsnummer prüfen.',
      'Bei Fehlern Rechnung bearbeiten.',
    ],
  },
  {
    title: 'Dokumentenablage',
    steps: [
      'Passende Akte öffnen: Kunde, Fahrzeug, Serviceauftrag oder Rechnung.',
      'Bemerkung zum Dokument eintragen.',
      'Datei auswählen und hochladen.',
      'Im Dokumentenmodul prüfen, ob die Datei sichtbar ist.',
    ],
  },
]

export default function WikiPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Werkstattmeister', 'Werkstatt', 'Serviceannahme', 'Buchhaltung', 'Lager', 'Behördenvertreter']}>
      <div style={{ display: 'grid', gap: 18 }}>
        <div className="topbar">
          <div>
            <h1 className="topbar-title">System-Wiki & User Guide</h1>
            <div className="topbar-subtitle">
              Arbeitsabläufe, Seitenfunktionen und Mitarbeiteraufgaben.
            </div>
          </div>
        </div>

        <div className="page-card">
          <h2 style={{ marginTop: 0 }}>Arbeitsabläufe</h2>

          {workflows.map((workflow) => (
            <div key={workflow.title} className="list-box">
              <h3 style={{ marginTop: 0 }}>{workflow.title}</h3>
              <ol style={{ marginBottom: 0 }}>
                {workflow.steps.map((step) => (
                  <li key={step} style={{ marginBottom: 6 }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="page-card">
          <h2 style={{ marginTop: 0 }}>Seitenfunktionen und Mitarbeiteraufgaben</h2>

          {sections.map((section) => (
            <div key={section.title} className="list-box">
              <h3 style={{ marginTop: 0 }}>{section.title}</h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <h4>Funktion der Seite</h4>
                  <ul>
                    {section.functionText.map((item) => (
                      <li key={item} style={{ marginBottom: 6 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4>Was Mitarbeiter tun müssen</h4>
                  <ul>
                    {section.employeeTasks.map((item) => (
                      <li key={item} style={{ marginBottom: 6 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="page-card">
          <h2 style={{ marginTop: 0 }}>Grundregel</h2>
          <p>
            Jeder Vorgang sollte sauber dokumentiert werden. Die wichtigste Kette lautet:
          </p>
          <div className="list-box">
            <strong>Kunde → Fahrzeug → Serviceauftrag → Arbeitszeit / Material → Rechnung → Zahlung</strong>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}