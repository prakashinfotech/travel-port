# 🔒 Security Guide — TravelPort

## 1. Authentication Security

### JWT Configuration
- Access Token TTL: **15 minutes**
- Refresh Token TTL: **7 days**
- Algorithm: **HS256** (upgrade to RS256 for production)
- Refresh Token Rotation: Enabled (old token invalidated on use)
- Refresh Token stored: DB with hash comparison

### Password Policy
- Minimum 8 characters
- Must include: uppercase, lowercase, number, special char
- Hashed using **BCrypt** (cost factor: 12)
- Plaintext NEVER stored or logged

---

## 2. API Security

### Rate Limiting
```
POST /auth/login     → 5 attempts / 15 min per IP
POST /auth/register  → 10 requests / hour per IP
GET  /flights/search → 100 requests / min
All endpoints        → 1000 requests / hour per user
```

### Input Validation
- FluentValidation on all request DTOs (backend)
- Zod schemas on all forms (frontend)
- Parameterized queries only (EF Core — no raw SQL interpolation)

### Security Headers (via middleware)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

---

## 3. Role-Based Authorization

| Role  | Access                                              |
|-------|-----------------------------------------------------|
| Guest | Public search, view flights/hotels                  |
| User  | Booking, profile, wallet, booking history           |
| Admin | All user actions + admin panel + user management   |

Enforced via `[Authorize(Roles = "Admin")]` on controllers.

---

## 4. Data Protection

- Sensitive data (PAN, card numbers) NEVER stored
- Payment handled via Razorpay (PCI DSS compliant)
- Passport numbers encrypted at rest (AES-256)
- PII fields masked in logs

---

## 5. Environment Variables

```bash
# Never commit these to Git
JWT_SECRET=<min 256-bit random string>
DB_CONNECTION_STRING=<connection string>
RAZORPAY_KEY_SECRET=<secret>
SENDGRID_API_KEY=<key>
REDIS_CONNECTION=<connection>
```

Use `.env.example` with placeholder values only.

---

## 6. SQL Injection Prevention

- All DB queries via EF Core LINQ (parameterized by default)
- No string-interpolated SQL anywhere
- Stored procedures use parameterized input

---

## 7. CORS Policy

```csharp
// Only allow configured frontend origin
builder.Services.AddCors(options => {
    options.AddPolicy("TravelPortCors", policy => {
        policy.WithOrigins(config["AllowedOrigins"])
              .AllowedMethods("GET", "POST", "PUT", "DELETE")
              .AllowCredentials();
    });
});
```

---

## 8. Audit Logging

All sensitive operations logged to `AuditLogs` table:
- Login attempts (success/failure)
- Booking creation/cancellation
- Admin actions
- Password changes
- Payment events
