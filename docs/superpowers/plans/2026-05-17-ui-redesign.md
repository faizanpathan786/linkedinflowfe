# UI Redesign — Dark Navy Sidebar + LinkedIn Blue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all app pages to use a dark navy sidebar (`#1a1f35`), `#f0f2f5` page background, white cards, and LinkedIn blue (`#0a66c2`) accents — matching the reference design images.

**Architecture:** The app already centralises design tokens in `src/index.css` and sidebar styling in utility classes (`.sidebar-item`). The biggest visual change is the Sidebar component (light → dark) and the page background. Most other pages need only minor class-name edits since they already use `bg-card`, `border-border`, and Tailwind tokens. No business logic changes.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Vite — build with `pnpm build`, dev server with `pnpm dev`

---

## File Map

| File | Change |
|------|--------|
| `src/index.css` | CSS variables, sidebar-item utility classes, dashboard-shell background |
| `src/components/layout/Sidebar.tsx` | Dark navy bg, white text, dark user card, dark collapse button |
| `src/components/layout/Layout.tsx` | Main content area background `#f0f2f5` |
| `src/components/layout/Header.tsx` | Header bg white, button backgrounds updated |
| `src/pages/Dashboard.tsx` | Panel border-radius, chart colours (already blue) |
| `src/pages/Posts.tsx` | Tab bar active style |
| `src/pages/Analytics.tsx` | Chart colour tokens |
| `src/pages/LinkedInVault.tsx` | No glassmorphism exists — already white cards; minor polish |
| `src/pages/Automation.tsx` | Already white cards; minor polish |
| `src/pages/Settings.tsx` | Token-driven; no manual changes needed |

---

## Task 1: Update CSS Design Tokens and Sidebar Utility Classes

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Update `:root` CSS variables**

In `src/index.css`, replace the entire `:root` block (lines 7–58) with:

```css
  :root {
    /* Page & surface */
    --background: 220 14% 96%;        /* #f0f2f5 */
    --foreground: 220 13% 10%;        /* #111827 */

    --card: 0 0% 100%;
    --card-foreground: 220 13% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 13% 10%;

    /* LinkedIn blue */
    --primary: 211 90% 40%;           /* #0a66c2 */
    --primary-foreground: 0 0% 100%;

    --secondary: 220 14% 96%;
    --secondary-foreground: 220 13% 10%;
    --muted: 220 13% 94%;
    --muted-foreground: 220 9% 46%;   /* #6b7280 */
    --accent: 220 13% 94%;
    --accent-foreground: 220 13% 10%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 62% 35%;
    --success-foreground: 138 76% 97%;
    --warning: 38 92% 50%;
    --warning-foreground: 48 96% 10%;

    --border: 220 13% 91%;            /* #e5e7eb */
    --input: 220 13% 97%;
    --ring: 211 90% 40%;
    --radius: 0.75rem;                /* 12px — cleaner than 1.15rem */

    /* Status colours */
    --status-draft:     38 92% 50%;
    --status-scheduled: 217 91% 60%;
    --status-published: 142 72% 42%;
    --status-failed:    0 84% 60%;

    /* Sidebar — dark navy */
    --sidebar-bg:        231 34% 16%;   /* #1a1f35 */
    --sidebar-bg-hover:  231 34% 20%;
    --sidebar-bg-active: 211 90% 40%;   /* LinkedIn blue */
    --sidebar-border:    231 34% 22%;
    --sidebar-text:      0 0% 65%;      /* rgba(255,255,255,0.65) */
    --sidebar-text-active: 0 0% 100%;

    --shadow-xs: 0 1px 2px rgba(0,0,0,0.06);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 8px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06);
    --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
    --shadow-xl: 0 16px 48px rgba(0,0,0,0.14);
  }
```

- [ ] **Step 2: Replace the `.dark` block**

Replace the `.dark` block (lines 61–102) with a minimal copy (since the app is light-mode only, this just prevents any dark-class from changing things):

