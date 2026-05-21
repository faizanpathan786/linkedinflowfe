# LinkedIn Connection Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block access to Create Post when LinkedIn is not connected, showing a modal that prompts the user to connect before proceeding.

**Architecture:** A new `LinkedInGateModal` component renders as an open dialog. `CreatePost.tsx` renders it and returns early (before the form) when `linkedInStatus` is known and not connected. `Sidebar.tsx` intercepts the "Create Post" click to show the same modal without navigating.

**Tech Stack:** React 18, TypeScript, Zustand (`useLinkedInStore`), shadcn/ui Dialog, lucide-react, react-router-dom `useNavigate`

**Spec:** `docs/superpowers/specs/2026-05-22-linkedin-connection-gate-design.md`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/components/posts/LinkedInGateModal.tsx` | **Create** | Standalone modal shown when LinkedIn is not connected |
| `src/pages/CreatePost.tsx` | **Modify** | Render gate modal and return early if disconnected |
| `src/components/layout/Sidebar.tsx` | **Modify** | Intercept "Create Post" click and show gate modal if disconnected |

---

## Task 1: Create `LinkedInGateModal` component

**Files:**
- Create: `src/components/posts/LinkedInGateModal.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/posts/LinkedInGateModal.tsx` with the following content:

```tsx
import { Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LinkedInGateModalProps {
  onDismiss: () => void;
}

export function LinkedInGateModal({ onDismiss }: LinkedInGateModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md text-center"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#0a66c2]/10 flex items-center justify-center">
            <Linkedin className="h-7 w-7 text-[#0a66c2]" />
          </div>
          <div className="space-y-1.5">
            <DialogTitle className="text-xl">
              Connect LinkedIn to unlock everything
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              To create, schedule, and publish posts you need to connect your
              LinkedIn account first. It only takes a few seconds.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            className="w-full bg-[#0a66c2] hover:bg-[#004182] text-white"
            onClick={() => navigate('/dashboard/linkedin-vault')}
          >
            Connect LinkedIn
          </Button>
          <Button variant="ghost" className="w-full" onClick={onDismiss}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors related to `LinkedInGateModal.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/posts/LinkedInGateModal.tsx
git commit -m "feat: add LinkedInGateModal component"
```

---

## Task 2: Gate `CreatePost` page behind LinkedIn connection

**Files:**
- Modify: `src/pages/CreatePost.tsx`

The component already reads `linkedInStatus` from `useLinkedInStore` at line 86:
```ts
const { addPost, linkedInStatus, posts } = useLinkedInStore();
```
And already computes `isLinkedInConnected` at line 92:
```ts
const isLinkedInConnected = Boolean(linkedInStatus?.isConnected && !linkedInStatus?.isExpired);
```

- [ ] **Step 1: Add import for `LinkedInGateModal` and `useNavigate`**

`useNavigate` is already imported (line 38). Add the modal import after the existing imports block (around line 46):

```tsx
import { LinkedInGateModal } from '@/components/posts/LinkedInGateModal';
```

- [ ] **Step 2: Add gate check early in the component body**

After line 92 (where `isLinkedInConnected` is defined), add:

```tsx
const linkedInStatusKnown = linkedInStatus !== null;

if (linkedInStatusKnown && !isLinkedInConnected) {
  return <LinkedInGateModal onDismiss={() => navigate('/dashboard')} />;
}
```

This goes before any hooks that depend on form state — important: hooks must not be called conditionally in React. The existing code has many `useState`/`useForm`/`useRef` calls BEFORE line 92. The gate check must go AFTER all hooks.

**Find the correct insertion point:** All hooks (`useState`, `useForm`, `useRef`, `useMemo`, `useDropzone`) are called before the return statement. The safe place to add the gate is right before the component's `return (` at the very end of the function body, NOT before the hooks.

Locate the final `return (` in the `CreatePost` function (the big JSX block). Add the guard directly above it:

```tsx
  if (linkedInStatusKnown && !isLinkedInConnected) {
    return <LinkedInGateModal onDismiss={() => navigate('/dashboard')} />;
  }

  return (
    // ... existing JSX unchanged
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/CreatePost.tsx
git commit -m "feat: gate CreatePost page behind LinkedIn connection"
```

---

## Task 3: Intercept "Create Post" in Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

The sidebar already has `isLinkedInConnected` computed at line 58. The `NavItem` component is defined inside `Sidebar` starting at line 60.

- [ ] **Step 1: Add import for `LinkedInGateModal` and `useState`**

`useState` is not currently imported in Sidebar. Add it to the React import at the top:

The file currently starts with:
```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
```

There is no `import React` or `import { useState }` — add `useState` import:

```tsx
import { useState } from 'react';
```

Add the modal import after the existing imports:

```tsx
import { LinkedInGateModal } from '@/components/posts/LinkedInGateModal';
```

- [ ] **Step 2: Add `showGate` state inside `Sidebar` component**

Inside the `Sidebar` function body, after the existing variable declarations (after line 58 where `isLinkedInConnected` is defined), add:

```tsx
const [showGate, setShowGate] = useState(false);
const linkedInStatusKnown = linkedInStatus !== null;
```

- [ ] **Step 3: Update `NavItem` to intercept "Create Post" click**

Replace the existing `NavItem` component (lines 60-99) with:

```tsx
const NavItem = ({ item }: { item: typeof mainNav[0] }) => {
  const itemPath = item.href.split('?')[0];
  const isActive = location.pathname === itemPath;

  const handleClick = (e: React.MouseEvent) => {
    if (item.href === '/dashboard/create-post' && linkedInStatusKnown && !isLinkedInConnected) {
      e.preventDefault();
      setShowGate(true);
      return;
    }
    setIsOpen(false);
  };

  return (
    <Link
      to={item.href}
      onClick={handleClick}
      className={cn(
        'sidebar-item',
        isCollapsed && 'h-9 w-9 justify-center !px-0 !gap-0',
        isActive && 'active',
      )}
      title={isCollapsed ? item.title : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1 whitespace-nowrap overflow-hidden">{item.title}</span>
          {item.href === '/dashboard/posts' && (draftCount > 0 || scheduledCount > 0) && (
            <span className="ml-auto flex gap-0.5">
              {draftCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {draftCount}
                </span>
              )}
              {scheduledCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-[#0a66c2]">
                  {scheduledCount}
                </span>
              )}
            </span>
          )}
          {item.href === '/dashboard/linkedin-vault' && (
            <span className={cn('ml-auto h-1.5 w-1.5 rounded-full shrink-0', isLinkedInConnected ? 'bg-green-500' : 'bg-amber-400')} />
          )}
        </>
      )}
    </Link>
  );
};
```

- [ ] **Step 4: Render `LinkedInGateModal` in Sidebar JSX**

In the Sidebar's return statement, inside the outermost `<>` fragment, add the gate modal right after the opening `<>`:

```tsx
return (
  <>
    {showGate && (
      <LinkedInGateModal onDismiss={() => setShowGate(false)} />
    )}
    {/* Mobile backdrop */}
    <div ...
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: intercept Create Post nav when LinkedIn not connected"
```

---

## Task 4: Manual verification

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

Open `http://localhost:3000`

- [ ] **Step 2: Test gate when not connected**

1. Log in with a user that has no LinkedIn connected
2. Click "Create Post" in the sidebar → modal appears with "Connect LinkedIn to unlock everything"
3. The Create Post form is NOT visible behind the modal
4. Click "Maybe later" → redirected to `/dashboard`
5. Click "Connect LinkedIn" → navigated to `/dashboard/linkedin-vault`

- [ ] **Step 3: Test gate does not show when connected**

1. Log in with a user that has LinkedIn connected
2. Click "Create Post" → form renders normally, no modal

- [ ] **Step 4: Test loading state**

While `linkedInStatus` is still `null` (brief loading window on page load), the Create Post form should render normally — no flash of the gate modal.

- [ ] **Step 5: Final commit if no issues**

No additional commit needed — all changes already committed in prior tasks.
