# clink.fun contracts

Two contracts, no dependencies, no proxy.

| Contract | What it is |
|---|---|
| `ClinkLaunchpad.sol` | Factory, bonding curves, fee accounting, claims |
| `ClinkToken.sol` | Fixed-supply ERC-20 with no admin surface at all |

```bash
forge install foundry-rs/forge-std --no-git   # once
forge build
forge test -vv
```

## The design in one page

**One curve per pairing.** A coin paired with NVDA and TSLA gets two independent
constant-product curves. They do not arbitrage each other and they are not a
basket: the allocation only decides how the fixed supply is split between them.

**Virtual quote reserves.** Each curve starts with a virtual quote balance, so
there is nothing to deposit on the quote side. A creator can launch against NVDA
without owning any NVDA. The only mandatory cost is the flat launch fee.

**No migration, no ceiling.** Tokens are sold from the curve asymptotically, so
price rises without bound and there is no graduation event where liquidity moves
and something can break. A curve behaves identically on day one and day one
thousand.

**No admin surface on the token.** No mint, no owner, no pause, no blacklist, no
upgrade. The supply at construction is the supply forever. The launchpad holds no
privileges over a token it created beyond the balance it was minted.

**Bounded admin on the launchpad.** The owner sets the launch fee, the swap fee
and the quote registry. The swap fee is capped at 5% in code, not in policy, so
the owner key cannot expropriate traders.

## Three things it does that PAIR does not

**Skipping the developer buy is the default and needs nothing.** On PAIR, "no
dev buy" must be encoded as market index 255; passing index 0 with a zero amount
reverts with `InvalidDeveloperBuy()` and the sentinel is undocumented. Here the
field is optional, `NO_DEV_BUY` is a named constant, and a launch with no buy
needs no stock balance and no approval.

**Fees claim in one transaction.** A coin paired against three stocks earns in
three assets. `claimFees(address[])` collects all of them at once instead of one
transaction per asset.

**The fee recipient can move.** A creator who rotates wallets, or hands a project
to a DAO, keeps the revenue stream. Already-accrued fees stay with whoever earned
them.

## Rounding

Both sides of the curve round the remaining reserve **up**, which rounds the
amount out **down**. The first version rounded the other way and a buy-then-sell
round trip returned one wei more than it cost. Repeated, that drains a pool a wei
at a time. `testFuzz_roundTripNeverProfits` pins it.

## Status

30 tests pass, including fuzz coverage for round-trip profitability, reserve
backing and supply conservation.

**Not audited.** Do not deploy to mainnet with real money behind it until it has
been. The tests demonstrate the intended behaviour; they are not a substitute for
someone trying to break it.
