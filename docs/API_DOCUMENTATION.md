# 📡 API Documentation — TravelPort

**Base URL:** `https://api.travelport.com/api/v1`  
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

---

## Flights

| Method | Endpoint                | Auth | Description           |
|--------|-------------------------|------|-----------------------|
| GET    | `/flights/search`       | ❌   | Search available flights |
| GET    | `/flights/:id`          | ❌   | Flight details        |
| POST   | `/flights/book`         | ✅   | Book a flight         |
| GET    | `/flights/popular`      | ❌   | Popular routes        |

### GET /flights/search
```
Query Params:
  source=BOM&destination=DEL&date=2024-12-01&passengers=1&class=Economy
  &sort=price&page=1&limit=10

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

## Bookings

| Method | Endpoint                | Auth | Description           |
|--------|-------------------------|------|-----------------------|
| GET    | `/bookings`             | ✅   | User booking history  |
| GET    | `/bookings/:id`         | ✅   | Booking details       |
| POST   | `/bookings/:id/cancel`  | ✅   | Cancel booking        |
| GET    | `/bookings/:id/invoice` | ✅   | Download invoice      |

---

## Payments

| Method | Endpoint                       | Auth | Description         |
|--------|--------------------------------|------|---------------------|
| POST   | `/payments/initiate`           | ✅   | Initiate payment    |
| POST   | `/payments/verify`             | ✅   | Verify payment      |
| GET    | `/payments/:id`                | ✅   | Payment status      |

---

## Users (Profile)

| Method | Endpoint                        | Auth | Description          |
|--------|---------------------------------|------|----------------------|
| GET    | `/users/profile`                | ✅   | Get profile          |
| PUT    | `/users/profile`                | ✅   | Update profile       |
| GET    | `/users/travellers`             | ✅   | Saved travellers     |
| POST   | `/users/travellers`             | ✅   | Add traveller        |
| DELETE | `/users/travellers/:id`         | ✅   | Remove traveller     |
| GET    | `/users/wallet`                 | ✅   | Wallet balance       |

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
