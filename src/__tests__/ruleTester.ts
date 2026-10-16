import { resolve } from 'path';
import { RuleTester } from '@typescript-eslint/rule-tester';
import tsParser from '@typescript-eslint/parser';

/** A rule tester for rules that need no type information. */
export const createRuleTester = (): RuleTester =>
  new RuleTester({
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  });

/**
 * A rule tester for rules that need type information. Every test lints
 * `fixtures/file.ts`, part of the program `tsconfig.eslint.json` describes,
 * next to the fixtures it can import.
 */
export const createTypedRuleTester = (): RuleTester => {
  const tsconfigRootDir = resolve(__dirname, '../../');
  const tester = new RuleTester({
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        project: resolve(tsconfigRootDir, 'tsconfig.eslint.json'),
        sourceType: 'module',
        tsconfigRootDir,
      },
    },
  });

  const filename = 'fixtures/file.ts';
  const run = tester.run.bind(tester);

  tester.run = (name, rule, { valid, invalid }) =>
    run(name, rule, {
      valid: valid.map((test) =>
        typeof test === 'string' ? { code: test, filename } : { ...test, filename },
      ),
      invalid: invalid.map((test) => ({ ...test, filename })),
    });

  return tester;
};
