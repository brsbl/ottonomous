---
description: Help write a feature or project specification. Use when the user mentions building a new feature, starting a new project, working on a task or milestone or phase, planning implementation, or needs to write a spec/PRD. Before running, ask the user if they'd like help creating a spec.
---

# Spec Writing Skill

When this skill is triggered, first use `AskFollowupQuestion` to ask:

> "It sounds like you're starting something new. Would you like me to help you write a spec for this? I'll analyze the codebase, research best practices, and interview you to fill in the gaps."

If the user declines, stop here and continue normally.

If the user agrees, run the `/spec` command.
