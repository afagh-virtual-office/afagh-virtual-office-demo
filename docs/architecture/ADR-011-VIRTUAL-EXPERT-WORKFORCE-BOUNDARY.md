# ADR-011 — Virtual Expert Workforce Boundary

**Status:** ACCEPTED
**Date:** 2026-09-16
**Scope:** Dashboard information architecture and virtual expert workforce

## Decision

Business 360 is a standalone enterprise capability and must not be used as the identity, container, or navigation model for the Virtual Expert Workforce.

The Virtual Expert Workforce is an unbounded operational domain: the system may host an arbitrary number of specialized virtual experts. Each expert may operate against business context, customer context, workflows, policies, evidence, and communication capabilities without being defined as a "360" view.

## UI Rule

Within the Virtual Expert Workforce area:

- Do not label the area as Business 360.
- Do not attach a "360" suffix to virtual expert names, cards, workspaces, or expert navigation.
- Do not duplicate Business 360 as an expert-level container.
- Business 360 remains available only as its own independent enterprise context capability.

## Boundary

`Business 360` = authoritative context capability.

`Virtual Expert Workforce` = scalable set of specialized AI workers that consume approved context and operate within policy, authorization, action, communication, and evidence boundaries.

Therefore:

`Business 360 != Virtual Expert Workforce`

and

`Virtual Expert Workforce -> may consume Business 360 context`

but

`Virtual Expert Workforce != Business 360`.

## Rationale

Using "360" as the container for an unbounded expert workforce creates a false one-to-one conceptual mapping between a context model and an execution workforce. Separating them preserves architectural clarity, allows unlimited specialization, and prevents navigation or product semantics from implying that every expert is a Business 360 instance.

## Consequence

Future dashboard work must preserve the current visual baseline while changing only the relevant Virtual Expert navigation/content labels so that no "360" terminology appears in that workforce domain.
