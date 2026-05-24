# Enterprise REST API & DTO Specifications

## Project Name: Mangosteen

### Document Version: 1.0.0 (Production-Ready Draft)

### API Context Base: `/api/v1`

### API Standard: RESTful JSON over HTTPS

---

## 1. Document Control & Agent Collaboration Log

This API specification manual was developed and audited under a **Two-Agent Peer Review Workflow**:

| Role               | Agent Persona                                       | Contribution                                                                                                                        |
| :----------------- | :-------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Drafting Agent** | **Agent 1: Lead Enterprise Architect**              | Configured the REST resource routes, parameterized payloads, defined pagination schemas, and documented basic DTO maps.             |
| **Reviewer Agent** | **Agent 2: Principal Systems & Security Architect** | Standardized error envelopes, verified authorization annotations, created DTO validation rules, and mapped access control policies. |

### Peer Review & Hardening Log:

- **Audit Ref #16 (Uniform Error Contract)**: Standardized error responses to use a strict domain-error schema instead of raw HTTP exceptions, facilitating clean API boundary checks on the Next.js frontend.
- **Audit Ref #17 (Strict Payload Validation)**: Applied strict validation parameters (`whitelist: true`, `forbidNonWhitelisted: true`) to the NestJS global ValidationPipe to drop unapproved payload keys before controller processing.
- **Audit Ref #18 (Logistics & Agent Guarding)**: Audited delivery status endpoints to ensure agents can only mutate orders assigned to their active zones, blocking cross-agent data exposure.

---

## 2. API Global Standards

All system endpoints are exposed over HTTP/S, with data serialized in JSON. All non-public APIs require the authorization header: `Authorization: Bearer <JWT_TOKEN>`.

### 2.1. Standard Response Envelopes

To ensure predictable client parsing, the backend wraps every response in standard wrappers.

#### Success Envelope (with optional pagination metadata):

```json
{
  "success": true,
  "data": {
    "items": [],
    "meta": {
      "totalItems": 120,
      "itemCount": 10,
      "itemsPerPage": 10,
      "totalPages": 12,
      "currentPage": 1
    }
  }
}
```

#### Error Envelope:

```json
{
  "success": false,
  "error": {
    "code": "STOCK_INSUFFICIENT",
    "message": "Requested mango weight exceeds available fresh inventory.",
    "details": ["Variant ID 'var_123' only has 15kg in stock, 25kg requested."],
    "timestamp": "2026-05-24T15:26:00Z"
  }
}
```

---

## 3. Global Error Code Dictionary

The following domain-specific error codes are compiled in the backend error dictionary:

| Domain        | Error Code                 | HTTP Status        | Description                                                |
| :------------ | :------------------------- | :----------------- | :--------------------------------------------------------- |
| **Auth**      | `AUTH_INVALID_CREDENTIALS` | `401 Unauthorized` | Invalid username, password, or verification code.          |
| **Auth**      | `AUTH_TOKEN_EXPIRED`       | `401 Unauthorized` | JWT access token expired; request rotation.                |
| **Auth**      | `AUTH_FORBIDDEN`           | `403 Forbidden`    | Authenticated user lacks required role/permissions.        |
| **Catalog**   | `STOCK_INSUFFICIENT`       | `400 Bad Request`  | Selected box variant stock level is below requested count. |
| **Affiliate** | `REFERRAL_EXPIRED`         | `400 Bad Request`  | Affiliate referral link or cookie exceeds active window.   |
| **Order**     | `COUPON_INVALID`           | `400 Bad Request`  | Coupon is invalid, expired, or cart value is below limit.  |
| **Logistics** | `DELIVERY_OTP_INVALID`     | `400 Bad Request`  | OTP code shared by the delivery agent mismatches.          |

---

## 4. Key API Endpoints & DTO Mappings

### 4.1. Authentication Module (`/api/v1/auth`)

#### 4.1.1. User Registration

- **Endpoint**: `POST /register`
- **Access**: Public
- **Payload DTO (`RegisterUserDto`)**:

  ```typescript
  export class RegisterUserDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @IsString()
    @MinLength(3)
    fullName!: string;

    @IsOptional()
    @IsPhoneNumber("BD") // Enforces Bangladesh standard phone numbers
    phone?: string;

    @IsEnum(UserRole)
    role!: UserRole; // Only CUSTOMER or AFFILIATE roles permitted in registration
  }
  ```

