# Skill: Generate UI Component

**Slash command:** `/generate-ui`
**Category:** Frontend Development
**Stack:** React 18 · TypeScript · Tailwind CSS · Redux Toolkit

---

## Purpose

Generates a complete React component or page for TravelPort following all frontend conventions — including loading/error states, Zod validation, service integration, and routing.

---

## When to Use

- Adding a new page (e.g. "create a wallet top-up page")
- Building a new reusable component (e.g. "create a price range slider filter")
- Adding a new feature UI (e.g. "create a coupon input with validation and preview")

---

## Usage

```
/generate-ui <description of component or page>
```

**Examples:**
```
/generate-ui wallet top-up page with amount input and confirmation
/generate-ui reusable StarRating component with half-star support
/generate-ui admin users list page with search and deactivate action
```

---

## What Gets Generated

| Artifact | Location |
|----------|----------|
| Page component | `frontend/src/pages/<Name>Page.tsx` |
| Reusable component | `frontend/src/components/<domain>/<Name>.tsx` |
| New TypeScript types | Added to `frontend/src/types/index.ts` |
| New service method | Added to `frontend/src/services/<name>Service.ts` |
| Route entry | Added to `frontend/src/routes/AppRouter.tsx` |

---

## Project Conventions Applied

- Tailwind CSS only — no custom CSS
- `primary-600` for primary actions, `brand-orange` for CTAs
- Loading: `<Skeleton />` or `<FullPageSpinner />` while fetching
- Error: inline `bg-red-50 border-red-200` error div
- Forms: `react-hook-form` + `zodResolver` — no manual validation
- Icons: `lucide-react` only
- Path alias: `@/` for `src/`
- Pages: `default export`, lazy-loaded via `AppRouter`
- No inline comments unless explaining a constraint

---

## Example Output

**Prompt:** `/generate-ui wallet top-up page`

```tsx
// src/pages/WalletTopUpPage.tsx
export default function WalletTopUpPage() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ amount }: FormValues) => {
    setSubmitting(true)
    try {
      await userService.topUpWallet(amount)
      navigate('/profile')
    } catch {
      setError('Top-up failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Money to Wallet</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl bg-white border p-6 shadow-sm flex flex-col gap-4">
        <Input label="Amount (₹)" type="number" error={errors.amount?.message} {...register('amount', { valueAsNumber: true })} />
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Button type="submit" loading={submitting}>Add Money</Button>
      </form>
    </div>
  )
}
```
