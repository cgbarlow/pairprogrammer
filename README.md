# Agentic Pair Programmer for Coding Agents

## Overview
An intelligent pair programming assistant that embodies the collective wisdom of software engineering thought leaders, providing real-time code review and planning assistance through automated triggers.

## Core Philosophy
The agent synthesizes best practices from industry leaders:
- **Dave Farley**: Continuous Delivery, Modern Software Engineering principles
- **Kent Beck**: Tidy First methodology, Test-Code-Revert cycle
- **Martin Fowler**: Refactoring patterns, architectural design
- **Kevlin Henney**: Code as design, patterns and practices
- **Robert C. Martin**: Clean code principles, SOLID design

## Technical Architecture

### Implementation Framework
- **Protocol**: Model Context Protocol (MCP)
- **Integration**: Claude Code hooks for automated triggers
- **Configuration**: CLAUDE.md for behavior customization and .claude/hooks.yaml for trigger setup

### Core Functions

#### 1. Plan Review
- **Trigger**: Git issue creation/modification
- **Actions**:
  - Analyze issue description for clarity and completeness
  - Suggest acceptance criteria
  - Identify potential edge cases
  - Recommend implementation approach
  - Flag architectural concerns

#### 2. Code & Documentation Review
- **Trigger**: File write operations
- **Actions**:
  - Immediate feedback on code quality
  - Design pattern suggestions
  - Test coverage recommendations
  - Documentation completeness check
  - Performance and security considerations

## Behavioral Characteristics

### Communication Style
- Constructive and educational feedback
- Asks clarifying questions like a human pair programmer
- Provides context for suggestions
- Balances pragmatism with best practices

### Review Priorities
1. **Correctness**: Logic errors, edge cases
2. **Clarity**: Readability, naming, structure
3. **Maintainability**: SOLID principles, coupling
4. **Performance**: Only when relevant
5. **Security**: Input validation, common vulnerabilities

## Configuration

### CLAUDE.md Structure
```markdown
## Pair Programming Preferences
- Review depth: [light|standard|thorough]
- Focus areas: [testing|architecture|performance|security]
- Communication style: [direct|educational|socratic]

## Project Context
- Technology stack
- Coding standards
- Architecture patterns
```

### Claude Code Hooks Configuration
```yaml
# .claude/hooks.yaml
hooks:
  - trigger: file_write
    pattern: "**/*.{js,ts,py,java,go}"
    action: code_review
    
  - trigger: file_write
    pattern: "**/README.md"
    action: documentation_review
    
  - trigger: git_issue_create
    action: plan_review
```

## Future Enhancements
- IDE integration for real-time suggestions
- Learning from team's code review patterns
- Metrics tracking for code quality improvements
- Integration with CI/CD pipelines

## References
- [Muses - Johannes Prinz](https://icy-dune-030ff6d00.azurestaticapps.net/muse)
- [Pair Programming - Wikipedia](https://en.wikipedia.org/wiki/Pair_programming)
- [Claude Code Hooks Documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Model Context Protocol documentation](https://modelcontextprotocol.io/introduction)
