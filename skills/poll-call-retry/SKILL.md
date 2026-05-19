# SKILL — DB call inside a loop (N+1)

> **Version:** 0.1.0
> **Last updated:** 2026-05-19
> **Agent targets:** copilot, cursor, claude
> **File name:** `SKILL.md` (inside `skills/poll-call-retry/`)
> **Description:** Detect, explain and refactor database calls performed inside a loop.

---

## Purpose

Detect, explain and refactor database calls performed inside a loop.

---

## Trigger

This skill is activated when:

- When rule fires: `GCI1`
- When rule fires: `GCI72`
- When the input contains: `repository.`

---

## Source of Truth

The agent **must** consult the following references before producing any output.
It must **never** invent information not present in these sources.

| Source | URL |
|---|---|
| Creedengo GCI1 | https://github.com/green-code-initiative/creedengo-rules-specifications/blob/main/src/main/rules/GCI1/java/GCI1.asciidoc |

---

## Instructions

Execute the following steps **in order**. Do not skip any step.

1. **Identify and validate the input**
   Identify the language and ensure the input is a code snippet.

2. **Consult the source of truth**
   Open the sources listed above. Never invent rules or refs.

3. **Analyse or transform**
   Apply the rule(s) deterministically; do not invent violations.

4. **Produce output**
   Render the output exactly as specified below.

5. **Self-check before responding** *(mandatory — never skip)*
   Verify every reported ref exists in the source(s); drop entries that fail.

---

## Fallback Behavior

| Situation | Agent action |
|---|---|
| Input is missing or cannot be determined | Ask the user the exact question defined for this skill |
| No results found after full analysis | Produce the "no results" output block defined below |
| A required source of truth is unreachable | Inform the user; do not hallucinate content from memory |

---

## Output Format

_Define the exact output structure your skill must produce._

---

## Constraints

The agent **must never**:

- [ ] Invent information not present in the declared sources of truth
- [ ] Skip the self-check step before responding
- [ ] Produce output in a format different from the one defined above
- [ ] Proceed when the input is ambiguous — always ask first
- [ ] Report a rule ID not in: `GCI1`, `GCI72`


---

## Examples

### Example 1 — happy path

**Input:**

    TODO

**Expected output:**

    TODO

### Example 2 — edge case

**Input:**

    TODO (no-results / edge case)

**Expected output:**

    TODO

---

## Related Skills

_None yet._

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1.0 | 2026-05-19 | Initial version |

