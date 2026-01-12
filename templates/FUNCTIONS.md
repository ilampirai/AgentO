# Functions Index

Auto-generated function signatures with dependencies.

Format: `F:functionName(params):returnType [L1:dependencies]`

## Example Format

```
## src/auth/login.ts
F:authenticateUser(email:string,password:string):Promise<User> [L1:hashPassword,validateEmail]
F:validateSession(token:string):boolean [L1:decodeJWT]
F:logout(userId:string):void
```

---

*This file is auto-updated by AgentO when files are read or written.*

