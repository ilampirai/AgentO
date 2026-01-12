# Project Architecture

Project structure and patterns for maintaining consistency.

## Structure

Document your project's directory structure:

```
project/
├── src/
│   ├── components/   [UI components]
│   ├── services/     [Business logic]
│   ├── utils/        [Helper functions]
│   └── hooks/        [React hooks]
├── tests/            [Test files]
└── docs/             [Documentation]
```

## Patterns

### Code Organization
- Components in `components/` - UI only, no business logic
- Services in `services/` - Business logic, API calls
- Utils in `utils/` - Pure functions, helpers

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Functions: camelCase (e.g., `getUserById`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

### Import Order
1. External packages
2. Internal modules
3. Components
4. Utilities
5. Types

## Constraints

Add project-specific constraints:

- [ ] No direct API calls in components (use services)
- [ ] No side effects in utils
- [ ] All async functions must have error handling

---

*Update this file to match your project's actual architecture.*

