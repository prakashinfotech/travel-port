# 📡 API Documentation — TravelPort

**Base URL (local):** `http://localhost:5000/api/v1`  
**Swagger UI:** `https://localhost:7001/swagger` (HTTPS profile only)  
**Auth:** `Authorization: Bearer <jwt_token>`

---

## Authentication

| Method | Endpoint                      | Auth | Description          |
|--------|-------------------------------|------|----------------------|
| POST   | `/auth/register`              | ❌   | User registration    |
| POST   | `/auth/login`                 | ❌   | Email/password login |
| POST   | `/auth/refresh`               | ❌   | Refresh access token |
| POST   | `/auth/logout`                | ✅   | Invalidate tokens    |
| POST   | `/auth/forgot-password`       | ❌   | Send reset email     |
| POST   | `/auth/reset-password`        | ❌   | Reset with token     |
| POST   | `/auth/verify-email`          | ❌   | Verify email OTP     |

### POST /auth/register
```json
Request:
{ "name": "John Doe", "email": "john@example.com", "phone": "9876543210", "password": "Secure@123" }

Response 201:
{ "success": true, "message": "Registration successful. Please verify your email." }
```

### POST /auth/login
```json
Request:
{ "email": "john@example.com", "password": "Secure@123" }

Response 200:
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "abc...",
    "expiresIn": 900,
    "user": { "userId": "uuid", "name": "John", "email": "john@example.com", "role": "User" }
  }
}
```

### POST /auth/forgot-password
```json
Request:
{ "email": "john@example.com" }

Response 200:
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

The reset link points to `http://localhost:5173/reset-password?token=...` and expires in **1 hour**.
When SendGrid is disabled in development, the backend logs the reset link instead of sending email.

### POST /auth/reset-password
```json
Request:
{ "token": "raw-reset-token", "newPassword": "NewPass@123" }

Response 200:
{
  "success": true,
  "message": "Password reset successful."
}
```

On success, all existing refresh tokens for that user are revoked.

---

## Flights

> **Data source:** 900+ DB seed flights generated programmatically across 42 bidirectional routes with 7 airlines: IndiGo (6E), SpiceJet (SG), Air India (AI), Vistara (UK), Akasa Air (QP), Air India Express (IX), Go First (G8). Duffel live results can optionally be merged when `Duffel.Enabled=true`.

| Method | Endpoint                | Auth | Description           |
|--------|-------------------------|------|-----------------------|
| GET    | `/flights/search`       | ❌   | Search available flights |
| GET    | `/flights/:id`          | ❌   | Flight details        |
| POST   | `/flights/book`         | ✅   | Book a flight         |
| GET    | `/flights/popular`      | ❌   | Popular routes        |

### GET /flights/search
```
Query Params:
  origin=BOM&destination=DEL&departureDate=2025-12-01&passengers=1&cabinClass=Economy
  &maxPrice=10000&maxStops=1&airlines=6E,AI&sortBy=price&page=1&pageSize=20

Response 200:
{
  "success": true,
  "data": {
    "flights": [
      {
        "flightId": "uuid",
        "airline": "IndiGo",
        "flightNumber": "6E-123",
        "source": "BOM", "destination": "DEL",
        "departureTime": "2024-12-01T06:00:00Z",
        "arrivalTime": "2024-12-01T08:15:00Z",
        "duration": 135,
        "stops": 0,
        "availableSeats": 45,
        "price": 4599.00,
        "class": "Economy"
      }
    ],
    "total": 24,
    "page": 1,
    "limit": 10
  }
}
```

### POST /flights/book
```json
Request:
{
  "flightId": "uuid",
  "class": "Economy",
  "passengers": [
    { "name": "John Doe", "age": 30, "gender": "Male", "passportNo": "A1234567" }
  ],
  "contactEmail": "john@example.com",
  "couponCode": "SAVE100"
}

Response 201:
{
  "success": true,
  "data": {
    "bookingId": "uuid",
    "bookingRef": "TP2024001234",
    "status": "Pending",
    "totalAmount": 4599.00,
    "discountAmount": 100.00,
    "finalAmount": 4499.00,
    "paymentUrl": "/api/v1/payments/initiate/uuid"
  }
}
```

---

## Hotels

| Method | Endpoint                | Auth | Description        |
|--------|-------------------------|------|--------------------|
| GET    | `/hotels/search`        | ❌   | Search hotels      |
| GET    | `/hotels/:id`           | ❌   | Hotel details      |
| GET    | `/hotels/:id/rooms`     | ❌   | Available rooms    |
| POST   | `/hotels/book`          | ✅   | Book a hotel       |

