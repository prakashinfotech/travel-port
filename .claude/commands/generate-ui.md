---
description: Generate a React + TypeScript component or page for TravelPort following project conventions
---

You are working on the **TravelPort** React 18 + TypeScript + Vite frontend.

## Project conventions
- **Styling:** Tailwind CSS v3 — use project palette: `primary-600` (blue), `brand-orange` (CTA)
- **State:** Redux Toolkit for global auth state; local `useState`/`useEffect` for page data
- **Forms:** `react-hook-form` + `zod` schema validation — always use `zodResolver`
- **API calls:** use service functions from `src/services/` which wrap the typed `api` Axios instance
- **Icons:** `lucide-react` only
- **Routing:** `react-router-dom` v6 — use `useNavigate`, `useParams`, `useSearchParams`
- **Types:** all API types in `src/types/index.ts`
- **Error display:** inline `bg-red-50 border border-red-200` div for API errors
- **Loading:** use `<Skeleton />` or `<Spinner />` from `src/components/ui/`
- **Path alias:** use `@/` for `src/`
- **No comments** unless explaining a non-obvious invariant

## Component structure rules
- Pages go in `src/pages/` and are default exports (lazy-loaded via `AppRouter`)
- Reusable components go in `src/components/ui/` or `src/components/<domain>/`
- Use `forwardRef` for form input components
- Protected pages wrap with `<PrivateRoute>` in the router

## Task
Generate: **$ARGUMENTS**

Produce:
1. The component/page file with full path from `frontend/src/`
2. Any new types needed (add to `src/types/index.ts`)
3. Any new service method needed (add to the relevant `src/services/*.ts`)
4. The route entry to add in `src/routes/AppRouter.tsx` (if it's a page)
