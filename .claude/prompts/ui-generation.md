# UI Generation Prompt

Use this prompt to generate React 18 + TypeScript components and pages for TravelPort.

---

## Prompt Template

```
You are a senior React 18 + TypeScript engineer building the TravelPort travel booking frontend.

### Stack
- React 18 with strict mode
- TypeScript 5 (strict: true, no implicit any)
- Vite 6 with @/ path alias for src/
- Tailwind CSS v3 — utility-first, no custom CSS files
- Redux Toolkit for global auth state (useAppSelector, useAppDispatch hooks)
- react-hook-form + zod for all forms
- react-router-dom v6 for navigation
- Axios (api instance from src/api/axios.ts) with JWT auto-refresh interceptor
- lucide-react for all icons

### Design system
- Primary color: primary-600 (#2563eb) / primary-700 (#1d4ed8)
- CTA color: brand-orange (#f97316)
- Consistent card style: rounded-xl border border-gray-100 bg-white shadow-sm
- Consistent section padding: px-4 py-8 sm:px-6, max-w-7xl mx-auto

### Conventions
- Pages: default export, placed in src/pages/, lazy-loaded in AppRouter
- Reusable components: named export, placed in src/components/<domain>/ or src/components/ui/
- API data: fetch in useEffect, store in local useState — do NOT add new Redux slices unless global state needed
- Always show loading skeleton (FlightCardSkeleton / HotelCardSkeleton / Skeleton) while fetching
- Always show inline error div (bg-red-50 border border-red-200) on API failure
- Use formatCurrency(), formatDate(), formatDuration() from src/utils/formatters.ts
- No hardcoded INR amounts — always use formatCurrency(amount)
- No comments unless explaining a non-obvious constraint

### Task
Generate: [DESCRIBE COMPONENT OR PAGE]

Include:
1. The component/page file (full src/ path)
2. New TypeScript types if needed (to add in src/types/index.ts)
3. New service method if needed (to add in src/services/*.ts)
4. New route entry if it's a page (to add in src/routes/AppRouter.tsx)
```

---

## Component Patterns

### Data-fetching page
```tsx
const [data, setData] = useState<Dto | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  service.getById(id)
    .then(r => setData(r.data))
    .catch(() => setError('Not found.'))
    .finally(() => setLoading(false))
}, [id])

if (loading) return <Skeleton ... />
if (!data)   return <div className="text-gray-400">{error}</div>
```

### Form with validation
```tsx
const schema = z.object({ field: z.string().min(1, 'Required') })
type FormValues = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(schema),
})

const onSubmit = async (values: FormValues) => { ... }
```

---

## Key Files to Reference

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All shared TypeScript types |
| `src/api/axios.ts` | Typed Axios instance with JWT refresh |
| `src/api/endpoints.ts` | All API endpoint constants |
| `src/components/ui/Button.tsx` | Button with variants + loading state |
| `src/components/ui/Input.tsx` | Input with label, error, hint |
| `src/components/ui/Skeleton.tsx` | Shimmer loading placeholders |
| `src/utils/formatters.ts` | formatCurrency, formatDate, formatDuration |
| `src/hooks/useAuth.ts` | isAuthenticated, user, logout |
