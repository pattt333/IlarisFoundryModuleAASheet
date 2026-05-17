# 1. Objective
Eine vollständige, priorisierte Spezifikationsabdeckung des aktuellen Modul-Ist-Zustands herstellen, indem bestehende Dokumente unter `docs/_specs` gegen den realen Funktionsumfang abgeglichen und fehlende Domänen als einzelne neue Spezifikationsdokumente definiert werden.

# 2. Context & Research Summary
- Vollständige Ist-Quelle für die Abdeckung: alle Dateien unter `docs/_specs` (20 Dateien), ergänzt durch Kontext aus `README.md`, `TECHNICAL_NOTES.md`, `module.json`, `module.js`, `scripts/**/*.js`, `templates/**/*.hbs`, `styles/**/*.css`.
- Bereits gut dokumentierte Domänen: Initiative-Dialoge (teilweise), Creature-Sheet (hoch), Schips, Rast/Regeneration, segmentierter Lebensbalken, Item-Accordion, Effekt-Stacks, Munitionslogik, Fernkampfoption-/Wurfwaffen-nahe Themen.
- Hohe Überschneidung historischer/migrationsbezogener Specs: mehrere `MIGRATION_*`-Dateien beschreiben Umsetzungshistorie, aber nicht durchgängig den heutigen Soll-Ist-Schnitt pro Subsystem.
- Reale Subsysteme mit schwacher oder fehlender eigener Spezifikation (Ist-Zustand):
  - Modul-Grundaufbau und Hook-Lifecycle (`module.js`, `module.json`)
  - Helden-Sheet-Kernarchitektur (Tabs, Context-Aufbereitung, Actions, Drag/Drop)
  - Favoriten-Komponente
  - Effektbibliothek-Workflow (Compendium -> Drop -> ActiveEffect)
  - Handlebars-Helper-Katalog
  - Zeitfortschritt/Scene-Control-Tooling für Effekte
  - Kompendien-/Pack-Architektur und Abhängigkeiten
  - CSS-Architektur auf Modul-Ebene (jenseits einzelner Features)
- Risiko: Ohne domänenscharfe Einzel-Specs bleibt Wissen verteilt über Code, Migrationsdateien und Feature-Inseln; Onboarding, Review und Regression-Checks werden fehleranfällig.
- Hinweis zur Quellenlage: Die in Planner-Hinweisen referenzierten Dateien `.agents/CODEBASE_ARCHITECTURE.md`, `.agents/PATTERNS_AND_EXAMPLES.md`, `.agents/GLOSSARY.md` waren in diesem Repository nicht vorhanden; daher erfolgte die Architektur-/Pattern-Recherche direkt aus Repository-Struktur, Quellcode und vorhandenen Spezifikationen.

# 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `docs/_specs/2026_05_17_modul_grundaufbau_abdeckung/modul_grundaufbau_abdeckung_plan.md` | create | Ausführbarer Master-Plan für Abdeckungsanalyse und Lückenschluss |
| `docs/_specs/modul-grundaufbau-und-hook-lifecycle.md` | create | Dokumentiert Initialisierung, Hooks, Registrierungen und Settings als Ist-Zustand |
| `docs/_specs/helden-sheet-architektur-und-interaktionen.md` | create | Dokumentiert Kernlogik des alternativen Helden-Sheets inkl. Tabs, Actions, Drag/Drop |
| `docs/_specs/initiative-system-komplettfluss.md` | create | Konsolidiert Single-, Mass- und Negative-Initiative inkl. Flag-Persistenz und Effektlogik |
| `docs/_specs/favoriten-komponente-und-zustand.md` | create | Schließt Lücke für Favorites-Subsystem und Session-State-Verhalten |
| `docs/_specs/effektbibliothek-und-effektuebertragung.md` | create | Beschreibt Compendium-zu-Actor-Effektübertragung inkl. Stacking-Pfade |
| `docs/_specs/handlebars-helpers-katalog.md` | create | Schafft Referenz für registrierte Template-Helper und deren Verwendung |
| `docs/_specs/zeitfortschritt-und-tempoaere-effekte.md` | create | Dokumentiert Actor-/Szenenweiten Zeitfortschritt temporärer Effekte |
| `docs/_specs/kompendien-und-pack-architektur.md` | create | Dokumentiert Pack-Landschaft, Rollen im Modul und Abhängigkeiten in Features |
| `docs/_specs/css-architektur-und-ui-bausteine.md` | create | Dokumentiert Modul-CSS-Struktur, Komponenten-CSS und Verantwortlichkeiten |
| `docs/_specs/spec-index-ist-abdeckung.md` | create | Liefert Mapping-Tabelle: Funktion -> Spec-Datei inkl. Abdeckungsstatus |

