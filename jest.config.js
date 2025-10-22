module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    "^.+\\.mjs$": "babel-jest",
  },
  testTimeout: 15000,
  transformIgnorePatterns: [
    "/node_modules/(?!(mongodb-memory-server|bson|mongodb|@testing-library|dom-accessibility-api)/)",
  ],
  moduleFileExtensions: ["mjs", "js", "jsx", "ts", "tsx"],
  setupFilesAfterEnv: [
    "@testing-library/jest-dom",
    "<rootDir>/src/test/setup.js",
  ],
};
