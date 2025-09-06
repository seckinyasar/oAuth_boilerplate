// // Mock Sentry for Jest tests
// module.exports = {
//   captureException: jest.fn(),
//   captureMessage: jest.fn(),
//   withSentryConfig: (config) => config,
//   init: jest.fn(),
//   getCurrentHub: jest.fn(() => ({
//     getClient: jest.fn(),
//     getScope: jest.fn(),
//   })),
//   addBreadcrumb: jest.fn(),
//   setContext: jest.fn(),
//   setTag: jest.fn(),
//   setUser: jest.fn(),
//   setLevel: jest.fn(),
//   configureScope: jest.fn(),
//   withScope: jest.fn(),
//   flush: jest.fn(),
//   close: jest.fn(),
// };