# 4. Steps
1. **[P1] Baseline-Abdeckungsmatrix aus Ist-Zustand erstellen**
- **What**: Alle aktuellen Features und Subsysteme aus `module.js`, `module.json`, `scripts/`, `templates/`, `styles/` in eine strukturierte Matrix erfassen (Feature, Quellpfad, derzeitige Spec-Abdeckung, Lücke ja/nein).
- **Where**: Referenzbasis aus `module.js`, `module.json`, `scripts/**/*.js`, `templates/**/*.hbs`, `styles/**/*.css`; Ergebnis als Grundlage für `docs/_specs/spec-index-ist-abdeckung.md`.
- **Who**: `docs`
- **Depends on**: none
- **Reference**: `module.js`, `scripts/sheets/alternative-actor-sheet.js`, `scripts/sheets/alternative-creature-sheet.js`, Foundry API (Hooks, Application/Dialog, ActiveEffect): https://foundryvtt.com/api/

2. **[P1] Modul-Grundaufbau und Hook-Lifecycle spezifizieren**
- **What**: Eigene Spec für Initialisierung, Sheet-Registrierung, Settings, Template-Preload, Combat-/Tracker-Hooks, Munitions-Hook, Scene-Control-Button erstellen.
- **Where**: `docs/_specs/modul-grundaufbau-und-hook-lifecycle.md`
- **Who**: `docs`
- **Depends on**: 1
- **Reference**: `module.js`, `module.json`

3. **[P1] Helden-Sheet-Kernlogik als eigene Domänen-Spec dokumentieren**
- **What**: Tabs, Context-Preparation, Action-Handler, Drag/Drop-Flows, Rest-Dialog, Schips-Interaktion und Effektzeit-Aktionen als Ist-Verhalten beschreiben.
- **Where**: `docs/_specs/helden-sheet-architektur-und-interaktionen.md`
- **Who**: `docs`
- **Depends on**: 1
- **Reference**: `scripts/sheets/alternative-actor-sheet.js`, `templates/sheets/character/**/*.hbs`

4. **[P1] Initiative-System Ende-zu-Ende konsolidieren**
- **What**: Einzeldialog, Massen-Dialog, Negative-Initiative-Dialog, Persistenz über Flags und Effekt-/INI-Anwendung in einer technischen Ist-Spec zusammenführen.
- **Where**: `docs/_specs/initiative-system-komplettfluss.md`
- **Who**: `docs`
- **Depends on**: 1
- **Reference**: `scripts/apps/initiative-dialog.js`, `scripts/apps/mass-initiative-dialog.js`, `scripts/apps/negative-initiative-dialog.js`, `module.js`

5. **[P1] Effektbibliothek- und Effektübertragungs-Workflow dokumentieren**
- **What**: Drag/Drop aus Effektbibliothek, EffectItem-Transfer, Stack-Handling, Decrement/Advance-Mechaniken und Actor-bezogene Wirkungskette beschreiben.
- **Where**: `docs/_specs/effektbibliothek-und-effektuebertragung.md`
- **Who**: `docs`
- **Depends on**: 1
- **Reference**: `scripts/utilities.js`, `scripts/sheets/alternative-actor-sheet.js`, `scripts/sheets/alternative-creature-sheet.js`, `templates/components/effect-card.hbs`

