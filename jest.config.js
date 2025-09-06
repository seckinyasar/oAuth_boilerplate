/** @type {import('jest').Config} */
const config = {
  //? ts-jest preset for typescript
  preset: "ts-jest",
  //? needed for dom api's
  testEnvironment: "jsdom",
  //? runs setup files before each test
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  //? maps the @/ alias to the src directory
  //? maps the css, less, scss, sass files to identity-obj-proxy
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  //? determines which files to include in the coverage report
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
  ],
  //? it is like .gitignore but for jest. .next/ and node_modules/ are ignored.
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  //? transforms the files to the jest format. js,ts,jsx,tsx files are transformed to ts-jest.
  //? for jsx files, react-jsx is used.
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  //? determines the file extensions that jest will recognize.
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

module.exports = config;
