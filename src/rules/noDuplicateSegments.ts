import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isAcquireCall } from '../utils/isAcquireCall';
import { getSparseApi } from '../utils/sparseApi';

type MessageIds = 'duplicate-segment' | 'duplicate-key';

type Rule = TSESLint.RuleModule<MessageIds, []>;

type ListItem = TSESTree.Expression | TSESTree.SpreadElement | null;

/** A segment reference that can be compared by its text: `a` or `a.b.c`. */
const isReference = (node: TSESTree.Node): boolean =>
  node.type === AST_NODE_TYPES.Identifier ||
  (node.type === AST_NODE_TYPES.MemberExpression && !node.computed && isReference(node.object));

/** The value of a string literal or of a template literal without expressions. */
const getStaticString = (node: TSESTree.Node): string | undefined => {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
    return node.value;
  }
  if (node.type === AST_NODE_TYPES.TemplateLiteral && node.expressions.length === 0) {
    // Only a tagged template can leave an escape uncooked.
    return node.quasis[0]!.value.cooked as string;
  }
  return undefined;
};

const getProperty = (
  node: TSESTree.Node | undefined,
  name: string,
): TSESTree.Property['value'] | undefined => {
  if (node?.type !== AST_NODE_TYPES.ObjectExpression) {
    return undefined;
  }
  for (const property of node.properties) {
    if (
      property.type === AST_NODE_TYPES.Property &&
      !property.computed &&
      ((property.key.type === AST_NODE_TYPES.Identifier && property.key.name === name) ||
        getStaticString(property.key) === name)
    ) {
      return property.value;
    }
  }
  return undefined;
};

const meta: Rule['meta'] = {
  docs: {
    description:
      'Disallow listing a segment twice, and defining two segments with the same key in a file.',
  },
  messages: {
    'duplicate-segment': '`{{name}}` is already listed.',
    'duplicate-key': 'A segment with the key "{{key}}" is already defined in this file.',
  },
  schema: [],
  type: 'problem',
};

const create: Rule['create'] = (context) => {
  const api = getSparseApi(context);
  const definedKeys = new Set<string>();

  const checkList = (items: readonly ListItem[]) => {
    const seen = new Set<string>();
    for (const item of items) {
      if (item && isReference(item)) {
        const name = context.sourceCode.getText(item);
        if (seen.has(name)) {
          context.report({ messageId: 'duplicate-segment', node: item, data: { name } });
        }
        seen.add(name);
      }
    }
  };

  const checkArray = (node: TSESTree.Node | undefined) => {
    if (node?.type === AST_NODE_TYPES.ArrayExpression) {
      checkList(node.elements);
    }
  };

  return {
    CallExpression(node) {
      if (isAcquireCall(node)) {
        checkList(node.arguments);
        return;
      }

      const name = api.resolve(node.callee);

      if (name === 'useSparseSegments') {
        checkArray(node.arguments[0]);
      } else if (name === 'defineSegment') {
        const [options] = node.arguments;
        checkArray(getProperty(options, 'deps'));

        const keyNode = getProperty(options, 'key');
        const key = keyNode && getStaticString(keyNode);
        if (key !== undefined) {
          if (definedKeys.has(key)) {
            context.report({ messageId: 'duplicate-key', node: keyNode!, data: { key } });
          }
          definedKeys.add(key);
        }
      }
    },

    JSXOpeningElement(node) {
      if (api.resolve(node.name) !== 'SparseScope') {
        return;
      }
      for (const attribute of node.attributes) {
        if (
          attribute.type === AST_NODE_TYPES.JSXAttribute &&
          attribute.name.name === 'segments' &&
          attribute.value?.type === AST_NODE_TYPES.JSXExpressionContainer
        ) {
          checkArray(attribute.value.expression);
        }
      }
    },
  };
};

export const noDuplicateSegmentsRule: Rule = {
  defaultOptions: [],
  meta,
  create,
};
