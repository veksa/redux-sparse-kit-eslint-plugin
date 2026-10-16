/**
 * Test fixture: a module with a defineSegment of its own and no StaticState,
 * treated as redux-sparse-kit's through the importSources setting.
 */
export function defineSegment<const Key extends string>(options: {
  key: Key;
  reducer: () => number;
}) {
  return options;
}
