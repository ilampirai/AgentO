# Project Rules

Rules that all AgentO agents must follow. Violations are blockers.

## System Rules

These rules cannot be disabled:

- **MAX_FILE_LINES: 500** - No file should exceed 500 lines of code
- **NO_DUPLICATE_CODE: true** - Never write code that already exists in the project
- **REQUIRE_ERROR_HANDLING: true** - All external calls must have error handling

## Custom Rules

Add your project-specific rules here:

- [USR001] (Example) All API endpoints must validate input
- [USR002] (Example) Use async/await instead of callbacks

## Disabled Rules

Temporarily disabled rules (will not be enforced):

<!-- Move rules here to disable them temporarily -->
<!-- - [USR003] ~Require JSDoc for all functions~ -->
