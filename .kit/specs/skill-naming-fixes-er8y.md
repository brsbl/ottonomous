---
id: skill-naming-fixes-er8y
name: Skill Naming and Description Fixes
status: approved
created: 2026-01-12
updated: 2026-01-12
---

# Skill Naming and Description Fixes

Fix skill frontmatter to align with Claude Code documentation best practices.

## Overview

Skills have `name` fields that don't match their directory names, and descriptions could include more trigger keywords.

## Goals

- Fix `name` fields to match directory names (per docs)
- Improve descriptions with more specific trigger keywords

## Non-Goals

- Restructuring skill content
- Adding new skills

## Requirements

### 1. Fix Name Fields

| Skill | Current Name | Directory | New Name |
|-------|--------------|-----------|----------|
| spec | `spec-writing` | `spec` | `spec` |
| task | `task-management` | `task` | `task` |
| log | `engineering-log` | `log` | `log` |

### 2. Improve Descriptions

**spec** (current):
> "Writes specifications through collaborative interview. Use when user mentions plans, create a plan, planning, new features, projects, or needs a spec/PRD."

Keep as-is - already good.

**task** (current):
> "Generates and manages task lists from specs. Activates when user has a spec and mentions tasks, implementation, work, or asks 'what's next?'"

Add: "what should I do?", "what should I work on?"

**log** (current):
> "Captures engineering knowledge anchored to source files. Activates when exploring code, investigating bugs, planning implementation, or answering questions about how code works."

Add: "how does this work?", "what does this code do?"
