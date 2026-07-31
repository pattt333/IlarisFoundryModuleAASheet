# SVG-Icon-Agent

Diese Anleitung definiert, wie neue Icons für dieses Modul gestaltet,
aus Rastervorlagen nachgezeichnet und als saubere SVG-Dateien abgelegt werden.

## Zielbild

Die Icons orientieren sich an der bereitgestellten Referenz: **grafische,
kantige Aktions-Silhouetten** mit bewusst gesetzten Ausbrüchen. Sie wirken
dynamisch und lesbar, nicht detailverliebt oder realistisch.

```text
große, klare Form       +  1–3 prägnante Aussparungen
asymmetrische Bewegung  +  großzügiger Leerraum
wenige harte Kanten     +  hohe Erkennbarkeit bei kleiner Darstellung
```

### Stilregeln

- Zeichne ein Icon als einzelne, dominante Silhouette. Das Motiv muss bei
  24 × 24 px noch ohne Kontext verständlich bleiben.
- Setze Bewegung durch schräge Achsen, keilförmige Ausläufer, Splitter oder
  gezielte Einschnitte um – nicht durch viele kleine Konturen.
- Bevorzuge große Flächen, klare Negativräume und unterschiedlich lange,
  leicht unregelmäßige Kanten. Das Ergebnis darf roh und energisch wirken,
  aber nicht chaotisch.
- Verwende höchstens zwei Bedeutungsebenen: Hauptmotiv plus optionales
  Aktions-/Treffer-/Bewegungselement.
- Halte Innenaussparungen groß genug, damit sie bei kleiner Anzeige nicht
  zulaufen. Vermeide Haarlinien, Texturen, Schraffuren, Verläufe und Schatten.
- Der Bildrand bleibt frei: Die sichtbare Form soll üblicherweise nicht näher
  als 32 Einheiten an die `viewBox`-Kante reichen. Ausnahmen sind bewusst
  angeschnittene Bewegungs- oder Splitterelemente.
- Nutze keine Hintergrundfläche, keinen Rahmen und keine eingebetteten
  Rasterbilder.

### Nicht passend

- fotorealistische oder anatomisch detaillierte Darstellungen
- symmetrische, klinisch glatte Piktogramme ohne Charakter
- viele getrennte Mini-Details, dünne Linien oder dekorative Ornamente
- mehrfarbige Varianten, feste weiße/schwarze Flächen oder Rastereffekte

## Technische SVG-Vorgaben

Neue Dateien werden als eigenständige, responsive SVGs angelegt.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true">
  <path fill="currentColor" d="…"/>
</svg>
```

- Verwende immer `viewBox="0 0 512 512"`; lasse `width`, `height` und
  Inline-`style` weg.
- Färbe sichtbare Flächen mit `fill="currentColor"`. So steuert CSS die
  Farbe über `color`. Benutze weder `#fff`, `#000` noch andere feste Farben.
- Arbeite möglichst nur mit `<path>` und bei Bedarf `<g>`. Keine `<style>`,
  `<script>`, externen Referenzen, `id`s, Editor-Metadaten, `<title>` oder
  `<desc>`.
- Erzeuge Aussparungen als zusammengesetzten Pfad mit `fill-rule="evenodd"`
  und `clip-rule="evenodd"`, oder durch eine echte boolesche Subtraktion.
  Ein separater Pfad mit `fill="none"` stanzt keine vorhandene Fläche aus.
- Verwende keine Filter, Masken, Clips, Gradients, Muster, Texte, Bilder oder
  Bitmap-Data-URLs.
- Pfadkoordinaten dürfen Dezimalstellen haben, sollen aber nach der Optimierung
  sinnvoll gerundet sein. Entferne versteckte, leere und doppelte Formen.

### Einfärbung im UI

`currentColor` wird direkt vom umgebenden CSS geerbt, wenn ein SVG inline im
DOM verwendet wird. Bei einer externen Datei in `<img src="…">` kann die
Elternfarbe nicht in das SVG hineinvererbt werden. In diesem Fall gibt es zwei
zulässige Einbindungswege:

```css
/* Inline-SVG */
.icon { color: var(--color-text-primary); }

/* Externe SVG-Datei als CSS-Maske */
.icon {
  background-color: var(--color-text-primary);
  -webkit-mask: url("…/icon.svg") center / contain no-repeat;
  mask: url("…/icon.svg") center / contain no-repeat;
}
```

Icons selbst bleiben in beiden Fällen transparent und monochrom. Wenn der
Einbindungsort noch nicht feststeht, wird die SVG dennoch mit `currentColor`
angelegt; die spätere Komponente entscheidet dann zwischen Inline-SVG und
Maske.

