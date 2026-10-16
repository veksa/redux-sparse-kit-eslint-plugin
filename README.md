# eslint-plugin-redux-sparse-kit

[![npm version](https://img.shields.io/npm/v/eslint-plugin-redux-sparse-kit.svg?style=flat-square)](https://www.npmjs.com/package/eslint-plugin-redux-sparse-kit)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE.md)

ESLint rules for [redux-sparse-kit](https://github.com/veksa/redux-sparse-kit):
mistakes with segments and scopes that types cannot see, caught in the editor
instead of at runtime.

## Installation

```bash
npm install --save-dev eslint-plugin-redux-sparse-kit
# or
yarn add --dev eslint-plugin-redux-sparse-kit
```

Requires ESLint 8.57 or later. `no-static-state-key` needs type information,
which comes from `@typescript-eslint/parser` 8 and TypeScript 5.4 to 6.0.

## Usage

`eslint.config.js`:

```js
import { reduxSparseKitPlugin } from 'eslint-plugin-redux-sparse-kit';

export default [
  // ...
  ...reduxSparseKitPlugin.configs.recommended,
];
```

With type information, use `recommended-type-checked`, which adds the rules
that need it:

```js
import tseslint from 'typescript-eslint';
import { reduxSparseKitPlugin } from 'eslint-plugin-redux-sparse-kit';

export default [
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  ...reduxSparseKitPlugin.configs['recommended-type-checked'],
];
```

| Config                     | Rules                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `recommended`              | `no-define-segment-in-render`, `no-duplicate-segments`, `release-acquired-segments` |
| `recommended-type-checked` | the above and `no-static-state-key`                                                 |

The configs are flat config arrays. Under eslintrc, add the plugin and list the
rules:

```json
{
  "plugins": ["redux-sparse-kit"],
  "rules": {
    "redux-sparse-kit/no-define-segment-in-render": "error",
    "redux-sparse-kit/no-duplicate-segments": "error",
    "redux-sparse-kit/release-acquired-segments": "error"
  }
}
```

### Settings

The rules find redux-sparse-kit's API by its imports from `redux-sparse-kit`
and `redux-sparse-kit/react`, renamed or not, through namespace imports, and
through what `createSparseReact()` returns. When an application re-exports the
API from a module of its own, name that module:

```js
{
  settings: {
    'redux-sparse-kit': { importSources: ['@app/state'] },
  },
}
```

## Rules

### `no-define-segment-in-render`

A segment is identified by the object `defineSegment` returns. Defined inside a
component or a hook, it is a new segment on every render: scopes acquire it
again, and the store refuses a second segment under a key that is still
present.

```tsx
// ✗
function OrdersPage() {
  const orders = defineSegment({ key: 'orders', reducer });
  return <SparseScope segments={[orders]} />;
}

// ✓
const orders = defineSegment({ key: 'orders', reducer });

function OrdersPage() {
  return <SparseScope segments={[orders]} />;
}
```

Functions that are neither components nor hooks are left alone, so a factory
that defines segments at module scope is fine:

```ts
const createListSegment = (key: string) => defineSegment({ key, reducer: listReducer });

export const orders = createListSegment('orders');
```

Components and hooks are told by their names: a function, or the variable or
wrapper call it is assigned to, named in PascalCase or `useSomething`, and
class `render` methods.

### `no-duplicate-segments`

Reports a segment listed twice in `deps`, in a `SparseScope`'s `segments`, in
`useSparseSegments([...])` and in `store.sparse.acquire(...)`, and two
segments defined with the same literal key in one file.

```tsx
// ✗
defineSegment({ key: 'page', deps: [orders, prices, orders] });
<SparseScope segments={[orders, orders]} />;

export const a = defineSegment({ key: 'orders', reducer });
export const b = defineSegment({ key: 'orders', reducer: otherReducer });
```

Segments are compared by their references, such as `orders` or
`segments.orders`; keys built at runtime are not compared.

### `release-acquired-segments`

`store.sparse.acquire(...)` returns the function that releases what it
acquired. Discarding it keeps the segments in the store for good.

```ts
// ✗
store.sparse.acquire(orders);

useEffect(() => {
  store.sparse.acquire(orders);
}, []);

// ✓
const release = store.sparse.acquire(orders);

useEffect(() => store.sparse.acquire(orders), []);
```

Calls are recognised as `<something>.sparse.acquire(...)` and
`sparse.acquire(...)`.

### `no-static-state-key`

_Needs type information._ A segment with a reducer cannot use a key of the
static state: the store refuses to acquire it. The rule reads the segment's key
and reducer from its type, and the static state from `StaticState` as the
application registers it:

```ts
declare module 'redux-sparse-kit' {
  interface StaticState {
    router: RouterState;
  }
}

// ✗
export const routing = defineSegment({ key: 'router', reducer: routingReducer });

// ✓ a segment without a reducer owns no slice
export const routing = defineSegment({ key: 'router', epics: [routingEpic] });
```

Keys typed as a union of literals are checked one by one; keys typed as
`string` are not known and not checked.

## License

[MIT](LICENSE.md)
