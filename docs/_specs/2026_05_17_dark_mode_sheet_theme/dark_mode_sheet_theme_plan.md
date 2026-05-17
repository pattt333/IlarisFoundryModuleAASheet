# 1. Objective

Die alternativen Sheets dieses Moduls sollen automatisch eine Dark-Mode-Farbpalette verwenden, sobald Foundry VTT im Dark Mode läuft, wobei die bestehende Modul-Variablenstruktur erhalten und mit den Farben aus `C:\Users\padiq\IdeaProjects\umbrakor\frontend\src\theme.scss` gemappt wird.

# 2. Context & Research Summary

- Die zentrale Farbdefinition des Moduls liegt derzeit in `styles/module.css` in einem globalen `body`-Block mit CSS-Variablen fuer Flachen, Text, Border, Accent, Danger, Success und Overlays.
- Laut installierter Foundry-Client-CSS wird der aktive UI-Theme-Zustand ueber `body.theme-dark` und `body.theme-light` abgebildet. In `C:\Program Files\Foundry Virtual Tabletop\resources\app\public\css\foundry2.css` existieren eigene Variable-Saetze unter diesen Selektoren. Das ist der stabilste CSS-Hook fuer ein Modul, weil kein privates JS-Verhalten nachgebaut werden muss.
- Die Foundry-API-Doku bestaetigt allgemein, dass Module sich an oeffentlichen Oberflaechen und ausgelieferten Client-Ressourcen orientieren sollen; fuer das eigentliche Theme-Mapping war die ausgelieferte Foundry-CSS die entscheidende Quelle.
- Die externe Datei `C:\Users\padiq\IdeaProjects\umbrakor\frontend\src\theme.scss` definiert ein Dark Theme auf Basis einer Material-Palette mit dunklen Neutralwerten (`neutral` 5/10/20/30/40), dunkleren Secondary-/Neutral-Variant-Toenen und einer Error-Palette. Diese Werte muessen auf die vorhandenen Modul-Variablen gemappt werden, statt eine zweite unabhaengige Token-Struktur einzufuehren.
- `module.json` bindet bereits alle sechs Style-Dateien des Moduls ein. Es ist daher kein zusaetzlicher Manifest-Hook noetig, solange der Dark-Mode-Wechsel rein ueber CSS-Selektoren erfolgt.
- Neben den zentralen Variablen existieren mehrere hart codierte Light-Werte in den Style-Dateien, insbesondere `background: white` in `styles/module.css`, `styles/item-accordion.css` und `styles/initiative-dialog.css`. Diese Stellen wuerden Dark Mode sonst visuell brechen und muessen in dieselbe Token-Strategie ueberfuehrt werden.
- Die in `.github/agents/planner.md` geforderten `.agents`-Referenzdateien (`CODEBASE_ARCHITECTURE.md`, `PATTERNS_AND_EXAMPLES.md`, `GLOSSARY.md`) sind in diesem Repository nicht vorhanden. Die Planung stuetzt sich daher auf die vorhandenen Projektdateien, die Modul-Styles, das Manifest, die externe Theme-Datei und die installierte Foundry-CSS.

# 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `styles/module.css` | modify | Zentrale Light-Variablen in eine Light/Dark-Struktur ueberfuehren und `body.theme-dark`-Overrides anlegen |
| `styles/item-accordion.css` | modify | Hart codierte weisse Flaechen auf Modul-Variablen umstellen |
| `styles/initiative-dialog.css` | modify | Hart codierte Light-Flaechen fuer Dark Mode tokenisieren |
| `styles/favorites-component.css` | modify | Harte Kontrast- und Flaechenwerte gegen Theme-Variablen pruefen und bei Bedarf angleichen |
| `styles/effect-card.css` | modify | Texte/Flaechen mit festen Kontrastfarben fuer Dark Mode absichern |
| `styles/creature-sheet.css` | modify | Direkte Farbwerte mit zentralen Variablen konsistent machen |
| `docs/_specs/2026_05_17_dark_mode_sheet_theme/dark_mode_sheet_theme_plan.md` | create | Umsetzungsplan fuer die Dark-Mode-Erweiterung dokumentieren |

