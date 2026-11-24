module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    complexity: ["error", 10],
    "max-depth": ["error", 3],
    "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
    "max-params": ["error", 4],
    "no-duplicate-imports": "error",
    eqeqeq: ["error", "smart"],
    "no-var": "error",
    "prefer-const": "error",
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.smoke.ts"],
      rules: { "max-lines-per-function": "off" },
    },
    // WITHDRAWN 2026-09-07 — a rule banning database/network clients from lib/ was drafted here and
    // pulled after testing. It fails on this scaffold's OWN lib/db.ts (`import postgres from
    // 'postgres'`), and on three correctly-placed files in the workbench. Two independent codebases
    // put I/O in lib/, so 'pure logic in lib/, I/O in services/' is aspirational, not the house
    // style — lib/ means unit-testable and injectable. The rule survives only as a workbench-internal
    // test (src/__tests__/lib/convention-declared-model.test.ts), where the structure genuinely does
    // hold. Do not re-add it here until the scaffold's own lib/ boundary is decided. See
    // design/convention-declare-the-model.md §9. (No override object here: it previously carried an
    // empty `files: []`, which ESLint rejects; the note is retained on its own as the tombstone.)
    //
    // CONVENTION: the schema is the source of truth - derive the type, never restate it. A
    // hand-written interface beside a Zod schema is two declarations that can disagree, which is the
    // whole failure this rule exists to prevent. Use `z.infer<typeof X>`.
    {
      files: ["**/schemas/**/*.ts", "**/schema/**/*.ts"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector: "ExportNamedDeclaration > TSInterfaceDeclaration",
            message:
              "Do not export a hand-written interface from a schemas/ directory. Declare the shape once in Zod and export `z.infer<typeof Schema>` - two declarations of one shape will drift.",
          },
        ],
      },
    },
    // CONVENTION: tiers are an ordered declared model, compared through one helper. Scattered string
    // comparison is the model encoded in control flow. Edit the literal list below to match this
    // project's plan names; it is deliberately explicit rather than clever, because a regex that
    // guesses plan names would fire on unrelated strings.
    {
      files: ["**/*.ts", "**/*.tsx"],
      excludedFiles: ["**/lib/tiers.ts", "**/lib/tiers.test.ts", "**/schemas/**"],
      rules: {
        "no-restricted-syntax": [
          "warn",
          {
            selector: "BinaryExpression[operator=/^[=!]==?$/] > Literal[value=/^(free|pro|team|enterprise)$/]",
            message:
              "Compare tiers through tierAtLeast(), not against plan string literals. The ordering is a declared model; a scattered comparison hides it.",
          },
        ],
      },
    },
  ],
};
