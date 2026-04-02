# Feature-Spezifikation: Active Effects Stacking System

## Übersicht

Implementierung eines Stack-Systems für Active Effects im Ilaris Alternative Actor Sheet Modul. Stack-Effects nutzen eine Name-basierte Konvention ("Stack" im Namen) und tracken ihren Stack-Count via `changes.length`. Das System unterstützt automatisches Stacking bei Drop, manuelle +/- Controls und Duration-Refresh gemäß Nenneke-Regelwerk.

## Stack-Regeln (Nenneke Regelwerk)

### Schaden über Zeit (DoT) Kategorien
- **Kategorien**: Blutung, Brennen, Gift, Krankheit, Erfrieren
- **Maximale Stacks**: 5 pro Kategorie
- **Duration**: 3 Kampfrunden (im Encounter) / 15 Minuten (außerhalb)
- **Schaden**: 2 SP pro Stack
- **Auffrischung**: Neuer Stack setzt Duration aller Stacks dieser Kategorie zurück auf 3 KR
- **Stacklimit**: Bei 5 Stacks wird nur noch Duration refreshed, kein weiterer Stack

### Andere Stack-Effects
Auch Erschwernisse und andere Effekte können stacken:
- Gleiche Mechanik (max 5, duration refresh)
- Können andere Modifier haben (z.B. globaler Malus statt Schaden)

## Technische Spezifikation

### Data Model

#### Stack-Effect Struktur
```javascript
{
  _id: "abc123",
  name: "Brennen Stack",          // MUSS "Stack" enthalten
  icon: "path/to/icon.png",
  changes: [
    {
      key: "system.modifikatoren.globalermod",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "-2"
    },
    {
      key: "system.modifikatoren.globalermod",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "-2"
    }
    // changes.length = Stack Count (hier: 2)
  ],
  duration: {
    turns: 3                       // Immer 3 bei Refresh
  },
  origin: "Actor.xyz123"
}
```

#### Konventionen
- **Stack Detection**: `effect.name.includes("Stack")`
- **Stack Count**: `effect.changes.length` (1-5)
- **Single Change Type**: Alle Changes haben denselben `key` und `mode`
- **Kein Flag nötig**: Changes-Array ist Single Source of Truth

### Implementierung

#### 1. Stack Detection & Auto-Stacking (Drop Handler)

**Datei**: `scripts/sheets/alternative-actor-sheet.js`

**Ort**: In `_onDrop()` Methode nach Effect-Transfer (Zeile ~475)

**Logik**:
```javascript
async _onDrop(event) {
  // ... existing effect transfer code ...
  
  // Nach dem Transfer: Check für Stack-Effects
  if (effectData.name.includes("Stack")) {
    const existingStack = this.actor.effects.find(e => 
      e.name === effectData.name && e.name.includes("Stack")
    );
    
    if (existingStack) {
      // Effect existiert bereits - Stack erhöhen
      await this._increaseEffectStack(existingStack);
      ui.notifications.info(`${effectData.name} Stack erhöht (${existingStack.changes.length + 1})`);
      return;
    }
  }
  
  // Ansonsten: Normales Create
  await this.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}
```

#### 2. Stack-Erhöhung (Increase)

**Neue Methode**: `_increaseEffectStack(effect)`

**Logik**:
```javascript
async _increaseEffectStack(effect) {
  const currentStacks = effect.changes.length;
  
  // Maximum Check
  if (currentStacks >= 5) {
    ui.notifications.warn(`${effect.name} hat bereits maximale Stacks (5). Nur Duration aufgefrischt.`);
    await effect.update({"duration.turns": 3});
    return;
  }
  
  // Change Template kopieren
  const changeTemplate = foundry.utils.deepClone(effect.changes[0]);
  
  // Neuen Change hinzufügen
  const updatedChanges = [...effect.changes, changeTemplate];
  
  // Effect updaten
  await effect.update({
    changes: updatedChanges,
    "duration.turns": 3
  });
  
  ui.notifications.info(`${effect.name} Stack erhöht auf ${updatedChanges.length}`);
}
```

#### 3. Stack-Reduzierung (Decrease)

**Neue Methode**: `_decreaseEffectStack(effect)`

**Logik**:
```javascript
async _decreaseEffectStack(effect) {
  const currentStacks = effect.changes.length;
  
  // Bei 1 Stack: Komplett löschen
  if (currentStacks === 1) {
    await effect.delete();
    ui.notifications.info(`${effect.name} entfernt (0 Stacks)`);
    return;
  }
  
  // Letzten Change entfernen
  const updatedChanges = effect.changes.slice(0, -1);
  
  await effect.update({
    changes: updatedChanges
  });
  
  ui.notifications.info(`${effect.name} Stack reduziert auf ${updatedChanges.length}`);
}
```

#### 4. Event Listener

**Datei**: `scripts/sheets/alternative-actor-sheet.js`

**Ort**: In `activateListeners(html)` Methode

