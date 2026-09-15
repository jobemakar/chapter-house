/** Optional, read-only diagnostics for local playtesting tools. No mutation API. */
export class LocalDiagnostics {
  constructor(read: () => unknown) {
    const context = (
      document as Document & {
        modelContext?: { registerTool: (tool: unknown) => unknown };
      }
    ).modelContext;
    try {
      if (context?.registerTool)
        Promise.resolve(
          context.registerTool({
            name: "read_chapter_house_status",
            description:
              "Read the current local clubhouse and Wishbone playtest status without changing it.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: read,
          }),
        ).catch(() => {});
    } catch {}
  }
}
