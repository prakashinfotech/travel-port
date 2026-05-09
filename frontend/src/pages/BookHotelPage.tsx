import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Hotel, Calendar, Tag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { HotelDto, HotelRoomDto } from '@/types'
import { hotelService } from '@/services/hotelService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDate } from '@/utils/formatters'

const schema = z.object({
  couponCode: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function BookHotelPage() {
  const { id, roomId } = useParams<{ id: string; roomId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const checkIn  = searchParams.get('checkIn')  ?? ''
  const checkOut = searchParams.get('checkOut') ?? ''
  const nights   = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1

  const [hotel,     setHotel]     = useState<HotelDto | null>(null)
  const [room,      setRoom]      = useState<HotelRoomDto | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [submitting,setSubmitting]= useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!id) return
    hotelService.getById(id)
      .then(r => {
        setHotel(r.data)
        const found = r.data.rooms.find(r => r.id === roomId)
        setRoom(found ?? null)
      })
      .catch(() => setError('Hotel not found.'))
      .finally(() => setLoading(false))
  }, [id, roomId])

  const onSubmit = async (values: FormValues) => {
    if (!room) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await hotelService.book({
        hotelRoomId: room.id,
        checkIn,
        checkOut,
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
      <Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full rounded-xl" />
    </div>
  )

  if (!hotel || !room) return (
    <div className="flex items-center justify-center min-h-[50vh] text-gray-400">{error ?? 'Room not found'}</div>
  )

  const total = room.pricePerNight * nights

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Confirm Hotel Booking</h1>

      {/* Summary */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Hotel className="h-5 w-5 text-primary-600" />
          <span className="font-semibold text-gray-800">{hotel.name}</span>
        </div>
        <p className="text-lg font-medium text-gray-700">{room.roomType}</p>
        <div className="mt-3 flex gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(checkIn)} → {formatDate(checkOut)}</span>
          <span>{nights} night{nights > 1 ? 's' : ''}</span>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500">
          <span>{formatCurrency(room.pricePerNight)} × {nights} nights</span>
          <span className="font-semibold text-gray-800">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
        <h2 className="font-semibold text-gray-800">Booking Details</h2>
        <div className="relative">
          <Input
            label="Coupon Code (optional)"
            placeholder="e.g. HOTEL20"
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
            <p className="text-sm text-gray-600">Total amount</p>
            <p className="text-2xl font-bold text-primary-700">{formatCurrency(total)}</p>
          </div>
          <Button type="submit" size="lg" loading={submitting}>
            Confirm Booking
          </Button>
        </div>
      </form>
    </div>
  )
}
