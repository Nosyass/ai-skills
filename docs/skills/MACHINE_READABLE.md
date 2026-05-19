# Machine-readable skill layer (optional)

`SKILL.md` is — and remains — the source of truth for both humans and AI
agents (Copilot, Cursor, Claude, ChatGPT, …). Its prose contract is what
makes a skill discoverable and usable by an LLM.

This document describes an **optional, additive** layer that lets *programs*
(catalog browsers, rule engines, IDE plugins, MCP servers, scanners) consume
the catalog without parsing markdown.

## TL;DR

A skill folder MAY ship a `skill.yaml` (or `skill.yml`) next to its
`SKILL.md`. When present, this file is validated against
[`schemas/skill.schema.json`](../../schemas/skill.schema.json) by CI.

Skills that do NOT ship a manifest keep working exactly as before — they are
simply not indexed by tools that rely on the manifest.

## Folder layout

```
skills/
├── index.json                          # optional catalog (validated)
└── <skill-id>/
    ├── SKILL.md                        # REQUIRED — prose contract (unchanged)
    └── skill.yaml                      # OPTIONAL — machine-readable mirror
```

## Minimal `skill.yaml`

```yaml
id: green-code-review
name: Green Code Review
version: 1.1.0
capabilities: [analysis]
languages: [java, python, php, javascript, csharp, rust, html]
```

## Recommended `skill.yaml`

```yaml
id: green-code-review
name: Green Code Review
description: Detect Creedengo green code rule violations in source code.
version: 1.1.0
last_updated: 2026-05-19
capabilities: [analysis]
languages: [java, python, php, javascript, csharp, rust, html]
agent_targets: [copilot, cursor, claude, chatgpt, codex]
severity: MEDIUM
category: OTHER
tags: [creedengo, sonar, audit]
triggers:
  - keyword: "green code review"
  - keyword: "creedengo violation"
gci_refs: []          # leave empty for catch-all skills
sources:
  - name: Rules support matrix
    url: https://github.com/green-code-initiative/creedengo-rules-specifications/blob/main/RULES.md
maintainers: ["@green-code-initiative"]
license: Apache-2.0
```

## Why `capabilities`?

The same skill folder can be consulted in several modes:

| Capability  | Question it answers                          | Consumer                       |
|-------------|----------------------------------------------|--------------------------------|
| `generation`| "How should I *write* code that avoids this?"| Cursor, Copilot, Claude Code   |
| `analysis`  | "Why is *this existing code* problematic?"   | IDE scanners, CI, GreenAISkills |
| `refactor`  | "Transform *this code* into a green version."| Codemod tools                  |

A `SKILL.md` may cover all three in its prose; `capabilities` declares which
modes consumers can legitimately request.

## Why optional `gci_refs`?

When a skill is tied to one or several rules from
[`creedengo-rules-specifications`](https://github.com/green-code-initiative/creedengo-rules-specifications),
declaring `gci_refs: [GCI1, GCI72]` enables a deterministic bridge:

```text
rule engine detects GCI1
         │
         ▼
catalog.findByGciRef("GCI1")  →  skill 'loop-db-call'
         │
         ▼
AI agent receives the right skill as context
```

Without this field, tools must grep markdown to discover the binding —
fragile and brittle. With it, both kinds of consumer benefit:

- **AI generation agents** can cite the authoritative spec in generated
  comments (`// see GCI1`).
- **Analysis tools** (e.g. [GreenAISkills](https://github.com/<you>/GreenAISkills))
  can route a deterministic violation to the matching skill in one lookup.

The field is **optional**. Skills that don't map to a specific rule simply
omit it (or leave the array empty).

## `skills/index.json` (optional)

A catalog file at `skills/index.json` lists indexed skills. It is generated
or hand-maintained; the validator cross-checks it against discovered
manifests.

```json
{
  "version": 1,
  "generated_at": "2026-05-19T10:00:00Z",
  "skills": [
    {
      "id": "green-code-review",
      "path": "skills/green-code-review",
      "version": "1.1.0",
      "capabilities": ["analysis"],
      "languages": ["java", "python", "php", "javascript", "csharp", "rust", "html"]
    }
  ]
}
```

## Validation

Locally:

```bash
npm --prefix scripts install
node scripts/validate-skills.mjs
```

On every PR: see [`.github/workflows/validate-skills.yml`](../../.github/workflows/validate-skills.yml).

The validator enforces:

1. Every `skill.yaml` is valid YAML and matches the schema.
2. Folder name equals manifest `id`.
3. A companion `SKILL.md` exists.
4. `skills/index.json` (if present) is valid and consistent with manifests.

Skills without a manifest are ignored by the validator — **no breaking change**.

## FAQ

**Do I have to add a `skill.yaml` to my existing skill?**
No. Opt in when (and if) you want tooling to index it.

**What if my `SKILL.md` and `skill.yaml` disagree?**
`SKILL.md` wins for humans/LLMs. `skill.yaml` wins for tools. Keep them in
sync at version bumps.

**Can downstream consumers add custom fields?**
Yes, under the `extensions:` object. Validators MUST ignore unknown keys
there.

