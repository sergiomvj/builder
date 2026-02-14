# Project Goals — builder (Virtual Company Manager / Personas + N8N)

This document is the **source of truth** for what this project is for.
Any implementation must be evaluated against these goals.

## 1) Mission
Build an orchestration platform to run **virtual companies** (personas + workflows) that execute tasks through **automation (N8N + subsystems)** while being governed by **measurable real-world goals**, **internal communications**, and **hierarchical supervision**.

## 2) Core goals (must-have)
1. **Goal-driven execution (real-world measurable)**
   - Objectives must be tangible and measurable outside the system.
   - Connect tasks to KPIs and feedback loops.

2. **Inter-persona communications**
   - Persist and route handoffs, notifications, questions, and approval requests.
   - Communication must be auditable (status, timestamps, payloads).

3. **Hierarchical supervision chains**
   - Define supervision per task and escalation rules.
   - Support approvals, timeouts, and escalation to higher levels.

4. **Human-in-the-loop interface (structured, low-cost)**
   - User interventions should be **structured templates** (not free-form LLM dependence).
   - Allow adding tasks, parameterizing goals, approving/rejecting, redirecting workflows.

5. **Automation-first architecture**
   - N8N workflows should be the execution substrate.
   - The platform coordinates, supervises, and logs.

## 3) Non-goals
- A fully autonomous system that ignores human oversight.
- Depending on paid LLMs for every interaction; LLMs are optional accelerators, not a hard dependency.

## 4) Decision rule (“Should we do this?”)
Approve changes if they:
- improve measurability or accountability,
- strengthen communications/supervision, or
- reduce ambiguity via structured templates,
- improve the reliability of workflow execution.

Defer/reject if they:
- add automation without governance/supervision,
- increase ambiguity or remove audit trails.
