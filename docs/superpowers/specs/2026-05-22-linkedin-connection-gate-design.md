# LinkedIn Connection Gate — Design Spec

**Date:** 2026-05-22  
**Status:** Approved

## Problem

Users can navigate to Create Post and attempt to publish/schedule posts without having connected their LinkedIn account. This leads to confusing API errors at submission time. The gate should be shown proactively — before they invest time writing content.

## Goal

Block access to the Create Post page entirely when LinkedIn is not connected. Show a clear, friendly modal that explains what's locked and gives a direct path to connect.

## Scope

**In scope:**
- Gate the `/dashboard/create-post` page behind LinkedIn connection status
- Intercept "Create Post" sidebar click when disconnected
- `LinkedInGateModal` — reusable modal component

**Out of scope:**
- Gating the "Publish Now" button on the Posts page
- Gating Analytics, Ideas, AI Interview, or any other page
- Gating drafts separately from live-publish (entire page is gated)

## Connection State

`isLinkedInConnected` is already computed in the codebase as:

```ts
const isLinkedInConnected = Boolean(linkedInStatus?.isConnected && !linkedInStatus?.isExpired);
```

`linkedInStatus` is populated from `useLinkedInStore`. It is fetched on app mount via `fetchStatus()` in `App.tsx`. While fetching, `linkedInStatus` is `null` — the gate must not trigger while status is still loading (treat `null` as "unknown / loading").

## Components

### `LinkedInGateModal` (`src/components/posts/LinkedInGateModal.tsx`)

A shadcn `Dialog` that is always open when rendered (no internal open state — caller decides when to render it).

Props:
```ts
interface LinkedInGateModalProps {
  onDismiss: () => void; // called when user clicks "Maybe later"
}
```

Content:
- **Icon:** LinkedIn logo (`Linkedin` from lucide-react) in a blue rounded container
- **Headline:** "Connect LinkedIn to unlock everything"
- **Body:** "To create, schedule, and publish posts you need to connect your LinkedIn account first. It only takes a few seconds."
- **Primary CTA:** "Connect LinkedIn" → navigate to `/dashboard/linkedin-vault`
- **Secondary:** "Maybe later" → calls `onDismiss()`

The dialog must **not** be closeable by clicking the overlay (no close-on-outside-click). The only exit is via the two buttons.

### Changes to `CreatePost.tsx`

At the top of the `CreatePost` component body, after reading `linkedInStatus` from the store:

```ts
const isLinkedInConnected = Boolean(linkedInStatus?.isConnected && !linkedInStatus?.isExpired);
const linkedInStatusKnown = linkedInStatus !== null;
```

If `linkedInStatusKnown && !isLinkedInConnected`: render `<LinkedInGateModal onDismiss={() => navigate('/dashboard')} />` and return early (do not render the form at all).

### Changes to `Sidebar.tsx`

The sidebar has a `NavItem` component for each link. For the "Create Post" item specifically:

- Track a local boolean state `showGate` in `Sidebar`
- Override the `Create Post` link's `onClick`: if `!isLinkedInConnected && linkedInStatusKnown`, call `e.preventDefault()`, set `showGate = true`
- Render `<LinkedInGateModal onDismiss={() => setShowGate(false)} />` when `showGate` is true
- Modal's "Connect LinkedIn" CTA navigates to `/dashboard/linkedin-vault` and dismisses

## Data Flow

```
App.tsx → fetchStatus() on mount
          ↓
useLinkedInStore.linkedInStatus (null → { isConnected, isExpired, ... })
          ↓
CreatePost.tsx reads linkedInStatus
  → if known + not connected → render LinkedInGateModal
  → if connected → render normal form

Sidebar.tsx reads linkedInStatus
  → Create Post onClick → if known + not connected → showGate = true
```

## Error Handling

- While `linkedInStatus === null` (still loading): do not show the gate. Render the page normally or a loading state. This prevents a flash of the gate on fast connections.
- If `linkedInStatus` becomes connected after mount (user connects in another tab): the gate dismisses automatically because `isLinkedInConnected` becomes true.

## Testing

Manual test plan:
1. Log in with no LinkedIn connected → click "Create Post" in sidebar → gate modal appears, page does not render
2. Click "Maybe later" → redirected to Dashboard
3. Click "Connect LinkedIn" → navigated to LinkedIn Vault
4. Connect LinkedIn → return to Create Post → form renders normally
5. Log in with LinkedIn connected → Create Post works immediately, no gate
