# clink.fun

**Launch a coin paired with real stocks.** Permissionless, fixed supply, liquidity
nobody can pull. On Robinhood Chain.

Every coin here is quoted in a tokenized equity rather than a stablecoin or the
chain's gas token. A coin paired with NVDA trades against NVDA: its price, its
depth, and the fees it pays its creator are all denominated in the stock. Pick up
to five markets, pay one flat fee, and the curve runs forever.

```
launch  ──→  1B fixed supply split across 1..5 curves, one per stock
trade   ──→  constant product with a virtual quote reserve, no migration, no ceiling
earn    ──→  70% of every swap fee, claimable across all pairings in one transaction
```

---

## What is in here

| Directory | What it is | State |
|---|---|---|
| [`contracts/`](contracts) | Launchpad and token, Solidity, no dependencies | 30 tests pass, **unaudited** |
| [`apps/web/`](apps/web) | The site. React, Vite, Tailwind, wagmi | 7 pages, typechecked, builds |
| [`apps/api/`](apps/api) | Image and descriptor hosting, chain reads, the MCP server at `/mcp` | running, tested |
| [`packages/sdk/`](packages/sdk) | TypeScript SDK for launching programmatically | chain and stock registry |
| [`packages/mcp/`](packages/mcp) | `clink-mcp`, the stdio bridge for MCP clients that launch servers with `npx` | tested against the live tool set |
| [`docs/`](docs) | Deploy guide, architecture, API reference | |
| [`docs/research/launchpads.md`](docs/research/launchpads.md) | The launchpad report: UX, UI, mechanics and revenue of the ten highest-earning launchpads, with a ranked feature list for clink.fun | 13,000 words |
| [`ROADMAP.md`](ROADMAP.md) | MCP, x402, agents, and the launchpad feature matrix | |

## Run it

```bash
npm install

# Contracts
cd contracts
forge install foundry-rs/forge-std --no-git   # once
forge test

# Deploy the launchpad and register every stock market in one run
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.mainnet.chain.robinhood.com \
  --private-key $PRIVATE_KEY --broadcast

# Then point the apps at it
cd ..
export CLINK_LAUNCHPAD=0x...        # api
export VITE_LAUNCHPAD=0x...         # web
npm run dev
```

The web app runs on port 3000 and proxies `/api` to the API on 8787, so the app
always calls same-origin paths and there is no CORS difference between
development and production.

## Launch from Claude

