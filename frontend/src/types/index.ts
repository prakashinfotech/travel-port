// ── Auth ──────────────────────────────────────────────────────────────────────
export interface UserToken {
  id: string
  name: string
  email: string
  role: 'User' | 'Admin' | 'Hotel'
  hotelId?: string
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

// ── Transport Booking Requests ────────────────────────────────────────────────
export interface BookBusRequest {
  busId: string
  operator: string
  busType: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  price: number
  amenities: string
  seats?: number
  couponCode?: string
  useWallet?: boolean
  savedCardId?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
}

export interface BookTrainRequest {
  trainId: string
  trainNumber: string
  trainName: string
  class: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  price: number
  passengers?: number
  couponCode?: string
  useWallet?: boolean
  savedCardId?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
}

export interface BookCabRequest {
  cabId: string
  provider: string
  cabType: string
  carModel: string
  origin: string
  destination: string
  pickupDateTime: string
  durationMinutes: number
  distanceKm: number
  price: number
  couponCode?: string
  useWallet?: boolean
  savedCardId?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'
export type BookingType = 'Flight' | 'Hotel' | 'Bus' | 'Train' | 'Cab'

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
  // Flight fields
  airline?: string
  flightNumber?: string
  origin?: string
  originCity?: string
  destination?: string
  destinationCity?: string
  departureTime?: string
  arrivalTime?: string
  durationMinutes?: number
  // Hotel fields
  hotelName?: string
  hotelAddress?: string
  hotelCity?: string
  hotelStars?: number
  roomType?: string
  pricePerNight?: number
  nightsCount?: number
  // Transport fields (Bus / Train / Cab)
  transportOperator?: string
  transportVehicleType?: string
  transportAmenities?: string
  transportDistanceKm?: number
}

// ── Users ─────────────────────────────────────────────────────────────────────
export interface UserProfileDto {
  id: string
  name: string
  email: string
  phone: string
  role: string
}

export interface WalletTransactionDto {
  type: 'Credit' | 'Debit'
  amount: number
  description?: string
  createdAt: string
}

export interface WalletDto {
  walletId: string
  balance: number
  recentTransactions: WalletTransactionDto[]
}

export interface SavedCardDto {
  cardId: string
  cardHolderName: string
  lastFourDigits: string
  expiryMonth: number
  expiryYear: number
  cardType: string
  nickName?: string
  isDefault: boolean
}

export interface AddSavedCardRequest {
  cardHolderName: string
  cardNumber: string
  expiryMonth: number
  expiryYear: number
  cardType: string
  nickName?: string
  setAsDefault?: boolean
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
  savedCardId?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
}

export interface BookHotelRequest {
  hotelId: string
  roomId: string
  checkIn: string
  checkOut: string
  guests: number
  couponCode?: string
  useWallet?: boolean
  savedCardId?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
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

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface AdminDashboardDto {
  totalUsers: number
  totalBookings: number
  totalRevenue: number
  activeBookings: number
  cancelledBookings: number
  flightBookings: number
  hotelBookings: number
  avgBookingValue: number
}

export interface AdminUserDto {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  isVerified: boolean
  walletBalance: number
  totalBookings: number
  createdAt: string
}

export interface CouponDto {
  id: string
  code: string
  type: 'Fixed' | 'Percentage'
  value: number
  minAmount: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export interface CreateCouponRequest {
  code: string
  type: 'Fixed' | 'Percentage'
  value: number
  minAmount: number
  maxDiscount?: number
  usageLimit?: number
  expiresAt?: string
}

export interface UpdateCouponRequest {
  type: 'Fixed' | 'Percentage'
  value: number
  minAmount: number
  maxDiscount?: number
  usageLimit?: number
  expiresAt?: string
  isActive: boolean
}

export interface MonthlyRevenueDto { month: string; revenue: number; bookingCount: number }
export interface BookingsByStatusDto { status: string; count: number }
export interface BookingsByTypeDto { type: string; count: number; revenue: number }

export interface AdminAnalyticsDto {
  monthlyRevenue: MonthlyRevenueDto[]
  bookingsByStatus: BookingsByStatusDto[]
  bookingsByType: BookingsByTypeDto[]
}

// ── Hotel Manager ─────────────────────────────────────────────────────────────
export interface HotelManagerDashboardDto {
  totalBookings: number
  activeBookings: number
  cancelledBookings: number
  totalRevenue: number
  totalRooms: number
  activeRooms: number
  avgReviewScore: number
  reviewCount: number
}

export interface HotelManagerBookingDto {
  id: string
  bookingRef: string
  roomType: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  amount: number
  status: string
  bookedAt: string
}

export interface HotelRoomManagerDto {
  id: string
  roomType: string
  pricePerNight: number
  maxGuests: number
  totalRooms: number
  amenities?: string
  images?: string
  isActive: boolean
}

export interface HotelProfileDto {
  id: string
  name: string
  city: string
  address?: string
  starRating: number
  reviewScore: number
  reviewCount: number
  description?: string
  amenities?: string
  imageUrl?: string
  images?: string
  isActive: boolean
  rooms: HotelRoomManagerDto[]
}

export interface CreateRoomRequest {
  roomType: string
  pricePerNight: number
  maxGuests: number
  totalRooms: number
  amenities?: string
  images?: string
}

export interface UpdateRoomRequest {
  roomType?: string
  pricePerNight?: number
  maxGuests?: number
  totalRooms?: number
  amenities?: string
  images?: string
  isActive?: boolean
}

export interface UpdateHotelDetailsRequest {
  name?: string
  address?: string
  city?: string
  starRating?: number
  description?: string
  amenities?: string
  imageUrl?: string
  images?: string
}

export interface AdminHotelListDto {
  id: string
  name: string
  city: string
  address?: string
  starRating: number
  reviewScore: number
  reviewCount: number
  isActive: boolean
  roomCount: number
  managerEmail?: string
  createdAt: string
}

export interface RegisterHotelRequest {
  hotelName: string
  city: string
  address: string
  starRating: number
  managerEmail: string
  managerPassword: string
  managerName: string
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
