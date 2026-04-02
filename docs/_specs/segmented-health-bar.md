# Segmentierter Lebensbalken (Segmented Health Bar)

## Übersicht

Der Lebensbalken (LeP-Anzeige) wurde von einer einfachen durchgehenden Anzeige zu einer segmentierten Darstellung umgebaut, die die Ilaris-Regelwerk-Mechanik mit LAW (Lebenspunkte-Abschnittswert) visuell abbildet.

## Regelwerk-Grundlage

### LAW-Berechnung
- **LAW** = 1/8 von hp_max (aufgerundet)
- LAW definiert die Größe eines Segments
- Bei 50 LeP: LAW = 7 (da 50 ÷ 8 = 6.25, aufgerundet = 7)

### Segment-Struktur
Der Lebensbalken wird in 7 visuelle Segmente aufgeteilt:

1. **Segment 1-4** (Rot): Schwer verletzt
   - Segment 1: LeP 1-7
   - Segment 2: LeP 8-14
   - Segment 3: LeP 15-21
   - Segment 4: LeP 22-28

2. **Segment 5-6** (Gelb): Verletzt
   - Segment 5: LeP 29-35
   - Segment 6: LeP 36-42

3. **Segment 7+8** (Grün): Wundfrei
   - Segment 7+8 kombiniert: LeP 43-50
   - Dieses Segment enthält **alle restlichen LeP** bis zum Maximum (maxHP - 6 × LAW)
   - Bei 50 LeP: 50 - (6 × 7) = 50 - 42 = 8 LeP

## Implementierungs-Komponenten

### 1. Handlebars Helper (`healthSegments`)

Ein neuer Helper berechnet die Segment-Daten für das Template:

**Eingabe:**
- `actor`: Der Foundry Actor mit System-Daten

**Ausgabe:**
- Array von Segment-Objekten mit folgenden Eigenschaften:
  - `number`: Segment-Nummer (1-7)
  - `start`: Start-LeP des Segments
  - `end`: End-LeP des Segments
  - `size`: Größe in LAW-Einheiten (normal: 1 LAW, letztes: 2 LAW)
  - `color`: Farbkategorie ('red', 'yellow', 'green')
  - `fillPercentage`: Füllstand in Prozent (0-100)
  - `width`: Prozentuale Breite für CSS

**Besondere Features:**
- Unterstützt **negative HP-Werte**: Alle Segmente bleiben leer
- Berechnet partielle Füllung: Ein Segment kann teilweise gefüllt sein
- Letztes Segment ist automatisch doppelt so breit

### 2. Template-Anpassungen

Das Handlebars-Template rendert die Segmente:

**Struktur:**
- Container mit `health-segments` Klasse
- Iteration über alle Segmente aus dem Helper
- Jedes Segment hat:
  - Data-Attribute für Segment-Informationen (Nummer, Start, End)
  - Tooltip mit Segment-Bereich
  - Inneres `segment-fill` Div für visuellen Füllstand
  - Dynamische Breite basierend auf LAW-Größe

**Interaktivität:**
- Segmente sind mit Tooltips versehen
- Zeigen den LeP-Bereich des Segments beim Hover

### 3. CSS-Styling

**Layout:**
- Segmente werden nahtlos nebeneinander mit Flexbox dargestellt
- Transparenter Hintergrund für leere Bereiche
- Keine Trennlinien zwischen Segmenten für fließenden Übergang
- Absolute Positionierung innerhalb des energy-progress Containers

**Farbschema:**
- **Rot** (Segmente 1-4): Gradient von dunklerem zu hellerem Rot
- **Gelb** (Segmente 5-6): Warme Orange-Gelb-Töne
- **Grün** (Segment 7+8): Frisches Grün für den wundfreien Bereich

**Animation:**
- Sanfte Übergänge beim Ändern des Füllstands (0.3s)
- Hover-Effekt für bessere Interaktivität

## Verwendung und Verhalten

### Vollständig gefüllter Charakter (50/50 LeP)
- Alle 7 Segmente sind vollständig gefüllt
- Grünes letztes Segment zeigt "Wundfrei"-Status

### Teilweise verletzt (25/50 LeP)
- Segmente 1-3: vollständig rot gefüllt (21 LeP)
- Segment 4: teilweise rot gefüllt (4 von 7 LeP)
- Segmente 5-7: leer

### Schwer verletzt (10/50 LeP)
- Segment 1: vollständig rot gefüllt (7 LeP)
- Segment 2: teilweise rot gefüllt (3 von 7 LeP)
- Alle anderen Segmente: leer

### Negative LeP (-5/50 LeP)
- Alle Segmente sind leer
- Die numerische Anzeige zeigt den negativen Wert

## Technische Details

### Berechnung der Segment-Füllung

Für jedes Segment wird berechnet:
1. **Vollständig gefüllt**: Wenn aktuelle HP ≥ Segment-Ende
2. **Teilweise gefüllt**: Wenn Segment-Start ≤ aktuelle HP < Segment-Ende
   - Berechnung: `(HP - Segment-Start + 1) / Segment-Größe × 100%`
3. **Leer**: Wenn aktuelle HP < Segment-Start

### Breiten-Verteilung

Bei 50 maxHP und LAW = 7:
- Segmente 1-6: Je 7 LeP = 14% der Gesamtbreite
- Segment 7: 8 LeP (50 - 42) = 16% der Gesamtbreite

Jedes Segment wird proportional zu seiner tatsächlichen LeP-Größe dargestellt:
`Breite = (Segment-Größe / maxHP) × 100%`

## Erweiterungsmöglichkeiten

Potenzielle zukünftige Verbesserungen:
- Klickbare Segmente zum direkten Setzen von HP
- Animationen bei HP-Änderungen
- Visuelle Indikatoren für kritische Zustände
- Anzeige der LAW-Grenzen als Beschriftung
- Responsive Anpassung für kleinere Bildschirme
