# AGENTS.md — Ilaris Alternative Actor Sheet

Tool-agnostische Arbeitsregeln für KI-Agenten in diesem Repository.
Sie gelten für dieses **Foundry-VTT-Modul** und nicht für das separate
Ilaris-Systemprojekt.

## Projekt in Kürze

- **Modul-ID:** `ilaris-alternative-actor-sheet`
- **Abhängigkeit:** Ilaris-System (`Ilaris`)
- **Laufzeit:** Foundry VTT 14 (siehe `module.json`)
- **Technik:** JavaScript ES-Module, Handlebars (`.hbs`) und CSS; kein TypeScript
- **Einstiegspunkt:** `module.js`

Die Modulstruktur ist:

```text
module.js                 Hook-Registrierung, Sheet-/Dialog-Integration
scripts/sheets/           Alternative Actor- und Creature-Sheets
scripts/apps/             Dialoge und weitere Foundry-Anwendungen
scripts/components/       Wiederverwendbare UI-Komponenten
scripts/utilities.js      Geteilte Hilfsfunktionen und Domänenlogik
scripts/handlebars-helpers.js
templates/{sheets,apps,components,chat}/
styles/                   Modul- und feature-spezifische Stylesheets
assets/                   Icons und Bilder
openspec/                 Specs und Change-Artefakte
```

## Quellen und Vorrang

Bei widersprüchlichen Informationen gilt – absteigend:

1. Pfadspezifische Dateien in `.github/instructions/`
2. Diese `AGENTS.md`
3. `openspec/config.yaml` und die Artefakte der gerade bearbeiteten Änderung
4. Tatsächlicher Code sowie `module.json` und `package.json`
5. Allgemeine Dateien in `.github/`

### Wichtige Abgrenzung

Ein Teil der `.github/copilot-instructions.md`- und `.github/agents/`-Texte
beschreibt das **Ilaris-System** statt dieses Moduls. Dort genannte Pfade wie
`scripts/core/`, `scripts/actors/`, `template.json`, `comp_packs/`, Jest oder
System-spezifische AppV2-Beispiele sind keine Belege für die Struktur dieses
Repositories. Übernimm sie nicht ohne Abgleich mit dem lokalen Modulcode.

`module.json` ist für die veröffentlichte Foundry-Kompatibilität maßgeblich.
Wenn eine Änderung die Kompatibilität oder Version berührt, prüfe zusätzlich
den abweichenden `foundry`-Block in `package.json` und halte beide bewusst
konsistent.

## OpenSpec ist verbindlich

Für jede relevante Verhaltens-, UI-, API-, Daten- oder Asset-Änderung gilt:

```text
Explore  →  Propose  →  Apply  →  Archive
```

### 1. Explore

Explore dient ausschließlich dem Verstehen: Anforderungen klären, Code und
Specs lesen, Risiken und Tests ermitteln.

- **Keine Implementierung und keine Projektdateien schreiben, ändern oder
  löschen.** Das schließt Dokumentation, SVGs, CSS und Konfiguration ein.
- Erlaubt sind nur lesende Untersuchungen und – falls ausdrücklich gewünscht –
  OpenSpec-Artefakte zur Festhaltung von Erkenntnissen.
- Wenn der Nutzer im Explore-Modus eine konkrete Änderung verlangt, halte an,
  fasse Erkenntnisse zusammen und wechsle erst nach einem Proposal in Apply.

### 2. Propose

Lege für eine relevante Änderung einen Change unter
`openspec/changes/<kebab-case-name>/` an und erstelle die erforderlichen
Artefakte gemäß `openspec/config.yaml`:

- `proposal.md` — Zweck, Umfang, betroffene Modulpfade, Hooks und Testauswirkung
- `design.md` — technische Umsetzung, bei UI: Template/CSS/Script-Schichten
- `specs/` — Delta-Spezifikationen mit Szenarien
- `tasks.md` — atomare, abhaktbare Umsetzungsschritte mit exakten Pfaden

Verwende die OpenSpec-CLI, um Status und Artefaktanweisungen zu ermitteln;
bei PowerShell-Ausführungsrichtlinien kann die `.cmd`-Variante des jeweiligen
Node-Programms nötig sein. Bearbeite keine Implementierungsdatei, bevor das
Change-Artifact `tasks.md` die Aufgabe freigibt.

### 3. Apply

Implementiere ausschließlich offene Aufgaben aus dem freigegebenen
`tasks.md`. Halte Änderungen klein, aktualisiere die Checkboxen erst nach
erfolgreicher Validierung und erweitere Proposal/Design/Specs, sobald sich
Umfang oder Annahmen ändern.

