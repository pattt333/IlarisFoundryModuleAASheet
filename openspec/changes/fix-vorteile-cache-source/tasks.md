## 1. Update Data Source

- [x] 1.1 Replace `game.packs.get('Ilaris.vorteile')` with Ilaris system setting — DONE, reads `game.settings.get('Ilaris', 'vorteilePacks')` JSON, iterates all configured packs
- [x] 1.2 Update category filtering — DONE, same category filter, now per-pack
- [x] 1.3 Verify cache format — CONFIRMED, same JSON structure `{category: [names]}`
