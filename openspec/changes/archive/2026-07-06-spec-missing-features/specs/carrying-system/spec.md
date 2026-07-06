# Carrying System

> Derived from: `templates/components/carrying.hbs`, `templates/components/supporting.hbs`, `templates/components/handcart.hbs`, `styles/module.css`

## ADDED Requirements

### Requirement: Three container types with distinct display logic

The actor sheet SHALL render three carrying container types: Mitführend (carrying), Unterstützend (supporting), and Handkarren (handcart). Each SHALL use its own Handlebars template and display items appropriate to that container.

#### Scenario: Viewing actor inventory

- **WHEN** an actor sheet inventory tab is rendered
- **THEN** the carrying, supporting, and handcart containers are displayed with their respective items

### Requirement: Carrying container shows directly carried items

The Mitführend (carrying) container SHALL display items the actor carries directly on their person, with capacity constraints based on the actor's carrying capacity.

#### Scenario: Actor carries items within capacity

- **WHEN** the actor carries items whose total weight is within their carrying capacity
- **THEN** all items are displayed normally without capacity warnings

### Requirement: Supporting container shows support items

The Unterstützend (supporting) container SHALL display support-type items, distinct from directly carried items.

#### Scenario: Actor has support items

- **WHEN** the actor has items categorized as "Unterstützend"
- **THEN** those items appear in the supporting container, not the carrying container

### Requirement: Handcart container shows cart-stored items

The Handkarren (handcart) container SHALL display items stored in the actor's handcart or similar external container.

#### Scenario: Actor has handcart items

- **WHEN** the actor has items stored in a handcart
- **THEN** those items appear in the handcart container

### Requirement: Each container uses item accordion for item display

Items within each container SHALL be rendered using the shared `item-accordion` component with appropriate parameters for that container type.

#### Scenario: Item in carrying container

- **WHEN** a carried item is rendered
- **THEN** it uses the item-accordion partial with container-appropriate nameLabel and controls