```javascript
activateListeners(html) {
  super.activateListeners(html);
  
  // Stack Controls
  html.on("click", ".effect-stack-increase", this._onEffectStackIncrease.bind(this));
  html.on("click", ".effect-stack-decrease", this._onEffectStackDecrease.bind(this));
}

async _onEffectStackIncrease(event) {
  event.preventDefault();
  const effectId = event.currentTarget.dataset.effectId;
  const effect = this.actor.effects.get(effectId);
  
  if (!effect) {
    ui.notifications.error("Effect nicht gefunden");
    return;
  }
  
  await this._increaseEffectStack(effect);
}

async _onEffectStackDecrease(event) {
  event.preventDefault();
  const effectId = event.currentTarget.dataset.effectId;
  const effect = this.actor.effects.get(effectId);
  
  if (!effect) {
    ui.notifications.error("Effect nicht gefunden");
    return;
  }
  
  await this._decreaseEffectStack(effect);
}
```

### UI/UX

#### Effect Card Template

**Datei**: `templates/components/effect-card.hbs`

**Änderungen**:
```handlebars
{{!-- Effect Card Component --}}
<div class="effect-card" data-item-id="{{effect._id}}" {{#if effect.description}}data-tooltip="{{effect.description}}"{{/if}}>
    
    {{!-- Existing Edit/Delete buttons --}}
    {{#unless (eq effect.flags.ilaris.sourceType "vorteil")}}
    <a class="effect-control item-edit effect-edit" ...>
        <i class="fas fa-edit"></i>
    </a>
    <a class="effect-control item-delete effect-delete" ...>
        <i class="fas fa-trash"></i>
    </a>
    {{/unless}}
    
    {{!-- NEW: Stack Controls (nur bei Stack-Effects) --}}
    {{#if (includes effect.name "Stack")}}
    <div class="effect-stack-controls">
        <a class="effect-stack-button effect-stack-decrease" 
           data-effect-id="{{effect._id}}" 
           title="Stack reduzieren">
            <i class="fas fa-minus"></i>
        </a>
        <a class="effect-stack-button effect-stack-increase {{#if (gte effect.changes.length 5)}}disabled{{/if}}" 
           data-effect-id="{{effect._id}}" 
           title="Stack erhöhen">
            <i class="fas fa-plus"></i>
        </a>
    </div>
    {{/if}}
    
    {{!-- Effect Icon --}}
    <div class="effect-icon">
        <img src="{{effect.img}}" alt="{{effect.name}}" title="{{effect.name}}"/>
    </div>
    
    {{!-- Effect Name --}}
    <div class="effect-name">
        <span>{{effect.name}}</span>
    </div>
    
    {{!-- NEW: Stack Badge (bottom-left) --}}
    {{#if (includes effect.name "Stack")}}
    <div class="effect-stack-badge">×{{effect.changes.length}}</div>
    {{/if}}
    
    {{!-- Duration (bottom right corner) --}}
    <div class="effect-duration">
        {{#if effect.duration.turns}}
        <span>{{effect.duration.turns}} KR</span>
        {{else}}
        <i class="fas fa-infinity" title="Unbegrenzte Dauer"></i>
        {{/if}}
    </div>
</div>
```

**Benötigte Handlebars Helper**:
```javascript
// In module.js bei Handlebars.registerHelper()
Handlebars.registerHelper('includes', function(str, search) {
  return str && str.includes(search);
});

Handlebars.registerHelper('gte', function(a, b) {
  return a >= b;
});
```

#### CSS Styling

**Datei**: `styles/effect-card.css`

**Neue Styles**:
```css
/* Stack Badge (bottom-left corner) */
.ilaris.sheet.actor.alternative .effect-stack-badge {
    position: absolute;
    bottom: 2px;
    left: 4px;
    font-size: 10px;
    font-weight: bold;
    color: white;
    background: rgba(66, 153, 225, 0.9);
    padding: 2px 6px;
    border-radius: 3px;
    line-height: 1;
    z-index: 2;
}

/* Stack Controls (hover overlay) */
.ilaris.sheet.actor.alternative .effect-stack-controls {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 3;
}

.ilaris.sheet.actor.alternative .effect-card:hover .effect-stack-controls {
    opacity: 1;
}

.ilaris.sheet.actor.alternative .effect-stack-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(66, 153, 225, 0.95);
    color: white;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.ilaris.sheet.actor.alternative .effect-stack-button:hover {
    background: rgba(49, 130, 206, 1);
    transform: scale(1.1);
}

.ilaris.sheet.actor.alternative .effect-stack-button.disabled {
    background: rgba(160, 174, 192, 0.8);
    cursor: not-allowed;
    pointer-events: none;
}

.ilaris.sheet.actor.alternative .effect-stack-button i {
    font-size: 14px;
}

/* Decrease button (minus) */
.ilaris.sheet.actor.alternative .effect-stack-decrease {
    background: rgba(245, 101, 101, 0.95);
}

.ilaris.sheet.actor.alternative .effect-stack-decrease:hover {
    background: rgba(229, 62, 62, 1);
}
```

## Testszenarien

### Test 1: Neuer Stack-Effect per Drop
1. Öffne Effect Library Compendium
2. Drag "Brennen Stack" auf Actor Sheet
3. **Erwartung**: Effect erscheint mit Badge "×1", Duration 3 KR

