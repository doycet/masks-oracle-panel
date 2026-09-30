# Masks Solo / GM Oracle Panel — playtest 0.2.0

A private oracle control panel for solo Masks play or GM preparation in Foundry VTT v14. Although designed for use with Masks: A New Generation, it is system independent. It does not modify Masks sheets, publish chat messages, create world documents, or save results in shared world data.

## Install

**Option 1:** 
Copy the url https://github.com/doycet/masks-oracle-panel/releases/latest/download/module.json and paste that into Foundry’s **Install Module → Manifest URL**.

**Option 2:**
Unzip into `FoundryData/Data/modules/` so that the folder is `FoundryData/Data/modules/masks-oracle-panel/` and `module.json` is directly inside that folder. Restart Foundry if it is already running. Enable **Masks Solo / GM Oracle Panel** in Manage Modules. Click the theatrical masks sidebar icon and **Open Control Panel**. The same panel is available from the browser console with `MasksOraclePanel.open()`.

The ZIP is a manual installation package, not a hosted manifest URL. A browser refresh after editing data will reload it; the panel's **Reload data** button does the same.

## Use

Each table has its own button. **Action + Theme** rolls both at once. **Ask the Oracle** uses the selected chance of yes. A result and the latest twelve rolls remain in the current user's window memory; closing or reloading Foundry clears them. **Clear** removes them immediately. Rolls never enter chat or other players' windows.

The source sheet is `data/oracles.json`. Each table has an `id`, `title`, `group`, `die`, optional `note`, and `entries` with inclusive `min` and `max` ranges and `text`. Edit that file with a text editor, keeping valid JSON and complete nonoverlapping die coverage. **Reload data** checks it before replacing the current tables. The three relationship tables are playtest drafts; their wording can be changed directly in this file.

Action substitutions retain their d100 slots: 43 Explore → Provoke; 50 Gather → Embarrass; 59 Journey → Recruit. Theme substitutions: 11 Commerce → Approval; 32 Expedition → Acceptance; 50 Labor → Expectation; 59 Passage → Belonging; 73 Resource → Influence; 86 Supply → Friendship; 91 Trade → Identity; 98 Wealth → Responsibility.

The NPC generator includes Starforged's Disposition, First Look, and Goal with original percentile weights, plus Masks Role, Current Activity, and the 1d12 **What do they think you are?** table. The custom Consequence table rolls twice when it lands on 20, rerolling further 20s. Threat Type and the three relationship tables use playtest drafts.

## Scope

This build was checked statically and its data ranges validated; it has been run inside several Foundry installations of Masks: a New Generation, on Foundry v14. Let the table results earn any further rewriting in play.

The floating panel and sidebar access pattern follow the more mature Quiet Year v0.5.0 package Tim White built from my draft. This module is independent and does not copy Quiet Year's state, tracker, or kit setup.

## 0.2.0 changes

Adds Interlude Scene, Story Complication, Story Clue, and Combat Action from Sundered Isles pp. 228–232 with light Masks-themed substitutions within the original d100 ranges. Interlude results display their follow-up questions. Roll-twice results resolve automatically, rerolling subsequent roll-twice entries. Story Clue 91–100 automatically rolls Descriptor and Focus. These prompts supplement Masks fiction and moves by providing prompts to inspire narrative color; they do not replace the game's mechanics.

Fixed the sidebar wrapper so its margins apply, heading size reduces, and explanatory text and launch button have consistent spacing.

Validated all 19 table ranges, syntax, and special-result resolution in a Foundry environment. Tested inside several live Foundry worlds.
