import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { HotelLayout } from '@/components/layout/HotelLayout'
import { FlightOperatorLayout } from '@/components/layout/FlightOperatorLayout'
import { BusOperatorLayout } from '@/components/layout/BusOperatorLayout'
import { CabOperatorLayout } from '@/components/layout/CabOperatorLayout'
import { PrivateRoute } from './PrivateRoute'
import { HotelRoute } from './HotelRoute'
import { OperatorRoute } from './OperatorRoute'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { LocationAwareErrorBoundary } from '@/components/ui/ErrorBoundary'

const HomePage             = lazy(() => import('@/pages/HomePage'))
const LoginPage            = lazy(() => import('@/pages/LoginPage'))
const RegisterPage         = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage   = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage    = lazy(() => import('@/pages/ResetPasswordPage'))
const EmailVerificationPage = lazy(() => import('@/pages/EmailVerificationPage'))
const NotFoundPage         = lazy(() => import('@/pages/NotFoundPage'))

const FlightsPage          = lazy(() => import('@/pages/FlightsPage'))
const BookFlightPage       = lazy(() => import('@/pages/BookFlightPage'))

const HotelsPage                = lazy(() => import('@/pages/HotelsPage'))
const HotelDetailPage           = lazy(() => import('@/pages/HotelDetailPage'))
const BookHotelPage             = lazy(() => import('@/pages/BookHotelPage'))
const HotelBookingConfirmPage   = lazy(() => import('@/pages/HotelBookingConfirmPage'))
const BusBookingConfirmPage     = lazy(() => import('@/pages/BusBookingConfirmPage'))

const BookingsPage         = lazy(() => import('@/pages/BookingsPage'))
const BookingDetailPage    = lazy(() => import('@/pages/BookingDetailPage'))

const BusesPage            = lazy(() => import('@/pages/BusesPage'))
const BookBusPage          = lazy(() => import('@/pages/BookBusPage'))
const TrainsPage           = lazy(() => import('@/pages/TrainsPage'))
const BookTrainPage        = lazy(() => import('@/pages/BookTrainPage'))
const CabsPage             = lazy(() => import('@/pages/CabsPage'))
const BookCabPage          = lazy(() => import('@/pages/BookCabPage'))

const ProfilePage          = lazy(() => import('@/pages/ProfilePage'))
const AdminPage            = lazy(() => import('@/pages/AdminPage'))
const PaymentPage          = lazy(() => import('@/pages/PaymentPage'))
const AiPlannerPage        = lazy(() => import('@/pages/AiPlannerPage'))

const HotelDashboardPage      = lazy(() => import('@/pages/hotel/HotelDashboardPage'))
const HotelBookingsPage       = lazy(() => import('@/pages/hotel/HotelBookingsPage'))
const HotelRoomsPage          = lazy(() => import('@/pages/hotel/HotelRoomsPage'))
const HotelProfilePage        = lazy(() => import('@/pages/hotel/HotelProfilePage'))
const HotelAvailabilityPage   = lazy(() => import('@/pages/hotel/HotelAvailabilityPage'))

const FlightOperatorDashboardPage = lazy(() => import('@/pages/operator/FlightOperatorDashboardPage'))
const FlightOperatorFlightsPage   = lazy(() => import('@/pages/operator/FlightOperatorFlightsPage'))
const FlightOperatorBookingsPage  = lazy(() => import('@/pages/operator/FlightOperatorBookingsPage'))

const BusOperatorDashboardPage    = lazy(() => import('@/pages/operator/BusOperatorDashboardPage'))
const BusOperatorBusesPage        = lazy(() => import('@/pages/operator/BusOperatorBusesPage'))
const BusOperatorBookingsPage     = lazy(() => import('@/pages/operator/BusOperatorBookingsPage'))

const CabOperatorDashboardPage    = lazy(() => import('@/pages/operator/CabOperatorDashboardPage'))
const CabOperatorBookingsPage     = lazy(() => import('@/pages/operator/CabOperatorBookingsPage'))

export function AppRouter() {
  return (
    <BrowserRouter>
      <LocationAwareErrorBoundary>
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
              <Route path="hotels"                              element={<HotelsPage />} />
              <Route path="hotels/:id"                          element={<HotelDetailPage />} />
              <Route path="hotels/:id/book/:roomId"             element={<PrivateRoute><BookHotelPage /></PrivateRoute>} />
              <Route path="hotels/booking/:id/confirm"          element={<PrivateRoute><HotelBookingConfirmPage /></PrivateRoute>} />

              {/* Transport */}
              <Route path="buses"       element={<BusesPage />} />
              <Route path="buses/book"  element={<BookBusPage />} />
              <Route path="buses/booking/:id/confirm" element={<PrivateRoute><BusBookingConfirmPage /></PrivateRoute>} />
              <Route path="trains"      element={<TrainsPage />} />
              <Route path="trains/book" element={<BookTrainPage />} />
              <Route path="cabs"        element={<CabsPage />} />
              <Route path="cabs/book"   element={<BookCabPage />} />

              {/* Protected */}
              <Route path="bookings"     element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
              <Route path="bookings/:id" element={<PrivateRoute><BookingDetailPage /></PrivateRoute>} />
              <Route path="profile"      element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="payment"      element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
              <Route path="admin"        element={<PrivateRoute><AdminPage /></PrivateRoute>} />
              <Route path="ai-planner"   element={<AiPlannerPage />} />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Hotel Portal — sidebar layout, no main Navbar/Footer */}
            <Route path="hotel" element={<HotelRoute><HotelLayout /></HotelRoute>}>
              <Route path="dashboard"    element={<HotelDashboardPage />} />
              <Route path="bookings"     element={<HotelBookingsPage />} />
              <Route path="rooms"        element={<HotelRoomsPage />} />
              <Route path="availability" element={<HotelAvailabilityPage />} />
              <Route path="profile"      element={<HotelProfilePage />} />
            </Route>

            {/* Flight Operator Portal */}
            <Route path="flight-operator" element={<OperatorRoute role="FlightOperator"><FlightOperatorLayout /></OperatorRoute>}>
              <Route path="dashboard" element={<FlightOperatorDashboardPage />} />
              <Route path="flights"   element={<FlightOperatorFlightsPage />} />
              <Route path="bookings"  element={<FlightOperatorBookingsPage />} />
            </Route>

            {/* Bus Operator Portal */}
            <Route path="bus-operator" element={<OperatorRoute role="BusOperator"><BusOperatorLayout /></OperatorRoute>}>
              <Route path="dashboard" element={<BusOperatorDashboardPage />} />
              <Route path="buses"     element={<BusOperatorBusesPage />} />
              <Route path="bookings"  element={<BusOperatorBookingsPage />} />
            </Route>

            {/* Cab Operator Portal */}
            <Route path="cab-operator" element={<OperatorRoute role="CabOperator"><CabOperatorLayout /></OperatorRoute>}>
              <Route path="dashboard" element={<CabOperatorDashboardPage />} />
              <Route path="bookings"  element={<CabOperatorBookingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </LocationAwareErrorBoundary>
    </BrowserRouter>
  )
}