### Test 2: Stack erhöhen per Drop
1. Stack-Effect existiert bereits auf Actor (z.B. "Brennen Stack ×2")
2. Drop gleichen Effect erneut aus Library
3. **Erwartung**: 
   - Badge zeigt "×3"
   - Duration zurück auf 3 KR
   - Nur ein Effect mit dem Namen, kein Duplikat

### Test 3: Stack erhöhen per + Button
1. Hover über Stack-Effect Card
2. Klick auf + Button
3. **Erwartung**: Badge erhöht sich, Duration refresh auf 3 KR

### Test 4: Stack reduzieren per - Button
1. Stack-Effect mit 3 Stacks
2. Klick auf - Button zweimal
3. **Erwartung**: Badge zeigt "×1"

### Test 5: Stack auf 0 reduzieren
1. Stack-Effect mit 1 Stack
2. Klick auf - Button
3. **Erwartung**: Effect wird komplett gelöscht

### Test 6: Maximum Stacks (5)
1. Stack-Effect auf 5 erhöhen
2. Versuch weiteren Stack zu droppen
3. **Erwartung**: 
   - Notification "Maximum erreicht, nur Duration refreshed"
   - Badge bleibt bei "×5"
   - + Button wird grau/disabled

### Test 7: Changes-Array Konsistenz
1. Stack-Effect erstellen mit custom Change (z.B. `-3` statt `-2`)
2. Stack per + Button erhöhen
3. **Erwartung**: Neuer Change ist identisch zum Template (auch `-3`)

## Offene Fragen

### 1. Change-Template Validation
**Frage**: Sollen wir validieren, dass alle Changes in einem Stack-Effect denselben `key` und `mode` haben?

**Optionen**:
- A) Ja, mit Warnung wenn inkonsistent
- B) Nein, wir vertrauen auf korrekte Konfiguration
- C) Ja, mit automatischer Korrektur (alle Changes angleichen an erstem)

**Empfehlung**: Option B (KISS-Prinzip, da Stack-Effects nur via Templates kommen)

### 2. Kompendium-Templates
**Frage**: Sollen vordefinierte Stack-Effects im `effect-library` Compendium bereitgestellt werden?

**Templates**:
- Brennen Stack (Feuer-DoT)
- Gift Stack (Gift-DoT)
- Blutung Stack (Blutungs-DoT)
- Krankheit Stack (Krankheits-DoT)
- Erfrieren Stack (Kälte-DoT)
- Erschöpfung Stack (Malus auf alle Proben)

**Empfehlung**: Ja, als Beispiele und Quick-Start für GMs

### 3. Visual Feedback bei Max-Stacks
**Frage**: Wie soll der + Button bei 5 Stacks dargestellt werden?

**Optionen**:
- A) Komplett ausgeblendet
- B) Disabled (grau) mit Tooltip "Maximum erreicht"
- C) Disabled mit Shake-Animation bei Klick

**Empfehlung**: Option B (klarer UX-State ohne Verwirrung)

## Abhängigkeiten

### Foundry VTT API
- `ActiveEffect.update()` - Effect-Daten ändern
- `ActiveEffect.delete()` - Effect entfernen
- `actor.effects` Collection - Effect-Suche
- `foundry.utils.deepClone()` - Change Template kopieren

### Ilaris System
- `effect-item` Item-Type (existiert bereits)
- Effect Library Compendium (existiert: `ilaris-alternative-actor-sheet.effect-library`)
- System-spezifische Change Keys (z.B. `system.modifikatoren.globalermod`)

### Modul-Intern
- Effect Card Component Template (`effect-card.hbs`)
- Effect Card Styling (`effect-card.css`)
- Alternative Actor Sheet Class (`alternative-actor-sheet.js`)

## Implementation Reihenfolge

1. **Phase 1: Core Logic**
   - `_increaseEffectStack()` Methode
   - `_decreaseEffectStack()` Methode
   - Stack-Detection in `_onDrop()`

2. **Phase 2: UI Components**
   - Handlebars Helper registrieren
   - Effect Card Template erweitern
   - CSS für Badge und Buttons

3. **Phase 3: Event Handling**
   - Event Listeners in `activateListeners()`
   - Handler-Methoden für +/- Buttons

4. **Phase 4: Polish & Testing**
   - Notifications/Feedback verfeinern
   - Edge Cases testen
   - Kompendium-Templates erstellen (optional)

## Notizen

- **Keine Migration nötig**: Bestehende Effects ohne "Stack" im Namen werden nicht beeinflusst
- **Backwards Compatible**: Modul funktioniert auch ohne Stack-Effects normal weiter
- **System-Agnostic Pattern**: Könnte theoretisch für andere Systeme adaptiert werden
- **Performance**: Array-Operations (`length`, `push`, `pop`) sind O(1), kein Performance-Impact

## Changelog

### Version 1.0.0 (Geplant)
- Initial implementation of Stack Effects System
- Name-based Stack Detection
- Auto-stacking on drop
- Manual +/- controls
- Duration refresh on stack increase
- Max stack limit (5) with UI feedback
