import { meta, reduxSparseKitPlugin } from '../index';

describe('plugin', () => {
  it('is named after redux-sparse-kit', () => {
    expect(meta.name).toBe('redux-sparse-kit');
    expect(reduxSparseKitPlugin.meta).toBe(meta);
  });
});
