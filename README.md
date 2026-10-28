# 🐾 PetShop Enterprise - High-Performance E-Commerce Platform

An enterprise-grade, concurrency-safe E-Commerce platform built for Pet Shop Owners and Customers, architected to demonstrate **backend engineering craftsmanship**, **SOLID design principles**, **SDLC best practices**, and **zero-redundancy bandwidth optimization**.

---

## 🌟 Architectural Highlights

### 1. SOLID Design Principles Implementation
- **Single Responsibility Principle (SRP)**:
  - `PetService`: Manages pet catalog validations, views count, and inventory state.
  - `OrderService`: Coordinates atomic checkout transactions, row locking, and order status transitions.
  - `AuthService`: Handles user onboarding, JWT token issuance, and real-user identity verification.
  - `ImageOptimizationService`: Manages server-side image compression, dimensions, SHA256 hashing, and cache headers.
  - Controllers/Views focus strictly on HTTP request/response serialization.
- **Open/Closed Principle (OCP)**:
  - Extensible `IPaymentGateway` strategy interface. Payment processors (`MockCardPaymentGateway`, `CashOnDeliveryGateway`) can be swapped or extended without modifying `OrderService`.
- **Liskov Substitution Principle (LSP)**:
  - Repositories implement `IBaseRepository[T]`, ensuring any data layer implementation can be substituted in testing without altering domain service behavior.
- **Interface Segregation Principle (ISP)**:
  - Granular models and mixins (`TimestampedModel`, `SoftDeletableModel`, `AuditableModel`).
- **Dependency Inversion Principle (DIP)**:
  - Business logic services depend on abstract repository interfaces (`IPetRepository`, `IOrderRepository`) rather than direct ORM couplings.

---

### 2. Authentication Strategy: JWT vs Session Analysis & Real User Verification
- **JWT (JSON Web Token)** with **SimpleJWT** was selected over standard sessions because:
  - **Decoupled SPA Architecture**: Stateless bearer tokens allow seamless communication between the React Single Page Application and the Django REST API without cookie CORS or sticky-session bottlenecks.
  - **Scalability**: Zero server session storage overhead across distributed microservices or worker processes.
  - **Enhanced Security**: 15-minute access tokens with refresh token rotation and database blacklist on revocation.
  - **Real User Verification**: Every user record includes an `is_verified` flag. User registration requires identity confirmation via a 6-digit verification code before full account activation.

---

### 3. Concurrency Protection & Multi-User Race Condition Prevention
- **Pessimistic Row-Level Locking (`select_for_update()`)**:
  - In e-commerce platforms selling unique pets or limited stock, multiple customers may attempt to purchase the exact same pet simultaneously.
  - Inside a `transaction.atomic()` block, the specific `Pet` record is locked at the database engine level until commit.
  - The second concurrent buyer's request safely blocks, detects that the pet has been marked `is_available = False`, and fails gracefully with an HTTP `409 Conflict` ("This pet has just been adopted by another customer").
  - **Guarantees zero overselling or double-adoption under heavy traffic.**

---

### 4. Bandwidth Optimization & Client-Side Local Storage Caching
- **Server-Side Processing & Storage**:
  - Shop owner image uploads are stored server-side with dimension optimization and automated SHA256 checksum computation (`content_hash`).
  - Responses emit immutable headers: `Cache-Control: public, max-age=31536000, immutable` and `ETag: "{content_hash}"`.
  - Conditional HTTP requests evaluate `If-None-Match` and return `304 Not Modified`.
- **Client-Side Persistent IndexedDB Cache**:
  - The React SPA features an automated `ImageCacheManager` powered by browser **IndexedDB**.
  - Before requesting an image across the network, the client checks IndexedDB for the cached blob.
  - **Cache Hit**: Renders instantaneously from client local storage with **0 KB network bandwidth**.
  - **Cache Miss**: Downloads from server once, writes blob to IndexedDB, and subsequent visits are instant.
  - The UI displays an active **[Local Cache]** badge showing live cache hits and bandwidth saved in real time.

---

### 5. React Virtual DOM Optimization
- Components (`PetCard`, `CachedImage`, `CartDrawer`) are wrapped in `React.memo` with custom equality checks.
- Event handlers and callbacks are stabilized via `useCallback`.
- Filtered pet queries are calculated using `useMemo`.
- Parent re-renders (such as search queries or cart toggles) **do not trigger re-renders of unrelated child components**, minimizing latency and browser DOM operations.
- **Zero dead code**: Every single written function, component, and hook is actively utilized.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm
- Git

### 1. Backend Setup (Django REST Framework)
```bash
# Navigate to backend directory
cd backend

# Activate Python Virtual Environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
# source venv/bin/activate

# Install dependencies (already prepared in venv)
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed database with sample pets, categories, breeds, and demo accounts
python manage.py seed_petshop

# Run automated test suite (Unit tests, Concurrency tests, Permissions)
python manage.py test

# Start the Django development server
python manage.py runserver 8000
```
- API Base URL: `http://127.0.0.1:8000/api/`
- Interactive OpenAPI / Swagger UI: `http://127.0.0.1:8000/api/docs/`

---

### 2. Frontend Setup (React Single Page Application)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite React development server
npm run dev
```
- Storefront & Admin App: `http://localhost:5173`

---

## 🔑 Demo Accounts for Evaluation

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Shop Owner** | `owner@petshop.com` | `owner123` | Full Admin Dashboard, Add/Edit/Delete Pets, Image Upload, Order Fulfillment |
| **Customer** | `customer@example.com` | `customer123` | Browse Catalog, Health Disclosures, Cart, Concurrency Checkout, Order History |

*(The Sign In modal includes convenient 1-click demo login buttons for both roles).*

---

## 🧪 Automated Test Suite

Run the full automated test suite covering:
1. `AccountsAuthTests`: Registration, Real-user verification code, JWT claims.
2. `PetDomainTests`: Shop owner listing creation, SHA256 image hashing, Customer RBAC permissions, Cache headers.
3. `OrderConcurrencyAndFulfillmentTests`: Pessimistic locking race-condition test (two concurrent threads competing for the last pet), Payment gateway strategy pattern.

```bash
cd backend
python manage.py test
```
Result: **8/8 Tests Passing** in real atomic transactions.

---

## 📁 SDLC Project Architecture

```
petshop/
├── backend/
│   ├── accounts/             # Custom User, JWT Claims, Real-User Verification
│   ├── pets/                 # Catalog, Image Optimization Service, Repositories, Services
│   ├── orders/               # Concurrency-Safe Checkout (select_for_update), Payment Gateways
│   ├── analytics/            # Shop Owner KPIs (Revenue, Pets, Orders, Verified Users)
│   ├── common/               # SOLID Interfaces (IBaseRepository, IPaymentGateway)
│   └── petshop_backend/      # Settings, URLs, WSGI
├── frontend/
│   ├── src/
│   │   ├── components/       # Virtual DOM optimized pure components (PetCard, CachedImage)
│   │   ├── services/         # api.ts (JWT client) & imageCache.ts (IndexedDB local cache)
│   │   ├── App.tsx           # Main Single Page Application coordinator
│   │   └── style.css         # Modern, responsive design system
│   ├── index.html
│   └── vite.config.ts
└── README.md
```
