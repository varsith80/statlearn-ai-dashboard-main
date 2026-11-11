import {
  getDatabaseStats,
  getBootstrapState,
  syncStoreKeyToDb,
  executeReadOnlyQuery,
  resetSqliteDatabase,
} from "./db";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith("/api/")) {
    return null;
  }

  try {
    // 1. Health & Database Statistics
    if (path === "/api/health" && request.method === "GET") {
      const stats = await getDatabaseStats();
      return jsonResponse({ status: "ok", ...stats });
    }

    // 2. Full Bootstrap State from SQLite Database
    if (path === "/api/bootstrap" && request.method === "GET") {
      const bootstrap = await getBootstrapState();
      return jsonResponse({ status: "ok", ...bootstrap });
    }

    // 3. Real-Time Store-to-SQLite Synchronization
    if (path === "/api/sync" && request.method === "POST") {
      const body = (await request.json()) as { key?: string; value?: unknown };
      if (!body.key) {
        return jsonResponse({ error: "Missing store key" }, 400);
      }
      await syncStoreKeyToDb(body.key, body.value);
      const stats = await getDatabaseStats();
      return jsonResponse({ status: "synced", key: body.key, stats });
    }

    // 4. Interactive SQL Query Runner (Read-Only SELECT / PRAGMA)
    if (path === "/api/sql" && request.method === "POST") {
      const body = (await request.json()) as { query?: string };
      if (!body.query || !body.query.trim()) {
        return jsonResponse({ error: "SQL query cannot be empty" }, 400);
      }
      const result = await executeReadOnlyQuery(body.query);
      return jsonResponse({ status: "ok", ...result });
    }

    // 5. Factory Reset & Re-Seed SQLite Database
    if (path === "/api/reset" && request.method === "POST") {
      const stats = await resetSqliteDatabase();
      const bootstrap = await getBootstrapState();
      return jsonResponse({ status: "reset", stats, data: bootstrap.data });
    }

    return jsonResponse({ error: `API route not found: ${path}` }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
}
