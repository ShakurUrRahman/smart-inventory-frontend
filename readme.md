# InventoryOS Frontend

A modern, responsive inventory management system built with **Next.js 14**, **React**, and **TypeScript**. Features a sleek dark-themed UI with real-time notifications, smooth animations, and comprehensive inventory tracking capabilities.

## 🎨 Design & Aesthetics

- **Dark Theme**: Space-inspired color palette (`#0a0d12`, `#13161F`, `#1C1F2A`)
- **Accent Colors**: Indigo (`#6366F1`), Cyan (`#00F5FF`), Purple (`#7B2FFF`), Amber (`#FFD166`)
- **Smooth Animations**: Framer Motion transitions for all interactions
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Custom Scrollbars**: Sleek webkit scrollbar styling
- **Icons**: Lucide React for consistent iconography

## 📁 Project Structure

```
packages/frontend/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── orders/
│   │   ├── restock/
│   │   ├── activity/
│   │   └── layout.tsx
│   ├── globals.css               # Global styles + animations
│   ├── layout.tsx                # Root layout
│   ├── middleware.ts             # Auth middleware
│   ├── not-found.tsx             # 404 page
│   └── providers.tsx             # TanStack Query provider
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Topbar.tsx        # Header with notifications
│   │   │   ├── Sidebar.tsx       # Navigation menu
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── ProtectedLayout.tsx
│   │   ├── orders/
│   │   │   ├── CreateOrderDrawer.tsx
│   │   │   ├── StatusDropdown.tsx
│   │   │   └── StatusConfirmDialog.tsx
│   │   ├── restock/
│   │   │   └── RestockModals.tsx
│   │   ├── shared/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── ui/                   # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       ├── sheet.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── api.ts                # Axios instance + interceptors
│   │   ├── authApi.ts            # Auth endpoints
│   │   ├── productsApi.ts        # Products endpoints
│   │   ├── ordersApi.ts          # Orders endpoints
│   │   ├── categoriesApi.ts      # Categories endpoints
│   │   ├── restockApi.ts         # Restock endpoints
│   │   ├── dashboardApi.ts       # Dashboard analytics
│   │   └── utils.ts              # Helper functions
│   │
│   ├── store/
│   │   ├── authStore.ts          # Zustand auth state
│   │   └── notificationStore.ts  # Notification state
│   │
│   └── hooks/
│       └── useSearch.ts          # Debounce hook
│
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript config
└── package.json

```

## 🚀 Key Features

### Authentication

- **Login/Register**: Secure authentication with JWT tokens
- **Protected Routes**: Middleware-based route protection
- **Session Management**: Automatic logout on 401 errors
- **Persistent Login**: Token stored in httpOnly cookies

### Dashboard

- **Real-time Analytics**: Order stats, revenue charts, inventory metrics
- **7-Day Charts**: Orders bar chart, Revenue bar chart
- **Status Breakdown**: Donut chart for order statuses
- **Product Summary**: Stock levels with category info
- **Recent Activity Feed**: Live activity log with 5-item display
- **Animated Counters**: Smooth number animations on load

### Products Management

- **Search & Filter**: Real-time search with debounce
- **Category Filter**: Filter by product category
- **Status Indicators**: Active/Inactive status badges
- **Add/Edit/Delete**: Full CRUD operations
- **Restock Action**: Quick restock modal
- **Pagination**: 10 items per page with nav

### Categories Management

- **Grid View**: Category cards with product count
- **Add/Edit/Delete**: Simple category management
- **Duplicate Prevention**: Prevents duplicate categories

### Orders Management

- **Status Tabs**: All, Pending, Confirmed, Shipped, Delivered, Cancelled
- **Advanced Filtering**: Search by customer, filter by date
- **Expandable Rows**: View order items, totals, metadata
- **Status Transitions**: Confirm, Ship, Deliver, or Cancel orders
- **Order Creation**: Drawer-based order creation with product selection
- **Price Tracking**: Item prices captured at order time
- **Pagination**: Navigate through orders

### Restock Queue

