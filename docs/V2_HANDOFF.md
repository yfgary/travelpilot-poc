# TravelPilot V2 — Conversation / Session Handoff

This file exists so the project does not depend on chat memory.

## Source of truth
Repository documentation is authoritative for project state:
- `AGENTS.md`
- `docs/V2_MASTER_SPEC.md`
- `docs/V2_ARCHITECTURE.md`
- `docs/V2_DATABASE_SCHEMA.md`
- `docs/V2_DECISIONS.md`
- `docs/V2_ROADMAP.md`
- `docs/V2_CURRENT_STATE.md`
- `docs/V2_SCHEMA_VALIDATION.md`

## Recommended first message in a new ChatGPT conversation
> 繼續 TravelPilot V2。先讀 repo 內 AGENTS.md 同所有 docs/V2_*.md，尤其 V2_CURRENT_STATE.md 同 V2_DECISIONS.md。讀完先總結而家做到邊、已完成、未完成、known issues 同下一個 bounded task；未確認之前唔好改 code。Production 唔准改，只用 travelpilot-poc。

## End-of-task rule
Before finishing any implementation task:
- update `V2_CURRENT_STATE.md`
- record any changed decision in `V2_DECISIONS.md`
- record newly discovered high-risk/complex requirements
- identify the next bounded task
- state tests run and remaining known issues

## Why
Chat memory is useful but is not guaranteed to carry every technical detail into a new conversation. The repository documents are the durable handoff mechanism for ChatGPT, Codex, and future sessions.


## Continuity rule
Do not rely on ChatGPT Memory as the authoritative project record. At the beginning of a new conversation, read the repository documents first.

If `V2_CURRENT_STATE.md` contains a **Pending architecture review** section, explicitly summarize those pending items and ask/confirm before treating them as final decisions.

A recommendation discussed in chat is not a final project decision until it is either:
- explicitly approved by the user and recorded in `V2_DECISIONS.md`, or
- purely factual/documentation correction that does not change product behaviour.

## Minimal restart prompt
> 繼續 TravelPilot V2。先讀 travelpilot-poc 入面 AGENTS.md 同所有 docs/V2_*.md，尤其 V2_CURRENT_STATE.md、V2_DECISIONS.md 同 V2_SCHEMA_VALIDATION.md。先總結 Current Phase、已完成、Pending Review、Known Issues 同下一個 bounded task。未確認之前唔好改 code；Production 唔准改。