clink.fun is a remote MCP server, so Claude, or any assistant that speaks the
[Model Context Protocol](https://modelcontextprotocol.io), can browse markets,
read coins, price trades and plan a launch.

```bash
# Claude Code
claude mcp add --transport http clink https://clink-fun-93741856042.us-central1.run.app/mcp
```

Claude on the web or desktop: Settings, Connectors, Add custom connector, then
paste the same URL. Clients that start servers over stdio run
`npx -y clink-mcp` ([packages/mcp](packages/mcp)).

| Tool | Does |
|---|---|
| `plan_launch` | Validate a coin and return a launch link the user signs with their wallet |
| `launch_status` | Whether a planned launch has been signed, and the coin once it has |
| `list_markets` | The stocks a coin can pair against |
| `list_coins` | Launched coins, filterable by market or by launched-from-an-assistant |
| `get_coin` | Price, curve and raise for every market a coin trades in |
| `quote_trade` | Price a buy or sell before committing |
| `claimable_fees` | Creator fees a wallet can claim right now |
| `fee_schedule` | Launch fee, swap fee and creator share, live from the contract |

**The assistant plans; a person signs.** `plan_launch` validates everything the
launch form would (ticker, markets live on the contract, weights totalling
100%), copies the logo onto this server, and stores a draft. It returns a
`/launch?draft=<id>` link that opens the launch page with every field filled in
and still editable. The user connects their own wallet and signs. There is no
server-held key that can spend, which is the safety design the roadmap asked
for.

**Every coin launched this way is provably marked.** The draft-bound descriptor
carries an `origin` block (channel, assistant, draft id) signed by the platform
attester, and the keccak of the descriptor bytes is committed on chain at
launch. Anyone can recover the signer of

```
clink.fun launch origin v1
channel: prompt
draft: <draft id>
name: <coin name>
symbol: <ticker>
```

and compare it with `attester` from `GET /api/config`. The site shows these
coins with a "via Claude" badge and a filter on the explore page
(`/explore?origin=prompt`, `GET /api/tokens?origin=prompt`). `launch_status`
finds the coin with no report from the browser: it scans `Launched` events for
a descriptor naming the draft.

## How the curve works

Each pairing gets its own constant-product bonding curve with a **virtual quote
reserve**. The virtual reserve is what gives a curve a starting price without
anyone depositing the stock, which is why launching costs only the flat fee: a
creator can launch against NVDA while owning no NVDA.

Buying moves price up the curve, selling moves it back down, and the two sides
are symmetric minus fees. Rounding always favours the pool, so a round trip
returns slightly less than it cost and never more.

There is no graduation and no migration. Tokens are sold asymptotically, so price
rises without bound and there is never a moment where liquidity moves somewhere
else and something can break.

**Multiple markets do not arbitrage each other automatically.** A large buy
through one pool can leave that market priced differently from the others until
someone trades the gap. That is a property of independent pools, not a bug.

## Fees

| | Amount | Goes to |
|---|---|---|
| Launch fee | Flat, in ETH | Protocol treasury, once |
| Swap fee | Taken from the quote side of every trade | Split below |
| **Creator share** | **70% of swap fees** | The creator |
| Protocol share | 30% of swap fees | Treasury |

Fees accrue in the asset each pool quotes, so a coin paired with NVDA earns its
creator NVDA. Claim collects **every asset in one transaction**.

## Three things it does that the incumbent does not

These are not guesses. They came out of integrating against PAIR, and each one
cost real time to discover.

**Skipping the launch buy is the default and needs nothing.** On PAIR, "no
developer buy" has to be encoded as market index `255`. Passing index `0` with a
zero amount reverts with `InvalidDeveloperBuy()` (`0xc81a59ab`), the sentinel is
undocumented, and the only way to find it is to decode the calldata of launches
that already worked. Here the field is optional, the sentinel is a named
constant, and a launch with no buy needs no stock balance and no approval.

**Fees claim in one transaction.** A coin paired against three stocks earns in
three assets. Requiring three signatures to collect one day of fees is how fees
go unclaimed.

**The fee recipient can move.** Rotating wallets or handing a project to a DAO
should not cost you the revenue stream. Fees already accrued stay with whoever
earned them.

## Safety posture

**No admin surface on the tokens.** No mint, no owner, no pause, no blacklist,
no upgrade path. The supply at construction is the supply forever, and the
launchpad holds no privilege over a token it created beyond the balance it was
minted.

**Bounded admin on the launchpad.** The owner sets the launch fee, the swap fee
and the quote registry. The swap fee is capped at 5% **in code**, so the owner
key cannot be used to expropriate traders.

**Locked liquidity cuts both ways.** Nobody can rug the pool. Nobody can withdraw
it either, including the creator. The only thing extractable is the fee stream.

**The contracts are not audited.** They are tested, including fuzzing for
round-trip profitability, reserve backing and supply conservation. That is not
the same thing as someone trying to break them. Read them before you put money
behind them.

## Chain

| | |
|---|---|
| Network | Robinhood Chain, an Arbitrum Orbit L2 |
| Chain ID | 4663 |
| Gas | ETH |
| Explorer | https://robinhoodchain.blockscout.com |

Getting gas onto the chain is the only awkward step. The canonical bridge runs
from Ethereum L1 and costs more in L1 gas than most people want to spend.
[Relay](https://relay.link) and [Gas.zip](https://gas.zip) both support chain
4663 and cost cents from any L2.

## Disclaimer

Launching a coin is a public, permanent, irreversible act. Tokens launched here
are speculative and can go to zero. The pairing is launch liquidity, not backing:
a coin paired with AAPL is not a claim on AAPL, is not redeemable for it, and is
not an index or a fund. You are responsible for what you launch and for anyone
who buys it. Nothing here is financial advice.

## License

Apache-2.0
