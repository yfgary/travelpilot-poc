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
