# Specialist App — Progress Log

---

## 2026-06-18 — Branch `feat/theme_fixed` Review & Fix

### Branch
`feat/theme_fixed` → `https://github.com/AfriDamAI/specialist/tree/feat/theme_fixed`

### What the branch does
- WhatsApp-style mobile chat layout (patient list hides when a chat is open, back button to return)
- Dashboard theming via CSS custom properties (`--dashboard-*` variables in `globals.css`)
- FOUC fix: `<Script strategy="beforeInteractive">` in `layout.tsx` applies saved theme before paint
- Removes global `<Toaster>` from layout (correctly relies on the one in `NotificationContext`)
- Removes auto-select of first chat so mobile users see the list by default
- `StatCard` simplified — removed unused `color`/`isDark` props
- Various responsive layout fixes across chat, dashboard, settings, wallet pages

### Build result
✅ Passes cleanly — 21 routes, 0 TypeScript errors, 0 compile errors.

### Fixes applied in review (commit `522f51d`)

| File | Issue | Fix |
|------|-------|-----|
| `app/chat/components/ConversationView.tsx` | Date separators (Today/Yesterday/date) completely removed — messages from different days showed as one stream | Restored date separator logic |
| `app/chat/components/ConversationView.tsx` | `isSending` dropped from `MessageInput` disabled prop — rapid clicks caused duplicate sends | Restored `disabled={sessionEnded \|\| !!isSending}` |
| `app/chat/components/ConversationView.tsx` | Scroll `useEffect` dep `[messages, isSending]` fired premature scroll before message landed | Changed to `[messages]` only |
| `app/chat/components/ConversationView.tsx` | Session-ended banner removed — closed sessions had no visual feedback | Restored "session has ended" notice above input |
| `context/ThemeContext.tsx` | `getInitialTheme` function defined but never called (dead code) | Deleted |

### Slow loading root cause (pre-existing, not introduced by this branch)

Two compounding issues cause slow perceived loading on every navigation:

1. **`components/DashboardLayout.tsx`** — calls `/specialists/me` on every mount. Since `DashboardLayout` wraps every authenticated page, this fires on every route change, not just login.
2. **`context/NotificationContext.tsx`** — `fetchNotifications` has `pathname` in its dep array, so it re-fetches the full notification list on every route change.

**Recommended fix:** Cache the profile in state at the layout level and only re-fetch if data is stale (>5 min). Remove `pathname` from `fetchNotifications`'s dependency array and trigger it manually on mount instead.

### Mergeability
Branch is mergeable. All regressions fixed, build clean, pushed to `origin/feat/theme_fixed`.
