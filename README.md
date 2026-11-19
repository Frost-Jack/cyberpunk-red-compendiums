# Cyberpunk RED Compendiums

The **Everyday Items** compendium contains all 28 entries from *Everyday Items v1.3* by
J Gray, published by R. Talsorian Games. Each card uses Foundry's interface
language to display its English or Russian description. The source field uses **EI**.

## Installation

Tested with Foundry VTT 12.343 and Cyberpunk RED – CORE v0.92.4. To install
from an archive, extract its contents to `Data/modules/cyberpunk-red-compendiums`,
with `module.json` directly inside that folder. Restart Foundry, enable
**Cyberpunk RED Compendiums** in a Cyberpunk RED world, and open **Everyday Items** in the
**Lumiel Compendiums** folder. Set the language in Foundry's Core Settings.

## Skill effects

- Equip the **Danshi Badgemaker** to make its +2 situational modifier available
  on Forgery rolls. Select it when making a fake ID badge.
- After drinking **EndurU**, enable its +1 Endurance effect from the item's
  Effects tab. After two hours, switch to the −1 effect for one hour. Keep only
  one phase active per character, even when they have several copies of EndurU.
- **Lead’s Bodyfree Mask** has a descriptive effect while equipped. Apply the
  rule on the item card manually to the observer's check.

## Build

Edit the descriptions in `languages/en.json` and `languages/ru.json`. Item
metadata lives in `src/everyday-items.json`. To rebuild the compendium, set
`NODE_PATH` to Foundry VTT 12's `resources/app/node_modules`
directory and run `node scripts/build-pack.cjs <new-pack-directory>`. This uses
Foundry's bundled ClassicLevel backend. Copy the rebuilt pack to
`packs/ei` while Foundry is closed.

Run `python scripts/build-release.py dist` from the module root to produce
`dist/module.zip` and its loose manifest. The release workflow uses the same
command with the GitHub release tag to set the version and archive URL.
