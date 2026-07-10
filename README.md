# PraeLux Entscheidungsübersicht

Mandantenverständlicher Generator für hochwertige PraeLux-Entscheidungsübersichten als PNG.

Die Anwendung nimmt Basisdatenblatt- und Finanzgutachten-Text entgegen, extrahiert relevante Werte, berechnet die Mandantenwirkung aus Sicht des Mandanten und rendert daraus ein A4-Blatt im PraeLux-Stil.

## Funktionen

- Eingabe kompletter Unterlagen in einem Textfeld
- Erkennung von Mandantendaten, Bestand, Empfehlung und Produktveränderungen
- Darstellung fehlender Daten als `fehlt`, `nicht angegeben` oder `muss geprüft werden`
- positive Darstellung von Ersparnissen und Entlastungen aus Mandantensicht
- A4-Vorschau mit PraeLux-Design in Navy, Gold, Weiß und Grün
- Export der finalen Übersicht als PNG

## Entwicklung

```bash
npm install
npm run dev
```

Danach ist die Anwendung lokal unter `http://localhost:3000` erreichbar.

## Prüfung

```bash
npm run lint
npm run build
```
