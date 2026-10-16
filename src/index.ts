import type { TSESLint } from '@typescript-eslint/utils';

const meta = {
  name: 'redux-sparse-kit',
};

const rules: Record<string, TSESLint.RuleModule<string, unknown[]>> = {};

const plugin = { meta, rules };

export const reduxSparseKitPlugin = {
  configs: {},
  meta,
  rules,
};

export { meta, rules, plugin };
