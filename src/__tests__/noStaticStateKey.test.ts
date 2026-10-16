import { noStaticStateKeyRule } from '../rules/noStaticStateKey';
import { createTypedRuleTester } from './ruleTester';

const reported = (key: string) => ({ messageId: 'static-state-key' as const, data: { key } });

const reducer = `const reducer = (state: number = 0) => state;`;

createTypedRuleTester().run('no-static-state-key', noStaticStateKeyRule, {
  valid: [
    `import { defineSegment } from 'redux-sparse-kit';
     ${reducer}
     export const orders = defineSegment({ key: 'orders', reducer });`,
    // A segment without a reducer owns no slice.
    `import { defineSegment } from 'redux-sparse-kit';
     export const routing = defineSegment({ key: 'router', epics: [] });`,
    // A key that is not known to the types.
    `import { defineSegment } from 'redux-sparse-kit';
     ${reducer}
     declare const key: string;
     export const unknown = defineSegment({ key, reducer });`,
    // Not redux-sparse-kit's.
    `import { defineSegment } from './localSegments';
     export const local = defineSegment({ key: 'router', reducer: () => 0 });`,
    // Treated as redux-sparse-kit's, but without a StaticState next to it.
    {
      code: `import { defineSegment } from './localSegments';
             export const local = defineSegment({ key: 'router', reducer: () => 0 });`,
      settings: { 'redux-sparse-kit': { importSources: ['./localSegments'] } },
    },
    {
      code: `import * as local from './localSegments';
             export const local2 = local.defineSegment({ key: 'router', reducer: () => 0 });`,
      settings: { 'redux-sparse-kit': { importSources: ['./localSegments'] } },
    },
    // Returns no segment.
    {
      code: `import { defineSegment } from './notASegment';
             export const nothing = defineSegment({ key: 'router' });`,
      settings: { 'redux-sparse-kit': { importSources: ['./notASegment'] } },
    },
    // Does not type-check: there is no segment to look at.
    `import { defineSegment } from 'redux-sparse-kit';
     // @ts-expect-error the options are missing
     export const broken = defineSegment();`,
  ],
  invalid: [
    {
      code: `import { defineSegment } from 'redux-sparse-kit';
             ${reducer}
             export const routing = defineSegment({ key: 'router', reducer });`,
      errors: [reported('router')],
    },
    {
      code: `import * as sparse from 'redux-sparse-kit';
             ${reducer}
             const KEY = 'session';
             export const session = sparse.defineSegment({ key: KEY, reducer });`,
      errors: [reported('session')],
    },
    {
      code: `import { defineSegment } from 'redux-sparse-kit';
             ${reducer}
             declare const key: 'router' | 'orders' | 'session';
             export const either = defineSegment({ key, reducer });`,
      errors: [reported('router'), reported('session')],
    },
    {
      code: `import { defineSegment } from './barrel';
             ${reducer}
             export const routing = defineSegment({ key: 'router', reducer });`,
      errors: [reported('router')],
      settings: { 'redux-sparse-kit': { importSources: ['./barrel'] } },
    },
  ],
});