```css
  .dark {
    --background: 220 14% 96%;
    --foreground: 220 13% 10%;
    --card: 0 0% 100%;
    --card-foreground: 220 13% 10%;
    --primary: 211 90% 40%;
    --primary-foreground: 0 0% 100%;
    --border: 220 13% 91%;
    --muted-foreground: 220 9% 46%;
    --sidebar-bg: 231 34% 16%;
    --sidebar-bg-active: 211 90% 40%;
  }
```

- [ ] **Step 3: Update `html` base background**

In the `@layer base` section, change:
```css
  html {
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    background-color: #eef3f8;
  }
```
To:
```css
  html {
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    background-color: #f0f2f5;
  }
```

- [ ] **Step 4: Update `.dashboard-shell` and `.dashboard-panel`**

Find and replace:
```css
  .dashboard-shell {
    background: #f9f8f6;
  }

  .dark .dashboard-shell {
    background: #f9f8f6;
  }

  .dashboard-panel {
    @apply rounded-[1.75rem] border border-border/70 bg-card shadow-[var(--shadow-xl)] overflow-hidden;
  }
```
With:
```css
  .dashboard-shell {
    background: #f0f2f5;
  }

  .dark .dashboard-shell {
    background: #f0f2f5;
  }

  .dashboard-panel {
    @apply rounded-xl border border-border bg-card shadow-sm overflow-hidden;
  }
```

- [ ] **Step 5: Update `.sidebar-item` utility classes**

Find and replace the three sidebar-item rules:
```css
  .sidebar-item {
    @apply flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-all duration-150 cursor-pointer select-none text-[#191919] border border-transparent;
  }

  .sidebar-item:hover {
    @apply bg-gray-200/70 text-[#191919];
  }

  .sidebar-item.active {
    @apply bg-[#0a66c2] text-white border border-[#0a66c2] shadow-[0_4px_20px_rgba(10,102,194,0.24)];
  }

  .dark .sidebar-item.active {
    @apply bg-[#0a66c2] text-white border border-[#0a66c2] shadow-[0_4px_20px_rgba(10,102,194,0.24)];
  }
```
With:
```css
  .sidebar-item {
    @apply flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer select-none border border-transparent;
    color: rgba(255, 255, 255, 0.60);
  }

  .sidebar-item:hover {
    background: rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.90);
  }

  .sidebar-item.active {
    @apply bg-[#0a66c2] text-white border-transparent;
    box-shadow: 0 2px 8px rgba(10, 102, 194, 0.35);
  }

  .dark .sidebar-item.active {
    @apply bg-[#0a66c2] text-white border-transparent;
  }
```

- [ ] **Step 6: Verify build passes**

```
pnpm build
```
Expected: Build succeeds with no errors. Fix any TypeScript errors before continuing.

- [ ] **Step 7: Commit**

```
git add src/index.css
git commit -m "style: update design tokens — dark sidebar vars, f0f2f5 bg, tighter radius"
```

---

## Task 2: Rebuild the Sidebar Component (Dark Navy)

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Update the `aside` element classes**

In `Sidebar.tsx`, find the `<aside` element and replace its `className`:

```tsx
// FROM:
className={cn(
  'fixed left-0 top-0 z-50 h-full w-[280px] flex flex-col overflow-hidden lg:overflow-visible',
  'border-r border-gray-200 bg-[#f8fafb] text-gray-700',
  'lg:m-0 lg:h-screen lg:rounded-none lg:border-r lg:border-gray-200 lg:shadow-none',
  isCollapsed ? 'lg:w-[90px]' : 'lg:w-[250px]',
  'transition-[transform,width] duration-300 ease-in-out lg:sticky lg:top-0 lg:self-start lg:translate-x-0',
  isOpen ? 'translate-x-0' : '-translate-x-full',
)}

// TO:
className={cn(
  'fixed left-0 top-0 z-50 h-full w-[280px] flex flex-col overflow-hidden lg:overflow-visible',
  'border-r border-white/10 bg-[#1a1f35] text-white',
  'lg:m-0 lg:h-screen lg:rounded-none lg:shadow-xl',
  isCollapsed ? 'lg:w-[68px]' : 'lg:w-[240px]',
  'transition-[transform,width] duration-300 ease-in-out lg:sticky lg:top-0 lg:self-start lg:translate-x-0',
  isOpen ? 'translate-x-0' : '-translate-x-full',
)}
```