- **Priority Levels**: High (🔴), Medium (🟡), Low (🔵)
- **Current Stock Display**: Real-time stock levels
- **Threshold Comparison**: Shows required minimum threshold
- **Resolve Modal**: Add stock with preview of new total
- **Auto-removal**: Resolved items auto-remove from queue
- **Queue Management**: Remove items from queue (admin override)

### Activity Log

- **Entity Filtering**: Order, Product, Stock, User, Category
- **Timeline View**: Chronological activity history
- **User Info**: See who performed each action
- **Pagination**: Browse through activity history

### Notifications

- **Live Badge**: Red pulsing dot when unread
- **5-Item Display**: Most recent unread notifications
- **Mark as Read**: Click to dismiss notifications
- **Entity Icons**: 📦 Order, 🏷️ Product, 📊 Stock, 👤 User, 📁 Category
- **Relative Time**: "2 hours ago" format
- **Auto-refresh**: Every 30 seconds

## 🎯 Page Breakdown

### `/dashboard`

- 4 stat cards with animated numbers
- 2 bar charts (Orders, Revenue) - Last 7 days
- 1 donut chart (Order Status Breakdown)
- Product stock summary table
- Recent activity feed

### `/products`

- Search bar + category dropdown
- Status tabs (All, Active, Inactive)
- Products table with pagination
- Add/Edit/Delete/Restock modals
- Inline error messages

### `/categories`

- Grid layout of categories
- Category card with product count
- Add/Edit/Delete functionality
- Confirmation dialogs

### `/orders`

- Status filter tabs with counts
- Customer search + date filter
- Orders table with expandable rows
- Order creation drawer
- Status change confirmation dialog
- Full order details on expand

### `/restock`

- Priority filter tabs (All, High, Medium, Low)
- Queue items sorted by stock (lowest first)
- Current stock vs threshold comparison
- Restock modal with preview
- Remove from queue confirmation

### `/activity`

- Entity type filter dropdown
- Activity timeline with icons
- Relative timestamps
- User who performed action
- Pagination support

## 🛠️ Technologies

| Category                | Tools                        |
| ----------------------- | ---------------------------- |
| **Framework**           | Next.js 14, React 18         |
| **Language**            | TypeScript                   |
| **Styling**             | Tailwind CSS, CSS Animations |
| **State**               | Zustand, TanStack Query      |
| **Forms**               | React Hook Form, Zod         |
| **Animations**          | Framer Motion                |
| **Charts**              | Recharts                     |
| **Icons**               | Lucide React                 |
| **UI Components**       | shadcn/ui                    |
| **Toast Notifications** | Sonner                       |
| **Date**                | date-fns                     |
| **HTTP**                | Axios                        |
| **Validation**          | Zod Schema                   |

## 📦 Dependencies

```json
{
	"next": "^14.0.0",
	"react": "^18.2.0",
	"react-dom": "^18.2.0",
	"@tanstack/react-query": "^5.x",
	"zustand": "^4.x",
	"react-hook-form": "^7.x",
	"zod": "^3.x",
	"framer-motion": "^10.x",
	"recharts": "^2.x",
	"axios": "^1.x",
	"sonner": "^1.x",
	"lucide-react": "^0.x",
	"date-fns": "^3.x",
	"tailwindcss": "^3.x"
}
```

## 🔐 Security Features

- **Protected Routes**: Middleware checks token before allowing access
- **HttpOnly Cookies**: JWT stored securely (not accessible from JS)
- **401 Interceptor**: Auto logout on authentication errors
- **CORS Enabled**: Credentials included in requests
- **Environment Variables**: API URL stored in `.env.local`
- **Role-Based Access**: User roles (admin, manager) respected

## 🎬 Animations & Transitions

- **Page Load**: Fade-in with stagger delays
- **Modal/Drawer**: Slide-in with content fade
- **Button Hover**: Scale (1.05) on hover, scale (0.95) on click
- **Row Animations**: Slide up on table row entry
- **Expandable Rows**: Height transition with content fade
- **Status Badge**: Scale animation on change
- **Notification**: Pulse animation on new unread

## 🌐 API Integration

All API calls go through axios instance at `src/lib/api.ts`:

