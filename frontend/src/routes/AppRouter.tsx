import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { PrivateRoute } from './PrivateRoute'
import { FullPageSpinner } from '@/components/ui/Spinner'

const HomePage          = lazy(() => import('@/pages/HomePage'))
const LoginPage         = lazy(() => import('@/pages/LoginPage'))
const RegisterPage      = lazy(() => import('@/pages/RegisterPage'))
const NotFoundPage      = lazy(() => import('@/pages/NotFoundPage'))

const FlightsPage       = lazy(() => import('@/pages/FlightsPage'))
const BookFlightPage    = lazy(() => import('@/pages/BookFlightPage'))

const HotelsPage        = lazy(() => import('@/pages/HotelsPage'))
const HotelDetailPage   = lazy(() => import('@/pages/HotelDetailPage'))
const BookHotelPage     = lazy(() => import('@/pages/BookHotelPage'))

const BookingsPage      = lazy(() => import('@/pages/BookingsPage'))
const BookingDetailPage = lazy(() => import('@/pages/BookingDetailPage'))

const ProfilePage       = lazy(() => import('@/pages/ProfilePage'))

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route index element={<HomePage />} />
            <Route path="login"    element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* Flights */}
            <Route path="flights"               element={<FlightsPage />} />
            <Route path="flights/:id/book"      element={<PrivateRoute><BookFlightPage /></PrivateRoute>} />

            {/* Hotels */}
            <Route path="hotels"                         element={<HotelsPage />} />
            <Route path="hotels/:id"                     element={<HotelDetailPage />} />
            <Route path="hotels/:id/book/:roomId"        element={<PrivateRoute><BookHotelPage /></PrivateRoute>} />

            {/* Protected */}
            <Route path="bookings"     element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
            <Route path="bookings/:id" element={<PrivateRoute><BookingDetailPage /></PrivateRoute>} />
            <Route path="profile"      element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