- [ ] **Step 2: Update the collapse toggle button**

Find the collapse toggle button and replace its className:
```tsx
// FROM:
className="hidden lg:flex absolute right-0 translate-x-1/2 top-16 z-20 h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-[0_2px_8px_rgba(0,0,0,0.10)] hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-colors"

// TO:
className="hidden lg:flex absolute right-0 translate-x-1/2 top-16 z-20 h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[#252b45] text-white/70 shadow-lg hover:bg-[#2d3450] hover:text-white transition-colors"
```

- [ ] **Step 3: Update the brand area**

Find the brand/logo button and update the logo container and text:
```tsx
// FROM:
<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-sm shrink-0">
  <Linkedin className="h-5 w-5" />
</div>
{!isCollapsed && (
  <div className="text-left leading-tight">
    <span className="block text-base font-bold text-gray-800 whitespace-nowrap">LinkedInFlow</span>
    <span className="block text-[11px] text-gray-500 whitespace-nowrap">Control center</span>
  </div>
)}

// TO:
<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0a66c2] text-white shadow-md shrink-0">
  <Linkedin className="h-5 w-5" />
</div>
{!isCollapsed && (
  <div className="text-left leading-tight">
    <span className="block text-sm font-bold text-white whitespace-nowrap">LinkedInFlow</span>
    <span className="block text-[11px] text-white/45 whitespace-nowrap">Control center</span>
  </div>
)}
```

- [ ] **Step 4: Add section labels to nav sections**

Find the nav section loop and add section labels above each section's items (currently section labels are hidden). Replace the nav `<div key={section.label}>` block:

```tsx
// FROM:
{navSections.map((section, sectionIndex) => (
  <div key={section.label}>
    {sectionIndex > 0 && (
      <div className={cn(isCollapsed ? '-mx-2 mb-2' : '-mx-3 mb-3')} />
    )}
    <div className={cn(isCollapsed ? 'flex flex-col items-center gap-2' : 'space-y-2 lg:space-y-[14px]')}>

// TO:
{navSections.map((section) => (
  <div key={section.label} className="space-y-1">
    {!isCollapsed && (
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">
        {section.label}
      </p>
    )}
    <div className={cn(isCollapsed ? 'flex flex-col items-center gap-1' : 'space-y-0.5')}>
```

- [ ] **Step 5: Update the mobile close button**

Find the mobile close button (X button inside brand row) and update:
```tsx
// FROM:
className="lg:hidden h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"

// TO:
className="lg:hidden h-8 w-8 flex items-center justify-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white"
```

- [ ] **Step 6: Update the account / user card at bottom**

Find the account section at the bottom and replace it:
```tsx
// FROM:
<div className={cn('shrink-0 space-y-1.5', isCollapsed ? 'p-2' : 'p-2 lg:p-3')}>
  <div className={cn('flex rounded-2xl border border-gray-200 bg-white', isCollapsed ? 'items-center justify-center px-2 py-3' : 'items-center gap-3 px-3 py-3')}>
    <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-[11px] font-bold text-primary ring-2 ring-primary/30">
      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
    </div>
    {!isCollapsed && (
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{user?.name || 'User'}</p>
        <p className="text-[11px] text-gray-500 truncate">{user?.email || ''}</p>
      </div>
    )}
  </div>

  <div className={cn(isCollapsed && 'flex justify-center')}>
    <button
      onClick={logout}
      className={cn('sidebar-item', isCollapsed ? 'h-10 w-10 justify-center !px-0 !gap-0' : 'w-full justify-start')}
      title="Sign out"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span className="whitespace-nowrap">Sign out</span>}
    </button>
  </div>
</div>

// TO:
<div className={cn('shrink-0 border-t border-white/10', isCollapsed ? 'p-2' : 'p-3')}>
  <div className={cn('flex rounded-xl bg-white/[0.06] border border-white/10', isCollapsed ? 'items-center justify-center p-2' : 'items-center gap-3 px-3 py-2.5 mb-1')}>
    <div className="h-8 w-8 rounded-full bg-[#0a66c2] flex items-center justify-center shrink-0 text-[11px] font-bold text-white ring-2 ring-white/10">
      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
    </div>
    {!isCollapsed && (
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
        <p className="text-[10px] text-white/45 truncate">{user?.email || ''}</p>
      </div>
    )}
  </div>

  <div className={cn(isCollapsed && 'flex justify-center mt-1')}>
    <button
      onClick={logout}
      className={cn('sidebar-item', isCollapsed ? 'h-9 w-9 justify-center !px-0 !gap-0' : 'w-full justify-start')}
      title="Sign out"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span className="whitespace-nowrap">Sign out</span>}
    </button>
  </div>
</div>
```

