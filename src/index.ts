import type { TSESLint } from '@typescript-eslint/utils';
import { noDefineSegmentInRenderRule } from './rules/noDefineSegmentInRender';
import { noDuplicateSegmentsRule } from './rules/noDuplicateSegments';
import { noStaticStateKeyRule } from './rules/noStaticStateKey';
import { releaseAcquiredSegmentsRule } from './rules/releaseAcquiredSegments';

const meta = {
  name: 'redux-sparse-kit',
};

const rules = {
  'no-define-segment-in-render': noDefineSegmentInRenderRule,
  'no-duplicate-segments': noDuplicateSegmentsRule,
  'no-static-state-key': noStaticStateKeyRule,
  'release-acquired-segments': releaseAcquiredSegmentsRule,
};

const plugin = { meta, rules };

/** The rules that need no type information. */
const recommended: TSESLint.FlatConfig.ConfigArray = [
  {
    name: 'redux-sparse-kit/recommended',
    plugins: {
      'redux-sparse-kit': plugin,
    },
    rules: {
      'redux-sparse-kit/no-define-segment-in-render': 'error',
      'redux-sparse-kit/no-duplicate-segments': 'error',
      'redux-sparse-kit/release-acquired-segments': 'error',
    },
  },
];

/** Every rule, for projects linted with type information. */
const recommendedTypeChecked: TSESLint.FlatConfig.ConfigArray = [
  ...recommended,
  {
    name: 'redux-sparse-kit/recommended-type-checked',
    rules: {
      'redux-sparse-kit/no-static-state-key': 'error',
    },
  },
];

export const reduxSparseKitPlugin = {
  meta,
  rules,
  configs: {
    recommended,
    'recommended-type-checked': recommendedTypeChecked,
  },
};

/**
 * The eslintrc engine loads a plugin by name and looks the rules up on the
 * module itself, so `plugins: ['redux-sparse-kit']` needs them exported here.
 * Its configs are flat config arrays, so under eslintrc list the rules
 * directly instead of extending them.
 */
export { meta, rules };
