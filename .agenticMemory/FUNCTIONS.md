# Function Index

Compressed index with **dependency levels** for smart context loading.

## Dependency Levels

- **L0**: The function itself (signature only)
- **L1**: Direct dependencies (functions it calls)
- **L2**: Second-level dependencies (what L1 calls)

**Rule**: Start with L0. Only load L1 if needed. Rarely need L2.

## Format

```
## file_path
F:name(params):return [L1:dep1,dep2] [L2:dep3]
C:Class{methods} [L1:deps]
T:Type{fields}
```

## Index

```
(Run /AgentO:index to populate)

Example:
## src/services/auth.ts
F:login(email,pass):Promise<Token> [L1:validateUser,hashCompare] [L2:dbQuery]
F:validateUser(email):User|null [L1:dbQuery]
F:hashCompare(plain,hash):bool [L1:bcrypt.compare]
C:AuthService{login(),logout(),refresh()} [L1:TokenService,UserRepo]

## src/utils/db.ts
F:dbQuery(sql,params):Promise<Row[]> [L1:pool.query]
F:transaction(fn):Promise<T> [L1:pool.getConnection]
```

## Dependency Graph (Key Functions)

```
(Populated by indexer)

Example:
login
├── validateUser
│   └── dbQuery
└── hashCompare
    └── bcrypt.compare
```

## Quick Reference

### Most Used Functions
(Top 10 by reference count)

### Entry Points
(Functions called from routes/controllers)

### Database Functions
(All functions that touch DB)

---

*Last indexed: Never*
*Run `/AgentO:index` to scan the codebase*