- [ ] **Step 7: Update the sidebar collapsed width in Layout's padding adjustment**

In `Sidebar.tsx` the collapsed width changed from `lg:w-[90px]` to `lg:w-[68px]`. Also fix the collapsed nav item sizing to match:

Find:
```tsx
isCollapsed && 'h-10 w-10 justify-center rounded-xl !px-0 !gap-0',
```
Replace with:
```tsx
isCollapsed && 'h-9 w-9 justify-center !px-0 !gap-0',
```
(This appears in both the nav Link and the logout button — update both.)

- [ ] **Step 8: Verify build passes**

```
pnpm build
```
Expected: Build succeeds. Fix any TypeScript errors before committing.

- [ ] **Step 9: Commit**

```
git add src/components/layout/Sidebar.tsx
git commit -m "style: rebuild sidebar — dark navy #1a1f35, white text, LinkedIn blue active"
```

---

## Task 3: Update Layout and Header

**Files:**
- Modify: `src/components/layout/Layout.tsx`
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Update Layout main area background**

In `src/components/layout/Layout.tsx`, find:
```tsx
<main className="flex-1 overflow-y-auto bg-[#fafafa]">
```
Replace with:
```tsx
<main className="flex-1 overflow-y-auto bg-[#f0f2f5]">
```

- [ ] **Step 2: Update Layout outer container**

Find:
```tsx
<div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-transparent transition-all duration-200 ease-in-out">
```
Replace with:
```tsx
<div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f0f2f5] transition-all duration-200 ease-in-out">
```

- [ ] **Step 3: Update Header background and border**

In `src/components/layout/Header.tsx`, find:
```tsx
<header className="sticky top-0 z-30 shrink-0 border-b border-gray-200 bg-[#f8fafb] backdrop-blur-lg transition-all duration-200 ease-in-out">
```
Replace with:
```tsx
<header className="sticky top-0 z-30 shrink-0 border-b border-gray-200 bg-white transition-all duration-200 ease-in-out">
```

- [ ] **Step 4: Update Header button backgrounds**

In `Header.tsx`, replace all occurrences of `bg-[#f8fafb]` and `hover:bg-[#f0f3f5]` in the header buttons with cleaner variants:

```tsx
// Notification button — FROM:
className="relative h-10 w-10 rounded-full border-gray-400 bg-[#f8fafb] hover:bg-[#f0f3f5]"
// TO:
className="relative h-10 w-10 rounded-full border-gray-200 bg-white hover:bg-gray-50"

// Calendar button — FROM:
className="hidden sm:inline-flex h-10 w-10 rounded-full border-gray-400 bg-[#f8fafb] hover:bg-[#f0f3f5]"
// TO:
className="hidden sm:inline-flex h-10 w-10 rounded-full border-gray-200 bg-white hover:bg-gray-50"

// Create button — FROM:
className="hidden xl:inline-flex h-10 rounded-full px-4 border-gray-400 bg-[#f8fafb] hover:bg-[#f0f3f5]"
// TO:
className="hidden xl:inline-flex h-10 rounded-full px-4 border-gray-200 bg-white hover:bg-gray-50"

// User avatar dropdown trigger — FROM:
className="hidden md:flex items-center gap-2 rounded-full border border-gray-400 bg-[#f8fafb] px-2 py-1.5 shadow-[var(--shadow-xs)] hover:bg-[#f0f3f5] transition-colors outline-none"
// TO:
className="hidden md:flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm hover:bg-gray-50 transition-colors outline-none"

// Dropdown profile card header — FROM:
<div className="bg-[#f8fafb] px-4 py-4 border-b border-border">
// TO:
<div className="bg-gray-50 px-4 py-4 border-b border-border">
```

