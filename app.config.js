module.exports = ({ config }) => {
  const organization = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;
  if (!organization || !project) return config;
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      ["@sentry/react-native/expo", { organization, project, url: "https://sentry.io/" }],
    ],
  };
};
