import * as Sentry from "@sentry/react-native";
import { safeEndpoint, sanitizeSentryEvent } from "./sentryPrivacy";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment:
    process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ||
    (__DEV__ ? "development" : "production"),
  release: process.env.EXPO_PUBLIC_SENTRY_RELEASE || "stu-mobile@1.3.0",
  sendDefaultPii: false,
  // Native SDK events bypass the JS privacy filter, so use the JS transport only.
  enableNative: true,
  enableNativeCrashHandling: true,
  enableAutoSessionTracking: false,
  enableAutoPerformanceTracing: false,
  enableCaptureFailedRequests: false,
  enableLogs: false,
  attachScreenshot: false,
  attachViewHierarchy: false,
  tracesSampleRate: 0.1,
  integrations: (integrations) =>
    integrations.filter(
      (integration) =>
        ![
          "Breadcrumbs",
          "HttpContext",
          "HttpClient",
          "ReactNativeTracing",
          "ExpoRouter",
        ].includes(integration.name),
    ),
  beforeBreadcrumb: () => null,
  beforeSend: (event, hint) => {
    hint.attachments = [];
    return sanitizeSentryEvent(event);
  },
  beforeSendTransaction: (event, hint) => {
    hint.attachments = [];
    return sanitizeSentryEvent(event);
  },
});

export function setMonitoringUser(id?: string) {
  Sentry.setUser(id ? { id } : null);
}

export async function monitoredFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  if (!dsn) return fetch(url, options);
  const endpoint = safeEndpoint(url.replace(/^https?:\/\/[^/]+\//, ""));
  const method = /^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/.test(
    options.method || "GET",
  )
    ? options.method || "GET"
    : "OTHER";
  const span = Sentry.startInactiveSpan({
    name: `${method} ${endpoint}`,
    op: "http.client",
    forceTransaction: true,
  });
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    if (!options.signal?.aborted) {
      Sentry.withScope((scope) => {
        scope.setTag("endpoint", endpoint);
        scope.setTag("method", method);
        Sentry.captureEvent({
          exception: {
            values: [{ type: "NetworkError", value: "Network request failed" }],
          },
          level: "error",
        });
      });
    }
    span?.setStatus({ code: 2 });
    span?.end();
    throw error;
  }
  const requestID = response.headers.get("X-Request-ID");
  if (response.status >= 500) {
    Sentry.withScope((scope) => {
      scope.setTag("endpoint", endpoint);
      scope.setTag("method", method);
      scope.setTag("http_status", String(response.status));
      if (requestID) scope.setTag("request_id", requestID);
      Sentry.captureEvent({
        exception: {
          values: [{ type: "HTTPServerError", value: "API server error" }],
        },
        level: "error",
      });
    });
  }
  span?.setStatus({ code: response.status >= 500 ? 2 : 1 });
  span?.end();
  return response;
}

export { Sentry };
