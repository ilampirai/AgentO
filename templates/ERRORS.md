# Known Errors & Solutions

Document recurring errors and their solutions for quick reference.

## Format

```markdown
### [ERR001] Error Name
**Symptom**: Description of the error
**Cause**: Why it happens
**Solution**: How to fix it
**Files**: Affected files
```

## Common Errors

### [ERR001] Module Not Found
**Symptom**: `Cannot find module 'X'`
**Cause**: Missing dependency or incorrect import path
**Solution**: 
1. Check if package is installed: `npm ls X`
2. Install if missing: `npm install X`
3. Verify import path is correct

### [ERR002] Type Error
**Symptom**: `TypeError: Cannot read property 'X' of undefined`
**Cause**: Accessing property on null/undefined value
**Solution**: Add null checks or optional chaining (`?.`)

---

*Add project-specific errors and solutions here.*



