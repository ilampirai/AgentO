# Dependency Versions

Track all project dependency versions for change detection and compatibility.

## Format

```
PKG:name@version [file] [updated:timestamp]
CHANGE:name@old->new [file] [timestamp] [type:major|minor|patch]
```

## JavaScript / TypeScript

### package.json
```
(Auto-populated when package.json is modified)

Example:
PKG:react@18.2.0 [package.json]
PKG:next@14.0.4 [package.json]
PKG:typescript@5.3.3 [package.json] [dev]
```

### package-lock.json / yarn.lock
```
(Lockfile changes tracked separately)
```

## Python

### requirements.txt
```
(Auto-populated when requirements.txt is modified)

Example:
PKG:fastapi@0.109.0 [requirements.txt]
PKG:pydantic@2.5.3 [requirements.txt]
```

### pyproject.toml
```
(Auto-populated when pyproject.toml is modified)
```

## Go

### go.mod
```
(Auto-populated when go.mod is modified)

Example:
PKG:github.com/gin-gonic/gin@v1.9.1 [go.mod]
```

## Rust

### Cargo.toml
```
(Auto-populated when Cargo.toml is modified)

Example:
PKG:tokio@1.35.0 [Cargo.toml]
PKG:serde@1.0.195 [Cargo.toml]
```

## PHP

### composer.json
```
(Auto-populated when composer.json is modified)

Example:
PKG:laravel/framework@10.0 [composer.json]
```

## Ruby

### Gemfile
```
(Auto-populated when Gemfile is modified)

Example:
PKG:rails@7.1.2 [Gemfile]
```

---

## Change Log

| Date | Package | From | To | Type | File |
|------|---------|------|-----|------|------|
| | | | | | |

---

## Alerts

### Major Version Changes
```
(Listed when major version bumps detected - may have breaking changes)
```

### Security Advisories
```
(Listed if known vulnerable versions detected)
```

---

*Last updated: Never*
*Auto-updates when dependency files are modified via PostToolUse hook*

