# Omni-Reviewer - design system

## Mode

**Operate.** Personal study tool. Scanability, consistency, and the late-night desk scene beat expression. No hero, bento, marquee, or three equal feature cards.

## Scene

One person at a late-night desk under a lamp. Dark chrome frames the workspace. Long-form reading (Locked In, Summary) sits on a warmer paper surface. One ink-or-amber accent marks selection and primary action. Not AI-purple. Not Inter as default display.

## Typography

| Role | Family | Notes |
| --- | --- | --- |
| UI | IBM Plex Sans | Labels, tabs, buttons, lists. Fixed rem scale. |
| Reading | Source Serif 4 | Locked In and Summary body. Measure ~65–75ch. |
| Mono | IBM Plex Mono | Code spans only. |

Scale (approx): 12 / 14 / 16 / 18 / 20 / 24 / 30. Ratio ~1.125–1.2. Tracking no tighter than -0.03em on large titles.

## Color

Dark product shell by default (`html.dark`).

| Token | Intent |
| --- | --- |
| `--background` | Deep warm charcoal desk |
| `--chrome` / header | Slightly cooler / darker frame |
| `--card` / `--surface` | Raised panels |
| `--foreground` | Soft warm off-white |
| `--muted-foreground` | Secondary labels |
| `--primary` | Lamp amber: primary actions, selected tab |
| `--reading` | Warm paper for long-form |
| `--reading-foreground` | Ink on paper |
| `--success` | Available for success states; unused for Ready (badge no longer shown) |
| `--warning` | Not yet processed |
| `--destructive` | Failed / delete |

Accent is for selection and primary CTAs only, not decoration.

## Layout

- App shell: slim top bar (wordmark + sign out), content column max ~1100px.
- Home: topic tab strip full width, then reviewer list.
- Workspace: stacked on mobile; desktop may show sources beside or above study modes. Prefer sources on top, then generate row, then study mode tabs.
- Breakpoint: single column below 768px. No horizontal overflow at 390px.
- Touch targets: primary controls ≥ 44px height on touch-sized viewports.

## Components

- **Topic tabs**: horizontal scroll if needed; selected = amber underline or filled chip.
- **Reviewer rows**: name + chevron; overflow menu rename/delete.
- **Source rows**: filename, kind icon, status badge when Failed or Not yet processed, delete. Ready sources show no status badge.
- **Badges**: Failed / Not yet processed are labeled. Ready badge is no longer shown.
- **Generate**: primary amber; first pack only. After study modes exist, hide it.
- **Redo**: outline control on the active study mode, with a one-line description of upstream. Confirm if that mode already has content. Redo Locked In rebuilds all four.
- **Study mode tabs**: Locked In · Summary · Test Me · Carded.
- **Empty states**: short title, one teaching sentence, one action when available.
- **Skeletons**: muted blocks, not centered spinners, for list loads.

## Motion

150–250ms. State only: tab switch opacity, card flip, button pending. No page-load choreography.

## Icons

`@phosphor-icons/react` only (regular weight for chrome, bold sparingly for emphasis). No Lucide in product chrome after restyle.

## Copy rules

- Product language: topic, reviewer, source, generate, redo, study mode, Locked In, Summary, Test Me, Carded.
- Controls name the action.
- Errors name the problem and recovery.
- Never use an em dash in visible UI copy. Use a period, colon, or comma.

## Anti-patterns (banned here)

- Inter as display default
- AI purple gradients
- Three equal marketing feature cards
- Hero / bento / marquee
- Em dash in UI strings
- Second icon family
- Regenerating on tab focus or page open
