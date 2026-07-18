# Permission Resource Naming Note

## Metadata
- **Scope**: AILOS v3.2.0 — Permission Manager v1.0
- **Date**: 2026-07-18
- **Status**: Formal Definition — To be included in global AILOS Terminology Glossary

## Background

During the TEST VERIFICATION phase of Permission Manager, a Non-Blocking Observation was raised regarding the Seed data permission resource names `community:read` and `community:write`. The term "community" appears in a deleted track of Dual-Track Evolution (only Personal + Platform remain), creating potential semantic ambiguity.

## Formal Definition

### community (Resource Domain)

**Definition**: `community` is a **business resource domain** in the Permission Manager's RBAC model. It represents the functional module scope for community / social interaction features within the AILOS platform.

**Semantic Layer**: Resource Domain (业务资源域) — belongs to the Permission Model semantic layer.

**Usage**: 
- Permission codes: `community:read`, `community:write`
- Resource field: `resource = "community"`
- Action fields: `read`, `write`

### Community Evolution Track (Dual-Track)

**Definition**: The "Community Evolution" track was a third evolutionary track in an earlier version of Dual-Track Evolution. It has been **deleted** in v3.2.0. Only **Personal** and **Platform** tracks remain.

**Semantic Layer**: Evolution Track (进化轨道) — belongs to the Architecture Constitution semantic layer.

## Conclusion

**community:read ≠ Community Evolution Track**

The `community` resource domain in Permission Manager and the "Community Evolution" track in Dual-Track Evolution are **completely different semantic layers** with no logical association:

| Aspect | community (Resource Domain) | Community Evolution (Track) |
|--------|---------------------------|---------------------------|
| Semantic Layer | Permission Model | Architecture Constitution |
| Scope | Business function module | Product evolution trajectory |
| Status | Active (used in Seed data) | Deleted (v3.2.0) |
| Represented by | `resource: "community"` | *(no representation — deleted)* |

## Decision

- **Naming**: `community:read` / `community:write` retained as-is
- **Rationale**: The resource domain naming is unambiguous within the Permission Model context. No AI tool should conflate a resource domain string with an evolution track.
- **Future**: This distinction will be formally documented in the global AILOS Terminology Glossary to prevent similar ambiguity across all modules.

## Cross-Reference

- AILOS v3.2.0 Architecture Constitution — Dual-Track Evolution (Personal + Platform)
- Permission Manager v1.0 Design — RBAC Model
- TEST VERIFICATION Report — Non-Blocking Observation (Seed Resource Naming Review)