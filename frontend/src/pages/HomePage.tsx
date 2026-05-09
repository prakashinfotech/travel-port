import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane, Hotel, Search, Shield, Clock, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Tab = 'flights' | 'hotels'

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('flights')
  const navigate = useNavigate()

  // Flight search state
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departureDate, setDepartureDate] = useState('')

  // Hotel search state
  const [city, setCity] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')

  const handleFlightSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({ origin, destination, departureDate })
    navigate(`/flights?${params}`)
  }

  const handleHotelSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({ city, checkIn, checkOut })
    navigate(`/hotels?${params}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 to-primary-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Your Journey Starts Here
            </h1>
            <p className="mt-3 text-lg text-primary-200">
              Search flights & hotels at unbeatable prices
            </p>
          </div>

          {/* Search card */}
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-xl text-gray-900">
            {/* Tabs */}
            <div className="mb-5 flex gap-2">
              {(['flights', 'hotels'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize',
                    tab === t
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100',
                  ].join(' ')}
                >
                  {t === 'flights' ? <Plane className="h-4 w-4" /> : <Hotel className="h-4 w-4" />}
                  {t}
                </button>
              ))}
            </div>

            {tab === 'flights' ? (
              <form onSubmit={handleFlightSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <Input placeholder="From (e.g. DEL)" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                <Input placeholder="To (e.g. BOM)" value={destination} onChange={(e) => setDestination(e.target.value)} />
                <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
                <Button type="submit" className="h-10">
                  <Search className="h-4 w-4" /> Search
                </Button>
              </form>
            ) : (
              <form onSubmit={handleHotelSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <Input placeholder="City (e.g. Mumbai)" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input type="date" placeholder="Check-in" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                <Input type="date" placeholder="Check-out" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                <Button type="submit" className="h-10">
                  <Search className="h-4 w-4" /> Search
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">Why TravelPort?</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { icon: Tag,    title: 'Best Prices',     desc: 'Compare hundreds of airlines & hotels to get the lowest fare.' },
            { icon: Shield, title: 'Secure Booking',  desc: 'Your payments and personal data are fully encrypted and safe.' },
            { icon: Clock,  title: '24/7 Support',    desc: 'Round-the-clock customer support for all your travel needs.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <Icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