### GET /hotels/search
```
Query Params:
  city=Mumbai&checkin=2024-12-01&checkout=2024-12-03&guests=2&rooms=1
  &minPrice=500&maxPrice=5000&rating=4&sort=price&page=1&limit=10
```

---

## Buses

| Method | Endpoint          | Auth | Description           |
|--------|-------------------|------|-----------------------|
| GET    | `/buses/search`   | ❌   | Search bus routes     |
| POST   | `/buses/book`     | ✅   | Book a bus seat       |

### GET /buses/search
```
Query Params:
  origin=Mumbai&destination=Pune&travelDate=2025-12-01&seats=1&pageSize=30

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "operator": "RedBus Express",
      "busType": "Volvo A/C Sleeper",
      "origin": "Mumbai", "destination": "Pune",
      "departureTime": "2025-12-01T22:00:00Z",
      "arrivalTime": "2025-12-02T04:00:00Z",
      "durationMinutes": 360,
      "availableSeats": 24,
      "price": 899.00,
      "acAvailable": true,
      "isRefundable": true,
      "amenities": "WiFi, Charging, Blanket",
      "rating": 4.3
    }
  ],
  "meta": { "page": 1, "pageSize": 30, "total": 12 }
}
```

---

## Trains

| Method | Endpoint           | Auth | Description          |
|--------|--------------------|------|----------------------|
| GET    | `/trains/search`   | ❌   | Search train routes  |
| POST   | `/trains/book`     | ✅   | Book a train seat    |

### GET /trains/search
```
Query Params:
  origin=Mumbai&destination=Delhi&travelDate=2025-12-01&class=3A&passengers=1&pageSize=30

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "trainNumber": "12951",
      "trainName": "Mumbai Rajdhani Express",
      "origin": "Mumbai", "destination": "Delhi",
      "departureTime": "2025-12-01T17:00:00Z",
      "arrivalTime": "2025-12-02T09:55:00Z",
      "durationMinutes": 955,
      "classes": {
        "SL":  { "className": "SL",  "availableSeats": 120, "price": 715,  "availability": "AVAILABLE" },
        "3A":  { "className": "3A",  "availableSeats": 64,  "price": 1865, "availability": "AVAILABLE" },
        "2A":  { "className": "2A",  "availableSeats": 32,  "price": 2750, "availability": "WL-3" },
        "1A":  { "className": "1A",  "availableSeats": 8,   "price": 4625, "availability": "REGRET" },
        "CC":  { "className": "CC",  "availableSeats": 0,   "price": 1595, "availability": "REGRET" }
      },
      "runningDays": "Daily",
      "availableSeats": 184,
      "isTatkal": false
    }
  ],
  "meta": { "page": 1, "pageSize": 30, "total": 8 }
}
```

**Availability values:** `AVAILABLE` · `WL-N` (waitlist) · `RAC-N` (reservation against cancellation) · `REGRET` (no seats)

---

## Cabs

| Method | Endpoint          | Auth | Description           |
|--------|-------------------|------|-----------------------|
| GET    | `/cabs/search`    | ❌   | Search available cabs |
| POST   | `/cabs/book`      | ✅   | Book a cab            |

### GET /cabs/search
```
Query Params:
  origin=Mumbai&destination=Pune&pickupDateTime=2025-12-01T10:00:00&tripType=OneWay&pageSize=20

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "Ola",
      "cabType": "Sedan",
      "carModel": "Swift Dzire",
      "capacity": 4,
      "price": 1850.00,
      "pricePerKm": 12.50,
      "estimatedDurationMinutes": 180,
      "estimatedDistanceKm": 148,
      "acAvailable": true,
      "driverIncluded": true,
      "cancellationPolicy": "Free cancellation up to 1 hour before pickup"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 8 }
}
```

**Trip types:** `OneWay` · `RoundTrip` · `Outstation` · `Local`

---

## Bookings

| Method | Endpoint                | Auth | Description           |
|--------|-------------------------|------|-----------------------|
| GET    | `/bookings`             | ✅   | User booking history  |
| GET    | `/bookings/:id`         | ✅   | Booking details       |
| POST   | `/bookings/:id/cancel`  | ✅   | Cancel booking        |
| GET    | `/bookings/:id/invoice` | ✅   | Download invoice      |

