# Default Seeded Credentials

After running `npx ts-node prisma/seed.ts` in the backend directory, the following user roles and test accounts are created with standard credentials.

---

## 🔑 Login Accounts

| Role | Email | Password | Scope / Permissions |
|---|---|---|---|
| **Fleet Manager** | `admin@transitops.com` | `admin123` | Full access across all settings, fleet registry, drivers, expenses, and analytics |
| **Fleet Manager** | `manager2@transitops.com` | `password123` | Backup Fleet Manager account |
| **Dispatcher** | `dispatcher@transitops.com` | `password123` | Create and dispatch trips; read-only fleet/maintenance view |
| **Dispatcher** | `dispatcher2@transitops.com` | `password123` | Backup Dispatcher account |
| **Safety Officer** | `safety@transitops.com` | `password123` | Manage driver compliance, safety scores, and maintenance logs |
| **Safety Officer** | `safety2@transitops.com` | `password123` | Backup Safety Officer account |
| **Financial Analyst** | `finance@transitops.com` | `password123` | View expenses, fuel logs, and analytics reports |

---

## 🛠️ Security Settings

- **Default Secret**: `transitops-dev-secret` (loaded from `.env` in local development)
- **Account Lockout**: 5 failed login attempts lock the account for 15 minutes.