## Ablage und Benennung

- Fertigkeits-Icons: `assets/icons/fertigkeiten/<kebab-case-name>.svg`
- Waffen-Icons: `assets/icons/weapons/<kebab-case-name>.svg`
- Verwende ausschließlich Kleinbuchstaben, Bindestriche und eine beschreibende
  englische Bezeichnung, zum Beispiel `broken-shield.svg` oder `swift-strike.svg`.
- Überschreibe nie ein bestehendes Icon ohne ausdrücklichen Auftrag.
- Neue oder ersetzte Icons brauchen eine eindeutige Zuordnung zu ihrem
  Talent, ihrer Waffe oder ihrem UI-Zweck.

## Neues Icon gestalten

1. Benenne zuerst das Kernmotiv in einem kurzen Satz, etwa: „Ein Pfeil bricht
   durch einen Schild.“
2. Entscheide die dominante Silhouette und die Blickrichtung. Nutze eine
   Diagonale, wenn sie Handlung oder Tempo vermittelt.
3. Reduziere das Motiv auf eine Hauptform und höchstens drei charakteristische
   Aussparungen/Aktionselemente.
4. Prüfe die Lesbarkeit gedanklich bei 24 px und 32 px. Wenn ein Detail dort
   nicht mehr lesbar ist, weglassen oder stark vergrößern.
5. Erstelle die SVG nach den technischen Vorgaben und führe anschließend den
   Qualitätscheck durch.

## PNG zu SVG konvertieren

Eine automatische Vektorisierung ist nur ein Ausgangspunkt, niemals das
Endergebnis. Ziel ist eine stilistisch passende, editierbare Silhouette –
nicht die pixelgenaue Kopie der PNG.

1. **Vorlage prüfen:** Ist das Motiv kontrastreich und tatsächlich einfarbig?
   Entferne gedanklich Hintergrund, Schatten, Text und Antialiasing. Bei
   komplexen oder mehrfarbigen Vorlagen stattdessen neu nachzeichnen.
2. **Motiv vereinfachen:** Identifiziere Hauptform, Negativräume und höchstens
   drei Akzente. Interpretiere sie im Projektstil; übernimm keine unnötigen
   Pixelartefakte.
3. **Vektorisieren oder nachzeichnen:** Nutze Autotracing nur für eine grobe
   Form. Bereinige anschließend Knoten und zeichne kritische Formen manuell
   als wenige, glatte Pfade nach.
4. **Auf 512er-Raster ausrichten:** Skaliere und zentriere die sichtbare Form
   in `viewBox="0 0 512 512"`. Behalte einen ruhigen Rand und eine klare
   optische Mitte bei.
5. **CSS-Farbe anwenden:** Ersetze jede feste Füllfarbe durch
   `fill="currentColor"`; entferne den Hintergrund vollständig.
6. **Optimieren:** Entferne Metadaten und ungenutzte Attribute, vereine
   überlappende Formen falls dadurch keine Aussparungen verloren gehen, und
   reduziere überflüssige Punkte. Erhalte die visuelle Form vor maximaler
   Dateigrößenreduktion.
7. **Visuell vergleichen:** Prüfe auf hellem und dunklem Hintergrund sowie in
   einer kleinen Zielgröße. Achte besonders auf geschlossene Löcher,
   verschwindende Spitzen und unruhige Ränder.

## Qualitätscheck vor dem Speichern

- [ ] Transparent: keine Hintergrundform und kein eingebettetes Bild
- [ ] Einfarbig: jedes sichtbare Element nutzt `currentColor`
- [ ] Kompakt: `viewBox="0 0 512 512"`, keine festen Maße oder Inline-Stile
- [ ] Einfach: keine Verläufe, Filter, Masken, Texte oder unnötigen Gruppen
- [ ] Lesbar: Motiv ist bei 24–32 px klar erkennbar
- [ ] Stiltreu: kantig/dynamisch, große Formen, wenige prägnante Aussparungen
- [ ] Sauber: keine überflüssigen Punkte, Metadaten oder Editor-spezifischen
  Attribute
- [ ] Sicher: vorhandene Dateien nicht versehentlich überschrieben

## Urheberrecht und Quellen

Eine PNG darf nur vektorisiert oder als visuelle Vorlage genutzt werden, wenn
ihre Lizenz das erlaubt. Dokumentiere bei externen Quellen Urheber, Lizenz und
erforderliche Attribution. Die bisherigen Game-Icons-Dateien stehen unter
CC BY 3.0; neue, davon abgeleitete Icons müssen diese Anforderungen weiterhin
erfüllen.
