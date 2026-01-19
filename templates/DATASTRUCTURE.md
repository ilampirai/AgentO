# Data Structures

Document database schemas, API contracts, and data models.

## Schemas

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Contracts

### Authentication

```
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: User }

POST /api/auth/register
Body: { email: string, password: string, name: string }
Response: { user: User }
```

## State Management

Document global state structure:

```typescript
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

---

*Update this file when data structures change.*



