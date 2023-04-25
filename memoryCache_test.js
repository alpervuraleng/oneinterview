const assert = require('assert').strict;
const MemoryCache = require('./memoryCache');

suite('MemoryCache', function() {
    // Helpers:

    async function assertNotInCache(cache, key) {
        const { cached, value } = await cache.get(key);
        assert.equal(
            cached,
            false,
            `Expected '${key}' to not be in cache, but was`,
        );
        assert.equal(value, null);
    }

    async function assertCachedEquals(cache, key, expected) {
        const { cached, value } = await cache.get(key);
        assert.equal(
            cached,
            true,
            `Expected '${key}' to be in cache, but wasn't`,
        );
        assert.equal(value, expected);
    }

    // Tests:

    test('Basic', async function() {
        // Without worrying about capacity or expiry,
        // we should be able to get, set, and clear.

        const cache = new MemoryCache();

        // Initially, the cache should contain nothing.

        await assertNotInCache(cache, 'a');
        await assertNotInCache(cache, 'b');
        await assertNotInCache(cache, 'c');

        // We should be able to add items to the cache, then retrieve them.

        const a = 'A';
        const b = 'B';

        await cache.set('a', a);
        await cache.set('b', b);

        await assertCachedEquals(cache, 'a', a);
        await assertCachedEquals(cache, 'b', b);

        // Should be able to keep reading the items; they shouldn't be evicted.

        await assertCachedEquals(cache, 'a', a);
        await assertCachedEquals(cache, 'b', b);

        // We should be able to clear items from the cache too.
        // Other items should remain in the cache.

        assert.equal(await cache.clear('a'), true);
        assert.equal(await cache.clear('a'), false); // already cleared

        await assertNotInCache(cache, 'a');
        await assertCachedEquals(cache, 'b', b);
    });

    test('Capacity', async function() {
        // We should be able to limit the cache to a fixed memory capacity.
        // Adding items to the cache beyond the capacity should purge the
        // least recently read items.

        const cache = new MemoryCache({ maxItems: 3 });

        // Add items up to the capacity. All items should be retained.

        const a = 'A';
        const b = 'B';
        const c = 'C';

        await cache.set('a', a);
        await cache.set('b', b);
        await cache.set('c', c);

        await assertCachedEquals(cache, 'a', a);
        await assertCachedEquals(cache, 'b', b);
        await assertCachedEquals(cache, 'c', c);

        // Access the items in some different order.

        await assertCachedEquals(cache, 'a', a);
        await assertCachedEquals(cache, 'b', b);
        await assertCachedEquals(cache, 'a', a);
        await assertCachedEquals(cache, 'b', b); // b is least recently read
        await assertCachedEquals(cache, 'c', c);
        await assertCachedEquals(cache, 'a', a);
        await assertCachedEquals(cache, 'c', c); // c is most recently read

        // Add one more item to the cache. The least recently read item should be gone.

        const d = 'D';

        await cache.set('d', d);

        await assertNotInCache(cache, 'b');

        await assertCachedEquals(cache, 'a', a);
        await assertCachedEquals(cache, 'c', c);
        await assertCachedEquals(cache, 'd', d);

        // Access the current items in some different order again.

        await assertCachedEquals(cache, 'c', c); // c is least recently read
        await assertCachedEquals(cache, 'd', d);
        await assertCachedEquals(cache, 'a', a); // a is most recently read

        // Add *two* items to the cache. The *two* least recently read items should be gone.

        const e = 'E';

        await cache.set('b', b); // b again
        await cache.set('e', e);

        await assertNotInCache(cache, 'c');
        await assertNotInCache(cache, 'd');

        await assertCachedEquals(cache, 'a', a);
        await assertCachedEquals(cache, 'b', b);
        await assertCachedEquals(cache, 'e', e);
    });

    test('Expiry', async function() {
        this.skip(); // TODO: Implement!
    });
});
