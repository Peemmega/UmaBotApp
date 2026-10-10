# Tracen Academy UI

The academy portal uses large illustrated sections, generous headings, white surfaces,
and a shared accent palette. The supplied `Home_Image.webp` remains the full width
home hero. Desktop image positioning stays at `center 10%`.

## Foundations

- `src/styles/academyUi.css` is loaded last by `main.jsx`. It owns the shared theme,
  navigation, page hierarchy, cards, controls, dialog appearance, and responsive rules.
- Use `--uma-primary`, `--uma-primary-dark`, `--uma-bg`, `--uma-bg-soft`,
  `--uma-surface`, `--uma-ink`, `--uma-muted`, `--uma-border`, and the radius/space tokens.
  Keep status colors for success, errors, rarity, and game state separate from role colors.
- Trainees use green, trainers use purple, NPCs use slate. `AppShell` publishes the active
  role to `body[data-profile-theme]` so portals inherit the same theme. A dialog may pass
  `profileType` to show another player's role.
- The topbar contains the brand/actions followed by the horizontal game navigation.
  `ResizeObserver` measures it so content does not overlap wrapped navigation.
  Mobile navigation wraps with four slots per row.

## Page building blocks

```jsx
import { GameCard, SectionHeader, Button, Reveal, Dialog } from "./components/ui";

<GameCard as="header">
  <SectionHeader kicker="Campus bulletin" title="ข่าวสาร & กิจกรรม" />
</GameCard>

<Reveal as="section">
  <Button onClick={openEditor}>เพิ่มรายการ</Button>
</Reveal>

<Dialog open={editing} onClose={closeEditor} title="แก้ไขรายการ" closeDisabled={saving}>
  <div className="editor-body">{/* feature form */}</div>
</Dialog>
```

`GameCard` reveals on first viewport entry by default. Set `reveal={false}` for live
game controls or a surface whose motion is managed elsewhere. `Reveal` supports div,
section, article, header, aside, main, nav, footer, li, and button. Use
`StaggerContainer` / `StaggerItem` for lists: each item reveals once when it enters
the viewport, with short capped delays. Avoid wrapping live tracks or timing gauges
in repeated reveal animations. `MotionConfig` and the CSS reduced-motion rules
respect the user's operating system preference.

## Dialog lifecycle

`Dialog` portals to `document.body` and supplies a labelled surface, close control,
backdrop, and optional heading. `labelledBy` can point to a heading in custom content.
When a dialog has no visible heading, supply `label`. Keep its busy state in the
feature and pass `closeDisabled` while dismissal must be blocked.

`useUiDialogs` runs once in `App` and manages the latest opened dialog's focus,
Tab cycling, Escape through its enabled close control, layer order, and focus return.
`useModalScrollLock` locks the page while any registered backdrop remains, then
restores the previous scroll position. Nested dialogs keep the page locked.
Opening the registration confirmation still uses the existing `uma:close-overlays`
event to close the other feature overlays.

Existing feature dialogs are adapted through `src/design/uiConfig.js` so their
forms and API operations stay in their feature components. New dialogs should use
`Dialog`. For a legacy dialog, register its surface/backdrop selectors and mark its
dismissal button `data-dialog-close`. Never mark a destructive business action as a
close control. Dialog styles must use `--ui-dialog-layer` rather than fixed z-indexes.

## Content contracts

- Home shows up to six ongoing/upcoming events and races, three columns on desktop
  and two on mobile. It has no internal scrolling frame or numbered event index.
- The News page keeps the complete month list, including events and races.
- The external documentation item continues opening the supplied Google Doc in a new tab.
- Shared styling does not change registration, mailbox, loadout, race, or TCG API contracts.

## Checks

Run `npm run build` before release. Review home, profiles for each role, character and
skill filters, race details, news months, calculators, dialogs, and keyboard navigation
at desktop/tablet/mobile widths. Verify first-entry reveals, reduced motion, busy
dismissal guards, nested focus return, and restored page scroll in a browser.
