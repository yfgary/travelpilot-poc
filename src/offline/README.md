# Offline boundary

Step 6 stores validated, versioned trip snapshots in IndexedDB using `idb`.
Version records retain older snapshots; current pointers update atomically.
Cache reads validate the payload again. Remote invalid/unavailable responses
fall back to a good cache and never overwrite it with bad content.

Logout does not clear cached trips. They remain readable signed out in this
browser profile until explicitly cleared or browser storage is removed/evicted.
Signed-in fallback uses that account's pointer. A future Settings control will
provide explicit clearing. This step adds no service worker, image caching or
cold offline app-shell startup guarantee.
