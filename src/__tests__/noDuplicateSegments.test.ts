import { noDuplicateSegmentsRule } from '../rules/noDuplicateSegments';
import { createRuleTester } from './ruleTester';

const duplicate = (name: string) => ({ messageId: 'duplicate-segment' as const, data: { name } });
const duplicateKey = (key: string) => ({ messageId: 'duplicate-key' as const, data: { key } });

createRuleTester().run('no-duplicate-segments', noDuplicateSegmentsRule, {
  valid: [
    `import { defineSegment } from 'redux-sparse-kit';
     const a = defineSegment({ key: 'a', deps: [b, c, segments.d, segments.e] });
     const f = defineSegment({ key: \`f\`, deps });
     const g = defineSegment({ key: 'g', deps: [...list, ...list, make(), make(), , ] });
     const h = defineSegment({ key, deps: [] });
     const i = defineSegment({ key: prefix + 'x', [deps]: [b, b], 'deps': [b] });
     const j = defineSegment(options);
     const k = defineSegment({ key: 1, ...rest });
     const l = defineSegment({ key: \`\${prefix}l\` });
     const m = defineSegment();`,
    `import { SparseScope, useSparseSegments } from 'redux-sparse-kit/react';
     useSparseSegments([a, b]);
     useSparseSegments(list);
     useSparseSegments();
     const page = <SparseScope segments={[a, b]} fallback={[a, a]} {...props} />;
     const other = <SparseScope segments={list} />;
     const empty = <SparseScope segments />;
     const named = <SparseScope segments="a" />;`,
    `store.sparse.acquire(a, b);
     sparse.acquire(a, b);
     store.sparse.release(a, a);
     store.other.acquire(a, a);
     store['sparse'].acquire(a, a);
     store.sparse['acquire'](a, a);
     acquire(a, a);
     getStore().sparse.acquire(a, b);`,
    // Not redux-sparse-kit's.
    `defineSegment({ key: 'a' }); defineSegment({ key: 'a', deps: [b, b] });
     useSparseSegments([a, a]);
     const page = <SparseScope segments={[a, a]} />;
     const other = <div segments={[a, a]} />;`,
  ],
  invalid: [
    {
      code: `import { defineSegment } from 'redux-sparse-kit';
             const page = defineSegment({ key: 'page', deps: [orders, prices, orders] });
             const nested = defineSegment({ key: 'nested', 'deps': [segments.a, segments.a] });`,
      errors: [duplicate('orders'), duplicate('segments.a')],
    },
    {
      code: `import { defineSegment } from 'redux-sparse-kit';
             export const a = defineSegment({ key: 'orders' });
             export const b = defineSegment({ key: \`orders\` });
             export const c = defineSegment({ 'key': 'orders' });`,
      errors: [duplicateKey('orders'), duplicateKey('orders')],
    },
    {
      code: `import { SparseScope, useSparseSegments } from 'redux-sparse-kit/react';
             useSparseSegments([orders, orders]);
             const page = <SparseScope segments={[orders, prices, prices]} />;`,
      errors: [duplicate('orders'), duplicate('prices')],
    },
    {
      code: `store.sparse.acquire(orders, prices, orders);
             sparse.acquire(prices, prices);
             getStore().sparse.acquire(a, a);`,
      errors: [duplicate('orders'), duplicate('prices'), duplicate('a')],
    },
  ],
});