# 4. Steps

1. **Theme-Einstiegspunkt und Token-Strategie festlegen**
   - **What**: Den bestehenden globalen Variablenblock in `styles/module.css` in einen klaren Light-Default und einen separaten `body.theme-dark`-Block aufteilen. Dabei festlegen, welche vorhandenen Modul-Variablen als semantische Tokens fuer Surface, Text, Border, Accent, Statusfarben und Overlays dienen.
   - **Where**: `styles/module.css`
   - **Who**: code
   - **Depends on**: none
   - **Reference**: `C:\Program Files\Foundry Virtual Tabletop\resources\app\public\css\foundry2.css` (`body.theme-dark`, `body.theme-light`), `styles/module.css`

2. **Externe Dark-Palette auf Modul-Variablen mappen**
   - **What**: Aus `C:\Users\padiq\IdeaProjects\umbrakor\frontend\src\theme.scss` die relevanten dunklen Neutral-, Secondary-/Neutral-Variant- und Error-Farben ableiten und auf die bestehenden Modul-Variablen mappen, z. B. `--color-surface-base`, `--color-surface-muted`, `--color-surface-header`, `--color-text-primary`, `--color-text-secondary`, `--color-border-*`, `--color-danger*`, `--overlay-*` und abgeleitete Alias-Variablen wie `--header-bg-color`.
   - **Where**: `styles/module.css`
   - **Who**: code
   - **Depends on**: 1
   - **Reference**: `C:\Users\padiq\IdeaProjects\umbrakor\frontend\src\theme.scss`, insbesondere die `neutral`, `secondary`, `neutral-variant` und `error`-Paletten

3. **Zentrale harte Light-Werte in modul.css tokenisieren**
   - **What**: Alle festen Light-Farben in `styles/module.css`, die nicht bewusst Kontrasttext auf farbigen Flaechen darstellen, durch vorhandene oder neu definierte semantische Variablen ersetzen. Dazu gehoeren insbesondere `background: white`, helle Flaechenhintergruende und Textfarben, die im Dark Mode kippen muessen.
   - **Where**: `styles/module.css`
   - **Who**: code
   - **Depends on**: 2
   - **Reference**: `styles/module.css`, die bisherigen Light-Tokens im Kopfbereich der Datei

4. **Sekundaere CSS-Dateien auf Token-Nutzung umstellen**
   - **What**: Die restlichen Stylesheets des Moduls systematisch auf feste Light-Flaechen und unthematisierte Kontrastwerte pruefen. Alle Stellen, die im Dark Mode falsche Flaechen/Text-Kontraste erzeugen, auf die zentralen Modul-Variablen umstellen. `white` als bewusster Kontrastwert auf starken Akzentflaechen darf erhalten bleiben, wenn die Lesbarkeit dadurch korrekt bleibt.
   - **Where**: `styles/item-accordion.css`, `styles/initiative-dialog.css`, `styles/favorites-component.css`, `styles/effect-card.css`, `styles/creature-sheet.css`
   - **Who**: code
   - **Depends on**: 3
   - **Reference**: Die in `module.json` eingebundenen Stylesheets, Fundstellen mit `background: white` und festen Textfarben in den jeweiligen CSS-Dateien

5. **Dark- und Light-Mode-Verhalten manuell gegen Foundry-Themes absichern**
   - **What**: In Foundry beide UI-Themes durchschalten und pruefen, ob das Modul automatisch mitzieht, ohne JS-Hook oder eigene Setting-Logik. Dabei besonders Header, Tabs, Kartenflaechen, Dialoge, Akkordeons, Favoriten, Zustandsanzeigen, Energie-/Lebensleisten und Scroll-Container kontrollieren.
   - **Where**: alle in Abschnitt 3 genannten CSS-Dateien; manuelle Pruefung in Foundry VTT
   - **Who**: code
   - **Depends on**: 4
   - **Reference**: `module.json`, installierte Foundry-Oberflaeche mit `body.theme-dark` und `body.theme-light`