- [ ] **Step 5: Verify build passes**

```
pnpm build
```
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```
git add src/components/layout/Layout.tsx src/components/layout/Header.tsx
git commit -m "style: update layout and header — white header, f0f2f5 main bg"
```

---

## Task 4: Update Dashboard Page

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Update MetricCard component**

Find the `MetricCard` div in Dashboard.tsx:
```tsx
className={cn(
  'rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-2',
  onClick && 'cursor-pointer hover:-translate-y-0.5 transition-transform',
)}
```
Replace with:
```tsx
className={cn(
  'rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200 space-y-2',
  onClick && 'cursor-pointer hover:-translate-y-0.5',
)}
```

- [ ] **Step 2: Update Dashboard card headers and quick-action area**

Find the top action bar:
```tsx
<div className="flex flex-wrap items-center gap-2 shrink-0">
```
Replace with:
```tsx
<div className="flex flex-wrap items-center gap-2 shrink-0 mb-1">
```

- [ ] **Step 3: Update the LinkedIn connect banner**

Find:
```tsx
<div className="rounded-xl border border-[#dce6f1] bg-gradient-to-r from-[#eef3f8] to-white p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
```
Replace with:
```tsx
<div className="rounded-xl border border-blue-200 bg-blue-50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
```

- [ ] **Step 4: Verify build passes**

```
pnpm build
```

- [ ] **Step 5: Commit**

```
git add src/pages/Dashboard.tsx
git commit -m "style: update Dashboard card sizing and banner colours"
```

---

## Task 5: Update Posts Page

**Files:**
- Modify: `src/pages/Posts.tsx`

- [ ] **Step 1: Locate and update tab active styles**

Open `src/pages/Posts.tsx`. Find any hardcoded background or tab active colours that reference old grays like `#f8fafb`, `#eef3f8`, or `bg-gray-100` on the active tab. The shadcn Tabs component uses CSS variables so it should pick up the new tokens automatically.

Check for any explicit `bg-[#f8fafb]` or similar hardcoded colours in the file:

```
# In PowerShell:
Select-String -Path "src/pages/Posts.tsx" -Pattern "f8fafb|f9f8f6|eef3f8|fafafa"
```

If found, replace with `bg-white` or `bg-gray-50` as appropriate.

- [ ] **Step 2: Verify build passes**

```
pnpm build
```

- [ ] **Step 3: Commit**

```
git add src/pages/Posts.tsx
git commit -m "style: update Posts page colour tokens"
```

---

## Task 6: Update Analytics Page

**Files:**
- Modify: `src/pages/Analytics.tsx`

- [ ] **Step 1: Search for hardcoded old background colours**

```
Select-String -Path "src/pages/Analytics.tsx" -Pattern "f8fafb|f9f8f6|eef3f8|fafafa|8fafb"
```

Replace any matches with `bg-white` or `bg-gray-50`.

- [ ] **Step 2: Verify chart colours use `hsl(var(--primary))`**

In the recharts components, confirm fill/stroke references `hsl(var(--primary))` or `#0a66c2`. If hardcoded to another colour, update to `#0a66c2`.

- [ ] **Step 3: Verify build passes**

```
pnpm build
```

- [ ] **Step 4: Commit**

```
git add src/pages/Analytics.tsx
git commit -m "style: update Analytics chart colours and bg tokens"
```

---

## Task 7: Update LinkedIn Vault and Automation Pages

**Files:**
- Modify: `src/pages/LinkedInVault.tsx`
- Modify: `src/pages/Automation.tsx`

Both pages already use white card layouts — no glassmorphism to remove. The only changes needed are any old background reference colours that no longer match.

- [ ] **Step 1: Search LinkedInVault for old bg tokens**

```
Select-String -Path "src/pages/LinkedInVault.tsx" -Pattern "f8fafb|f9f8f6|eef3f8|fafafa"
```

Replace any matches with `bg-white` or `bg-gray-50`.

- [ ] **Step 2: Search Automation for old bg tokens**

