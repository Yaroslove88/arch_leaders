# Data Files

This folder contains the static data files used by the Leadership Architect application.

## Active Files (Source of Truth)

| File | Purpose |
|------|---------|
| `quest-templates.json` | Quest templates with definitions, steps, criteria, and theory content |
| `node-descriptions.json` | Ability node descriptions, examples, and integration levels |
| `interactive-cases.json` | Interactive case studies with options and consequences |
| `builds.json` | Leadership archetypes/builds with conditions and bonuses |
| `quest-theories-mapping.json` | Mapping between quests and theory content |

## Folders

- `layouts/` - Layout configurations (empty, placeholder for future use)
- `archive/` - Archived/deprecated data files (not used by the application)

## Archive Contents

The `archive/` folder contains backup and variant files that are no longer actively used:

- `quest-templates.backup.json` - Backup of quest templates
- `quest-templates.json.backup` - Another backup of quest templates
- `quest-templates-enhanced.json` - Enhanced version (merged into main)
- `quest-templates-restructured.json` - Restructured version (merged into main)
- `node-descriptions-expanded.json` - Expanded descriptions (merged into main)

## Usage

These files are loaded by the API at runtime:

- Quest templates are loaded by `QuestGenerationService` and various scripts
- Node descriptions are loaded by `NodesService`
- Interactive cases are loaded by `CasesService`
- Builds are loaded by `BuildsService`

## Editing

When editing these files:

1. Make sure JSON is valid before saving
2. Test locally before committing
3. Create a backup only if making major structural changes
4. Remove old backups periodically to avoid confusion
