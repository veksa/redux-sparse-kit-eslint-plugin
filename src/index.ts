import type { TSESLint } from '@typescript-eslint/utils';
import { noDefineSegmentInRenderRule } from './rules/noDefineSegmentInRender';
import { noDuplicateSegmentsRule } from './rules/noDuplicateSegments';
import { releaseAcquiredSegmentsRule } from './rules/releaseAcquiredSegments';

const meta = {
  name: 'redux-sparse-kit',
};

const rules = {
  'no-define-segment-in-render': noDefineSegmentInRenderRule,
  'no-duplicate-segments': noDuplicateSegmentsRule,
  'release-acquired-segments': releaseAcquiredSegmentsRule,
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
      'redux-sparse-kit/no-duplicate-segments': 'error',
      'redux-sparse-kit/release-acquired-segments': 'error',
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
