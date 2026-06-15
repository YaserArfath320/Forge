# TODO

- [x] Identify SSE mismatch between `app/api/gen-ai-code/route.ts` and `components/workspaceClient.tsx` (server sends `complete`, client was waiting for `done`).
- [x] Fix client SSE handler to handle `event.type === "complete"` and use `event.credits`.
- [ ] Run `npm run dev` and verify generation completes and code panel updates.
- [ ] If workspace URL is still not updated when creating a new workspace, update SSE server to also return `workspaceId` (currently client does not receive it).