# 5. Validation Plan

- **Step 1-2**
  - Commands to run: kein zwingender Build erforderlich; optional `npm run prettier` nach CSS-Aenderungen, falls das Repo dies fuer Styles verwendet.
  - Manual checks: Im Browser-Inspector von Foundry pruefen, dass `body.theme-dark` und `body.theme-light` die erwarteten Variablenwerte fuer das Modul setzen.
  - Expected outcomes: Die semantischen Modul-Variablen liefern im Light Mode weiterhin die bisherigen Farben und im Dark Mode die gemappten Werte aus der externen Palette.

- **Step 3-4**
  - Commands to run: `npm run lint` falls das Projektformat CSS-Dateien mitprueft; ansonsten `npm run prettier` fuer konsistente Formatierung.
  - Manual checks: Sheets, Initiative-Dialog, Item-Akkordeon, Favoriten-Komponente, Effect-Card und Creature-Sheet im Dark Mode oeffnen und auf verbleibende helle Hintergruende, schwache Kontraste oder unpassende Borders pruefen.
  - Expected outcomes: Keine ungeplanten weissen Flaechen mehr auf dunklem UI-Hintergrund; Text und Interaktionszustaende bleiben lesbar.

- **Overall result**
  - Commands to run: `npm run lint`; optional `npm test` nur als Regression-Check, obwohl fuer CSS-Theming voraussichtlich keine gezielten Tests existieren; `npm run start-foundry` oder vorhandene lokale Foundry-Instanz zur manuellen Sichtpruefung.
  - Manual checks: In Foundry zwischen `Foundry VTT` und `Foundry VTT (Light)` umschalten und bestaetigen, dass das Modul ohne Reload-Probleme die passende Light-/Dark-Version seiner Sheet-Farben verwendet.
  - Expected outcomes: Das Modul folgt dem Foundry-Theme automatisch, nutzt weiterhin seine bestehende Variablenarchitektur und benoetigt keine duplizierte Parallel-Stylestruktur ausserhalb der zentralen Tokens.

# 6. Assumptions & Open Questions

- Annahme: Die installierte Foundry-Version, gegen die das Modul genutzt wird, verwendet wie recherchiert `body.theme-dark` und `body.theme-light` als Theme-Selektoren.
- Annahme: Die externen Farben aus `theme.scss` duerfen semantisch gemappt werden und muessen nicht als 1:1-Namensspiegel ins Modul uebernommen werden.
- Annahme: Es ist ausreichend, nur die Styles dieses Moduls anzupassen; Templates und JavaScript muessen nicht erweitert werden.
- Offene Frage: Ob zusaetzlich einzelne Hover-/Glow-Werte aus der externen Palette feinjustiert werden muessen, entscheidet sich erst bei der visuellen Pruefung in Foundry.
- Offene Frage: Ob das Projekt `npm run lint` fuer reine CSS-Dateien tatsaechlich abdeckt, muss waehrend der Umsetzung anhand der vorhandenen Toolchain bestaetigt werden.

# 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | code | Bestehende Variablen in `styles/module.css`, Foundry-Theme-Selektoren aus `foundry2.css` | CSS-Struktur mit Light-Default und klarer Dark-Override-Ebene |
| 2 | code | Externe Palette aus `C:\Users\padiq\IdeaProjects\umbrakor\frontend\src\theme.scss`, bestehende Modul-Tokens | Konsistentes Mapping von Dark-Palette auf bestehende Modul-Variablen |
| 3 | code | `styles/module.css` nach Schritt 2 | Tokenisierte zentrale Sheet-Styles ohne feste Light-Flaechen |
| 4 | code | Uebrige Stylesheets aus `styles/`, zentrales Token-Set aus `styles/module.css` | Theme-faehige Neben-Styles ohne Dark-Mode-Brueche |
| 5 | code | Gebaute/geaenderte CSS-Dateien, laufende Foundry-Instanz | Verifizierter visueller Light-/Dark-Mode-Wechsel fuer alle betroffenen Sheets |