6. **[P2] Favoriten-Subsystem als Einzel-Spec ergänzen**
- **What**: Tab-Switching, Collapse-Verhalten, SessionStorage-Schlüssel, UX-Fluss und bekannte TODO-Grenzen (z. B. persistentes Löschen) dokumentieren.
- **Where**: `docs/_specs/favoriten-komponente-und-zustand.md`
- **Who**: `docs`
- **Depends on**: 1
- **Reference**: `scripts/components/favorites-manager.js`, `templates/components/favorites-component.hbs`, `styles/favorites-component.css`

7. **[P2] Handlebars-Helper-Katalog erstellen**
- **What**: Alle registrierten Helper, Signaturen, Rückgabeverhalten und Verwendungsstellen bündeln; Hilfestellung für Template-Reviews bereitstellen.
- **Where**: `docs/_specs/handlebars-helpers-katalog.md`
- **Who**: `docs`
- **Depends on**: 1
- **Reference**: `scripts/handlebars-helpers.js`, `templates/**/*.hbs`

8. **[P2] Zeitfortschritt temporärer Effekte dokumentieren**
- **What**: Actor- und Szenenweite Zeitreduktion (`turns`/`rounds`), UI-Auslöser und Fehlerfälle als Ist-Prozess beschreiben.
- **Where**: `docs/_specs/zeitfortschritt-und-tempoaere-effekte.md`
- **Who**: `docs`
- **Depends on**: 1
- **Reference**: `scripts/utilities.js`, `module.js`, `scripts/sheets/*.js`

9. **[P2] Kompendien- und Pack-Architektur spezifizieren**
- **What**: Zweck der Packs, in welchen Features sie konsumiert werden, sowie Abhängigkeiten und Ownership-Modell dokumentieren.
- **Where**: `docs/_specs/kompendien-und-pack-architektur.md`
- **Who**: `compendium`
- **Depends on**: 1
- **Reference**: `module.json`, `packs/**`, `scripts/utilities.js`, `scripts/apps/*.js`

10. **[P3] CSS-Architektur und UI-Bausteine zusammenfassen**
- **What**: Verantwortlichkeiten von `module.css` und komponentenspezifischen Styles, inklusive Mapping auf Templates/Komponenten, als Ist-Dokumentation erfassen.
- **Where**: `docs/_specs/css-architektur-und-ui-bausteine.md`
- **Who**: `docs`
- **Depends on**: 1
- **Reference**: `styles/*.css`, `templates/components/*.hbs`, `templates/sheets/**/*.hbs`

11. **[P1] Spezifikations-Index mit Prioritäten und Reihenfolge finalisieren**
- **What**: Zentrale Übersicht erstellen: bestehende vs. neue Specs, Abdeckungsgrad, P1/P2/P3, empfohlene Bearbeitungsreihenfolge, Verweise auf Quellpfade.
- **Where**: `docs/_specs/spec-index-ist-abdeckung.md`
- **Who**: `docs`
- **Depends on**: 2, 3, 4, 5, 6, 7, 8, 9, 10
- **Reference**: Alle zuvor erstellten/analysierten Spec-Dateien in `docs/_specs`

# 5. Validation Plan

## Step-spezifische Validierung
- **Schritt 1**: Vollständigkeit gegen Quellbaum prüfen.
  - Kommando: `rg --files docs/_specs`
  - Manuell: Jede in der Matrix genannte Domäne hat mindestens einen eindeutigen Code-Referenzpfad.
  - Erwartet: Keine ungemappten Kernsubsysteme (`module`, `sheets`, `apps`, `components`, `utilities`, `helpers`, `packs`, `styles`).
- **Schritte 2-10**: Für jede neu angelegte Spec-Datei Struktur- und Inhaltskonsistenz prüfen.
  - Kommando: `rg -n "^#|^##|Ist-Zustand|Subsystem|Hook|Dialog|Template|Style" docs/_specs/*.md docs/_specs/**/*.md`
  - Manuell: Datei beschreibt ausschließlich aktuellen Zustand, keine Roadmap-Inhalte außer als abgegrenzte Historie.
  - Erwartet: Pro Datei eindeutige Domäne, klare Quellverweise, keine Sammel-Unspezifik.
