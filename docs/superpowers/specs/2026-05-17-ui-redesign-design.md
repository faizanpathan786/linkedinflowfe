# LinkedInFlow UI Redesign — Design Spec
**Date:** 2026-05-17  
**Scope:** Full app redesign (all pages)  
**Theme:** Dark navy sidebar + LinkedIn blue accent + light gray background, light mode only

---

## 1. Design System Tokens

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#f0f2f5` | Page background |
| `--card` | `#ffffff` | Card / panel background |
| `--sidebar-bg` | `#1a1f35` | Sidebar background |
| `--sidebar-active` | `#0a66c2` | Active nav item pill |
| `--sidebar-text` | `rgba(255,255,255,0.65)` | Inactive nav text |
| `--sidebar-text-active` | `#ffffff` | Active nav text |
| `--primary` | `#0a66c2` | LinkedIn blue — buttons, links, active states |
| `--primary-hover` | `#0958a8` | Button hover |
| `--border` | `#e5e7eb` | Card borders |
| `--muted-foreground` | `#6b7280` | Subtext |
| `--foreground` | `#111827` | Primary text |

### Typography
- Font: **Plus Jakarta Sans** (already loaded)  
- Page title: `text-xl font-semibold text-gray-900`  
- Card title: `text-sm font-semibold text-gray-900`  
- Body: `text-sm text-gray-700`  
- Subtext / labels: `text-xs text-gray-500`

### Spacing & Radius
- Card radius: `rounded-xl` (12px)  
- Nav item radius: `rounded-lg` (8px)  
- Button radius: `rounded-lg`  
- Card padding: `p-5`  
- Page content padding: `p-6`  
- Gap between cards: `gap-4`

### Shadows
- Card: `shadow-sm` (`0 1px 3px rgba(0,0,0,0.08)`)  
- Sidebar: `shadow-xl` (right edge separation from content)

---

## 2. Sidebar Redesign

**Structure (top → bottom):**
1. Brand logo area — `LinkedInFlow` wordmark + LinkedIn icon on dark bg
2. Nav sections: Workspace / Insights / System (section labels in small caps, muted)
3. Active item: solid LinkedIn blue pill background, white text + icon
4. Inactive item: muted white/gray text, no background
5. Bottom: user avatar card (dark inner card), sign out button

**Dimensions:**
- Expanded: `w-[240px]`
- Collapsed: `w-[68px]` (icons only)
- Collapse toggle: floating circle button on right edge at y=64px

**Colors:**
- Background: `#1a1f35`
- Section labels: `rgba(255,255,255,0.35)` uppercase tracking-wider text-[10px]
- Hover item: `rgba(255,255,255,0.07)` background
- Active item: `#0a66c2` background, white text
- Bottom user card background: `rgba(255,255,255,0.06)` with `border border-white/10`

---

## 3. Layout

**Layout component changes:**
- Main content area background: `#f0f2f5`
- Top bar (mobile): dark background matching sidebar, hamburger icon white
- Page padding: `p-5 md:p-6`
- Remove any existing glassmorphism or gradient backgrounds from the Layout wrapper

---

## 4. Dashboard Page

**Metric cards (4 across):**  
- White card, `rounded-xl border border-gray-200 shadow-sm p-5`
- Icon in LinkedIn-blue circle (`bg-blue-50` + `text-[#0a66c2]`)
- Value: `text-2xl font-bold text-gray-900`
- Subtitle: `text-xs text-gray-500`
- Clickable → navigate to relevant tab

**Publishing activity chart:**  
- White card, LinkedIn blue area chart
- Gradient fill: `#0a66c2` → transparent

**Recent posts list:**  
- White card, rows with status dot + content + badge
- Status badges: green/amber/blue/red pills

**Workflow health:**  
- White card, conic-gradient ring in LinkedIn blue
- 3 mini-stat boxes below

**Right column cards:**  
- Daily prompt card: light blue tint (`bg-blue-50 border border-blue-100`)
- Upcoming queue: white card, scheduled items in bordered rows

---

## 5. All Other Pages

### Posts
- Tab bar styled with `border-b border-gray-200`, active tab LinkedIn blue underline
- Table rows: white bg, `divide-y divide-gray-100`
- Action buttons: outline style with hover blue

### Analytics
- White cards, all charts use LinkedIn blue palette
- No glassmorphism

### CreatePost
- White card form, clean input fields
- LinkedIn Preview in a white bordered card

### Ideas
- White card per idea, tag pills colored
- Quick capture button: LinkedIn blue

### AI Interview
- White card chat interface
- User message: LinkedIn blue bg; assistant: `bg-gray-100`

### Content Calendar (Planner)
- White card grid, published: green dot, scheduled: blue dot, draft: amber dot

### LinkedIn Vault
- **Remove glassmorphism** — replace with standard white card layout
- Connected status: green badge; disconnected: amber badge
- LinkedIn blue connect button

### Automation
- **Remove glassmorphism** — replace with white card layout
- Toggle switches: LinkedIn blue when active
- Section headers: standard card headers

### Settings
- Tabbed white card layout (no changes needed beyond token updates)

### Landing page
- Not redesigned (public-facing, separate design)

---

## 6. Files to Change

| File | Change |
|------|--------|
| `src/index.css` | Update all CSS tokens, sidebar variables, utility classes |
| `src/components/layout/Sidebar.tsx` | Full rebuild — dark nav, new structure |
| `src/components/layout/Layout.tsx` | Background, padding, mobile bar |
| `src/pages/Dashboard.tsx` | Card styling, chart colors |
| `src/pages/Posts.tsx` | Tab bar, table styling |
| `src/pages/Analytics.tsx` | Chart colors, card styling |
| `src/pages/CreatePost.tsx` | Form card styling |
| `src/pages/Ideas.tsx` | Card styling |
| `src/pages/AIInterview.tsx` | Chat bubble colors |
| `src/pages/ContentCalendar.tsx` | Calendar card styling |
| `src/pages/LinkedInVault.tsx` | Remove glassmorphism → white cards |
| `src/pages/Automation.tsx` | Remove glassmorphism → white cards |
| `src/pages/Settings.tsx` | Token-driven (minimal changes) |
| `src/pages/WeeklyWorkflow.tsx` | Token-driven (minimal changes) |
| `src/pages/BatchProcessing.tsx` | Token-driven (minimal changes) |
| `src/components/layout/Navbar.tsx` | Mobile top bar — dark bg matching sidebar |

---

## 7. What's NOT Changing

- All business logic, API calls, state management
- Component library (shadcn/ui) — only visual tokens change
- Route structure, navigation items
- Landing page
- Auth pages (Login, Signup, ForgotPassword)

---

## 8. Success Criteria

- Sidebar is dark navy with LinkedIn blue active state
- All pages use `#f0f2f5` background and white cards
- No glassmorphism anywhere in the app
- LinkedIn Vault and Automation match the same card style as Dashboard
- Charts consistently use LinkedIn blue
- Responsive: sidebar collapses correctly on mobile/desktop
- No TypeScript errors, builds cleanly
