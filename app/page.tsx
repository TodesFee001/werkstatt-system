export default function DashboardPage() {
  return (
    <div className="page-card">
      <h1>Dashboard</h1>
      <p>Willkommen im Werkstatt-System.</p>

      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        <div className="dashboard-box">
          <h3>Kunden</h3>
          <p>Verwalte Kundenstammdaten und Ansprechpartner.</p>
        </div>

        <div className="dashboard-box">
          <h3>Fahrzeuge</h3>
          <p>Fahrzeuge sauber mit Kunden verknüpfen.</p>
        </div>

        <div className="dashboard-box">
          <h3>Serviceaufträge</h3>
          <p>Fehler, Werkstattstatus und Kilometerstände erfassen.</p>
        </div>

        <div className="dashboard-box">
          <h3>Rechnungen</h3>
          <p>Rechnungen aus Aufträgen und Kundenbeziehungen erstellen.</p>
        </div>

        <div className="dashboard-box">
          <h3>Zahlungen</h3>
          <p>Offene Beträge und Zahlungseingänge verfolgen.</p>
        </div>

        <div className="dashboard-box">
          <h3>Nächster Ausbau</h3>
          <p>Lager, Dokumente, Mitarbeiter und Abwesenheiten.</p>
        </div>
      </div>
    </div>
  )
}