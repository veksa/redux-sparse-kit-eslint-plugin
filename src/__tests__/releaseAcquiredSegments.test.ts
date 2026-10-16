import { releaseAcquiredSegmentsRule } from '../rules/releaseAcquiredSegments';
import { createRuleTester } from './ruleTester';

const errors = [{ messageId: 'release-discarded' as const }];

createRuleTester().run('release-acquired-segments', releaseAcquiredSegmentsRule, {
  valid: [
    `const release = store.sparse.acquire(orders);`,
    `useLayoutEffect(() => store.sparse.acquire(orders), []);`,
    `useEffect(() => { return sparse.acquire(orders); }, []);`,
    `releases.push(store.sparse.acquire(orders));`,
    `const release = store?.sparse?.acquire(orders);`,
    `const release = (log(), store.sparse.acquire(orders));`,
    `const kept = !store.sparse.acquire(orders);`,
    // Not the sparse controller.
    `store.lock.acquire(orders); acquire(orders); mutex.acquire();`,
  ],
  invalid: [
    { code: `store.sparse.acquire(orders);`, errors },
    { code: `sparse.acquire(orders, prices);`, errors },
    { code: `void store.sparse.acquire(orders);`, errors },
    { code: `store?.sparse.acquire(orders);`, errors },
    { code: `store.sparse.acquire(orders), log();`, errors },
    { code: `log(), store.sparse.acquire(orders);`, errors },
    { code: `useEffect(() => { store.sparse.acquire(orders); }, []);`, errors },
  ],
});
