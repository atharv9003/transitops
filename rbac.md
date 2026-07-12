# Role-Based Access Control (RBAC) Matrix

TransitOps uses a strict role-based layout and routing guard system. Both the frontend UI (via `RoleRoute` components) and the backend API (via custom authorization middleware) enforce these boundaries.

---

## 1. Feature Access Matrix

| Module / Page | Route | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|---|---|---|---|---|---|
| **Dashboard** | `/dashboard` | ✅ View | ✅ View | ✅ View | ✅ View |
| **Fleet** | `/fleet` | ✅ Full CRUD | 👁️ Read-Only | 👁️ Read-Only | ❌ Hidden & Blocked |
| **Drivers** | `/drivers` | ✅ Full CRUD | 👁️ Read-Only | ✅ Full CRUD | ❌ Hidden & Blocked |
| **Trips** | `/trips` | ✅ View Only | ✅ Create/Dispatch | ❌ Hidden & Blocked | ❌ Hidden & Blocked |
| **Maintenance** | `/maintenance` | ✅ Open/Close | 👁️ Read-Only | ✅ Open/Close | 👁️ Read-Only |
| **Expenses** | `/fuel` | ✅ View Only | ❌ Hidden & Blocked | ❌ Hidden & Blocked | ✅ Create/View |
| **Analytics** | `/reports` | ✅ View Only | ❌ Hidden & Blocked | ❌ Hidden & Blocked | ✅ View Only |
| **Settings** | `/settings` | ✅ Edit | ❌ Hidden & Blocked | ❌ Hidden & Blocked | ❌ Hidden & Blocked |

*Legend: ✅ Full Access | 👁️ Read-Only | ❌ Hidden in Sidebar & Blocked at Route Level*

---

## 2. Guard Implementation Details

### Frontend Navigation Guard
Restricted links are filtered out of the sidebar navigation dynamically inside `Sidebar.tsx`. Direct URL navigation is intercepted at router level inside `src/router/index.tsx` using the `RoleRoute` wrapper:
```typescript
function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const role = useAuthStore(s => s.role);
  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
```

### Backend API Middleware
The Express API secures endpoints using JWT validation and the `authorizeRoles` middleware:
```typescript
export function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role?.name;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}
```
