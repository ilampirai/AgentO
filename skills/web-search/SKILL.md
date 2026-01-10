# Web Search Skill

Intelligent multi-source web search with automatic tool routing.

## Available Tools

| Tool | Best For | Speed | Depth |
|------|----------|-------|-------|
| **Exa** | Semantic search, concepts, tutorials | Fast | Deep |
| **Context7** | Library docs, API references | Instant | Focused |
| **grep.app** | Code examples across repos | Fast | Wide |
| **Playwright** | Live page scraping, testing | Slow | Precise |

## Decision Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Query                           │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   "Docs for X"   "How to X"   "Scrape page"
        │             │             │
        ▼             ▼             ▼
   Context7        Exa          Playwright
   (instant)    (semantic)    (automation)
```

## When to Use Each Tool

### Context7 - Documentation Lookup
```
✅ "What's the API for React useState?"
✅ "Next.js 14 app router docs"
✅ "TypeScript generic constraints"
✅ "FastAPI dependency injection"

❌ Don't use for: opinions, tutorials, real-world examples
```

### Exa - Semantic Web Search
```
✅ "How do I implement OAuth in Node.js?"
✅ "Best practices for React state management"
✅ "Explain microservices architecture"
✅ "Tutorial for setting up Docker"

❌ Don't use for: official docs (use Context7), specific code (use grep.app)
```

### grep.app Pattern (via Exa)
```
Query: site:github.com "implementation pattern"

✅ "How do others implement rate limiting?"
✅ "Real-world examples of Redux middleware"
✅ "Production GraphQL resolver patterns"

Use Exa with site:github.com filter for code search
```

### Playwright - Browser Automation
```
✅ Scrape specific page content
✅ Extract design templates/styles
✅ Test web applications
✅ Capture screenshots
✅ Fill forms, click buttons

❌ Don't use for: general search (too slow)
```

## Parallel Search Strategy

For complex queries, search multiple sources:

```
User: "How should I structure a Next.js 14 app with authentication?"

1. Context7 → Next.js 14 official docs (app router structure)
2. Exa → "Next.js 14 authentication best practices 2024"
3. Exa (github) → site:github.com "next.js 14 auth example"

Combine results for comprehensive answer.
```

## Query Patterns

### Documentation Query
```
Tool: Context7
Query: "{library} {feature} documentation"
Example: "React useEffect cleanup documentation"
```

### How-To Query
```
Tool: Exa
Query: "how to {task} in {technology} {year}"
Example: "how to implement WebSockets in Node.js 2024"
```

### Code Example Query
```
Tool: Exa with site filter
Query: site:github.com "{pattern}" "{language}"
Example: site:github.com "JWT authentication" "typescript"
```

### Live Data Query
```
Tool: Playwright
Action: Navigate → Snapshot → Extract
Example: Scrape pricing table from competitor site
```

## Response Format

After searching, structure response as:

```markdown
## Sources Consulted
- [Context7] Official {library} docs
- [Exa] {article title} - {url}

## Answer
{synthesized answer from sources}

## Code Example
{relevant code if found}

## Additional Resources
- {link 1}
- {link 2}
```

## Error Handling

| Error | Fallback |
|-------|----------|
| Context7 no results | Try Exa with "official docs {query}" |
| Exa rate limited | Use Playwright to scrape search results |
| Playwright timeout | Retry with longer timeout or skip |

## Integration with AgentO

When orchestrator receives a query:

1. Classify query type (docs/howto/code/scrape)
2. Select appropriate tool
3. Execute search
4. Synthesize results
5. Update memory if useful pattern found