### 4. Archive

Nach vollständig erledigten und validierten Aufgaben wird der Change über
OpenSpec archiviert. Die Hauptspecs müssen die endgültige Wahrheit enthalten.

### Ausnahmen

Reine Lese-/Analyseaufträge benötigen keinen Change. Eine Änderung an dieser
`AGENTS.md` oder an Agenten-Anleitungen darf direkt erfolgen, wenn sie nur die
Arbeitsanweisungen selbst korrigiert und keine Modulfunktion verändert.

## Foundry- und Modulregeln

1. Prüfe Foundry-APIs, Hooks, Dokumentmethoden und `foundry.utils.*` vor einer
   Implementierung in der offiziellen [Foundry-VTT-API-Dokumentation](https://foundryvtt.com/api/v14/).
   Niemals Hook-Signaturen oder Eigenschaften raten.
2. Verwende nur dokumentierte Schnittstellen und wahre das Modul-Präfix
   `ilaris-alternative-actor-sheet` für Settings, Flags und Socket-Nachrichten.
3. Bewahre deutsche Ilaris-Domänensprache in sichtbaren Texten und Datenpfaden
   (z. B. `Fertigkeiten`, `Waffen`, `LeP`). Verwende Englisch für strukturelle
   Code- und Dateinamen.
4. UI-Änderungen folgen der Schichtung: strukturierte Daten in JavaScript,
   Markup in einer passenden `.hbs`-Datei, Darstellung in einem passenden
   Stylesheet. Große HTML-Strings in JavaScript vermeiden.
5. Neue UI-Komponenten nutzen das zentrale Farbschema aus `styles/module.css`.
   Keine lokalen `--color-*`-Definitionen oder fest codierten Farben, wenn eine
   bestehende `var(--color-*)`-/`var(--overlay-*)`-Variable passt.
6. Ändere weder die Ilaris-Systemdateien noch externe Foundry-Dateien. Das
   Modul integriert sich über seine eigenen Hooks, Sheets, Templates und Styles.

## SVG- und Asset-Regeln

Für neue oder umgewandelte Icons gilt zusätzlich [svg-agent.md](svg-agent.md).
Icons werden transparent, einfarbig und vereinfachend im dort beschriebenen
Aktions-Silhouettenstil erstellt. Kläre Lizenz und erforderliche Attribution,
bevor externe Rastervorlagen oder Grafiken übernommen werden.

## Validierung

Lies zuerst `package.json`; die aktuell verfügbaren Skripte sind:

```text
npm run lint       ESLint-Prüfung
npm run lint:fix   ESLint mit automatischer Korrektur
npm run prettier   Prettier schreibt Änderungen
npm run pack-all   Pack-Hilfsprogramm (nur wenn die Änderung Pack-Daten betrifft)
```

- Dieses Repository definiert derzeit **kein** `npm test`; behaupte daher
  keine erfolgreiche Testausführung und erfinde keine Jest-Konfiguration.
- Führe `npm install` aus, wenn Abhängigkeiten fehlen, `package-lock.json`
  geändert wurde oder die Validierungswerkzeuge nicht laufen.
- Nach JavaScript- oder CSS-/Template-Änderungen: mindestens `npm run lint`
  ausführen und die betroffene Oberfläche in Foundry VTT 14 manuell prüfen.
- Nach Daten-/Pack-Änderungen: nur dann `npm run pack-all`, wenn die
  zugehörigen Quelldaten im Repository tatsächlich vorhanden sind.
- Nach Asset-Änderungen: SVG auf transparentem hellem und dunklem Hintergrund
  sowie in der tatsächlichen Zielgröße prüfen.

## Zusammenarbeit und Review

Wenn Arbeit delegiert wird, lies zuerst das passende Profil aus
`.github/agents/`. Jede Übergabe enthält:

| Feld | Inhalt |
| --- | --- |
| `objective` | Abgrenzbares Ziel |
| `context` | Relevante Dateien, Specs, Erkenntnisse und Einschränkungen |
| `artifacts` | Erstellte/geänderte Pfade |
| `validation` | Ausgeführte und noch nötige Prüfungen |
| `status` | `completed`, `blocked` oder `needs-review` |

Vor Abschluss erfolgt ein risikobasierter Review: Zielerfüllung,
Foundry-API-Konformität, Regressionen, Validierung, Dokumentation und
Lizenzfolgen prüfen. Ergebnis: `PASS`, `PASS_WITH_NOTES` oder `BLOCK`.
