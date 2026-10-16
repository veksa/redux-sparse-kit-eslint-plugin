import { meta, reduxSparseKitPlugin, rules } from '../index';

const untypedRules = [
  'no-define-segment-in-render',
  'no-duplicate-segments',
  'release-acquired-segments',
];
const typedRules = ['no-static-state-key'];

const turnedOn = (names: string[]) =>
  Object.fromEntries(names.map((name) => [`redux-sparse-kit/${name}`, 'error']));

describe('plugin', () => {
  it('is named after redux-sparse-kit', () => {
    expect(meta.name).toBe('redux-sparse-kit');
    expect(reduxSparseKitPlugin.meta).toBe(meta);
  });

  it('exposes its rules, for the eslintrc engine too', () => {
    expect(Object.keys(rules).sort()).toEqual([...untypedRules, ...typedRules].sort());
    expect(reduxSparseKitPlugin.rules).toBe(rules);
  });

  it('turns the rules that need no type information on in the recommended config', () => {
    const [config] = reduxSparseKitPlugin.configs.recommended;

    expect(reduxSparseKitPlugin.configs.recommended).toHaveLength(1);
    expect(config!.plugins!['redux-sparse-kit']).toEqual({ meta, rules });
    expect(config!.rules).toEqual(turnedOn(untypedRules));
  });

  it('adds the rules that need type information in the type-checked config', () => {
    const configs = reduxSparseKitPlugin.configs['recommended-type-checked'];

    expect(configs[0]).toBe(reduxSparseKitPlugin.configs.recommended[0]);
    expect(configs[1]!.rules).toEqual(turnedOn(typedRules));
  });
});
