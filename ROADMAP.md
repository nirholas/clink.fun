# Roadmap

What ships next, why, and what it takes. Ordered by whether it changes the
product or only adds surface area.

The bar for anything on this list: it has to work end to end before it counts.
A half-wired integration is worse than none, because it is a promise the product
does not keep.

---

## Where things stand

| | Status |
|---|---|
| Launchpad contracts, tested | done, unaudited |
| Web app, all pages | done |
| API, images and descriptors | done |
| SDK, chain and stock registry | partial |
| Deployed to mainnet | not yet |
| Audit | not yet |

---

## Phase 1: make it real

Nothing else on this page matters until these are true.

**Audit the contracts.** They hold permanently locked liquidity, so a bug is not
recoverable by upgrading. Scope is small on purpose: two files, no dependencies,
no proxy.

**Deploy and verify on Robinhood Chain.** Publish source on Blockscout so the
contract someone reads is provably the contract that runs.

**Trade history and charts.** The curve emits `Swap` on every trade, which is
everything a candle needs. This is an indexer over one event, not a data
partnership.

**Price in USD.** Every number in the app is currently denominated in the paired
stock. A composite USD figure needs a stock price feed. PAIR runs its own oracle
on this chain; using it is a dependency, and a Chainlink-style feed or a
Robinhood-published rate would be cleaner. Until one exists, showing NVDA-denominated
numbers and saying so is more honest than inventing a conversion.

**Holder counts and distribution.** Transfer-event indexing. The signal that
matters most for a new coin is how concentrated it is.

---

## Phase 2: the launchpad feature matrix

What pump.fun, bonk.fun, boop, Believe, Moonshot and the rest ship, and where we
stand on each.

| Feature | Them | Us | Notes |
|---|---|---|---|
| One-transaction launch | yes | **yes** | |
| Optional creator buy at launch | yes | **yes** | and genuinely optional |
| Fixed supply, no mint | yes | **yes** | no admin surface at all |
| Locked liquidity | yes | **yes** | permanent, nobody can withdraw |
| Creator fee share | yes | **yes** | 70%, batched claim |
| Live trade feed | yes | phase 1 | `Swap` event indexer |
| Candles and charts | yes | phase 1 | same indexer |
| Holder distribution | yes | phase 1 | Transfer indexer |
| Comments and replies | yes | phase 2 | needs identity, see below |
| Creator profiles | yes | phase 2 | wallet-keyed, no signup |
| Watchlists | yes | phase 2 | local first, synced later |
| Search | yes | **yes** | ticker, name, address |
| Trending and movers | yes | phase 2 | needs volume from the indexer |
| Referral or affiliate fees | some | phase 3 | split the protocol share |
| Bundled or vanity mint addresses | some | phase 3 | grind the salt |
| Anti-sniper protections | some | phase 3 | see below |
| Livestreams | pump.fun | no | not the product |
| Mobile app | some | phase 4 | the site is responsive first |

**Comments without accounts.** Every launchpad that added social added a login.
Sign-in-with-Ethereum keeps the "no signup" property: a wallet signature is the
identity, and the comment is stored against the address.

**Anti-sniper.** The honest options are a short post-launch buy cap, a
first-block fee surcharge that goes to the pool rather than to us, or nothing at
all. A launchpad that claims sniper protection it cannot enforce is worse than
one that says the first buyer usually wins.

---

## Phase 3: agents and machine access

This is where the product can be genuinely different rather than merely better.
A launchpad whose entire surface is callable by software is a launchpad that
other software builds on.

### MCP server

Expose the launchpad as [Model Context Protocol](https://modelcontextprotocol.io)
tools so an assistant can use it directly. The tool list is small because the
product is small:

| Tool | Does |
|---|---|
| `list_markets` | The stock tokens available to pair against |
| `list_coins` | Launched coins, newest first, with pairings |
| `get_coin` | One coin, its curves, prices and progress |
| `quote_trade` | Price a buy or sell before committing |
| `plan_launch` | Build and price a launch without signing it |
| `execute_launch` | Sign and send, behind an explicit approval |
| `claimable_fees` | What a wallet can claim |

The split between `plan_launch` and `execute_launch` is the whole safety design.
An agent may plan freely; signing requires a human or an explicit standing
authorization with a spend cap. An MCP server that exposes a one-shot "launch a
coin" tool to a model with a funded key is a liability, not a feature.

### x402 paid endpoints

[x402](https://x402.org) turns HTTP 402 into a working payment rail, which suits
read APIs that cost real money to serve.

- `GET /api/coins/:address/candles` and the trade feed, free at low volume and
  paid above it, so an indexer that costs money to run is funded by whoever is
  actually hammering it.
- `POST /api/launch/sponsored`, where the caller pays the launch fee over x402
  and a server-held key fronts the transaction. This lets an agent with no ETH
  on Robinhood Chain launch a coin, which removes the single hardest onboarding
  step. It needs a hard per-caller spend cap before it goes anywhere near
  production.

### Agent-native launching

The pieces already exist in this repo and in
[launch-relay](https://github.com/nirholas/launch-relay), which relays pump.fun
graduations onto a paired-stock launchpad. Making that first class here:

- A `clink` target in launch-relay so any trigger source can launch here.
- Webhooks on `Launched` and `Swap` so agents react without polling.
- A signing service with budgets, approval callbacks and an audit ledger,
  reusing the approval design from launch-relay: dry run by default, live behind
  an out-of-band arm plus per-launch approval, and a phone tap as the approver.

---

## Phase 4: more chains

The concept generalizes anywhere tokenized equities exist. The contracts are
chain-agnostic already; what is chain-specific is the quote registry.

| Chain | Blocker |
|---|---|
| Robinhood Chain | none, this is home |
| Base | needs a tokenized equity issuer with real liquidity |
| Solana | full rewrite in Anchor, and the equity tokens to pair against |
| Any Orbit chain | trivial, same bytecode and a new registry |

Ordering here should follow where the equities actually are, not where the users
are. A launchpad for stock-paired coins on a chain with no stock tokens is a
launchpad with nothing to pair against.

---

## Deliberately not doing

**Migrating liquidity at a threshold.** Graduation events are where launchpads
break. The curve is permanent on purpose.

**A ceiling on market cap.** Nothing stops a coin from running.

**Upgradeable contracts.** A proxy is a key that can rewrite the rules under
holders. The tradeoff is that a bug means a redeploy, which is the correct
tradeoff for a contract holding permanently locked liquidity.

**Calling the pairing a basket.** It is launch liquidity distribution. It is not
an index, not redeemable, and not backing. That distinction is legal, not
cosmetic, and it stays out of the branding.
