import { noDefineSegmentInRenderRule } from '../rules/noDefineSegmentInRender';
import { createRuleTester } from './ruleTester';

const ruleTester = createRuleTester();

const errors = [{ messageId: 'define-segment-in-render' as const }];

ruleTester.run('no-define-segment-in-render', noDefineSegmentInRenderRule, {
  valid: [
    // At module scope.
    `import { defineSegment } from 'redux-sparse-kit';
         export const orders = defineSegment({ key: 'orders', reducer });`,
    // In a factory called at module scope.
    `import { defineSegment } from 'redux-sparse-kit';
         const createList = (key) => defineSegment({ key, reducer });
         function makeSegment(key) { return defineSegment({ key }); }
         export const orders = createList('orders');`,
    // In a function immediately invoked at module scope.
    `import { defineSegment } from 'redux-sparse-kit';
         export const orders = (() => defineSegment({ key: 'orders' }))();`,
    // In an anonymous function, which is neither a component nor a hook.
    `import { defineSegment } from 'redux-sparse-kit';
         export default () => defineSegment({ key: 'orders' });`,
    // A defineSegment that is not redux-sparse-kit's.
    `import { defineSegment } from './segments';
         function Page() { defineSegment({ key: 'orders' }); return null; }`,
    `function Page() { defineSegment({ key: 'orders' }); return null; }`,
  ],
  invalid: [
    {
      code: `import { defineSegment } from 'redux-sparse-kit';
                   function OrdersPage() { const orders = defineSegment({ key: 'orders' }); return null; }`,
      errors,
    },
    {
      code: `import { defineSegment } from 'redux-sparse-kit';
                   const OrdersPage = () => <SparseScope segments={[defineSegment({ key: 'orders' })]} />;`,
      errors,
    },
    {
      code: `import { memo } from 'react';
                   import { defineSegment } from 'redux-sparse-kit';
                   const OrdersPage = memo(() => { defineSegment({ key: 'orders' }); return null; });`,
      errors,
    },
    {
      code: `import { defineSegment } from 'redux-sparse-kit';
                   function useOrders() { return useMemo(() => defineSegment({ key: 'orders' }), []); }`,
      errors,
    },
    {
      code: `import { defineSegment } from 'redux-sparse-kit';
                   const hooks = { useOrders() { return defineSegment({ key: 'orders' }); } };`,
      errors,
    },
    {
      code: `import { defineSegment } from 'redux-sparse-kit';
                   class OrdersPage extends Component { render() { defineSegment({ key: 'orders' }); return null; } }`,
      errors,
    },
    {
      code: `import { defineSegment as define } from 'redux-sparse-kit';
                   const OrdersPage = function () { define({ key: 'orders' }); return null; };`,
      errors,
    },
    {
      code: `import * as sparse from 'redux-sparse-kit';
                   function OrdersPage() { sparse.defineSegment({ key: 'orders' }); return null; }`,
      errors,
    },
    {
      code: `import { defineSegment } from '@app/state';
                   function OrdersPage() { defineSegment({ key: 'orders' }); return null; }`,
      errors,
      settings: { 'redux-sparse-kit': { importSources: ['@app/state'] } },
    },
  ],
});
