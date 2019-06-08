module.exports = {
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "sourceType": "module"
  },
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "plugins": [
    "flowtype",
    "import",
    "prettier"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:flowtype/recommended",
    "plugin:import/errors",
    "prettier",
    "prettier/flowtype",
  ],
  "globals": {
    "process": true
  },
  "rules": {
    "prettier/prettier": [
      2,
      {
        "trailingComma": "none",
        "singleQuote": true,
        "semi": true,
        "printWidth": 120
      }
    ],
    "import/newline-after-import": 2,
    "import/imports-first": 2,
    "import/no-dynamic-require": 2,
    "import/no-extraneous-dependencies": 2,
    "import/no-mutable-exports": 2,
    "flowtype/define-flow-type": 1,
    "flowtype/no-dupe-keys": 2,
    "flowtype/no-primitive-constructor-types": 2,
    "flowtype/object-type-delimiter": [
      2,
      "comma"
    ],
    "flowtype/require-parameter-type": [
      2,
      {"excludeArrowFunctions": true}
    ],
    "flowtype/require-valid-file-annotation": [
      1,
      "always",
      {"annotationStyle": "block"}
    ],
    "flowtype/space-after-type-colon": 2,
    "flowtype/space-before-type-colon": [
      2,
      "never"
    ],
    "flowtype/space-before-generic-bracket": [
      2,
      "never"
    ],
    "no-unused-vars": [
      "error",
      { "args": "all", "argsIgnorePattern": "^_" }
    ],
  }
}
