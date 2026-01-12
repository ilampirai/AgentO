---
description: Query the function index. Search by name, file, or check for duplicates before writing new code.
---

# /agento:functions

Query the indexed functions in your codebase.

## Usage

```
/agento:functions [query] [options]
```

## Actions

### List All Functions

```
/agento:functions
```

Shows summary of all indexed functions grouped by file.

### Search by Name/Keyword

```
/agento:functions auth
/agento:functions "user login"
```

### Filter by File

```
/agento:functions --file auth.ts
/agento:functions --file src/services/
```

### Check for Duplicates

```
/agento:functions --check-duplicates "function validateEmail(email: string): boolean { ... }"
```

Checks if the provided code contains functions that already exist.

## Output

```
📚 **Function Index** (147 functions in 23 files)

**src/auth/login.ts** (5)
  - authenticateUser(email:string,password:string): Promise<User>
  - validateSession(token:string): boolean
  - logout(userId:string): void
  - refreshToken(token:string): Promise<string>
  - hashPassword(password:string): string

**src/services/api.ts** (3)
  - fetchData(endpoint:string): Promise<any>
  - ...
```

## Integration

The function index is automatically updated when:
- Files are read with `agento_read`
- Files are written with `agento_write`
- Codebase is indexed with `agento_index`

## Format

Functions are stored in `.agenticMemory/FUNCTIONS.md`:

```markdown
## src/auth/login.ts
F:authenticateUser(email:string,password:string):Promise<User> [L1:hashPassword,validateEmail]
F:validateSession(token:string):boolean [L1:decodeJWT]
```

