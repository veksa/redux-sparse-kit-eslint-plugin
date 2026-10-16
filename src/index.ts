import type { TSESLint } from '@typescript-eslint/utils';
import { noDefineSegmentInRenderRule } from './rules/noDefineSegmentInRender';

const meta = {
  name: 'redux-sparse-kit',
};

const rules = {
  'no-define-segment-in-render': noDefineSegmentInRenderRule,
};

const plugin = { meta, rules };

const recommended: TSESLint.FlatConfig.ConfigArray = [
  {
    name: 'redux-sparse-kit/recommended',
    plugins: {
      'redux-sparse-kit': plugin,
    },
    rules: {
      'redux-sparse-kit/no-define-segment-in-render': 'error',
    },
  },
];

export const reduxSparseKitPlugin = {
  meta,
  rules,
  configs: { recommended },
};

/**
 * The eslintrc engine loads a plugin by name and looks the rules up on the
 * module itself, so `plugins: ['redux-sparse-kit']` needs them exported here.
 * Its configs are flat config arrays, so under eslintrc list the rules
 * directly instead of extending them.
 */
export { meta, rules };
