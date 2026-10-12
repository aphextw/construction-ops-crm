import type { Event } from "@sentry/react-native";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const resources = new Set([
  "auth", "projects", "users", "me", "workers", "materials", "material-sets",
  "measurement-units", "counterparties", "shops", "mail", "analytics", "roles", "companies", "audit-logs",
]);
const errorTypes = new Set(["Error", "TypeError", "ReferenceError", "RangeError", "SyntaxError", "NetworkError", "HTTPServerError"]);

export function safeEndpoint(url: string): string {
  const parts = url.split(/[?#]/)[0].replace(/^\/+/, "").split("/");
  if (parts[0] !== "api" || parts[1] !== "v1" || !resources.has(parts[2])) {
    return "<unknown>";
  }
  if (parts[2] === "auth" && ["login", "refresh", "logout", "register"].includes(parts[3])) {
    return `/api/v1/auth/${parts[3]}`;
  }
  return `/api/v1/${parts[2]}${parts.length > 3 ? "/*" : ""}`;
}

function safeFilename(filename?: string): string | undefined {
  if (!filename) return undefined;
  const basename = filename.split(/[?#]/)[0].replace(/\\/g, "/").split("/").pop();
  return filename.startsWith("app:///") ? `app:///${basename}` : basename;
}

// Build a fresh event: request bodies, tokens, breadcrumbs and error messages are never copied.
export function sanitizeSentryEvent<T extends Event>(event: T): T {
  const tags: NonNullable<Event["tags"]> = {};
  if (typeof event.tags?.endpoint === "string") tags.endpoint = safeEndpoint(event.tags.endpoint);
  if (typeof event.tags?.method === "string" && /^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/.test(event.tags.method)) tags.method = event.tags.method;
  if (typeof event.tags?.http_status === "string" && /^[1-5]\d{2}$/.test(event.tags.http_status)) tags.http_status = event.tags.http_status;
  if (typeof event.tags?.request_id === "string" && uuidPattern.test(event.tags.request_id)) tags.request_id = event.tags.request_id;

  const clean: Event = {
    event_id: event.event_id, timestamp: event.timestamp, start_timestamp: event.start_timestamp,
    type: event.type, level: event.level, platform: event.platform,
    environment: event.environment, release: event.release, dist: event.dist, sdk: event.sdk, tags,
    user: event.user?.id && uuidPattern.test(String(event.user.id)) ? { id: event.user.id } : undefined,
    transaction: tags.endpoint ? `${String(tags.method || "GET")} ${String(tags.endpoint)}` : "mobile",
  };
  if (event.type === "transaction" && typeof event.transaction === "string") {
    const [method, endpoint] = event.transaction.split(" ");
    clean.transaction = `${/^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS|OTHER)$/.test(method) ? method : "OTHER"} ${safeEndpoint(endpoint || "")}`;
  }
  if (event.exception?.values) {
    if (tags.endpoint) {
      clean.fingerprint = ["{{ default }}", String(tags.method || "GET"), String(tags.endpoint), String(tags.http_status || "")];
    }
    clean.exception = {
      values: event.exception.values.map((exception) => ({
        type: exception.type && errorTypes.has(exception.type) ? exception.type : "Error",
        value: "Details removed for privacy",
        mechanism: exception.mechanism ? { type: "generic", handled: exception.mechanism.handled } : undefined,
        stacktrace: exception.stacktrace ? {
          frames: exception.stacktrace.frames?.map((frame) => ({
            filename: safeFilename(frame.filename), function: frame.function,
            lineno: frame.lineno, colno: frame.colno, in_app: frame.in_app,
          })),
        } : undefined,
      })),
    };
  }
  const trace = event.contexts?.trace;
  if (trace && typeof trace.trace_id === "string" && /^[0-9a-f]{32}$/i.test(trace.trace_id) &&
      typeof trace.span_id === "string" && /^[0-9a-f]{16}$/i.test(trace.span_id)) {
    clean.contexts = { trace: { trace_id: trace.trace_id, span_id: trace.span_id, op: "http.client" } };
  }
  if (event.debug_meta?.images) {
    clean.debug_meta = { images: event.debug_meta.images.filter((image) =>
      image.type === "sourcemap" && image.debug_id && uuidPattern.test(image.debug_id),
    ).map((image) => ({ type: "sourcemap", debug_id: image.debug_id, code_file: safeFilename(image.code_file) || "index.bundle" })) };
  }
  return clean as T;
}
