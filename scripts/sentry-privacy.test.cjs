const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.join(__dirname, "../utils/sentryPrivacy.ts");
const source = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(source, { exports: exportsObject }, { filename });
const { safeEndpoint, sanitizeSentryEvent } = exportsObject;

function loadMonitoring(fetchImpl, enabled = true) {
  const events = [];
  let options;
  const sdk = {
    init: (value) => { options = value; },
    setUser: () => {},
    startInactiveSpan: () => ({ setStatus: () => {}, end: () => {} }),
    withScope: (callback) => {
      const tags = {};
      sdk.captureEvent = (event) => events.push(options.beforeSend({ ...event, tags }, {}));
      callback({ setTag: (key, value) => { tags[key] = value; } });
    },
  };
  const source = ts.transpileModule(readFileSync(path.join(__dirname, "../utils/monitoring.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports, __DEV__: false, process: { env: { EXPO_PUBLIC_SENTRY_DSN: enabled ? "test" : "" } },
    fetch: fetchImpl,
    require: (name) => name === "@sentry/react-native" ? sdk : exportsObject,
  });
  return { ...exports, events, options };
}

test("endpoint strips identifiers, queries and signed download tokens", () => {
  assert.equal(safeEndpoint("api/v1/projects/private-name?password=secret"), "/api/v1/projects/*");
  assert.equal(safeEndpoint("api/v1/mail/attachments/secret/download"), "/api/v1/mail/*");
  assert.equal(safeEndpoint("api/v1/auth/login?email=secret"), "/api/v1/auth/login");
  assert.equal(safeEndpoint("api/v1/secret"), "<unknown>");
});

test("event allowlist removes secrets and preserves correlation fields", () => {
  const id = "da41b20c-c4ce-44fa-ae92-7d45f2d74297";
  const event = {
    message: "secret", request: { url: "secret", data: "secret", headers: { Authorization: "secret" } },
    extra: { passport: "secret" }, breadcrumbs: [{ message: "secret" }],
    user: { id, email: "secret", ip_address: "secret", phone: "secret" },
    contexts: { device: { name: "secret" } },
    tags: { endpoint: "api/v1/projects/secret", method: "POST", http_status: "500", request_id: id, password: "secret" },
    exception: { values: [{ type: "TypeError", value: "secret", stacktrace: { frames: [{ filename: "/secret/index.bundle?secret", function: "handler", lineno: 42, vars: { password: "secret" }, context_line: "secret" }] } }] },
  };
  const clean = sanitizeSentryEvent(event);
  assert.equal(JSON.stringify(clean).includes("secret"), false);
  assert.equal(clean.user.id, id);
  assert.equal(clean.tags.request_id, id);
  assert.equal(clean.exception.values[0].stacktrace.frames[0].filename, "index.bundle");
  assert.equal(clean.exception.values[0].stacktrace.frames[0].lineno, 42);
});

test("transaction preserves timing and trace IDs without span payloads", () => {
  const clean = sanitizeSentryEvent({
    type: "transaction", transaction: "POST /api/v1/mail/secret", start_timestamp: 1, timestamp: 2,
    spans: [{ description: "secret" }],
    contexts: { trace: { trace_id: "a".repeat(32), span_id: "b".repeat(16), data: { body: "secret" } } },
  });
  assert.equal(clean.transaction, "POST /api/v1/mail/*");
  assert.equal(clean.start_timestamp, 1);
  assert.equal(clean.timestamp, 2);
  assert.equal(clean.contexts.trace.trace_id, "a".repeat(32));
  assert.equal(JSON.stringify(clean).includes("secret"), false);
});

test("arbitrary tag values cannot masquerade as request IDs or statuses", () => {
  const clean = sanitizeSentryEvent({
    tags: { method: "secret", request_id: "secret", http_status: "secret" }, user: { id: "secret" },
  });
  assert.equal(JSON.stringify(clean).includes("secret"), false);
});

test("HTTP failures retain the original response and correlate without reading its body", async () => {
  const id = "da41b20c-c4ce-44fa-ae92-7d45f2d74297";
  const response = { status: 500, headers: { get: () => id } };
  const input = { method: "POST", body: "secret", headers: { Authorization: "Bearer secret" } };
  const monitoring = loadMonitoring(async (url, options) => {
    assert.equal(url, "https://example.com/api/v1/mail/send?secret");
    assert.equal(options, input);
    return response;
  });
  assert.equal(await monitoring.monitoredFetch("https://example.com/api/v1/mail/send?secret", input), response);
  assert.equal(monitoring.events.length, 1);
  assert.equal(monitoring.events[0].tags.request_id, id);
  assert.equal(JSON.stringify(monitoring.events).includes("secret"), false);
});

test("expected HTTP errors and cancelled requests do not emit API issues", async () => {
  const monitoring = loadMonitoring(async () => ({ status: 401, headers: { get: () => null } }));
  await monitoring.monitoredFetch("https://example.com/api/v1/auth/login");
  assert.equal(monitoring.events.length, 0);
  const failure = new Error("secret");
  const cancelled = loadMonitoring(async () => { throw failure; });
  await assert.rejects(cancelled.monitoredFetch("https://example.com/api/v1/projects", { signal: { aborted: true } }), failure);
  assert.equal(cancelled.events.length, 0);
});

test("network failures are reported without the original exception text", async () => {
  const failure = new Error("secret password");
  const monitoring = loadMonitoring(async () => { throw failure; });
  await assert.rejects(monitoring.monitoredFetch("https://example.com/api/v1/projects"), failure);
  assert.equal(monitoring.events.length, 1);
  assert.equal(monitoring.events[0].exception.values[0].type, "NetworkError");
  assert.equal(JSON.stringify(monitoring.events).includes("secret"), false);
});
