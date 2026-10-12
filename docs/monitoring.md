# Sentry

The app initializes Sentry in utils/monitoring.ts and wraps the root layout.
The shared api_client captures network failures and HTTP 5xx without sending
request bodies, response bodies, tokens or file names. The server's X-Request-ID
is used to correlate API errors with backend events. Unhandled JS exceptions
are captured globally with their messages removed and safe stack frame fields.
HTTP transactions are sampled at 10%; automatic network tracing is disabled.

Configure .env.local for local testing or EAS environment variables for builds:

```env
EXPO_PUBLIC_SENTRY_DSN=https://public-key@mobile-ingest-host/project-id
EXPO_PUBLIC_SENTRY_ENVIRONMENT=production
EXPO_PUBLIC_SENTRY_RELEASE=stu-mobile@1.3.0-build-number
SENTRY_ORG=organization-slug
SENTRY_PROJECT=mobile-project-slug
SENTRY_AUTH_TOKEN=build-secret
```

Use the React Native project's DSN. An empty DSN disables transmission.
Never prefix the auth token with EXPO_PUBLIC_. It is a build secret, not
a runtime setting. app.config.js adds the Expo source map upload plugin when
organization and project are supplied. Build a new release and update the
release value for each build; source maps improve production stack traces.
Configure notification rules separately in Sentry's Alerts interface.

eas.json chooses the matching EAS environment explicitly: development builds
report as development, preview as staging, production as production. An ignored
.env.local is prepared for local development with an empty DSN and no build
auth token. Add the actual public DSN, organization and project there; use EAS
environment variables for remote builds (ignored local files are not uploaded).
Set SENTRY_AUTH_TOKEN as an EAS secret and set a unique production release for
each build. These settings do not update an already installed TestFlight app;
a new build is required. They also do not configure Sentry notification rules.

The React Native project's public DSN is set in each eas.json build profile,
so cloud builds do not depend on the ignored local dotenv file. DSN is an
ingestion identifier, not the private SENTRY_AUTH_TOKEN. Do not copy the Go
project DSN here. Source map uploads still require the actual organization and
project slugs plus a private EAS build token; these cannot be inferred from DSN.

After changing the local DSN, restart Metro with `npx expo start --clear`.
For a bundle check, use `npx expo export --platform ios --clear`; a cached
transformation can otherwise retain the previous empty inlined DSN.

Native crashes, screenshots, replay, view hierarchy, automatic breadcrumbs,
sessions and logs are intentionally disabled. Native events can bypass the
JavaScript filter. Current coverage is JS exceptions and shared API requests;
raw fetch calls elsewhere are not instrumented by api_client.
Privacy fields are allowlisted in utils/sentryPrivacy.ts. Original exception
messages, headers, bodies, query strings, arbitrary extras and attachments
are discarded. Also enable IP removal and data scrubbing in Sentry settings.

Check privacy tests with `node --test scripts/sentry-privacy.test.cjs`.

Official setup: https://docs.sentry.io/platforms/react-native/guides/expo/
