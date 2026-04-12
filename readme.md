# 🏭 Smart Inventory & Order Management System - Frontend

A modern, full-stack inventory management application with role-based access control, real-time stock monitoring, and approval workflows.

**Live Demo:** [Coming Soon]  
**Backend Repository:** [smart-inventory-backend](link)  
**Tech Stack:** Next.js 14 | React 18 | TypeScript | TailwindCSS | Shadcn UI | Tanstack Query

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Project Structure](#project-structure)
7. [API Integration](#api-integration)
8. [Authentication & Authorization](#authentication--authorization)
9. [Key Pages & Components](#key-pages--components)
10. [Data Flow](#data-flow)
11. [Development Guide](#development-guide)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**Smart Inventory** is an enterprise-grade inventory management system designed for multi-user environments with role-based access control. It enables users to submit products for approval, track stock levels, manage restocking requests, and provides admins with powerful tools for product approval and inventory oversight.

### Key Highlights:
- 🔐 **Role-Based Access Control (RBAC)** - 4 roles: User, Manager, Admin, Super Admin
- ✅ **Product Approval Workflow** - Products require admin/manager approval before use
- 📊 **Real-Time Stock Monitoring** - Low stock alerts and restock queue management
- 👥 **User-Centric Design** - Users manage only their products; admins manage all
- 🎨 **Modern UI/UX** - Dark theme with indigo accents, smooth animations
- 📱 **Responsive Design** - Works seamlessly on mobile, tablet, and desktop

---

## ✨ Features

### 👤 User (Regular User) Features

**Products Management:**
- ✅ Submit products for approval (awaiting admin/manager review)
- ✅ View products by approval status (Approved, Pending, Rejected)
- ✅ Edit products (resubmits for approval if previously approved)
- ✅ Delete products
- ✅ Restock own products when stock is low
- ❌ Cannot manage other users' products

**Stock Management:**
- ✅ View restock queue for own products only
- ✅ Resolve restock items by adding stock
- ✅ Receive low stock alerts
- ✅ Filter restock by priority (High, Medium, Low)

**Dashboard:**
- ✅ Quick overview of own products by status
- ✅ Recent activity logs
- ✅ Stock level indicators

---

### 👔 Manager Features

**Product Management:**
- ✅ View ALL products (not just own)
- ✅ Edit any product
- ✅ Delete any product
- ✅ Restock any product
- ✅ Approve/Reject pending products
- ✅ Filter by status, category, approval status

**Restock Management:**
- ✅ View ALL restock queue items
- ✅ Resolve restock for any product
- ✅ Remove items from queue
- ✅ Priority-based filtering

**Category Permissions:**
- ✅ Grant/Revoke category permissions to other managers
- ✅ Toggle Create, Update, Delete permissions globally

**Admin Panel:**
- ✅ Manage users (view, create, update roles)
- ✅ View activity logs
- ✅ Dashboard analytics

---

### 🔑 Admin & Super Admin Features

**All Manager Features +**
- ✅ Full system administration
- ✅ User role management
- ✅ System-wide analytics
- ✅ All activity logs
- ✅ Unlimited access to all operations

---

## 🏗️ Architecture

### Frontend Stack
```
Next.js 14 (App Router)
├── React 18
├── TypeScript
├── TailwindCSS v4
├── Shadcn UI Components
├── Tanstack Query (Data Fetching)
├── Zustand (State Management)
├── Framer Motion (Animations)
└── Sonner (Toast Notifications)
```

### Authentication Flow
```
Login → JWT Token → Cookie Storage → Protected Routes
   ↓
   Middleware (Token Validation)
   ↓
   Auth Store (User State)
   ↓
   Route Protection (usePermissions Hook)
```

### Data Flow
```
User Action → API Call → Tanstack Query → Cache → UI Update
                ↓
           Error Handling
                ↓
           Toast Notification
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:5000`

### Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd smart-inventory/packages/frontend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Environment Variables**
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Smart Inventory
```

4. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Smart Inventory` |
| `NODE_ENV` | Environment | `development` or `production` |

### API Client Configuration

**File:** `src/lib/api.ts`

```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Auto-attach JWT from cookies
apiClient.interceptors.request.use((config) => {
  const token = getTokenFromCookie();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication pages
│   │   ├── login/page.tsx       # Login form with demo account cards
│   │   └── register/page.tsx    # Registration (if enabled)
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── page.tsx             # Dashboard home
│   │   ├── products/page.tsx    # Products list (users see own, admins see all)
│   │   ├── restock/page.tsx     # Restock queue management
│   │   ├── categories/page.tsx  # Category management
│   │   ├── admin/page.tsx       # Admin panel (users, permissions)
│   │   └── activity/page.tsx    # Activity logs
│   ├── layout.tsx               # Root layout
│   └── middleware.ts            # Token validation middleware
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── PageHeader.tsx       # Page title & actions
│   │   └── TopNav.tsx           # Top navigation
│   ├── ui/                      # Shadcn UI components
│   ├── products/
│   │   ├── ProductModals.tsx    # Add/Edit/Delete dialogs
│   │   └── ProductCard.tsx      # Product card component
│   ├── shared/
│   │   ├── Skeleton.tsx         # Loading skeleton
│   │   ├── Modal.tsx            # Modal wrapper
│   │   └── Dialog.tsx           # Dialog wrapper
│   └── auth/
│       ├── LoginForm.tsx        # Login form
│       └── DemoAccountCards.tsx # Demo account selector
│
├── lib/
│   ├── api.ts                   # Axios instance
│   ├── productsApi.ts           # Products API methods
│   ├── restockApi.ts            # Restock API methods
│   ├── categoriesApi.ts         # Categories API methods
│   ├── adminApi.ts              # Admin API methods
│   ├── authApi.ts               # Authentication API
│   └── utils.ts                 # Utility functions
│
├── hooks/
│   ├── useAuth.ts               # Auth hook
│   ├── usePermissions.ts        # Role-based access hook
│   ├── useDebounce.ts           # Debounce hook
│   ├── useSearch.ts             # Search hook
│   └── useIsMobile.ts           # Mobile detection hook
│
├── store/
│   ├── authStore.ts             # Zustand auth store
│   └── uiStore.ts               # Zustand UI state store
│
├── types/
│   ├── auth.ts                  # Auth types
│   ├── products.ts              # Product types
│   ├── user.ts                  # User types
│   └── index.ts                 # Type exports
│
├── utils/
│   ├── stockUtils.ts            # Stock calculation helpers
│   ├── dateUtils.ts             # Date formatting
│   └── formatters.ts            # Data formatting utilities
│
├── styles/
│   └── globals.css              # Global styles + Tailwind
│
└── constants/
    ├── colors.ts                # Color constants
    ├── routes.ts                # Route definitions
    └── messages.ts              # User-facing messages
```

---

## 🔌 API Integration

### API Client Setup

**File:** `src/lib/api.ts`

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Include cookies
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Add JWT token from localStorage if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Methods

#### Products API

```typescript
// Get all products (users see own, admins see all)
productsApi.getAllProducts({
  search?: string;
  category?: string;
  status?: string;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  page?: number;
  limit?: number;
})

// Create product (submits for approval)
productsApi.createProduct(payload)

// Update product (resets approved to pending)
productsApi.updateProduct(id, payload)

// Delete product (owner or admin only)
productsApi.deleteProduct(id)

// Restock product (owner or admin only)
productsApi.restockProduct(id, { quantity })
```

#### Restock API

```typescript
// Get restock queue (users see own, admins see all)
restockApi.getRestockQueue({
  priority?: 'High' | 'Medium' | 'Low';
  page?: number;
  limit?: number;
})

// Resolve restock item
restockApi.resolveRestockItem(id, { quantity })

// Remove from queue
restockApi.removeFromQueue(id)
```

#### Admin API

```typescript
// Get all users
adminApi.getAllUsers()

// Update user role
adminApi.updateUserRole(userId, { role })

// Update category permissions
adminApi.updateCategoryPermissions(userId, {
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
})

// Approve product
adminApi.approveProduct(productId)

// Reject product
adminApi.rejectProduct(productId, { reason })
```

---

## 🔐 Authentication & Authorization

### Login Flow

1. User enters email/password or clicks demo account
2. POST `/auth/login` → Backend validates & returns JWT + user data
3. JWT stored in HTTP-only cookie
4. Zustand auth store updated with user data
5. Middleware validates token on protected routes

### Demo Accounts

```typescript
const DEMO_ACCOUNTS = [
  { email: 'user@inventory.com', password: 'user123', role: 'User' },
  { email: 'manager@inventory.com', password: 'manager123', role: 'Manager' },
  { email: 'admin@inventory.com', password: 'admin123', role: 'Admin' },
  { email: 'superadmin@inventory.com', password: 'superadmin123', role: 'Super Admin' },
];
```

### usePermissions Hook

```typescript
const { isUser, isManager, isAdmin, isSuperAdmin } = usePermissions();

if (isUser) {
  // Render user-specific UI
}

if (isAdmin) {
  // Render admin UI
}
```

### Route Protection

```typescript
// Middleware: src/app/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

---

## 📄 Key Pages & Components

### Authentication Pages

#### Login Page
- Demo account cards (4 roles)
- Email/password form
- Auto-fill on demo account click
- Redirect to dashboard on success

### Dashboard Pages

#### Products Page
**For Users:**
- View own products tabbed by status (Approved, Pending, Rejected)
- Filter by: status, category, approval status, search
- Actions: Edit, Delete, Restock (own only)
- Display rejection reason if rejected
- Show pending approval message

**For Admins:**
- View ALL products
- Filter by: status, category, approval status, creator, search
- Actions: Edit, Delete, Restock (any)
- Show product creator info
- Approval status badges

#### Restock Page
- Real-time restock queue
- Priority badges: High (red), Medium (yellow), Low (gray)
- Tab filters by priority with live count badges
- Resolve items → Updates stock
- Remove items → Clears queue
- User-based filtering (users see own, admins see all)

#### Admin Panel
- User management (view, edit roles)
- Category permissions per manager:
  - Global Create/Update/Delete toggles
  - Affects all categories for that user
- Activity logs
- System analytics

---

## 🔄 Data Flow

### Product Creation Flow
```
1. User submits product form
   ↓
2. POST /api/products
   ↓
3. Backend: Create product with approvalStatus = "pending", createdBy = userId
   ↓
4. Response: Product object + success message
   ↓
5. Frontend: Invalidate queries, show success toast, redirect to Pending tab
   ↓
6. UI: Product appears in Pending tab, awaits admin approval
```

### Product Approval Flow
```
1. Admin clicks "Approve" on pending product
   ↓
2. PATCH /api/admin/products/:id/approve
   ↓
3. Backend: Update approvalStatus = "approved"
   ↓
4. Frontend: Invalidate products query, toast notification
   ↓
5. UI: Product moves from Pending → Approved tab
```

### Restock Flow
```
1. Product stock drops below threshold
   ↓
2. Backend: Automatically creates RestockQueue item
   ↓
3. User sees item in Restock page
   ↓
4. User clicks "Resolve" + enters quantity
   ↓
5. PATCH /api/restock/:id/resolve { quantity }
   ↓
6. Backend: Updates product.stock, marks item as resolved
   ↓
7. UI: Item disappears from queue, stock updates
```

### User Access Control Flow
```
GET /api/products
  ↓
Backend checks user role:
  ├─ User? → Filter by createdBy = userId
  ├─ Manager? → Return all products
  └─ Admin? → Return all products
  ↓
Frontend: canManageProduct = isAdmin || product.createdBy._id === user._id
  ↓
UI: Show Edit/Delete only if canManage
```

---

## 🛠️ Development Guide

### Running Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

### Development Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit"
}
```

### Code Style

- **TypeScript** - Strict mode enabled
- **Prettier** - Auto-format (configured in `.prettierrc`)
- **ESLint** - Enforce best practices

### Creating New API Methods

```typescript
// src/lib/exampleApi.ts
import apiClient from './api';

export const exampleApi = {
  getAll: async () => {
    const response = await apiClient.get('/example');
    return response.data;
  },
  
  create: async (payload: any) => {
    const response = await apiClient.post('/example', payload);
    return response.data;
  },
  
  update: async (id: string, payload: any) => {
    const response = await apiClient.put(`/example/${id}`, payload);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/example/${id}`);
    return response.data;
  },
};
```

### Using Tanstack Query

```typescript
// Fetch
const { data, isLoading, error } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => productsApi.getAllProducts(filters),
});

// Mutate
const mutation = useMutation({
  mutationFn: (payload) => productsApi.createProduct(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.success('Created successfully!');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

---

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
```bash
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import repository
   - Set environment variables

3. **Configure Environment**
```env
NEXT_PUBLIC_API_URL=https://your-backend.com/api
NEXT_PUBLIC_APP_NAME=Smart Inventory
```

4. **Deploy**
   - Auto-deploys on push to main
   - Vercel provides preview URLs

### Build Optimization

```bash
# Production build
npm run build

# Analyze bundle
npm run build -- --analyze

# Check types
npm run type-check
```

### Performance Tips

- ✅ Use `next/image` for images
- ✅ Code splitting via dynamic imports
- ✅ Optimize API calls with Tanstack Query caching
- ✅ Use React.memo for heavy components
- ✅ Lazy load modals and dialogs

---

## 🐛 Troubleshooting

### Authentication Issues

**Problem:** "401 Unauthorized" on protected routes

**Solution:**
```typescript
// Check token in cookies
document.cookie // Look for 'token'

// Check auth store
const { user } = useAuthStore();
console.log(user); // Should not be null

// Verify API URL
console.log(process.env.NEXT_PUBLIC_API_URL);
```

### API Call Failures

**Problem:** "Network Error" or CORS issues

**Solution:**
```typescript
// Check backend is running
curl http://localhost:5000/api/health

// Check API URL in .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api (no trailing slash)

// Check credentials in request
// Ensure withCredentials: true in axios config
```

### Data Not Updating

**Problem:** Changes don't reflect in UI

**Solution:**
```typescript
// Invalidate relevant query key
queryClient.invalidateQueries({ queryKey: ['products'] });

// Or full invalidation
queryClient.invalidateQueries();
```

### Slow Load Times

**Problem:** Page takes too long to load

**Solution:**
- Check Network tab in DevTools
- Look for slow API endpoints
- Use Tanstack Query's `staleTime` and `cacheTime`
- Implement pagination/virtualization for large lists

### Build Errors

**Problem:** TypeScript or build errors

**Solution:**
```bash
# Type check
npm run type-check

# Clear cache
rm -rf .next node_modules
npm install

# Rebuild
npm run build
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Tanstack Query Documentation](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Contributors

- **Lead Developer:** [Your Name]
- **Backend Team:** [Team Members]
- **UI/UX Design:** [Designer]

---

## 📞 Support

For issues or questions:
- 📧 Email: support@inventory.com
- 💬 Discord: [Join Server](link)
- 🐛 GitHub Issues: [Report Issue](link)

---

**Last Updated:** April 12, 2026  
**Version:** 1.0.0