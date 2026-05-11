// ── Auth ──────────────────────────────────────────────────────────────────────
export interface UserToken {
  id: string
  name: string
  email: string
  role: 'User' | 'Admin'
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserToken
}

export interface RegisterRequest {
  name: string
  email: string
  phone: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

// ── Flights ───────────────────────────────────────────────────────────────────
export interface FlightSearchRequest {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers?: number
  cabinClass?: 'Economy' | 'Business' | 'First'
  maxPrice?: number
  maxStops?: number       // 0 = non-stop, 1 = 1 stop, undefined = any
  airlines?: string       // comma-separated IATA codes
  sortBy?: 'price' | 'duration' | 'departure' | 'arrival'
  page?: number
  pageSize?: number
}

export interface FlightDto {
  id: string
  flightNumber: string
  airline: string
  airlineCode: string
  origin: string
  originCity: string
  destination: string
  destinationCity: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  availableSeats: number
  price: number
  businessPrice?: number
  cabinClass: string
  stops: number
  isRefundable: boolean
  baggageIncluded: boolean
  checkedBags?: number
  aircraft?: string
  externalOfferId?: string
}

// ── Hotels ────────────────────────────────────────────────────────────────────
export interface HotelSearchRequest {
  city: string
  checkIn: string
  checkOut: string
  guests?: number
  minPrice?: number
  maxPrice?: number
  starRating?: number
  sortBy?: 'price' | 'rating' | 'stars' | 'name'
  page?: number
  pageSize?: number
}

export interface HotelRoomDto {
  id: string
  roomType: string
  pricePerNight: number
  maxOccupancy: number
  availableRooms: number
  amenities: string
  cancellationPolicy?: string
  mealPlan?: string
  isRefundable?: boolean
  externalOfferId?: string
}

export interface HotelDto {
  id: string
  name: string
  city: string
  address: string
  starRating: number
  reviewScore: number
  reviewCount: number
  description: string
  amenities: string
  imageUrl: string
  rooms: HotelRoomDto[]
  externalHotelId?: string
  latitude?: number
  longitude?: number
}

// ── Buses ─────────────────────────────────────────────────────────────────────
export interface BusSearchRequest {
  origin: string
  destination: string
  travelDate: string
  seats?: number
  page?: number
  pageSize?: number
}

export interface BusDto {
  id: string
  operator: string
  busType: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  availableSeats: number
  price: number
  acAvailable: boolean
  isRefundable: boolean
  amenities: string
  rating: number
}

// ── Trains ────────────────────────────────────────────────────────────────────
export interface TrainSearchRequest {
  origin: string
  destination: string
  travelDate: string
  class?: string       // SL, 3A, 2A, 1A, CC
  passengers?: number
  page?: number
  pageSize?: number
}

export interface TrainClassDto {
  className: string
  availableSeats: number
  price: number
  availability: string  // AVAILABLE | WL-5 | RAC-3 | REGRET
}

export interface TrainDto {
  id: string
  trainNumber: string
  trainName: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  classes: Record<string, TrainClassDto>
  runningDays: string
  availableSeats: number
  isTatkal: boolean
}

// ── Cabs ──────────────────────────────────────────────────────────────────────
export interface CabSearchRequest {
  origin: string
  destination: string
  pickupDateTime: string
  tripType?: 'OneWay' | 'RoundTrip' | 'Outstation' | 'Local'
  page?: number
  pageSize?: number
}

export interface CabDto {
  id: string
  provider: string
  cabType: string
  carModel: string
  capacity: number
  price: number
  pricePerKm: number
  estimatedDurationMinutes: number
  estimatedDistanceKm: number
  acAvailable: boolean
  driverIncluded: boolean
  cancellationPolicy: string
  imageUrl?: string
}

// ── Payments ──────────────────────────────────────────────────────────────────
export interface CreateOrderResponse {
  orderId: string
  amount: number
  currency: string
  keyId: string
}

export interface VerifyPaymentRequest {
  bookingId: string
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'
export type BookingType = 'Flight' | 'Hotel'

export interface BookingDto {
  id: string
  bookingReference: string
  type: BookingType
  status: BookingStatus
  totalAmount: number
  finalAmount: number
  bookingDate: string
  flightId?: string
  hotelId?: string
  passengers?: number
  checkIn?: string
  checkOut?: string
  couponCode?: string
  discountAmount: number
  userName?: string
  userEmail?: string
  userPhone?: string
  airline?: string
  flightNumber?: string
  origin?: string
  originCity?: string
  destination?: string
  destinationCity?: string
  departureTime?: string
  arrivalTime?: string
  durationMinutes?: number
}

// ── Users ─────────────────────────────────────────────────────────────────────
export interface UserProfileDto {
  id: string
  name: string
  email: string
  phone: string
  role: string
}

export interface WalletDto {
  id: string
  balance: number
}

export interface SavedTravellerDto {
  id: string
  name: string
  email: string
  phone: string
  passportNumber?: string
}

// ── Booking requests / responses ──────────────────────────────────────────────
export interface BookFlightRequest {
  flightId: string
  passengers: number
  cabinClass?: string
  couponCode?: string
  useWallet?: boolean
}

export interface BookHotelRequest {
  hotelId: string
  roomId: string
  checkIn: string
  checkOut: string
  guests: number
  couponCode?: string
  useWallet?: boolean
}

export interface BookingCreatedResponse {
  id: string
  bookingRef: string
  totalAmount: number
  status: BookingStatus
}

export interface CancelBookingResponse {
  bookingId: string
  refundAmount: number
  walletCredited: boolean
}

// ── API wrapper ───────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: string[]
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}
