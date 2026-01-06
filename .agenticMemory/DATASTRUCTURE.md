# Data Structure Map

Complete understanding of data flow, database schemas, and entity relationships.

## Format

### Database Tables
```
T:table_name
  PK:id (int)
  FK:user_id -> users.id
  F:name (varchar:255)
  F:created_at (timestamp)
  IDX:name,created_at
```

### Data Models / Entities
```
M:User [src/models/user.ts]
  id: string (uuid)
  email: string (unique)
  password: string (hashed)
  profile: -> Profile (1:1)
  orders: -> Order[] (1:N)
```

### API Data Flow
```
FLOW:user-login
  IN: {email, password}
  VALIDATE: email(format), password(min:8)
  QUERY: users WHERE email=$email
  CHECK: bcrypt.compare(password, hash)
  OUT: {token, user}
  ERR: 401(invalid), 404(not found)
```

### State Management
```
STATE:auth [src/store/auth.ts]
  user: User | null
  token: string | null
  isLoading: boolean
  ACTIONS: login, logout, refresh
  DEPS: api.auth, storage.local
```

## Database Schema

(Run /AgentO:index --data to populate)

## Entity Relationships

```
(Run /AgentO:index --data to populate)

Example:
User 1--N Order
Order N--1 Product
Product N--N Category
```

## API Endpoints

```
(Run /AgentO:index --data to populate)

Example:
POST /api/auth/login -> AuthController.login
GET /api/users/:id -> UserController.show
```

## Data Flow Diagrams

```
(Populated as flows are discovered)
```

---

*Last indexed: Never*
*Run `/AgentO:index --data` to scan data structures*