### GET /bookings/:id/invoice
Returns a downloadable PDF e-ticket for the authenticated user's booking.

Response:
- `200 OK`
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="<booking-ref>-e-ticket.pdf"`

---

## Payments (Razorpay)

| Method | Endpoint                       | Auth | Description                          |
|--------|--------------------------------|------|--------------------------------------|
| POST   | `/payments/initiate`           | ✅   | Create Razorpay order for a booking  |
| POST   | `/payments/verify`             | ✅   | Verify HMAC signature, confirm booking |
| GET    | `/payments/:id`                | ✅   | Payment status from Razorpay         |

### POST /payments/initiate
```json
Request: { "bookingId": "uuid" }

Response 200 (real Razorpay):
{
  "success": true,
  "data": { "orderId": "order_xxx", "amount": 4499.00, "currency": "INR", "keyId": "rzp_test_xxx" }
}

Response 200 (dev — Razorpay not configured):
{
  "success": true,
  "message": "Mock order created (Razorpay not configured)",
  "data": { "orderId": "order_mock_xxx", "amount": 4499.00, "currency": "INR", "keyId": "rzp_test_placeholder" }
}
```

### POST /payments/verify
```json
Request:
{
  "bookingId": "uuid",
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "hmac_sha256_hex"
}

Response 200:
{
  "success": true,
  "message": "Payment verified successfully",
  "data": { "paymentId": "uuid", "bookingRef": "TP20250001" }
}
```

**Signature verification:** `HMAC-SHA256(keySecret, "{orderId}|{paymentId}")`. In dev mode (mock orders), verification is always accepted.

---

## Users (Profile)

| Method | Endpoint                              | Auth | Description                 |
|--------|---------------------------------------|------|-----------------------------|
| GET    | `/users/profile`                      | ✅   | Get profile                 |
| PUT    | `/users/profile`                      | ✅   | Update profile              |
| GET    | `/users/travellers`                   | ✅   | Saved travellers            |
| POST   | `/users/travellers`                   | ✅   | Add traveller               |
| DELETE | `/users/travellers/:id`               | ✅   | Remove traveller            |
| GET    | `/users/wallet`                       | ✅   | Wallet balance              |
| POST   | `/users/wallet/topup`                 | ✅   | Top up wallet balance       |
| GET    | `/users/wallet/transactions`          | ✅   | Paginated transaction history |

### POST /users/wallet/topup
```json
Request:
{ "amount": 5000.00, "description": "Manual top-up" }

Response 200:
{
  "success": true,
  "data": {
    "walletId": "uuid",
    "balance": 5000.00,
    "currency": "INR"
  }
}
```
**Rules:** Amount must be > 0 and ≤ ₹1,00,000 per transaction.

### GET /users/wallet/transactions
```
Query Params: page=1&pageSize=20

Response 200:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "Debit",
        "amount": 4499.00,
        "description": "Flight booking TP2024001234",
        "referenceId": "uuid",
        "createdAt": "2024-12-01T06:30:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## Wallet Payment in Bookings

Both `/flights/book` and `/hotels/book` accept an optional `useWallet` field:

```json
{
  "flightId": "uuid",
  "class": "Economy",
  "passengers": [{ "name": "John Doe", "age": 30, "gender": "Male", "passportNo": "A1234567" }],
  "couponCode": "SAVE100",
  "useWallet": true
}
```

When `useWallet: true`, the `finalAmount` (after coupon discount) is deducted from the user's wallet atomically with the booking. If the wallet balance is insufficient, the API returns HTTP **422** with a descriptive error.

---

## Admin

| Method | Endpoint                   | Auth  | Role  |
|--------|----------------------------|-------|-------|
| GET    | `/admin/dashboard`         | ✅    | Admin |
| GET    | `/admin/users`             | ✅    | Admin |
| PUT    | `/admin/users/:id/block`   | ✅    | Admin |
| GET    | `/admin/bookings`          | ✅    | Admin |
| POST   | `/admin/coupons`           | ✅    | Admin |
| GET    | `/admin/analytics`         | ✅    | Admin |

---

## Standard API Response Wrapper

```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... } | null,
  "errors": [ ] | null,
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## Error Codes

| Code | Description              |
|------|--------------------------|
| 400  | Validation error         |
| 401  | Unauthorized             |
| 403  | Forbidden (role)         |
| 404  | Resource not found       |
| 409  | Conflict (duplicate)     |
| 422  | Business rule violation  |
| 429  | Rate limit exceeded      |
| 500  | Internal server error    |
