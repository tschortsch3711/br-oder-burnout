# BR-Wahl-O-Mat

Der **BR-Wahl-O-Mat** ist ein interaktiver Selbstcheck, der Mitarbeitenden hilft einzuschätzen, ob eine Kandidatur bei der Betriebsratswahl gut zu ihnen passt.

## Nutzung

### 1) GitHub Pages (empfohlen)

Du kannst das Projekt direkt über GitHub Pages hosten:

1. Repository auf GitHub öffnen.
2. **Settings → Pages** auswählen.
3. Als Source den Branch (z. B. `main` oder `work`) und `/ (root)` festlegen.
4. Speichern und die bereitgestellte URL aufrufen.

### 2) Lokaler Webserver

Alternativ kannst du einen einfachen Static Server verwenden, z. B.:

```bash
npx serve
```

Oder direkt die `index.html` im Browser öffnen.

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
