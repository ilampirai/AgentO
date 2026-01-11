---
name: code-splitting
description: Automatically splits files that exceed 500 lines into smaller, focused modules. Maintains imports and exports correctly.
---

# Code Splitting Skill

This skill handles automatic file splitting when the 500-line limit is approached.

## When to Split

- File exceeds 400 lines (proactive)
- File would exceed 500 lines after changes (mandatory)
- File has multiple unrelated responsibilities
- File has large classes that can be separated

## Splitting Strategies

### By Responsibility

```
// Before: userService.ts (600 lines)
- User CRUD operations
- User authentication
- User preferences
- User notifications

// After:
- userCrud.ts (150 lines)
- userAuth.ts (200 lines)  
- userPreferences.ts (100 lines)
- userNotifications.ts (150 lines)
- userService.ts (50 lines) - re-exports all
```

### By Feature

```
// Before: api.ts (700 lines)
- /users endpoints
- /products endpoints
- /orders endpoints

// After:
- api/users.ts
- api/products.ts
- api/orders.ts
- api/index.ts - combines routes
```

### By Layer

```
// Before: product.ts (500 lines)
- Product interface
- Product validation
- Product repository
- Product service

// After:
- product/types.ts
- product/validation.ts
- product/repository.ts
- product/service.ts
- product/index.ts
```

## Splitting Process

### 1. Analyze File

```
- Count lines
- Identify logical sections
- Map internal dependencies
- List exports
```

### 2. Plan Split

```
- Group related functions/classes
- Determine new file names
- Plan import/export structure
- Identify shared utilities
```

### 3. Execute Split

```
- Create new files with extracted code
- Update imports in new files
- Create barrel file (index.ts) if needed
- Update original file to re-export
```

### 4. Update References

```
- Find all files importing from original
- Update import paths if needed
- Verify no broken imports
```

## Import Patterns After Split

### Barrel Export (Recommended)

```typescript
// product/index.ts
export * from './types';
export * from './validation';
export * from './repository';
export * from './service';

// Usage remains same:
import { Product, validateProduct, ProductService } from './product';
```

### Direct Imports (For Tree Shaking)

```typescript
// When bundle size matters:
import { Product } from './product/types';
import { validateProduct } from './product/validation';
```

## Naming Conventions

| Original | Split Files |
|----------|-------------|
| userService.ts | user/service.ts, user/types.ts, user/index.ts |
| apiRoutes.ts | api/users.ts, api/products.ts, api/index.ts |
| utils.ts | utils/string.ts, utils/date.ts, utils/index.ts |

## Output Format

After splitting, report:

```
📦 Auto-split: userService.ts (612 lines)

Created:
- user/types.ts (45 lines)
- user/validation.ts (78 lines)
- user/repository.ts (156 lines)
- user/service.ts (234 lines)
- user/index.ts (12 lines)

Updated imports in:
- src/api/users.ts
- src/controllers/userController.ts
- tests/user.test.ts

Total: 1 file → 5 files, all under 250 lines
```

## Update Memory

After splitting:
1. Remove old FUNCTIONS.md entry
2. Add new entries for each split file
3. Update ARCHITECTURE.md if structure changed
4. Note split in session summary
