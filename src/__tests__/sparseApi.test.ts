import { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getSparseApi } from '../utils/sparseApi';
import { createRuleTester } from './ruleTester';

/** Reports what every call and JSX element resolves to. */
const resolveRule: TSESLint.RuleModule<'resolved', []> = {
  defaultOptions: [],
  meta: { messages: { resolved: '{{name}}' }, schema: [], type: 'problem' },
  create(context) {
    const api = getSparseApi(context);
    const report = (node: TSESTree.Node) => {
      const name = api.resolve(node);
      if (name) {
        context.report({ messageId: 'resolved', node, data: { name } });
      }
    };
    return {
      CallExpression: (node) => report(node.callee),
      JSXOpeningElement: (node) => report(node.name),
    };
  },
};

const resolved = (...names: string[]) =>
  names.map((name) => ({ messageId: 'resolved' as const, data: { name } }));

createRuleTester().run('sparse API', resolveRule, {
  valid: [
    `defineSegment(); useSparseSegments(); <SparseScope />;`,
    `import { defineSegment, useSparseSegments } from 'other';
         defineSegment(); useSparseSegments();`,
    `import { other } from 'redux-sparse-kit'; other();`,
    `import def from 'redux-sparse-kit'; def();`,
    `import * as sparse from 'redux-sparse-kit';
         sparse.other(); sparse['defineSegment'](); other.defineSegment(); sparse.inner.defineSegment();
         <sparse.Other />; <sparse.inner.SparseScope />; <other.SparseScope />;`,
    `const custom = createSparseReact(); <custom.SparseScope />;`,
  ],
  invalid: [
    {
      // None of these bind the members of the factory's result.
      code: `import { createSparseReact } from 'redux-sparse-kit/react';
         createSparseReact().defineSegment();
         const [first] = createSparseReact();
         const { other, ...rest } = createSparseReact();
         const { SparseScope: { inner } } = createSparseReact();
         const { ['SparseScope']: computed } = createSparseReact();
         const notFactory = other();
         let unset;
         other(); rest(); computed(); inner();`,
      errors: resolved(
        'createSparseReact',
        'createSparseReact',
        'createSparseReact',
        'createSparseReact',
        'createSparseReact',
      ),
    },
    {
      code: `import { defineSegment as define, useSparseSegments, SparseScope } from 'redux-sparse-kit/react';
                   define(); useSparseSegments(); <SparseScope />;`,
      errors: resolved('defineSegment', 'useSparseSegments', 'SparseScope'),
    },
    {
      code: `import { 'defineSegment' as define } from 'redux-sparse-kit';
                   define();`,
      errors: resolved('defineSegment'),
    },
    {
      code: `import * as sparse from 'redux-sparse-kit/react';
                   sparse.useSparseSegments(); <sparse.SparseScope />;`,
      errors: resolved('useSparseSegments', 'SparseScope'),
    },
    {
      code: `import { createSparseReact as create } from 'redux-sparse-kit/react';
                   const custom = create({ checks: true });
                   const { SparseScope, useSparseSegments: useSegments } = create();
                   custom.useSparseSegments(); <custom.SparseScope />; useSegments(); <SparseScope />;
                   create().useSparseSegments();`,
      errors: resolved(
        'createSparseReact',
        'createSparseReact',
        'useSparseSegments',
        'SparseScope',
        'useSparseSegments',
        'SparseScope',
        'useSparseSegments',
        'createSparseReact',
      ),
    },
    {
      code: `import { defineSegment } from 'app/state';
                   defineSegment();`,
      errors: resolved('defineSegment'),
      settings: { 'redux-sparse-kit': { importSources: ['app/state'] } },
    },
  ],
});
