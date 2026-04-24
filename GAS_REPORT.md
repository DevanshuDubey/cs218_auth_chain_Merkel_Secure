# Gas Optimization Report — Decentralised Identity Verification

## Gas Report (After Optimisation)

| Contract / Method     | Min     | Max     | Avg     | # Calls |
|-----------------------|---------|---------|---------|---------|
| **IdentityVerifier**  |         |         |         |         |
| addVerifier           | –       | –       | 51,468  | 33      |
| registerIdentity      | 34,470  | 68,447  | 65,049  | 20      |
| removeVerifier        | –       | –       | 29,439  | 1       |
| revokeIdentity        | 31,137  | 31,379  | 31,234  | 5       |
| verifyIdentity        | 31,240  | 31,252  | 31,242  | 13      |
| **KYCGatedAuction**   |         |         |         |         |
| endAuction            | –       | –       | 51,403  | 8       |
| placeBid              | 65,612  | 77,319  | 75,856  | 8       |
| withdrawProceeds      | –       | –       | 37,267  | 3       |
| withdrawRefund        | –       | –       | 32,422  | 2       |

| Deployment            | Gas     | % of limit |
|-----------------------|---------|------------|
| IdentityVerifier      | 801,811 | 1.3 %      |
| KYCGatedAuction       | 651,700 | 1.1 %      |

---

## Before / After Optimisation — Struct Packing

### What Changed

The `Identity` struct in `IdentityVerifier.sol` was repacked so that `status` (1 byte), `verified_by` (20 bytes), and `timestamp` (8 bytes) fit into a **single 32-byte storage slot** instead of occupying separate slots.

```diff
 struct Identity {
     bytes32 document_hash;   // Slot 0 (32 bytes)
     Status status;           // Slot 1 ...
     address verified_by;     // Slot 1 ...
-    uint256 timestamp;       // Slot 2 (was separate 32-byte slot)
+    uint64 timestamp;        // Slot 1 ... (now packed: 1+20+8 = 29 bytes < 32)
 }
```

### Results

| Function            | Before (gas) | After (gas) | Saved (gas) | Saving (%) |
|---------------------|-------------|-------------|-------------|------------|
| `registerIdentity`  | 70,579      | 68,447      | 2,132       | **3.0 %**  |
| `verifyIdentity`    | 53,308      | 31,240      | 22,068      | **41.4 %** |
| `revokeIdentity`    | 31,120      | 31,137      | −17         | ~0 %       |

### Why Does `verifyIdentity` Save 41%?

Before packing, `verifyIdentity()` wrote to **three separate storage slots** (`status`, `verified_by`, `timestamp`). Each `SSTORE` to a new slot costs 20,000 gas (cold) or 5,000 gas (warm).

After packing, all three fields share one slot. The EVM performs a **single warm `SSTORE`** (read-modify-write) instead of three separate writes, saving approximately 22,000 gas per call.

### Why is `revokeIdentity` Unchanged?

`revokeIdentity()` only writes to the `status` field. Since `status` occupied the same slot before and after the change, the number of `SSTORE` operations is identical.

---

## Coverage Report

```
File                   |  % Stmts | % Branch |  % Funcs |  % Lines |
-----------------------|----------|----------|----------|----------|
 IdentityVerifier.sol  |      100 |    96.43 |      100 |      100 |
 KYCGatedAuction.sol   |      100 |     82.5 |      100 |      100 |
-----------------------|----------|----------|----------|----------|
 All files             |      100 |    88.24 |      100 |      100 |
```

**32 tests total, 0 failing.** Coverage exceeds the 70% line coverage requirement.