- **Schritt 11**: Priorisierung und Reihenfolge verifizieren.
  - Kommando: `rg -n "P1|P2|P3|Reihenfolge|Abdeckung" docs/_specs/spec-index-ist-abdeckung.md`
  - Manuell: Reihenfolge beginnt mit P1-Domänen und spiegelt Abhängigkeitslogik wider.
  - Erwartet: Konsistente Prioritätskennzeichnung und umsetzbare Reihenfolge.

## Gesamtvalidierung
- Kommandos:
  - `rg --files docs/_specs | sort`
  - `rg -n "module.js|module.json|scripts/|templates/|styles/|packs/" docs/_specs/*.md docs/_specs/**/*.md`
- Manuelle Checks in Foundry VTT:
  - Querlesen, ob dokumentierte Flows mit beobachtbarem Verhalten übereinstimmen (Sheet-Wechsel, Initiative-Dialoge, Effekt-Buttons, Munitions-/Wurfwaffenlogik).
- Erwartetes Gesamtergebnis:
  - Jeder zentrale Funktionsbereich des aktuellen Moduls ist mindestens einmal durch eine dedizierte, domänenscharfe Spec dokumentiert.
  - Historische Migrationsdokumente bleiben Kontext, sind aber nicht mehr primäre Ist-Referenz für Kernverhalten.

# 6. Assumptions & Open Questions
- **Assumptions**
  - Abdeckungsmaßstab ist primär `docs/_specs`; `README.md`, `TECHNICAL_NOTES.md` und übrige `docs/` liefern nur Kontext.
  - Fokus ist ausschließlich aktueller Modul-Ist-Zustand (keine neue Roadmap).
  - Fehlende Bereiche werden als einzelne Domänen-Specs angelegt, nicht als Sammeldokument.
  - Priorisierung erfolgt als P1/P2/P3 plus empfohlene Reihenfolge.
- **Open Questions**
  - Soll `spec-index-ist-abdeckung.md` langfristig als verpflichtender Einstiegspunkt in `docs/_specs` gelten?
  - Sollen bestehende ältere Feature-/Migrationsdokumente mit Verweisen auf die neuen Domänen-Specs ergänzt werden (Cross-Linking), oder bleibt dies optional?

# 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | docs | Quellcode- und Strukturinventar (`module.js`, `module.json`, `scripts/`, `templates/`, `styles/`, bestehende Specs) | Abdeckungsmatrix als Arbeitsgrundlage |
| 2 | docs | Hook- und Init-Logik aus `module.js` + Manifestdaten | Spec: Modul-Grundaufbau & Hook-Lifecycle |
| 3 | docs | Helden-Sheet-Code + Character-Templates | Spec: Helden-Sheet-Architektur & Interaktionen |
| 4 | docs | Initiative-Dialog-Klassen + Combat-Hooks | Spec: Initiative-System-Komplettfluss |
| 5 | docs | Utility-/Sheet-Logik zu Effects + Effect-Template | Spec: Effektbibliothek & Effektübertragung |
| 6 | docs | Favorites-Manager + Template + CSS | Spec: Favoriten-Komponente & Zustand |
| 7 | docs | Handlebars-Helfer + Template-Verwendungen | Spec: Handlebars-Helpers-Katalog |
| 8 | docs | Zeitfortschritt-Utilities + UI-Auslöser | Spec: Zeitfortschritt & temporäre Effekte |
| 9 | compendium | `module.json` Packs + `packs/**` + Pack-Nutzung in Code | Spec: Kompendien- & Pack-Architektur |
| 10 | docs | Stylesheets + zugehörige Templates | Spec: CSS-Architektur & UI-Bausteine |
| 11 | docs | Ergebnisse aus Schritten 2-10 + bestehende Specs | Finaler Spec-Index mit P1/P2/P3 und Reihenfolge |
