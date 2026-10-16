import { resolve } from 'path';
import * as tsParser from '@typescript-eslint/parser';
import { ESLint } from 'eslint';
import { reduxSparseKitPlugin } from '../index';

const root = resolve(__dirname, '../../');

const code = `
import { defineSegment } from 'redux-sparse-kit';

const reducer = (state: number = 0) => state;

export const routing = defineSegment({ key: 'router', reducer });
export const page = defineSegment({ key: 'page', deps: [routing, routing] });

export function Orders() {
  defineSegment({ key: 'orders' });
  return null;
}

declare const store: { sparse: { acquire(...segments: unknown[]): () => void } };
store.sparse.acquire(page);
`;

const lint = async (config: keyof typeof reduxSparseKitPlugin.configs) => {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { project: './tsconfig.eslint.json', tsconfigRootDir: root },
        },
      },
      ...reduxSparseKitPlugin.configs[config],
    ],
  });

  const [result] = await eslint.lintText(code, { filePath: resolve(root, 'fixtures/file.ts') });

  return result!.messages.map(({ ruleId, line, message }) => `${line} ${ruleId ?? message}`);
};

// The ESLint class of ESLint 8 reads eslintrc files rather than flat configs.
const describeFlat = Number(ESLint.version.split('.')[0]) >= 9 ? describe : describe.skip;

describeFlat('the shipped configs', () => {
  it('report through ESLint with the recommended config', async () => {
    expect(await lint('recommended')).toEqual([
      '7 redux-sparse-kit/no-duplicate-segments',
      '10 redux-sparse-kit/no-define-segment-in-render',
      '15 redux-sparse-kit/release-acquired-segments',
    ]);
  });

  it('add the rules that need type information with the type-checked config', async () => {
    expect(await lint('recommended-type-checked')).toEqual([
      '6 redux-sparse-kit/no-static-state-key',
      '7 redux-sparse-kit/no-duplicate-segments',
      '10 redux-sparse-kit/no-define-segment-in-render',
      '15 redux-sparse-kit/release-acquired-segments',
    ]);
  });
});
