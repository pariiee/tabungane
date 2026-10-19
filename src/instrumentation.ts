export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startQrisReconcileDaemon } = await import("./lib/qris-reconcile");
    startQrisReconcileDaemon();
  }
}
