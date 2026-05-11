import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { PrivateRoute } from './PrivateRoute'
import { FullPageSpinner } from '@/components/ui/Spinner'

const HomePage             = lazy(() => import('@/pages/HomePage'))
const LoginPage            = lazy(() => import('@/pages/LoginPage'))
const RegisterPage         = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage   = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage    = lazy(() => import('@/pages/ResetPasswordPage'))
const EmailVerificationPage = lazy(() => import('@/pages/EmailVerificationPage'))
const NotFoundPage         = lazy(() => import('@/pages/NotFoundPage'))

const FlightsPage          = lazy(() => import('@/pages/FlightsPage'))
const BookFlightPage       = lazy(() => import('@/pages/BookFlightPage'))

const HotelsPage           = lazy(() => import('@/pages/HotelsPage'))
const HotelDetailPage      = lazy(() => import('@/pages/HotelDetailPage'))
const BookHotelPage        = lazy(() => import('@/pages/BookHotelPage'))

const BookingsPage         = lazy(() => import('@/pages/BookingsPage'))
const BookingDetailPage    = lazy(() => import('@/pages/BookingDetailPage'))

const BusesPage            = lazy(() => import('@/pages/BusesPage'))
const TrainsPage           = lazy(() => import('@/pages/TrainsPage'))
const CabsPage             = lazy(() => import('@/pages/CabsPage'))

const ProfilePage          = lazy(() => import('@/pages/ProfilePage'))
const AdminPage            = lazy(() => import('@/pages/AdminPage'))
const PaymentPage          = lazy(() => import('@/pages/PaymentPage'))

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route index                   element={<HomePage />} />
            <Route path="login"            element={<LoginPage />} />
            <Route path="register"         element={<RegisterPage />} />
            <Route path="forgot-password"  element={<ForgotPasswordPage />} />
            <Route path="reset-password"   element={<ResetPasswordPage />} />
            <Route path="verify-email"     element={<EmailVerificationPage />} />

            {/* Flights */}
            <Route path="flights"               element={<FlightsPage />} />
            <Route path="flights/:id/book"      element={<PrivateRoute><BookFlightPage /></PrivateRoute>} />

            {/* Hotels */}
            <Route path="hotels"                      element={<HotelsPage />} />
            <Route path="hotels/:id"                  element={<HotelDetailPage />} />
            <Route path="hotels/:id/book/:roomId"     element={<PrivateRoute><BookHotelPage /></PrivateRoute>} />

            {/* Transport */}
            <Route path="buses"  element={<BusesPage />} />
            <Route path="trains" element={<TrainsPage />} />
            <Route path="cabs"   element={<CabsPage />} />

            {/* Protected */}
            <Route path="bookings"     element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
            <Route path="bookings/:id" element={<PrivateRoute><BookingDetailPage /></PrivateRoute>} />
            <Route path="profile"      element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="payment"      element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
            <Route path="admin"        element={<PrivateRoute><AdminPage /></PrivateRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
