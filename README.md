# BR-Wahl-O-Mat

Der **BR-Wahl-O-Mat** ist ein interaktiver Selbstcheck, der Mitarbeitenden hilft einzuschätzen, ob eine Kandidatur bei der Betriebsratswahl gut zu ihnen passt.

## Nutzung

- Öffne die `index.html` direkt im Browser.
- Alternativ kannst du einen einfachen Static Server verwenden, z. B.:

```bash
npx serve
```

## Fragen erweitern

Die Fragen liegen in `assets/questions.js` und folgen diesem Format:

```js
{
  id: "eindeutige_id",
  text: "Fragetext",
  category: "Motivation",
  weight: 1.0,
  reverseScoring: false
}
```

Kategorien: `Motivation`, `Zeit`, `Kommunikation`, `Konflikt`, `Rückhalt`.

## Datenschutz

Alles läuft lokal im Browser. Es werden keine Daten an Server übertragen.
