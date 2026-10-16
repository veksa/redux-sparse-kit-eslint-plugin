import { meta, reduxSparseKitPlugin, rules } from '../index';

const ruleNames = ['no-define-segment-in-render'];

describe('plugin', () => {
  it('is named after redux-sparse-kit', () => {
    expect(meta.name).toBe('redux-sparse-kit');
    expect(reduxSparseKitPlugin.meta).toBe(meta);
  });

  it('exposes its rules, for the eslintrc engine too', () => {
    expect(Object.keys(rules)).toEqual(ruleNames);
    expect(reduxSparseKitPlugin.rules).toBe(rules);
  });

  it('turns every rule on in the recommended config', () => {
    const [config] = reduxSparseKitPlugin.configs.recommended;

    expect(config!.plugins!['redux-sparse-kit']).toEqual({ meta, rules });
    expect(config!.rules).toEqual(
      Object.fromEntries(ruleNames.map((name) => [`redux-sparse-kit/${name}`, 'error'])),
    );
  });
});