- **Response**: `{ success: true, message: "Verification email dispatched." }`

#### 4.1.2. Access Token Rotation

- **Endpoint**: `POST /refresh`
- **Access**: Public (HttpOnly cookie container `refresh_token` parsed automatically)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "new_jwt_access_token_string"
    }
  }
  ```

---

### 4.2. Catalog & Product Module (`/api/v1/catalog`)

#### 4.2.1. Query Catalog List

- **Endpoint**: `GET /products`
- **Access**: Public
- **Query Parameters**:
  - `page` (number, default `1`)
  - `limit` (number, default `10`)
  - `district` (string, e.g. `Rajshahi`)
  - `sweetness` (number, 1-5 scale)
  - `organic` (boolean)
- **Response**: Returns standard Success Envelope containing matching products list and meta parameters.

#### 4.2.2. Create Product Variant (Admin Only)

- **Endpoint**: `POST /variants`
- **Access**: Private (`JwtAuthGuard`, `@Roles(UserRole.ADMIN)`)
- **Payload DTO (`CreateProductVariantDto`)**:

  ```typescript
  export class CreateProductVariantDto {
    @IsUUID()
    productId!: string;

    @IsString()
    sku!: string;

    @IsDecimal()
    weightKg!: number;

    @IsInt()
    @Min(1)
    boxCount!: number;

    @IsDecimal()
    @Min(0)
    price!: number;
  }
  ```

---

### 4.3. Affiliate & Commissions Module (`/api/v1/affiliates`)

#### 4.3.1. Track Click Link

- **Endpoint**: `POST /clicks`
- **Access**: Public
- **Payload DTO (`TrackClickDto`)**:

  ```typescript
  export class TrackClickDto {
    @IsString()
    referralCode!: string;

    @IsOptional()
    @IsString()
    referrerUrl?: string;
  }
  ```

- **Response**: Success code and tracking confirmation cookie set.

#### 4.3.2. Request Payout Withdrawal

- **Endpoint**: `POST /withdrawals`
- **Access**: Private (`JwtAuthGuard`, `@Roles(UserRole.AFFILIATE)`)
- **Payload DTO (`WithdrawRequestDto`)**:

  ```typescript
  export class WithdrawRequestDto {
    @IsDecimal()
    @Min(500) // Minimum threshold 500 BDT
    amount!: number;

    @IsString()
    method!: string; // 'BKASH' | 'NAGAD' | 'BANK'

    @IsString()
    @MinLength(5)
    paymentDetails!: string; // Decrypted on admin verification
  }
  ```

---

### 4.4. Order & Checkout Module (`/api/v1/orders`)

#### 4.4.1. Submit Checkout Purchase

- **Endpoint**: `POST /checkout`
- **Access**: Private (`JwtAuthGuard`, `@Roles(UserRole.CUSTOMER)`)
- **Payload DTO (`CheckoutOrderDto`)**:

  ```typescript
  export class CheckoutOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items!: OrderItemDto[];

    @IsString()
    shippingAddress!: string;

    @IsString()
    district!: string;

    @IsString()
    deliverySlot!: string; // 'MORNING' | 'EVENING'

    @IsEnum(["COD", "STRIPE", "SSLCOMMERZ"])
    paymentGateway!: string;

    @IsOptional()
    @IsString()
    couponCode?: string;
  }
  ```

---

### 4.5. Logistics & COD Verification (`/api/v1/logistics`)

#### 4.5.1. Secure Order OTP Match (Delivery Agent Only)

- **Endpoint**: `POST /orders/:orderId/verify-otp`
- **Access**: Private (`JwtAuthGuard`, `@Roles(UserRole.DELIVERY_AGENT)`)
- **Payload DTO (`VerifyDeliveryOtpDto`)**:
  ```typescript
  export class VerifyDeliveryOtpDto {
    @IsString()
    @Length(6, 6)
    otp!: string;
  }
  ```
- **Response**: Returns standard Success Envelope with order details and payment validation logs.
