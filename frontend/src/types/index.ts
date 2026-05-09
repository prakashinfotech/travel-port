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
  page?: number
  pageSize?: number
}

export interface FlightDto {
  id: string
  flightNumber: string
  airline: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  cabinClass: string
  price: number
  availableSeats: number
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
  bookingDate: string
  flightId?: string
  hotelId?: string
  passengers?: number
  checkIn?: string
  checkOut?: string
  couponCode?: string
  discountAmount: number
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
  couponCode?: string
}

export interface BookHotelRequest {
  hotelRoomId: string
  checkIn: string
  checkOut: string
  couponCode?: string
}

export interface BookingCreatedResponse {
  id: string
  bookingReference: string
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
