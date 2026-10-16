import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const isNamed = (node: TSESTree.Node, name: string): boolean =>
  node.type === AST_NODE_TYPES.Identifier && node.name === name;

/**
 * A call to the sparse controller's `acquire`: `store.sparse.acquire(...)`,
 * or `sparse.acquire(...)` on a controller taken out of the store.
 */
export const isAcquireCall = (node: TSESTree.CallExpression): boolean => {
  const { callee } = node;

  if (
    callee.type !== AST_NODE_TYPES.MemberExpression ||
    callee.computed ||
    !isNamed(callee.property, 'acquire')
  ) {
    return false;
  }

  const { object } = callee;

  return (
    isNamed(object, 'sparse') ||
    (object.type === AST_NODE_TYPES.MemberExpression &&
      !object.computed &&
      isNamed(object.property, 'sparse'))
  );
};