```typescript
// Features
- Base URL: process.env.NEXT_PUBLIC_API_URL
- WithCredentials: true (for cookies)
- 401 Response: Auto logout + redirect to /login
- Error Handling: Toast notifications for all errors
- Request Timeout: 10 seconds
```

### Available Endpoints

```
POST   /api/auth/register         - Register new user
POST   /api/auth/login            - Login user
POST   /api/auth/logout           - Logout
GET    /api/auth/me               - Get current user

GET    /api/products              - Fetch all products
POST   /api/products              - Create product
PATCH  /api/products/:id          - Update product
DELETE /api/products/:id          - Delete product
PATCH  /api/products/:id/restock  - Restock product

GET    /api/categories            - Fetch categories
POST   /api/categories            - Create category
PATCH  /api/categories/:id        - Update category
DELETE /api/categories/:id        - Delete category

GET    /api/orders                - Fetch orders
POST   /api/orders                - Create order
PATCH  /api/orders/:id/status     - Update order status
GET    /api/orders/:id            - Get order details

GET    /api/restock               - Get restock queue
PATCH  /api/restock/:id/resolve   - Resolve restock item
DELETE /api/restock/:id           - Remove from queue

GET    /api/dashboard/stats       - Dashboard statistics
GET    /api/dashboard/orders-chart - Orders chart data
GET    /api/dashboard/revenue-chart - Revenue chart data
GET    /api/dashboard/product-summary - Product summary
GET    /api/dashboard/status-breakdown - Status breakdown
GET    /api/dashboard/activity    - Recent activity logs

GET    /api/activity              - Activity logs with filters
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Backend server running on `http://localhost:5000`

### Installation

```bash
cd packages/frontend
npm install
```

### Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 📊 State Management

### Zustand Stores

**Auth Store** (`src/store/authStore.ts`):

- User data
- Login/logout
- Session persistence
- Auto-rehydrate on page load

**Notification Store** (`src/store/notificationStore.ts`):

- Unread notifications
- Mark as read functionality
- Notification list management
- Activity-based population

## 🎨 Customization

### Colors

Edit `tailwind.config.js` and CSS variables in `app/globals.css`:

```css
--primary: #6366f1 --accent: #00f5ff --dark-bg: #0a0d12;
```

### Animation Timings

Modify delays in component files (e.g., `transition={{ delay: 0.1 }}`)

### Dark Mode

Always on (configured in `app/layout.tsx` and `tailwind.config.js`)

## 🐛 Common Issues

### 401 Unauthorized

- Check if backend is running
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Clear cookies and login again

### API Not Responding

- Ensure backend is on `http://localhost:5000`
- Check CORS settings on backend
- Verify network connectivity

### Charts Not Displaying

- Check if Recharts is installed
- Verify chart data from API
- Check browser console for errors

## 📝 Development Notes

- Use `react-hook-form` + `zod` for form validation
- Always check `isLoading` state before submitting
- Use `toast()` from sonner for notifications
- Implement `AnimatePresence` for conditional renders
- Use `useQuery` with proper `staleTime` and `gcTime`
- Always call `queryClient.invalidateQueries()` after mutations

## 🔄 Data Flow

```
User Action
    ↓
React Hook Form validates
    ↓
API Call (axios)
    ↓
TanStack Query mutation
    ↓
Success/Error handling
    ↓
Toast notification
    ↓
Invalidate cache
    ↓
UI updates with new data
```

## 📱 Responsive Breakpoints

- **Mobile**: 320px - 768px (hidden elements, stack layouts)
- **Tablet**: 768px - 1024px (adjusted spacing)
- **Desktop**: 1024px+ (full layouts)

## ✅ Performance Optimizations

- Code splitting by routes
- Image optimization (if using images)
- Query caching (5-30 minute intervals)
- Debounced search (400ms)
- Lazy loading of modals/drawers
- Memoized selectors in stores

## 📄 License

MIT

## 👨‍💻 Author

**Shakur** - Full-Stack Web Developer

- Location: Dhaka, Bangladesh
- Stack: Next.js, React, Node.js, MongoDB
- Portfolio: https://shakur.netlify.app

---

**Built with ❤️ using Next.js & TypeScript**

