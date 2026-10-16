import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isAcquireCall } from '../utils/isAcquireCall';

type MessageIds = 'release-discarded';

type Rule = TSESLint.RuleModule<MessageIds, []>;

/** Whether the value of `node` is thrown away. */
const isDiscarded = (node: TSESTree.Node): boolean => {
  // Never the program itself: a call or an expression around it.
  const parent = node.parent!;

  switch (parent.type) {
    case AST_NODE_TYPES.ChainExpression:
      return isDiscarded(parent);
    case AST_NODE_TYPES.ExpressionStatement:
      return true;
    case AST_NODE_TYPES.UnaryExpression:
      return parent.operator === 'void';
    case AST_NODE_TYPES.SequenceExpression:
      return parent.expressions[parent.expressions.length - 1] !== node || isDiscarded(parent);
    default:
      return false;
  }
};

const meta: Rule['meta'] = {
  docs: {
    description: 'Require keeping the release function that acquire returns.',
  },
  messages: {
    'release-discarded':
      'The release function acquire returns is discarded, so the segments are held for good. Keep it and call it once they are no longer needed.',
  },
  schema: [],
  type: 'problem',
};

const create: Rule['create'] = (context) => ({
  CallExpression(node) {
    if (isAcquireCall(node) && isDiscarded(node)) {
      context.report({ messageId: 'release-discarded', node });
    }
  },
});

export const releaseAcquiredSegmentsRule: Rule = {
  defaultOptions: [],
  meta,
  create,
};
