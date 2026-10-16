import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';

/** The redux-sparse-kit exports the rules recognise. */
export type SparseExport =
  | 'defineSegment'
  | 'createSparseReact'
  | 'SparseScope'
  | 'useSparseSegments';

/** The modules redux-sparse-kit's API is imported from by default. */
export const defaultImportSources: readonly string[] = [
  'redux-sparse-kit',
  'redux-sparse-kit/react',
];

/** Shared settings: `settings['redux-sparse-kit']` in an ESLint config. */
export interface SparseSettings {
  /**
   * Further modules that re-export redux-sparse-kit's API, such as an
   * application's own barrel module.
   */
  importSources?: string[];
}

export interface SparseApi {
  /** Which export `node` refers to, if any. */
  resolve(node: TSESTree.Node): SparseExport | undefined;
}

const sparseExports: ReadonlySet<string> = new Set<SparseExport>([
  'defineSegment',
  'createSparseReact',
  'SparseScope',
  'useSparseSegments',
]);

const isSparseExport = (name: string): name is SparseExport => sparseExports.has(name);

/** The members of `createSparseReact`'s result. */
const reactMembers: ReadonlySet<string> = new Set(['SparseScope', 'useSparseSegments']);

/**
 * Finds the names a file binds to redux-sparse-kit's API: named imports, with
 * or without an alias, namespace imports, and the members of the bindings
 * `createSparseReact()` returns.
 */
export function getSparseApi(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>,
): SparseApi {
  const settings = context.settings['redux-sparse-kit'] as SparseSettings | undefined;
  const sources = new Set([...defaultImportSources, ...(settings?.importSources ?? [])]);

  // Local names bound to an export.
  const named = new Map<string, SparseExport>();
  // Local names bound to the whole module, or to a `createSparseReact()` result.
  const namespaces = new Set<string>();

  const isReactFactoryCall = (node: TSESTree.Node | null | undefined): boolean =>
    node?.type === AST_NODE_TYPES.CallExpression && resolve(node.callee) === 'createSparseReact';

  const resolve = (node: TSESTree.Node): SparseExport | undefined => {
    if (node.type === AST_NODE_TYPES.Identifier) {
      return named.get(node.name);
    }

    if (
      node.type === AST_NODE_TYPES.MemberExpression &&
      !node.computed &&
      node.property.type === AST_NODE_TYPES.Identifier &&
      isSparseExport(node.property.name)
    ) {
      const { object } = node;
      if (object.type === AST_NODE_TYPES.Identifier && namespaces.has(object.name)) {
        return node.property.name;
      }
      if (isReactFactoryCall(object) && reactMembers.has(node.property.name)) {
        return node.property.name;
      }
    }

    if (
      node.type === AST_NODE_TYPES.JSXMemberExpression &&
      node.object.type === AST_NODE_TYPES.JSXIdentifier &&
      namespaces.has(node.object.name) &&
      node.property.name === 'SparseScope'
    ) {
      return 'SparseScope';
    }

    if (node.type === AST_NODE_TYPES.JSXIdentifier) {
      return named.get(node.name);
    }

    return undefined;
  };

  for (const statement of context.sourceCode.ast.body) {
    if (
      statement.type !== AST_NODE_TYPES.ImportDeclaration ||
      !sources.has(statement.source.value)
    ) {
      continue;
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
        namespaces.add(specifier.local.name);
      } else if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
        const imported =
          specifier.imported.type === AST_NODE_TYPES.Identifier
            ? specifier.imported.name
            : specifier.imported.value;
        if (isSparseExport(imported)) {
          named.set(specifier.local.name, imported);
        }
      }
    }
  }

  // Bindings made from `createSparseReact()`: `const custom = ...` and
  // `const { SparseScope, useSparseSegments: useSegments } = ...`.
  const visit = (node: TSESTree.Node) => {
    if (node.type === AST_NODE_TYPES.VariableDeclarator && isReactFactoryCall(node.init)) {
      if (node.id.type === AST_NODE_TYPES.Identifier) {
        namespaces.add(node.id.name);
      } else if (node.id.type === AST_NODE_TYPES.ObjectPattern) {
        for (const property of node.id.properties) {
          if (
            property.type === AST_NODE_TYPES.Property &&
            property.key.type === AST_NODE_TYPES.Identifier &&
            reactMembers.has(property.key.name) &&
            property.value.type === AST_NODE_TYPES.Identifier
          ) {
            named.set(property.value.name, property.key.name as SparseExport);
          }
        }
      }
    }

    // The parser knows the keys of every node it produces; they lead to
    // nodes, arrays of nodes, or nothing.
    for (const key of context.sourceCode.visitorKeys[node.type]!) {
      const child = (node as unknown as Record<string, TSESTree.Node | TSESTree.Node[] | null>)[
        key
      ];
      for (const item of Array.isArray(child) ? child : [child]) {
        if (item) {
          visit(item);
        }
      }
    }
  };

  // Only worth a walk when the factory is in reach.
  if ([...named.values()].includes('createSparseReact') || namespaces.size > 0) {
    visit(context.sourceCode.ast);
  }

  return { resolve };
}