```
Select-String -Path "src/pages/Automation.tsx" -Pattern "f8fafb|f9f8f6|eef3f8|fafafa"
```

Replace any matches with `bg-white` or `bg-gray-50`.

- [ ] **Step 3: Verify build passes**

```
pnpm build
```

- [ ] **Step 4: Commit**

```
git add src/pages/LinkedInVault.tsx src/pages/Automation.tsx
git commit -m "style: clean up old bg colour tokens in Vault and Automation"
```

---

## Task 8: Update Remaining Pages

**Files:**
- Modify: `src/pages/Ideas.tsx`
- Modify: `src/pages/AIInterview.tsx`
- Modify: `src/pages/ContentCalendar.tsx`
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/WeeklyWorkflow.tsx`
- Modify: `src/pages/CreatePost.tsx`

- [ ] **Step 1: Search all remaining pages for old background tokens**

```
Select-String -Path "src/pages/Ideas.tsx","src/pages/AIInterview.tsx","src/pages/ContentCalendar.tsx","src/pages/Settings.tsx","src/pages/WeeklyWorkflow.tsx","src/pages/CreatePost.tsx" -Pattern "f8fafb|f9f8f6|eef3f8|#fafafa|bg-\[#f8"
```

- [ ] **Step 2: Replace each match**

For each file with matches, replace old gray backgrounds:
- `bg-[#f8fafb]` → `bg-white`
- `bg-[#eef3f8]` → `bg-blue-50`
- `bg-[#fafafa]` → `bg-gray-50`
- `bg-[#f9f8f6]` → `bg-gray-50`

- [ ] **Step 3: Verify build passes**

```
pnpm build
```

- [ ] **Step 4: Commit**

```
git add src/pages/Ideas.tsx src/pages/AIInterview.tsx src/pages/ContentCalendar.tsx src/pages/Settings.tsx src/pages/WeeklyWorkflow.tsx src/pages/CreatePost.tsx
git commit -m "style: clean up old bg tokens across remaining pages"
```

---

## Task 9: Final Visual Verification and Polish

- [ ] **Step 1: Start dev server**

```
pnpm dev
```

- [ ] **Step 2: Verify each page visually**

Open browser at `http://localhost:3000`. Check each route:

| Route | Expected |
|-------|----------|
| `/dashboard` | Dark navy sidebar visible; `#f0f2f5` background; white metric cards |
| `/dashboard/posts` | Same sidebar; white card with tabs |
| `/dashboard/analytics` | Charts use LinkedIn blue |
| `/dashboard/create-post` | White form card on gray bg |
| `/dashboard/ideas` | White cards on gray bg |
| `/dashboard/ai-interview` | Chat bubbles visible |
| `/dashboard/linkedin-vault` | White card layout; LinkedIn blue banner gradient kept |
| `/dashboard/automation` | White card layout; LinkedIn blue active preset |
| `/dashboard/settings` | Clean white card |
| `/dashboard/content-calendar` | Calendar card on gray bg |
| Sidebar collapsed | Icons only, dark navy, collapse button works |
| Mobile (< 1024px) | Dark overlay + dark sidebar slides in |

- [ ] **Step 3: Fix any visual regressions found during review**

For each issue found, make the targeted fix and rebuild.

- [ ] **Step 4: Final build check**

```
pnpm build
```
Expected: Build succeeds with no TypeScript errors and no warnings about missing CSS.

- [ ] **Step 5: Final commit**

```
git add -A
git commit -m "style: production UI redesign — dark navy sidebar, LinkedIn blue accent, f0f2f5 bg"
```

---

## Self-Review Checklist

- [x] Task 1 covers all CSS tokens (background, sidebar vars, sidebar-item classes)
- [x] Task 2 rebuilds Sidebar with dark navy, white text, LinkedIn blue active
- [x] Task 3 updates Layout (main bg) and Header (white bg, updated button colours)
- [x] Task 4 updates Dashboard metric cards and banners
- [x] Tasks 5–8 cover all remaining pages
- [x] Task 9 is visual verification — no code changes without cause
- [x] No TBD/TODO placeholders
- [x] All type signatures unchanged (pure styling changes)
- [x] No logic changes anywhere
