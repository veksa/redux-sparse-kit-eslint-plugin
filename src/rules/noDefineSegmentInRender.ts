import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getSparseApi } from '../utils/sparseApi';

type MessageIds = 'define-segment-in-render';

type Rule = TSESLint.RuleModule<MessageIds, []>;

const componentName = /^[A-Z]/;
const hookName = /^use[A-Z0-9]/;

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

const isFunction = (node: TSESTree.Node): node is FunctionNode =>
  node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
  node.type === AST_NODE_TYPES.FunctionDeclaration ||
  node.type === AST_NODE_TYPES.FunctionExpression;

/**
 * The name a function is known by: its own, the variable or property it is
 * assigned to, or the variable a wrapper such as `memo(...)` is assigned to.
 */
const getFunctionName = (node: FunctionNode): string | undefined => {
  if (node.id) {
    return node.id.name;
  }

  let parent = node.parent;
  while (parent.type === AST_NODE_TYPES.CallExpression) {
    parent = parent.parent;
  }

  if (
    parent.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.id.type === AST_NODE_TYPES.Identifier
  ) {
    return parent.id.name;
  }

  if (
    (parent.type === AST_NODE_TYPES.Property || parent.type === AST_NODE_TYPES.MethodDefinition) &&
    parent.key.type === AST_NODE_TYPES.Identifier
  ) {
    return parent.key.name;
  }

  return undefined;
};

/** A component or hook: its body runs on every render. */
const rendersOnEveryCall = (node: TSESTree.Node): boolean => {
  if (isFunction(node)) {
    const name = getFunctionName(node);
    return name !== undefined && (componentName.test(name) || hookName.test(name));
  }

  return (
    node.type === AST_NODE_TYPES.MethodDefinition &&
    node.key.type === AST_NODE_TYPES.Identifier &&
    node.key.name === 'render'
  );
};

const meta: Rule['meta'] = {
  docs: {
    description: 'Disallow defining segments in components and hooks.',
  },
  messages: {
    'define-segment-in-render':
      'Define segments at module scope: a segment defined in a component or hook is a new segment on every render.',
  },
  schema: [],
  type: 'problem',
};

const create: Rule['create'] = (context) => {
  const api = getSparseApi(context);

  return {
    CallExpression(node) {
      if (api.resolve(node.callee) !== 'defineSegment') {
        return;
      }

      if (context.sourceCode.getAncestors(node).some(rendersOnEveryCall)) {
        context.report({ messageId: 'define-segment-in-render', node });
      }
    },
  };
};

export const noDefineSegmentInRenderRule: Rule = {
  defaultOptions: [],
  meta,
  create,
};
