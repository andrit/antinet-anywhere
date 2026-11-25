/**
 * Server startup hook. Next runs `register()` once per server instance, in BOTH the Node.js and Edge
 * runtimes, so the Node-only work (which pulls in the mongodb driver) lives in a separate module that
 * is dynamically imported only under the Node.js runtime guard — this keeps the mongodb driver out of
 * the Edge bundle. See instrumentation.node.ts.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}
