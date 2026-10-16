import { ESLintUtils, TSESLint } from '@typescript-eslint/utils';
import ts from 'typescript';
import { getSparseApi } from '../utils/sparseApi';

type MessageIds = 'static-state-key';

type Rule = TSESLint.RuleModule<MessageIds, []>;

/**
 * The `StaticState` interface declared next to `defineSegment`, with the
 * augmentations the program adds to it.
 */
const getStaticState = (callee: ts.Node, checker: ts.TypeChecker): ts.Type | undefined => {
  // The callee is an import, or a member of a namespace import: both resolve
  // to a declared function.
  let symbol = checker.getSymbolAtLocation(
    ts.isPropertyAccessExpression(callee) ? callee.name : callee,
  )!;

  if (symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }

  const staticState = symbol
    .declarations![0]!.getSourceFile()
    .statements.find(
      (statement): statement is ts.InterfaceDeclaration =>
        ts.isInterfaceDeclaration(statement) && statement.name.text === 'StaticState',
    );

  return staticState && checker.getTypeAtLocation(staticState.name);
};

/** The string literal types a key type allows. */
const getKeys = (type: ts.Type): string[] =>
  (type.isUnion() ? type.types : [type])
    .filter((member): member is ts.StringLiteralType => member.isStringLiteral())
    .map((member) => member.value);

const meta: Rule['meta'] = {
  docs: {
    description: 'Disallow segments with a reducer under a key of the static state.',
  },
  messages: {
    'static-state-key':
      'Segment key "{{key}}" is a key of the static state: acquiring a segment with a reducer under it throws.',
  },
  schema: [],
  type: 'problem',
};

const create: Rule['create'] = (context) => {
  const api = getSparseApi(context);
  const { esTreeNodeToTSNodeMap, program } = ESLintUtils.getParserServices(context);
  const checker = program.getTypeChecker();

  return {
    CallExpression(node) {
      if (api.resolve(node.callee) !== 'defineSegment') {
        return;
      }

      const call = esTreeNodeToTSNodeMap.get(node);
      const segment = checker.getTypeAtLocation(call);
      const key = segment.getProperty('key');
      const reducer = segment.getProperty('reducer');

      if (!key || !reducer) {
        return;
      }

      const reducerType = checker.getTypeOfSymbolAtLocation(reducer, call);
      if (reducerType.flags & ts.TypeFlags.Undefined) {
        // A segment without a reducer owns no slice.
        return;
      }

      const staticState = getStaticState(call.expression, checker);
      if (!staticState) {
        return;
      }

      for (const name of getKeys(checker.getTypeOfSymbolAtLocation(key, call))) {
        if (staticState.getProperty(name)) {
          context.report({ messageId: 'static-state-key', node, data: { key: name } });
        }
      }
    },
  };
};

export const noStaticStateKeyRule: Rule = {
  defaultOptions: [],
  meta,
  create,
};
