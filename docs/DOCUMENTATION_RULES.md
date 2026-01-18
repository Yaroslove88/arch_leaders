# Правила создания и размещения документов

> **Дата создания:** 15.01.2025  
> **Статус:** Активные правила

**Полная версия правил:** См. `.cursorrules-documentation.md` в корне проекта

---

## 🎯 Быстрая справка

### Куда поместить документ?

**Определите тему по ключевым словам в названии:**

| Ключевые слова | Папка |
|----------------|-------|
| `QUEST`, `QUESTS` | `docs/quests/` |
| `CASE`, `CASES` | `docs/cases/` |
| `ABILITY`, `EXPERIENCE`, `NODE` | `docs/ability/` |
| `DESIGN`, `UX`, `UI`, `ARCHITECTURAL` | `docs/design-system/` |
| `AUTH`, `SECURITY`, `JWT`, `OAUTH` | `docs/authentication/` |
| `ADMIN` | `docs/admin/` |
| `AUDIT`, `CHECKLIST` | `docs/audit/` |
| `SETUP`, `INSTALL`, `QUICK_START` | `docs/setup/` |
| `API` | `docs/api/` |
| `ERROR`, `FIX`, `TROUBLESHOOTING` | `docs/troubleshooting/` |
| `CONTENT`, `PROMPTS` | `docs/content/` |
| `USER_FLOW`, `ONBOARDING` | `docs/user-flow/` |
| **Не определено** | `docs/` |

---

## 📝 Формат названия файла

```
<TЕМА>_<ПОДТЕМА>_<СТАТУС>.md
```

**Примеры:**
- ✅ `QUEST_SYSTEM_COMPLETE.md`
- ✅ `CASES_UX_UI_SPECIFICATION.md`
- ✅ `ERROR_HANDLING_GUIDE.md`
- ❌ `quest-system.md` (неправильно)
- ❌ `New Document.md` (неправильно)

---

## ✅ Чеклист

- [ ] Название файла в UPPERCASE с подчеркиваниями
- [ ] Название содержит ключевые слова из таблицы
- [ ] Файл создан в правильной папке `docs/<тема>/`
- [ ] Если тема не определена → создан в `docs/`

---

**Подробные правила:** См. `.cursorrules-documentation.md` в корне проекта
