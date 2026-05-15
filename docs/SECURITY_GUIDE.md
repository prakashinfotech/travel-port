# 🔒 Security Guide — TravelPort

## 1. Authentication Security

### JWT Configuration
- Access Token TTL: **15 minutes**
- Refresh Token TTL: **7 days**
- Algorithm: **HS256** (upgrade to RS256 for production)
- Refresh Token Rotation: Enabled (old token invalidated on use)
- Refresh Token stored in DB with hash comparison; cleaned up by `RefreshTokenCleanupWorker`
- `ClockSkew: TimeSpan.Zero` — no grace period on token expiry

### JWT Claims

| Claim | Value | Roles |
|---|---|---|
| `sub` | User GUID | All |
| `email` | User email | All |
| `name` | User full name | All |
| `role` | `User` \| `Admin` \| `Hotel` | All |
| `jti` | Token GUID (for revocation) | All |
| `hotelId` | Hotel GUID | Hotel-role only |

The `hotelId` claim is embedded at login for Hotel-role users. `HotelManagerController` reads it from the JWT to scope all data access to that specific hotel — preventing cross-hotel data access without any additional DB lookup.

### Password Policy
- Minimum 8 characters
- Must include: uppercase, lowercase, digit, special character
- Hashed using **BCrypt** with `SecurityConstants.BcryptWorkFactor = 12`
- Cost factor extracted to named constant — no magic numbers in service code
- Plaintext NEVER stored or logged

---

## 2. Role-Based Authorization

| Role  | Access | Guard |
|-------|---------|-------|
| Guest | Public search, view flights/hotels | No auth required |
| User  | Booking, profile, wallet, booking history, saved cards/travellers | `[Authorize]` |
| Admin | All user actions + admin panel (user management, bookings, coupons, hotel registration) | `[Authorize(Roles = "Admin")]` |
| Hotel | Hotel portal — own dashboard, bookings, rooms, profile only | `[Authorize(Roles = "Hotel")]` |

### Hotel Manager Isolation
All `HotelManagerController` endpoints read `hotelId` from the JWT:

```csharp
private Guid CurrentHotelId =>
    Guid.Parse(User.FindFirstValue("hotelId")!);
```

Every service call passes this GUID, and every repository query filters by it. A hotel manager cannot read or modify data for any other hotel — even with a valid token — because the claim is set at login time and cannot be forged without the JWT signing key.

---

## 3. API Security

### Rate Limiting
```
POST /auth/login, /auth/register, /auth/forgot-password, /auth/reset-password
    → AuthPolicy: 5 requests / 15 minutes per IP

All other endpoints
    → GlobalPolicy: 100 requests / minute per IP
```

Enforced via ASP.NET Core Rate Limiting middleware (`AddRateLimiter`) with `FixedWindowLimiter`. Excess requests receive HTTP 429.

### Input Validation
- **Backend:** FluentValidation on all request DTOs
  - `RegisterRequestValidator` — name, email, 10-digit phone, password policy
  - `LoginRequestValidator` — email format, non-empty password
  - `ForgotPasswordRequestValidator` — email format
  - `ResetPasswordRequestValidator` — non-empty token, password policy
  - `BookFlightRequestValidator` — valid FlightId, Economy/Business cabin, 1–9 passengers
  - `RegisterHotelRequestValidator` — all 7 fields, star rating 1–5, password policy
  - `CreateRoomRequestValidator` — price > 0, guests 1–20, rooms > 0, optional field lengths
- **Frontend:** Zod schemas on all forms + FluentValidation error messages propagated via `ApiResponse<T>`
- **EF Core:** Parameterized queries only — no raw SQL string interpolation

---

## 4. Data Protection

### Payment / Cards
- Full card numbers (PAN) are **NEVER stored**
- `SavedCards` table stores only: last 4 digits, card brand, expiry month/year, cardholder name
- Razorpay handles PCI DSS compliance for actual payment processing

### Sensitive Field Handling
- Passport numbers in `SavedTravellers` — stored as-is (no encryption in current version; encrypt at rest with AES-256 in production)
- PII fields (name, email, phone) masked in Serilog logs where possible

---

## 5. Environment & Secrets

### What MUST NOT be committed to git

| Secret | Where to put it |
|---|---|
| JWT signing key | `appsettings.Development.json` or Docker env var `JwtSettings__Secret` |
| DB SA password | `.env` file (gitignored) or CI/CD secret |
| SMTP username + password | `appsettings.Development.json` or Docker env var `Email__Username` / `Email__Password` |
| Razorpay Key + Secret | `appsettings.Development.json` or CI/CD secret |
| Duffel API token | `appsettings.Development.json` only |

### appsettings.json (committed) — safe defaults only
```json
{
  "Email": { "Enabled": false, "Username": "", "Password": "" },
  "Razorpay": { "Enabled": false, "KeyId": "", "KeySecret": "" },
  "Duffel": { "Enabled": false, "ApiToken": "" }
}
```

All sensitive fields are **empty strings** in the committed file. Real values go in `appsettings.Development.json` (gitignored) or Docker environment variables.

### Docker environment variable override pattern
```yaml
# docker-compose.yml
api:
  environment:
    - JwtSettings__Secret=${JWT_SECRET}
    - Email__Enabled=${EMAIL_ENABLED}
    - Email__Username=${EMAIL_USERNAME}
    - Email__Password=${EMAIL_PASSWORD}
```

---

## 6. SQL Injection Prevention

- All DB queries via EF Core LINQ (parameterized by default)
- No string-interpolated SQL anywhere in the codebase
- `FromSqlRaw` is not used; all queries go through strongly-typed LINQ expressions

---

## 7. CORS Policy

Configured via `AllowedOrigins` in `appsettings.json`:

```csharp
builder.Services.AddCors(options =>
    options.AddPolicy("TravelPortCors", policy =>
        policy.WithOrigins(allowedOrigins)   // from config
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()));
```

Development default allows `http://localhost:5173` and `https://localhost:5173`. Production origins are injected via Docker env vars or CI secrets.

---

## 8. Security Headers

Applied via ASP.NET Core middleware:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## 9. Email Security

- SMTP credentials stored only in `appsettings.Development.json` or Docker env vars — never committed
- `Email.Enabled` defaults to `false` in `appsettings.json` — email is opt-in
- When email is disabled, password reset tokens are logged server-side instead of emailed
- Hotel credentials email (`SendHotelCredentialsEmailAsync`) is conditional: `if (_email.IsConfigured)`
- `FromEmail` must match SMTP `Username` — Office365 rejects mismatched sender addresses

---

## 10. Known Limitations (future work)

| Issue | Severity | Mitigation |
|---|---|---|
| Wallet deduction before booking commit | Medium | Wrap in compensating transaction or retry; tracked in TODO |
| Flight seat decrement race condition | Medium | Add optimistic concurrency or DB-level lock; tracked in TODO |
| Refresh token rotation not fully enforced | Low | Single-use tokens implemented; full rotation (revoke all on reuse) pending |
| Passport numbers stored unencrypted | Low | AES-256 at rest recommended for production |
