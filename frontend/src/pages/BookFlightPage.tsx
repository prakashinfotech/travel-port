import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plane, Tag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { FlightDto } from '@/types'
import { flightService } from '@/services/flightService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDuration } from '@/utils/formatters'

const schema = z.object({
  passengers: z.number().min(1).max(9),
  couponCode: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function BookFlightPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [flight,    setFlight]    = useState<FlightDto | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [submitting,setSubmitting]= useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { passengers: 1 },
  })
  const passengers = watch('passengers') || 1

  useEffect(() => {
    if (!id) return
    flightService.getById(id)
      .then(r => setFlight(r.data))
      .catch(() => setError('Flight not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const onSubmit = async (values: FormValues) => {
    if (!flight) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await flightService.book({
        flightId: flight.id,
        passengers: values.passengers,
        couponCode: values.couponCode || undefined,
      })
      navigate(`/bookings/${res.data.id}?new=true`)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Booking failed. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="mx-auto max-w-2xl px-4 py-10 flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  )

  if (!flight) return (
    <div className="flex items-center justify-center min-h-[50vh] text-gray-400">{error ?? 'Flight not found'}</div>
  )

  const dep = new Date(flight.departureTime)
  const arr = new Date(flight.arrivalTime)
  const fmt = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const totalPrice = flight.price * passengers

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Confirm Flight Booking</h1>

      {/* Flight summary */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Plane className="h-5 w-5 text-primary-600" />
          <span className="font-semibold text-gray-800">{flight.airline} — {flight.flightNumber}</span>
          <span className="text-sm text-gray-400">({flight.cabinClass})</span>
        </div>
        <div className="flex items-center justify-between text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">{fmt(dep)}</p>
            <p className="text-lg font-medium text-gray-600">{flight.origin}</p>
          </div>
          <div className="text-gray-400 text-sm">
            <p>{formatDuration(flight.durationMinutes)}</p>
            <div className="h-px w-24 bg-gray-200 my-1" />
            <p>Non-stop</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{fmt(arr)}</p>
            <p className="text-lg font-medium text-gray-600">{flight.destination}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500">
          <span>Price per passenger</span>
          <span className="font-semibold text-gray-800">{formatCurrency(flight.price)}</span>
        </div>
      </div>

      {/* Booking form */}
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
        <h2 className="font-semibold text-gray-800">Booking Details</h2>

        <Input
          label="Number of Passengers"
          type="number"
          min={1}
          max={Math.min(9, flight.availableSeats)}
          error={errors.passengers?.message}
          {...register('passengers', { valueAsNumber: true })}
        />

        <div className="relative">
          <Input
            label="Coupon Code (optional)"
            placeholder="e.g. SAVE10"
            error={errors.couponCode?.message}
            {...register('couponCode')}
          />
          <Tag className="absolute right-3 top-8 h-4 w-4 text-gray-400" />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-lg bg-primary-50 p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">{passengers} passenger{passengers > 1 ? 's' : ''} × {formatCurrency(flight.price)}</p>
            <p className="text-2xl font-bold text-primary-700 mt-0.5">{formatCurrency(totalPrice)}</p>
          </div>
          <Button type="submit" size="lg" loading={submitting}>
            Confirm Booking
          </Button>
        </div>
      </form>
    </div>
  )
}
