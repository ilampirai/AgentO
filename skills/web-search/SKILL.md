---
name: web-search
description: Web search capabilities using Exa MCP for finding documentation, solutions, and code examples.
---

# Web Search Skill

Search the web for documentation, solutions, and code examples using Exa MCP.

## When to Use

- Finding official documentation
- Searching for error solutions
- Looking up API references
- Finding code examples
- Researching best practices

## Search Strategies

### Documentation Search

```
Query: "[library name] [feature] documentation"
Example: "prisma relations documentation"
```

### Error Solutions

```
Query: "[error message] [language/framework] solution"
Example: "TypeError: Cannot read property 'map' of undefined react solution"
```

### Code Examples

```
Query: "[task] [language] example code"
Example: "jwt authentication nodejs example code"
```

### Best Practices

```
Query: "[topic] best practices [year]"
Example: "react state management best practices 2024"
```

## Search Tips

### Be Specific

```
❌ "react hooks"
✅ "react useEffect cleanup function async"
```

### Include Context

```
❌ "fix undefined error"
✅ "fix TypeError undefined is not iterable javascript map"
```

### Add Version When Relevant

```
"next.js 14 app router middleware"
"python 3.11 match statement"
```

## Processing Results

### Evaluate Sources

```
Prefer:
1. Official documentation
2. GitHub issues/discussions
3. Stack Overflow (high votes)
4. Recent blog posts (< 1 year old)

Avoid:
- Outdated content (> 2 years old usually)
- Low-quality SEO sites
- Paywalled content
```

### Extract Key Information

```
From documentation:
- API signatures
- Required parameters
- Return types
- Code examples

From solutions:
- Root cause
- Fix approach
- Caveats/gotchas
```

## Integration with Memory

After finding solutions:
1. If error solution found → Add to ERRORS.md
2. If best practice found → Consider for RULES.md
3. If useful pattern found → Note in ARCHITECTURE.md

## Rate Limiting

- Don't spam searches
- Cache results mentally for session
- Prefer one comprehensive search over many small ones
