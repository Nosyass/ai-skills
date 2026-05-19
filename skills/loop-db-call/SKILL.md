# SKILL — Detect & Fix DB Call in a Loop (N+1)

> **Version:** 0.1.0
> **Last updated:** 2026-05-19
> **Agent targets:** Claude, GitHub Copilot, ChatGPT, Cursor, or any LLM
> **File name:** `SKILL.md` (inside `skills/loop-db-call/`)
> **Description:** Use when: code iterates over IDs/entities and calls a repository/JDBC/JPA inside the loop; N+1 query symptom; "why is my endpoint slow"; Spring Data; eager fetch; GCI1; GCI72.

---

## Purpose

Identify database access performed inside a loop (the classic N+1 problem), explain
the energy/perf impact, and either **prevent** it (generation), **explain** it
(analysis), or **refactor** existing code to a single batched call (refactor).

---

## Trigger

This skill is activated when:

- A code snippet contains a `for`/`while`/`forEach`/`stream` that calls
  `repository.findById`, `jdbcTemplate.query*`, `entityManager.find`, raw
  `executeQuery` or similar on each iteration.
- The rule engine raises Creedengo `GCI1` or `GCI72`.
- The user explicitly asks to "apply the loop-db-call skill" or asks why their
  endpoint produces many SQL queries.

---

## Source of Truth

The agent **must** consult the following references before producing any output.
It must **never** invent rule IDs, severities, or remediation costs.

| Source | URL |
|---|---|
| Creedengo GCI1 (Java) | https://github.com/green-code-initiative/creedengo-rules-specifications/blob/main/src/main/rules/GCI1/java/GCI1.asciidoc |
| Creedengo GCI72 (Java) | https://github.com/green-code-initiative/creedengo-rules-specifications/blob/main/src/main/rules/GCI72/java/GCI72.asciidoc |
| Rules support matrix | https://github.com/green-code-initiative/creedengo-rules-specifications/blob/main/RULES.md |
| Green Code Initiative | https://green-code-initiative.org |

---

## Instructions

Execute the following steps **in order** depending on the requested capability.

### Capability: `analysis`

1. **Identify the loop construct** (Java/Kotlin `for`, enhanced-for, `while`,
   `forEach`, `Stream.map`, `IntStream`).
2. **Detect a data-access call inside the loop body**: any
   `*Repository.find*`, `jdbcTemplate.*`, `entityManager.find/createQuery`,
   `Statement.executeQuery`, `prepareStatement(...).execute*`.
3. **Confirm the violation** against GCI1 / GCI72 (see Source of Truth).
4. **Produce the report** in the Output Format below, citing exact line numbers.
5. **Self-check** before responding (mandatory — see Constraints).

### Capability: `generation`

When **writing** Java/Kotlin code that iterates over a collection of IDs and needs
related entities:

- **Never** emit `for (...) { repo.findById(...) }`.
- **Prefer** `repo.findAllById(ids)`, an explicit `@Query("... WHERE id IN :ids")`,
  `JOIN FETCH`, or `jdbcTemplate.batchUpdate`.
- Add a one-line comment justifying the choice (`// batched to avoid N+1, cf. GCI1`).

### Capability: `refactor`

When given a snippet flagged by `analysis`:

- Output **only** a unified diff that converts the loop into a single batched call.
- Preserve variable names and surrounding code.
- Do not introduce framework changes (stay on the same persistence stack).

---

## Fallback Behavior

| Situation | Agent action |
|---|---|
| Language not Java/Kotlin | Ask the user: "This skill targets Java/Kotlin. Do you want me to apply it anyway?" |
| Loop body too long to attribute the violation precisely | Report the loop range and ask the user to confirm the offending call |
| Source of truth unreachable | Inform the user; do not hallucinate spec content |

---

## Output Format

### Per violation (capability = `analysis`)

    🌿 [GCI1 | GCI72] — DB call inside a loop (N+1)
       Status   : ✅ Implemented
       Severity : Major
       Line(s)  : <loop start>–<loop end>
       Issue    : <repo>.<method>() is invoked on every iteration,
                  triggering one query per loop cycle.
       Impact   : N round-trips × (network latency + DB CPU + serialization).
                  At N=100 and 5 ms latency → ~500 ms wasted, ~100 KB extra TCP.
       Fix      : <one batched alternative idiomatic to the detected framework>
       Cost     : 30min
       Ref      : https://github.com/green-code-initiative/creedengo-rules-specifications/blob/main/src/main/rules/GCI1/java/GCI1.asciidoc

### Summary block (always present)

    --- Summary ---
    Language  : Java
    Violations: 1 (1 ✅ enforced by SonarQube)
    Skill     : loop-db-call v0.1.0

### When no violations are found

    ✅ No DB-in-loop violation detected.

    --- Summary ---
    Language  : Java
    Violations: 0
    Skill     : loop-db-call v0.1.0

### For capability = `refactor`

Output ONLY a unified diff (`---` / `+++` / `@@`), no prose.

---

## Constraints

The agent **must never**:

- [ ] Re-detect a violation already confirmed by the deterministic rule engine
      (your job is to teach / fix, not to re-grade).
- [ ] Report this skill for languages where GCI1/GCI72 are not supported
      (consult RULES.md).
- [ ] Suggest a fix that changes the persistence framework (JPA → JDBC etc.).
- [ ] Omit the `Ref` URL in any violation entry.
- [ ] Produce a refactor diff that compiles only with extra imports without
      adding them.

---

## Examples

### Example 1 — analysis (happy path)

**Input:**

    for (Integer id : userIds) {
        User u = userRepository.findById(id).orElseThrow();
        process(u);
    }

**Expected output:**

    🌿 [GCI1] — DB call inside a loop (N+1)
       Status   : ✅ Implemented
       Severity : Major
       Line(s)  : 1–4
       Issue    : userRepository.findById() is invoked on every iteration.
       Impact   : N HTTP round-trips × latency × 2 machines (app + DB).
       Fix      : List<User> users = userRepository.findAllById(userIds);
                  users.forEach(this::process);
       Cost     : 30min
       Ref      : https://github.com/green-code-initiative/creedengo-rules-specifications/blob/main/src/main/rules/GCI1/java/GCI1.asciidoc

    --- Summary ---
    Language  : Java
    Violations: 1 (1 ✅ enforced by SonarQube)
    Skill     : loop-db-call v0.1.0

### Example 2 — analysis (no violation)

**Input:**

    List<User> users = userRepository.findAllById(userIds);
    users.forEach(this::process);

**Expected output:**

    ✅ No DB-in-loop violation detected.

    --- Summary ---
    Language  : Java
    Violations: 0
    Skill     : loop-db-call v0.1.0

---

## Related Skills

| Skill file | Relationship |
|---|---|
| `SKILL_green_code_review.md` | Generic Creedengo review; this skill drills down on GCI1/GCI72. |

---

## Notes

This is the **first reference skill** exercising the optional machine-readable
layer (see `skill.yaml` next to this file). It is also the first to consume
`extensions.greenAISkills.*` to wire the skill into a scanner UI.

---

## Changelog

| Version | Date       | Change          |
|---------|------------|-----------------|
| 0.1.0   | 2026-05-19 | Initial version |

