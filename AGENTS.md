# AI Agent Constraints & System Rules

This file is a permanent set of rules and constraints for all AI coding agents working on the PharmaGuard Registry application. You must strictly adhere to these rules at all times.

## CRITICAL: Database Configuration Lock
1. **NEVER modify the Firestore database initialization logic or pointer.** 
2. The `firestoreDatabaseId` MUST always resolve from `firebase-applet-config.json` via `validConfig.firestoreDatabaseId`.
3. **DO NOT** hardcode the database ID to `"(default)"` under any circumstances.
4. Changing the database ID disrupts live client environments, routes active traffic to empty sandbox databases, and triggers login blockages for patients and pharmacists (such as Allen32 and Damelikian).

## Strict Scope Boundaries
- Do not add visual UI modules, custom pages, or navigation menus unless explicitly and literally requested by the developer.
- Do not modify files in `/src/lib/firebase.ts` or make changes to standard client authentication schemas unless diagnosing an active connection fault.
