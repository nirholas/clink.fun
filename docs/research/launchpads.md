# The Launchpad Report: UX, UI and features of the ten highest-earning token launchpads across every chain

Compiled 2026-08-28 for the clink.fun team. Every number is dated and sourced. Where a figure is a company claim rather than on-chain data it is labelled as such. Where the live site could not be crawled (geoblocks, WAFs, or the product being offline) the section says so and explains where the description came from instead.

The ten platforms were chosen by lifetime fee revenue on DefiLlama as of today, with one editorial substitution: Believe is included despite having collapsed because it invented two primitives (launch-by-reply and the creator-majority split) that every later launchpad copied, and the story of how it died is more instructive than another platform that merely survived.

| # | Launchpad | Chain | All-time fees | Trailing 30d fees | State today |
|---|---|---|---|---|---|
| 1 | pump.fun | Solana | $1.197B | $44.2M | Dominant; ~90% of Solana launches |
| 2 | Four.meme | BNB Chain | $98.0M | $0.42M | ~1% of its Oct 2025 peak |
| 3 | Bonk.fun | Solana | $66.9M | $0.17M | ~0.4% of pump.fun |
| 4 | Bags | Solana + Robinhood Chain | $63.9M | $1.76M | Post-spike, still shipping |
| 5 | Moonshot | Solana (app) | $63.7M | $1.04M | Consumer app, 2M users |
| 6 | Clanker | Base + 7 EVM chains | ~$50M+ (Oct 2025) | weekly record $8.0M (Feb 2026) | Owned by Farcaster/Neynar |
| 7 | Believe | Solana | $40.9M | ~$0 | Offline, founder litigated |
| 8 | Virtuals | Base + Solana | ~$39.5M protocol | $2.6M/month (Feb 2026) | Pivoted to agent commerce |
| 9 | Zora | Base | $12.0M | $1.45M | Social-first, partner retreat |
| 10 | SunPump | TRON | $6.5M | ~$0.03M | Near dormant |

Sources: DefiLlama fee adapters for each protocol, pulled raw from `api.llama.fi` on 2026-08-28; Clanker's figures from The Defiant (Oct 2025) and KuCoin (Feb 2026) because DefiLlama blocked automated fetches; Virtuals from BlockEden and the DEXTools 2026 guide. Full citations sit inside each section.

Boop.fun, Heaven, Flap, Time.fun and PumpSwap are covered in a shorter appendix because each has one idea worth stealing.

---

## Part 1: What the numbers say before you look at a single screen

Three facts shape everything else in this report.

**1. The market is one winner and a long tail of spikes.** pump.fun's lifetime revenue ($1.10B kept, $1.20B gross) is larger than the other nine combined by a factor of about three. Every challenger followed the same arc: a launch-week spike that briefly flipped pump.fun on daily fees (Believe May 2025, Bonk.fun July 2025, Heaven August 2025, Four.meme October 2025, Bags January 2026), then a fall to single-digit share within four to eight weeks. Alea Research documented the pattern explicitly for Bags: "Believe (May 2025, 0.4% share by August), LetsBonk (78% peak in July 2025, 3% by late August), HeavenDex (28% peak in Aug 2025, under 1% by September)" (https://alearesearch.substack.com/p/bags-launchpad). Four.meme made 45% of its lifetime revenue in a single month, October 2025, and is now at 1% of that peak. Bonk.fun did $34.7M in July 2025 and $170K in the last 30 days.

The lesson for a new launchpad is not "you cannot win". It is that a spike is purchasable with a narrative (a CZ tweet, a fee-share gimmick, a token airdrop) and retention is not. What retained pump.fun's users through its own 75% year-over-year revenue decline in early 2026 was the product surface: mobile app, livestreams, Terminal, creator fee sharing, cashback coins, and a two-year head start on liquidity.

**2. Creator economics changed from zero to majority in twelve months, and then got walked back.** In 2024 no launchpad paid creators anything. Believe (April 2025) introduced 50% then 70% of fees to the creator. pump.fun matched with 0.05% in May 2025, then a tiered schedule starting at 0.95% (September 2025), then let creators split it ten ways (January 2026), then let them give 100% back to traders (Cashback Coins, February 2026). Bonk.fun raised creator rewards in June 2025 and cut them to zero in January 2026 after its COO admitted they "enabled widespread abuse". Bags made fee sharing mandatory and let anyone assign fees to any X handle, which produced the platform's biggest week (Steve Yegge's $GAS) and its biggest ethical controversy (Yegge never consented). The design space is now well mapped: creator share attracts spam launches, zero share attracts nobody, and the surviving pattern is a share that decays with market cap plus the ability to route it to holders or to a named third party.

**3. Nobody has solved the graduation rate.** pump.fun under 1% in early 2025, 1.15% after cashback; Four.meme 1.3%; Bonk.fun 2.26% at its best; Believe 0.8%; Boop peaked at 6.86% for one day. Clanker and Zora skipped the curve entirely and mint straight into a Uniswap pool, which trades the graduation problem for a "95% lose liquidity within 48 hours" problem (KuCoin, Feb 2026). Every homepage in this report is therefore a feed of things that will be worthless tomorrow, and the UI decisions that matter most are the ones that help a user find the 1% before it graduates.

---

## Part 2: The ten, one at a time

Each profile follows the same shape: revenue, mechanics, every page, design system, integrations, what shipped in 2025-2026, what is wrong with it, and what clink.fun should take from it.

### 2.1 pump.fun (Solana)

**Revenue.** All-time fees $1,197M; all-time revenue $1,104M; 30-day fees $44.2M and revenue $33.8M (DefiLlama, fetched 2026-08-28, https://api.llama.fi/summary/fees/pump.fun). The week of Aug 3 to 9, 2026 did $10.03M in protocol fees on $2.97B ecosystem volume, split $751.6M bonding curve and $2.22B PumpSwap, and its 30-day revenue ($35.67M) overtook Hyperliquid's ($32.46M) (https://crypto.news/pump-fun-fees-top-10m-as-revenue-overtakes-hyperliquid/). This is the recovery: January 2026 fees were $31.8M, down 75% from $148M in January 2025 (https://coinmarketcap.com/academy/article/pumpdotfun-caps-creator-fee-changes-to-one-per-token). 14M coins launched by January 2026 (https://decrypt.co/355100/pump-fun-3-million-token-startup-fund). Creator payouts: $1.1M per day, $7.9M per week as of Jan 6, 2026; over $350M paid to creators through the bear market.

The PUMP token ICO (July 12, 2025) sold 150B tokens at $0.004 for $600M in roughly 12 minutes, plus $720M private, with US and UK buyers excluded (https://fortune.com/crypto/2025/07/18/pump-fun-memecoin-raise-ico-era-600-million-1-3-billion/). In late April 2026 the team burned every token it had bought back (~$370M, 36% of circulating supply) and committed 50% of net fees across bonding curve, PumpSwap and Terminal to a one-year buyback-and-burn (https://coinmarketcap.com/academy/article/pumpfun-burns-dollar370m-in-pump-commits-50percent-of-revenue-to-buybacks). Burns now offset 15.7% of the original supply.

**Mechanics.** The bonding curve is the reference every other Solana launchpad copies, so the constants matter:

| Parameter | Value |
|---|---|
| Total supply | 1,000,000,000 (6 decimals) |
| Initial virtual token reserves | 1,073,000,000 |
| Initial virtual SOL reserves | 30 SOL |
| Real tokens sold on the curve | 793,100,000 |
| Reserved for the migration pool | 206,900,000 |
| Initial price | ~0.000028 SOL |
| SOL collected at graduation | ~85 SOL |
| Market cap at graduation | ~411 SOL (about $69K at $168/SOL) |

Sources: https://github.com/nirholas/pump-fun-sdk/blob/main/docs/bonding-curve-math.md and https://docs.bitquery.io/docs/blockchain/Solana/Pumpfun/Pump-Fun-Marketcap-Bonding-Curve-API/. Bonk.fun uses exactly 793.1M on-curve and 85 SOL graduation too; Boop uses 206.9M for its pool. These numbers are a de facto standard.

Fees: creation is free (the first buyer covers it since August 2024). Bonding-curve trades pay 1.25% total, 0.95% protocol and 0.30% creator, as of March 2026. "Project Ascend" (September 1, 2025) made creator fees tier by market cap: 0.95% under roughly $300K, decaying to 0.05% above $20M, and paid $2M to creators in its first 24 hours (https://github.com/pump-fun/pump-public-docs/blob/main/docs/FEE_PROGRAM_README.md). Graduated PumpSwap pools decline to 0.30% total fee at 98,240 SOL market cap. Migration fee is 0.015 SOL, down from 6 SOL in the Raydium era. The tier table is read on-chain from `PUMP_FEE_CONFIG_PDA`; third-party guides disagree about current rates, so an integrator reads the PDA rather than prose.

Creator Fee Sharing (January 9, 2026): up to 10 shareholders, basis points summing to exactly 10,000, minimum 1 bps each, and the update instruction sets `admin_revoked = true`, so a creator gets one change per token (https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/CREATOR_FEE_SHARING.md). Cashback Coins (February 17, 2026): the creator elects at launch to route 100% of the creator fee to traders; the choice is permanent and cashback coins are ineligible for community takeover. Mayhem Mode (November 12, 2025): opt-in at launch, mints 2B supply on Token-2022, an AI agent trades randomly for 24 hours then burns what it did not sell. Dev buy is atomic with creation.

**Every page.** The global nav on the live site today is Home, Explore, GO, Mayhem, Live, Competition, Support, Terminal. First visit is gated by a 3D illustration (a smiling green character running over a hill with a Shiba Inu and a hippo), the copy "Pump lets anyone create coins, giving everyone equal access to buy and sell from the start. Prices can move quickly, so trade carefully.", and three checkboxes for terms, privacy and 18+.

*Board (home).* Left sidebar, central search, a "Now Trending" ticker (the old "King of the Hill", the highest-cap coin that has not graduated), "meta" chips that cluster themes ("dogs", "ai", "tesla"), and the live feed. Sort options are Featured (default), Bump Order (most recently traded or replied first) and Creation Time. Each card shows image, name/ticker, creator handle, market cap and reply count. When a coin gets a trade or reply its card physically bumps to the top with a shake and flash. This one animation is the most copied element in the category and the reason the feed feels alive even when nothing on it matters.

*Coin page (`/coin/<mint>`).* Header with name, ticker, market cap. Candlestick chart. Right-side Buy/Sell pane with amount input, quick presets (0.1, 0.5, 1 SOL; percentage buttons on sell), slippage settings. Bonding-curve progress as a percentage directly under the trade pane ("99%" means about to graduate). Thread with image replies. Holder distribution listing top holders with percentages and a "bonding curve" badge on the curve's own holding. Contract address. If the creator is streaming, the livestream is embedded on the coin page itself.

*Create coin.* Name, ticker, description, image or video. "Show more options" reveals Twitter/X, Telegram, website. After clicking Create a modal asks for an optional initial buy in SOL and shows the tokens received. Launch toggles now include Mayhem Mode, Cashback Coin and tokenized agent. Cost: 0 SOL plus network fee.

*Profile.* Coins created, coins held, followers/following, replies, likes. Creator fee claiming lives here and in the mobile app's Rewards tab.

*Advanced (legacy, October 2024).* Three columns: newly created, about to graduate, featured, plus a Watchlist column, mini charts and top-holder stats. This layout became the industry's "trenches" pattern.

*Terminal (Padre, acquired October 24, 2025).* Three-column "Trenches" (New, Almost Bonded, Recently Bonded) with saved filters over market cap, volume, holder concentration and dev activity, roughly 19 toggleable card metrics. Order types: market, stop loss, take profit, trailing stop, dip orders, dev-sell triggers, DCA, creation orders, up to five TP/SL legs per buy. Chains: Solana, Ethereum, Base, BNB, Robinhood Chain. Dark mode only, 12 to 13px body text, 24px rows, PWA with QR desktop login, flat 1% fee with 10% cashback (https://terminalpedia.com/ecosystem/what-is-terminal).

*Mobile app.* Full launch February 14, 2025 with Privy wallets and email/Google sign-up. Version 2.0 (June 27, 2025) added a "Movers Feed", "Tap-to-Ape" one-tap buys and a News section. "Callouts" (January 2026) let a user push one coin to all followers every six hours with a global leaderboard. 1.5M+ downloads by March 2026.

*Live.* Streams run from the coin page and surface on the Live tab. 18+, code of conduct, AI plus community moderation. Events are pushed over a NATS WebSocket.

*GO (June 5, 2026).* A bounty marketplace: connect X and a wallet, post a task with deadline and deliverables, fund from $5 into escrow. Day one: 320+ tasks and 1,100+ submissions.

**Design system.** White and mint/lime green on dark, gradient capsule logo, heavy geometric sans display. The Terminal is a separate, denser visual language. Onboarding uses Privy embedded wallets with email or social login; MoonPay handles fiat (cards, bank, Apple Pay, Google Pay) and, since March 2026, cross-chain deposits that auto-swap.

**Integrations.** Official `@pump-fun/pump-sdk`, `@pump-fun/pump-swap-sdk`, `@pump-fun/agent-payments-sdk`, a public docs repo, and an Agent Skills repo (Create Coin, Swap, Coin Fees, Tokenized Agent Payments). PumpPortal's Lightning API (1% per trade) and WebSocket (`subscribeNewToken`, `subscribeMigration`, `subscribeTokenTrade`) are the de facto third-party rail. Community SDKs include one with 47 MCP tools and a Telegram bot. Acquisitions: Kolscan (wallet tracker, July 2025) and Padre (October 2025).

**Weaknesses.** Solidus Labs found 98.6% of pump.fun tokens ended as pump-and-dumps or liquidity drains. UK users have been banned since December 2024. The "Pump Enterprise" class action (SDNY, July 2025) alleges $722M revenue against $4 to 5.5B of retail losses. The team cashed out $465.5M of PUMP in November 2025 with no investor lockups. Livestreams were suspended in November 2024 after violent content and the same pattern appeared on GO's launch day. Alon Cohen admitted creator fees "skewed incentives toward low-risk coin creation", which is why the fee model was rewritten three times in six months.

**What clink.fun takes.** The bump animation. The bonding-curve progress percentage adjacent to the trade pane. Quick presets on the trade pane. Reply threads with images. The three-column trenches layout for an advanced view. Creator fee sharing to N recipients with bps summing to 10,000 (clink already has `setFeeRecipient`; a multi-recipient split is the next step). The Cashback Coin idea (route creator fees to traders) is a one-flag feature on our contract.

### 2.2 Bonk.fun (letsbonk.fun, Solana)

**Revenue.** Launched April 25 to 28, 2025 as a BONK community and Raydium initiative. On July 7 to 8, 2025 it flipped pump.fun: 55% of Solana token issuance, 19,620 launches versus 9,249, and $1M+ daily revenue versus $231K (https://www.coindesk.com/markets/2025/07/08/bonkfun-grabs-55-of-solana-token-issuance-share-pushes-bonk-demand). July 2025 peaked at 74 to 78% share, $2M peak daily fees, 20K+ launches a day and $34.7M in monthly fees; the single best day was July 22 at $11.6M. By August 19, 2025 pump.fun was back at 91% of daily listings (24,911 versus 442) and Bonk.fun's daily revenue was about $250K (https://coingape.com/pump-fun-leads-letsbonk-with-800m-revenue-as-solana-memecoin-battle-grows/). Today: 30-day fees $170.7K, all-time $66.9M (DefiLlama). Bonk.fun's graduation rate at its best was 2.26% versus pump.fun's 0.84%.

A warning for anyone using secondary sources: several 2026 "comparison" articles recycle July 2025 numbers and label them "July 2026". Live data says Bonk.fun is at roughly 0.4% of pump.fun's fees.

**Fee split history**, because the marketing outlived the mechanism. Before June 10, 2025: 35% buy-and-burn BONK, 4% Solana Blockchain Reserve, 4% BonkRewards, 30% BONKsol staking. After June 10: buy-and-burn 50%, SBR 4%, BonkRewards 4%, BONKsol 15%, and Graphite Protocol (the operator) taking three lines of 7.67%. August 2025: burn cut to 40%, a "Bonk, Inc." line added at 10%. December 2025: the burn line was eliminated and replaced by "Buy for BNKK" at 51%, BNKK being Bonk, Inc., a NASDAQ-listed company (formerly Safety Shot) that took a 10% revenue interest for about $25M of BONK plus $35M preferred, then expanded to 51% (https://revenue.letsbonk.fun/, https://solanafloor.com/news/safety-shot-launches-crypto-treasury-with-25-m-deal-partners-with-bonk-founders-for-10-share-in-lets-bonk-fun). The "50% to BONK burn" pitch was true for two months. Today the majority of fees fund a public company's treasury purchases, which is a buy, not a burn.

**Mechanics.** Raydium LaunchLab program `LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj`, platform config `FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1`, mints vanity-ground to end in `bonk`. The curve is a constant product (`curveType 0`) despite marketing calling it a "Dynamic Logarithmic Curve". Supply 1B, 793.1M on the curve, graduation at 85 SOL, implied graduation market cap around 411 SOL. On-chain fees are 0.25% to Raydium plus 1.25% to the platform, so 1.5% per swap where the press says 1%. Migration is to Raydium CPMM with effectively 100% of LP burned; since Raydium's August 17, 2026 upgrade CPMM is the only graduation target. Quote tokens: SOL, USD1 (raise 6,250 USD1, launched with World Liberty Financial's "Project Wings" on September 10, 2025) and TRUMP. The create flow auto-swaps SOL to USD1 for the dev buy.

Modes (January 2026): "Memes" (BONK Classic, 0 creator fees, 0.30% swap fee mostly routed to liquidity) and "Bonkers" (creator fees, swap fee reduced up to 50%, rewards paid in a single quote asset such as USD1). Creator fees can be "Delegated to Someone", currently a Kick username via OAuth, who claims later. Before January 2026 creators earned 0.1% of volume.

**Every page** (from the live Vue/Vite bundle). Routes: `/`, `/advanced`, `/create`, `/token/:mint`, `/profile`, `/points`, `/creator-rewards`, `/hackathon`, `/trading-competition`, `/tech`, `/connections/kick`. Localised in English, Chinese, Turkish and Japanese.

*Nav.* Home, Create, Advanced, Profile, Creator Rewards, Creator Fee Claim, Revenue (external dashboard), Points Leaderboard, Hackathon, Tech Launch, Trading Competition, Bond Rewards, a Turbo On/Off toggle, light/dark toggle, language, Support. The support page still says official channels are "coming this weekend" and points users to Raydium's UI.

*Home.* Hero subtitle "Built for the community, by the community". Featured Coins ("The hottest tokens everyone's watching right now"), Hot Projects (above a market-cap threshold), an infinite-scroll grid. Sort: Last Trade, Creation Time, Heating Up, Market Cap. Filters: All Tokens, Watchlist, Graduated, search. Cards use standardized image sizes (a deliberate contrast to pump.fun's ragged images) with name/ticker, contract address, age, market cap and a progress bar. Empty state: "Looks like there are no tokens here yet. Be the first to launch a new coin and start the hype!" with a Launch New Coin button.

*Advanced.* Columns Newly Created, Heating Up, Graduating, Graduated, Watchlist. Trading Controls with Quick Snipe, Amount (SOL) and Quick Select presets. Visible Columns toggles, Live/Paused updates, "Swipe to View More" on mobile.

*Coin page.* Header with creator, contract, market cap, age and Website/Twitter/Telegram. TradingView Charting Library. Buy/Sell with slippage %, amount, Half/Max, refresh exchange rate, and balances that switch between SOL and USD1 depending on the quote. A post-buy modal says "You have successfully purchased {amount} {quote} worth of {symbol} at ${marketCap} market cap!" with a Share on X button. "Market Cap Progress: Current $X / Target $Y" bar. "This token has migrated." banner. Tabs: Replies (wallet-gated), Coin Info (Supply, Created, Bonding Curve Fees, Post Migration Fees, Developer Address), Activity (Age, Type, SOL, Account), Bubblemap, Top Holders (with Developer and Bonding Curve labels), Tokenomics Distribution, Token Locks.

*Create.* Image (5MB, drag-drop, crop tool), name (32), symbol (10), description, website, Twitter, Telegram. "Show more options": Decimals, Total Supply or Custom, Buy Amount with a simulated "≈ N SYM" readout, Slippage, Mode, Referrer wallet, Delegate Fees to a social user, saveable Configurations, optional token locks ("Tokenomics Distribution" buckets that must total 100%). After submit: "Waiting for your token to go live..." then an auto-redirect.

*Profile.* Edit name and picture; tabs Created Coins (Active / Graduated), Volume ("Coming soon"), Fees (pre- and post-migration, claim per coin, totals in SOL), Kick connection.

*Points.* A Top 20 table (Wallet, Points, Volume, Tokens Deployed, Joined) and "How to Earn Points: launch a token, participate in community events, complete daily challenges". Pitched as convertible to a future token.

*Creator Rewards.* Total rewards, projects earning (Project, Market Cap, Earned, Eligible) split Memes / Tech. By July 2025, 3,419 SOL had gone to creators and 6,685 SOL to tech contributors.

*Hackathon.* $200K pot (140 / 50 / 10), top 20 by market cap, joint review with Raydium for manipulation. *Trading Competition.* $80K, minimum 10 SOL to register, live leaderboard; the January 2026 "Winners Arc" paid $200K weekly to the top 50 traders by realised PnL on USD1 pairs via Axiom. *Bond Rewards* (rewards.bonk.fun): "Bond more, earn more. Daily rewards at UTC midnight." Deployers whose tokens graduate share a daily SOL plus USD1 pool pro rata, with a countdown, today's graduate count and Top Earners for 7/14/30 days.

No referral program, no native app, and the Volume tab has said "Coming soon" for a year.

**Design system** (from the shipped CSS, Tailwind plus shadcn-style tokens). Brand: `--primary-bonk-orange #fc8e03`, `--primary-bonk-yellow #ffd302`, `--primary-bonk-red #ff0000`, red-orange `#ff5c01`, gold `#e89607`, blue `#3685d9`. Neutrals `#363a3e`, `#6d6e72`, `#bfbfbf`, `#f6f6f6`. Dark background `#0a0a0a`, cards `#141414` and `#1a1a1a`. Buys `#48e704` / `#16a34a`, sells `#ef4444` / `#dc2626`. System font stack with monospace for addresses, radius 0.5rem. Keyframes: `float`, `gradient-shift`, `shine`, `pulse-ring`, `ping`, `pulse`, accordion and enter/exit from tailwindcss-animate. Orange scrollbar thumb. Voice: "Let's BONK!", "BONKers!", "start the hype!".

**Weaknesses.** Coinbase's Conor Grogan showed one wallet created 13,169 tokens of which 62 ever traded, and 13 wallets launched 4,200+ tokens in 24 hours; the rewards structure paid bot farms. Share collapsed from 78% to 3% in five weeks. Fee narrative churn destroyed the burn story. The COO admitted creator fees enabled abuse. Token pages have no sniper, bundler or insider metrics. Raydium's upgrade changed LP economics for every LaunchLab platform unilaterally, which is the cost of not owning the contract.

**What clink.fun takes.** Standardized card image sizes. The post-buy share modal with market cap baked into the copy. Quote-aware balances (clink's pools are quoted in stocks, so the buy pane must show the SPCX balance, not ETH). Saveable launch Configurations. The daily Bond Rewards pool is a cheap, legible incentive. And a negative lesson: own the contract; we do.

### 2.3 Four.meme (BNB Chain)

**Revenue.** All-time fees $97.98M and protocol revenue $96.57M on $9.90B of bonding-curve volume (DefiLlama, 2026-08-27). The monthly series tells the story: February 2025 $1.9M, March $5.8M, September $2.9M, **October 2025 $44.0M**, November $4.7M, January 2026 $10.5M, March $5.8M, July $1.4M, August to date $0.3M. Roughly 45% of all-time revenue came from one month. The catalyst was CZ's "#BNB meme szn" post on October 7, 2025 and the "4" token, which hit $212M market cap within hours and minted 21 new millionaires. October 8 saw 47,800 launches (3.5x the prior day), $4.22M in fees, $414M in volume and daily revenue of $4.1M versus pump.fun's $900K (https://www.cryptotimes.io/2025/10/08/bnb-chains-four-meme-launchpad-overtakes-pump-fun-in-daily-revenue/). The platform reported 812K daily unique users, 2M cumulative users, 400K tokens and a 1.3% graduation rate. Today the ecosystem category is still $704M in market cap, dominated by 币安人生 ("Binance Life") at $481M.

**Mechanics.** Fixed 1B supply, 800M on the curve, 200M reserved for the PancakeSwap V2 pool with LP burned. Progress formula `100 - ((balance - 200M) * 100 / 800M)`. Gross raise 24 BNB, about 18 BNB net to the pool. Quote assets: BNB, USDT, USD1, UUSD and, since August 2026, bStocks such as NVDAb, which makes Four.meme the second launchpad after clink.fun's own model to pair memes with tokenized equities ("Stock Memes", August 1, 2026, https://www.coingabbar.com/en/crypto-currency-news/bnb-news-today-four-meme-stock-memes-launch-update). Creation costs about 0.005 BNB in gas; trading fee 1% with a 0.001 BNB minimum. Dev buy is in the same `createToken` transaction. Launch time is schedulable and max buy per user is configurable. Every token address ends in `4444` via CREATE2.

X Mode (October 30, 2025): an anti-sniper fee that starts at 100% on block 0 and decays block by block to 1% around block 6; everything above 1% buys and burns the token right after migration. Token Name Protection locks a name and ticker for 72 hours once a coin has 100+ holders. Tax Tokens: 1/3/5/10% with burn/dividend/liquidity/recipient allocations summing to 100, dividends auto-distributed daily once $1,000 accrues. Creator rewards in classic mode are only the 10% referral cut; OpenFour (June 2026) adds "GoPlus Creator Incentives" that scale from 0.02% to a 1% cap with market cap, and a "Skill Royalty" split of 70/15/15. The Binance Wallet exclusive path ("Meme Rush", October 9, 2025) runs Keyless-only curve phases where tokens are non-transferable until migration at about $1M FDV, then a Migrated Tokens Ranking and a shot at a Binance Alpha listing, with 4x Alpha Points.

**Every page.** The site geoblocks this machine, so the following comes from the official GitBook product updates, the integration docs on GitHub and third-party reviews.

*Nav.* Board, Create Token, Ranking, Campaigns, Advanced, USD1, Airdrop. Wallets: Binance Wallet, SafePal, TokenPocket, Trust, OKX, MetaMask.

*Board.* Token cards with market cap and curve progress bar; tabs for newly created, trading and graduated ("listed on PancakeSwap"); a 24h hot list; a "Hottest USD1 tokens" strip; real-time trending keywords and narratives; a "Four" badge at 80% progress and a $44,444 market-cap badge tier.

*Rankings.* Progress, 24h Gainers, Market Cap, 24h Volume. *Advanced.* Graduated and trending projects. *Campaigns.* Active and historical.

*Coin page.* TradingView K-line chart (March 2025), buy/sell panel with AMAP and slippage, an MEV protection toggle, curve progress, a holders list plus a Bubble Map of the top 20, contract verification status, star-to-watchlist, creator wallet visibility, Space ID names on addresses, dividend claim for tax tokens, comments.

*Create.* Name and symbol (Chinese, English or mixed), logo under 5MB, description of 400 characters, a label from Meme / AI / DeFi / Games / Infra / De-Sci / Social / DePIN / Charity / Others, website/X/Telegram, raised-token selector, launch time, max buy per user, dev pre-buy, Free vs X Mode, tax settings, anti-sniping toggle.

*Profile.* Avatar and username, Watchlist, Following (follow addresses), referral code and link, a points balance top-left with a leaderboard on the right. Referral pays a flat 10% of referred users' fees.

*Mobile.* Responsive web with a 765px breakpoint, a Telegram MiniApp (@Four_memeBot) with buy alerts, and native tabs inside Binance Wallet (Markets, Meme Rush) and Trust Wallet (Swap, Meme Rush).

**Design system** (from the served shell CSS). Background `#010a10` (near-black navy), accent `#76F951` (neon green, the "4" wordmark), panels `#515151` at 10% alpha with a 30px radius, header 104px, 60px page gutters, system sans with no webfont. Minimal motion: live-updating lists and streaming charts.

**Weaknesses.** Two exploits in five weeks: February 11, 2025 (~$183K; migration called `createAndInitializePoolIfNecessary` without checking for a pre-existing V3 pair, so an attacker pre-initialised a pool at an absurd price) and March 18, 2025 (~$130K; a function let tokens reach a not-yet-created pair address, bypassing transfer restrictions). An MEV sandwich on a migration took ~$180K. FCFS curves favour bots; 1.3% graduation; geoblocks; the 97% decline from peak.

**What clink.fun takes.** The category label on the create form. Trending keywords as a discovery surface. The 80% progress badge and the round-number market-cap badge. The MEV toggle. The Bubble Map. Most of all, the migration exploit is a checklist item for us: when clink graduates a pool, the code must verify no pre-existing pool at the target address and must initialise price from the curve, never from whatever is already there. And Stock Memes with NVDAb confirms the market is moving toward what clink.fun already does.

### 2.4 Zora (Base)

**Revenue.** Cumulative fees about $12M, cumulative protocol revenue about $10.4M, 30-day fees about $1.45M (https://defillama.com/protocol/zora-protocol). The peak was the Base App launch on July 16, 2025: daily coin creators went from about 1,000 to 22,500, daily trades from 30K to 200K, daily volume to $41M and creator payouts to $375K per day (https://www.dlnews.com/articles/defi/socialfi-project-zora-surges-after-base-app-launch/). On August 2, 2025 Zora alone was 64.6% of tokens launched on Base and Solana combined (39,778 versus 15,132 for every Solana launchpad together), though Solana kept the volume by a wide margin. Q2 2025: $353M volume, $27M to creators, 179K creators, 2.8M active traders. Zora claims $1.6B cumulative volume. The ZORA token (TGE April 23, 2025) is at $0.006, market cap $26.7M, down 96% from its August 2025 high. Base ended its creator rewards program on February 15, 2026 after paying $450K to 17,000 creators and then removed the social feed entirely; Brian Armstrong: "It didn't work. We messed up, time to move on."

**Mechanics.** This is the one launchpad in the ten with no bonding curve and no graduation. Every coin is born as a Uniswap V4 pool with liquidity placed by Doppler across multi-curve positions and a single unified hook, `ZoraV4CoinHook`. Three coin types:

- Creator Coin: one per account, ticker is the username, 1B supply, 500M into the pool immediately, 500M vesting linearly over five years. Always backed by ZORA.
- Content Coin (a post): 1B supply, 10M to the creator, 990M into the pool, backed by the creator's Creator Coin.
- Trend Coin (Tags): 1B supply, all in the pool, 0.01% fee to protocol.

The backing stacks: Content Coin, then Creator Coin, then ZORA. Buying a post with USDC routes USDC to ZORA to Creator Coin to Post Coin, which is why 0x had to build custom multi-hop routing for Base App (https://0x.org/case-studies/zora). The hook applies a sniper tax that starts at 99% and decays linearly to base over the first ten seconds after creation, and a "LP remint" that takes 20% of collected fees and mints new single-sided liquidity outside the current range so pools get permanently deeper.

Fee split since September 15, 2025 (Coins v2.2.0): 1% total, of which creator 50%, platform referral 20%, trade referral 4%, protocol 5%, Doppler 1%, LP remint 20%. Custom Pairs (August 2026) let a post be paired with ETH, USDC, a Robinhood stock token or a Solana token, at 1% split creator 70 / Zora 25 / Doppler 5 on Base and Robinhood Chain. The app charges a further transaction fee: flat $0.50 under $50, 1% above.

**Every page** (from Zora's own running changelog at https://support.zora.co/en/articles/4641857).

*Feed.* Posts (image, GIF, video, 12-image carousels) as cards; creator-coin trades appear inline; a one-week sparkline on every post since May 2026. Buy is green, sell is pink. On mobile, double-tap to buy and touch-and-hold for the trade sheet.

*Vidz.* A full-screen, video-only, infinite-scroll tab (August 2025) where every video is a tradeable coin.

*Post / coin page.* Media, the $ticker as title, caption, market-cap chart, a Buy/Sell panel with a currency dropdown, presets or custom amounts, "Blockchain fee", "Estimated amount" and "Minimum received", prices and gas in USD, sell into ZORA/USDC/SOL/ETH, swap-with-comment, comments with @mentions, a pinned top-holder comment, holders list, activity, rich link previews. Quick Buy has a $0.20 minimum.

*Create.* A single page: "+" then Upload (JPG/PNG/GIF/MP4 up to 6GB) or Generate (AI, five styles: Zora, Horse, Pixel Art, Brainrot, Bust Down), Title (which becomes the ticker), caption, optional initial buy, then "Post" or "Buy + Post". Custom Pair selector, fixed at creation. Mobile adds crop, stickers, text, fonts, carousel reordering.

*Profile.* Header with Creator Coin stats (price, volume, holders, market cap), holders and holdings counts, a masonry grid of posts, pinned posts, "About this Account", an unverified label if no linked socials, locked creator-coin percentage, subscribe-for-push, and a lifetime earnings chart.

*Explore.* Categories (Featured, Video, Top Creators, Zora Stars), market cap as the primary metric with % change, Tags filter, filter by paired asset with Trending/Top/New per pair. The SDK's list types: TOP_GAINERS, TOP_VOLUME_24H, MOST_VALUABLE, NEW, LAST_TRADED, LAST_TRADED_UNIQUE, FEATURED, FEATURED_CREATORS.

*Wallet / Activity.* Realized FIFO PnL at the top with a per-coin breakdown and shareable PnL cards; Holdings tab; Tokens tab with Relay swaps; an Autosell ladder that sells 20% at 2x, 4x, 8x, 16x, 32x with per-order cancel.

*Onboarding.* Email signup with a Privy embedded wallet (three-shard Shamir, exportable), Coinbase Onramp, Apple Pay at 0% fee, gas payable in USDC or ZORA, gas-sponsored swaps on every chain since August 2026.

*Messages.* XMTP end-to-end DMs, request inbox, token-gated DMs by minimum holdings, an AI companion in web DMs. *Livestreams* in-app with archives postable as content. *Trader Leaderboard:* a weekly PnL contest paying $150K in ZORA across 50 places. *Zora Agent* trading for all users, a CLI with x402 payments, and a skill file at https://docs.zora.co/skill.md.

**Design system.** Monochrome, content-forward minimalism: near-black on white with a dark mode, media filling the card, minimal chrome. Green buys and pink sells, a deliberate departure from red/green so the app reads "social" rather than "terminal". Masonry grids, underline tabs, a bottom trade sheet, haptics on charts. Privy describes the goal as "more like using Instagram than installing a wallet."

**Weaknesses.** Sterling Crispin called it a "toxic hypercasino hellscape" where retail "gets rinsed by snipers, bundlers, coordinated pump and dumps, FNF groups, and industrial scale autonomous trading bots." The official Base account's content coin crashed 95% within hours in April 2025; Nick Shirley's creator coin hit $15M and fell 79% in 48 hours. New addresses per month fell from 60K+ to under 10K. Rewards paid in ZORA create constant sell pressure on the asset everything is backed by, and the stacked backing means one creator coin drawdown drags every post beneath it. Activation is irreversible and pairs are non-editable. The $0.50 floor makes micro trades expensive relative to a "free to post" pitch.

**What clink.fun takes.** Realized PnL with shareable cards. The Autosell ladder. Prices and gas in USD. The "filter by paired asset" explore view maps exactly onto clink's stock pairs. Green/pink is worth an experiment. The LP remint idea (a slice of fees deepens the pool permanently) is a contract-level feature we could add to `ClinkLaunchpad`. And the stacked-backing failure is a warning against ever making one clink coin the quote asset for another.

### 2.5 Virtuals Protocol (Base and Solana)

**Revenue.** Over 18,000 agents, "$470M+ Agentic GDP", and up to $1M per month distributed to agents selling services through ACP (February 2026 press release). Monthly protocol revenue fell 96% from about $3.5M in January 2025 to under $200K in June 2025, then recovered to $2.63M in February 2026 on agent-commerce activity (https://blockeden.xyz/blog/2026/04/21/agdp-agent-gdp-virtuals-protocol-ai-blockchain-valuation-primitive-tvl-displacement/). Cumulative protocol revenue exceeds $39.5M. VIRTUAL trades at $0.68 with a $449M market cap, 86% below its January 2025 high of $5.07; the ecosystem category is $822M, led by TIBBIR at $268M. AIXBT peaked above $500M in early 2025 and is now around $20M.

**Mechanics.** Creation fee 100 VIRTUAL. Prototype agents trade on a VIRTUAL-paired bonding curve and graduate to Sentient at 42,000 VIRTUAL (some docs say 42,425), which creates a Uniswap V2 pool on Base or a Meteora pool on Solana with LP locked for ten years. Metadata is frozen until about $600K market cap. Trading tax is 1%: all to treasury before graduation, 70% creator / 30% treasury after.

Genesis (April to October 2025) was a points-based presale: a 24-hour window to pledge Virgen Points and commit VIRTUAL, 37.5% of supply sold, a 0.5% per-user cap, tiers at 21K / 42K / 100K VIRTUAL, full refunds below 42,425. Points came from staking veVIRTUAL, "yapping", and voting. A 10-day cooldown hit anyone who sold below their allocation. It was gamed by wallet hopping and scrapped after six months.

Unicorn (October 7, 2025) replaced it with an anti-sniper tax that starts at 99% at TGE and decays 1% per minute over 98 minutes; the founder picks the window (0s / 60s / 10min / 98min) and which side it applies to, and the tax funds buybacks of the agent token. Automated Capital Formation: 50% of supply to the team, a sell ladder that starts at $2M FDV and adds a pool every $100K of FDV up to $160M, selling 5% per band and paying the team in USDC. "60 Days": the founder's 70% fee share is locked for two months with capped stipends, and a founder who does not commit sees the LP drained and holders refunded pro rata. January 2026 tiers: Pegasus, Unicorn ($20M to $160M FDV) and Titan ($50M minimum, $500K USDC paired at TGE).

ACP (Agent Commerce Protocol) is the actual business now: Request, Negotiation, Transaction, Evaluation with escrow released on an evaluator's sign-off, USDC settlement, ERC-8004 identity, x402 as the routing standard.

**Every page.** app.virtuals.io is a client-rendered SPA, so this is from the docs and guides. Home is a Pump.fun-style card grid with Prototype and Sentient tabs, a "Create New AI Agent" CTA and a Launch Radar of upcoming launches. The agent page has a Summary tab with chart and a VIRTUAL-denominated swap box, a Details tab with unified "Hire" and "Trade" buttons, Performance stats (weekly aGDP, job volume, success rate), Contribution NFTs, ratings and reviews, and Job Examples. The create flow: connect wallet, choose Unicorn or existing token, picture/name/ticker/socials, a one-minute pitch video from a verified X account, a 280-character pitch, How It Works, Roadmap, team contributors, schedule (three-plus days out) and optional pre-buy, a tokenomics editor, terms and the 100 VIRTUAL fee. Profile: My Projects, a veVIRTUAL lock slider, claims. ACP Scan ranks agents by aGDP with a transaction feed. Butler is a chat agent on web, X DMs, Telegram and a Base App mini-app. An iOS app shipped August 14, 2026.

**Design system.** Dark UI, lime accent for graduation and green dev-lock badges, yellow and orange DYOR badges. The brand kit publishes voice rules (calm, "onchain" as one word, at most one emoji) but no tokens.

**Weaknesses.** Revenue whiplash and total narrative dependence. Over 90% of wallets underwater. aGDP is self-reported, double-counts chained jobs and is exposed to wash trading. The fee structure has changed at least three times and docs contradict each other. Solana presence is thin (4,413 wallets over $10 versus 113,806 on EVM). Prompt injection against agent wallets is an open security topic.

**What clink.fun takes.** The scheduled launch with a public radar page, so a launch has a countdown and an audience before it goes live. The decaying sniper tax with a founder-chosen window. Dev-lock badges (green / yellow / DYOR) on cards. The "Hire" and "Trade" pairing is the template for clink's roadmap agents: every clink coin page can have an action that is not trading.

### 2.6 Clanker (Base and seven other EVM chains)

**Revenue.** Launched on Farcaster on November 8, 2024. By April 2025: about $27M all-time fees, over $13M team revenue, over 200,000 tokens, $2.7B swap volume, with no creation fee (https://www.theblock.co/post/349549/clanker-team-earns-13-million-in-revenue-from-over-200000-tokens-on-base-in-just-five-months). Farcaster acquired it in October 2025 when cumulative fees exceeded $50M and weekly revenue was $482K (https://thedefiant.io/news/nfts-and-web3/farcaster-acquires-clanker-tokenbot). The Moltbook/OpenClaw agent surge of January to February 2026 set records: $364M daily volume on January 31, 21,870 tokens created on February 2, a weekly fee record of $8.02M, and roughly 13,000 launches a day, with over 95% of tokens losing liquidity within 48 hours (https://www.kucoin.com/news/articles/clanker-surging-activity-in-base-ecosystem-drives-weekly-protocol-fees-to-record-8m-high). The homepage ticker today reads "Volume $24.9B+", "24h Volume $33.7M", "$CLANKER Bought 122.8k+", "Burned 1.37%".

**Mechanics.** No bonding curve. Every deploy mints a fixed 100B supply and seeds a Uniswap pool in one transaction. Liquidity is placed by an LP Locker into up to seven concentrated positions (a "liquidity staircase"), locked forever; only fees are claimable. The current deploy form defaults to "Project, USDC pair, 22,000 USDC market cap". v4 (July 10, 2025) moved to Uniswap V4 hooks: a static-fee hook (fixed bps per direction, e.g. buy 150 / sell 75) or a dynamic-fee hook (base plus a volatility component, roughly 0.5% base and 5% max). The protocol takes a fixed 20% of LP fees paid only in WETH; the rest goes to up to seven reward recipients with immutable bps allocations summing to 10,000, each choosing to be paid in the paired token, the coin, or both. A third-party interface earns only if it inserts itself as a recipient, and deploys carry a `context: { interface, platform, messageId, id }` for attribution.

MEV modules shape the first swaps: a two-block delay, a sniper auction (up to five rounds), and "descending fees" that decay parabolically from up to 80% over at most two minutes (the web default is "Static 1%, 15s sniper tax"). Extensions: a vault (lock up to 90% with optional linear vest, 30-day default), a Merkle airdrop, a dev buy inside the deploy transaction, and, in 2026, a "Droid" that carves out LP rewards to fund an AI agent with its own Farcaster account. A new presale contract (December 5, 2025) offers min/max raise, a seven-day window, withdrawable ETH during the sale and an allowlist; its first sale was called a "disaster" after one whale took 16 of the 20 ETH cap, and CCA-style "Clanker Auctions" are being built.

**Every page.**

*Home.* Top nav with an "Agent Skill" link and a Create button; secondary nav Home / Tokens / Create / Account / Settings; a menu with Analytics, Farcaster, X, Group Clanks, ELI5, Docs and Stock Token terms. A looping stats ticker. Hero "Launch your token", subline "Instant liquidity, built-in fee rewards, and presales", CTAs "Launch your token" and "Explore tokens". A trending grid of cards with image, name, ticker, price and 24h change.

*Token page.* Name, ticker, truncated address, creator avatar with Farcaster handle, age. A metrics bar with price, market cap and 24h change, 24h volume, holder count and top-10 holder concentration. A "Champagne Clanker" badge for approved blue chips. An embedded GeckoTerminal chart with the hint "No Data Here means no swap yet". A Token Information block (platform, contract, creator, admin, deploy date), About, Dev Buy / Vaulted % / Unlock date / vesting status / warnings ("No issues"), the originating Farcaster cast embedded, a version badge (V0 to V4.1) and a chain badge. Fee claiming at `/clanker/<address>/admin`, and anyone can trigger a claim for any token.

*Deploy.* Name, symbol, image (JPEG/PNG, 1MB), chain, description, Telegram/website/X/Farcaster. Pool pair (default USDC; a "stock token" pairing gated behind three US-person and jurisdiction checkboxes). Fee preset. Liquidity allocation slider. Droid section (toggle, name, voice, mode "Cast + Reply", LP reward share slider). Reward recipients (default one, 100% to the connected wallet). Creator Vault (percent, lock, vest). Creator Buy in ETH. Airdrop address list. A Preclank toggle with a case-sensitive trigger phrase so the config fires later from a cast. "Connect to Deploy".

*Farcaster cast path.* Tag @clanker with name, ticker and optional image. One deploy per FID per day, gated by Neynar user score. *Group Clanks:* a filterable list of proposals where users quote a cast to join as co-creators, showing slot fills like "7/4". `/tokens` and `/analytics` returned 404 during the crawl while still in the nav. No creator leaderboard exists on the site; the API exposes `/api/creator/<address>` and community tools fill the gap.

**Design system.** Dark, utilitarian, terminal-like. Monospace truncated addresses, dense stat bars, a badge system (version, chain, Champagne, vesting), embedded third-party widgets (GeckoTerminal, Farcaster casts) rather than custom charts, vanity addresses ending in `b07` as a brand signature, and a looping ticker.

**Integrations.** `clanker-sdk` (`deploy`, `simulate`, `claimRewards`, `availableRewards`, `claimVaultedTokens`, `createAirdrop`, a CLI) across Base, Arbitrum, Ethereum, BSC, Unichain, Monad and Abstract. A REST API with public, partner-key and user-auth tiers. An agent skill at https://clanker.world/skill/skill.md. Interfaces built on it include clank.fun, Clankpad, Glonkybot, CLAWNCH (8,600+ agent tokens) and pool.fans, which tokenizes Clanker fee streams. Bankr, once the main X gateway, now runs its own Doppler launcher defaulting to Robinhood Chain.

**Weaknesses.** Token slop and a 95% 48-hour death rate. The presale whale problem. A co-founder outed as the Velodrome insider who took $350K in 2022 (April 30, 2025). CLANKER 91% below its October 2025 high. Creators paid in their own token tend to market-sell. Deploy gating depends on Neynar. The effective creator share varies by interface and version (40%, 80%, 100%) and coverage constantly misstates it. Two nav links 404.

**What clink.fun takes.** Seven-recipient fee splits with immutable bps and per-recipient payout token: this is the multi-recipient version of clink's `setFeeRecipient`. Interface attribution in calldata so third-party front ends can earn. The "No Data Here means no swap yet" empty state on the chart. The vesting "No issues" summary line. Preclank (save a launch config, fire it later from a social trigger) is the exact primitive the launch-relay bot needs. The stock-token pairing with jurisdiction checkboxes is the legal pattern for our own stock pairs.

### 2.7 Believe (Solana)

**Status.** believe.app returns `DEPLOYMENT_DISABLED` from Vercel on every route, the API is down, and the founder has not posted since January 14, 2026. This profile documents a dead product because its rise and fall is the clearest case study in the set.

**Revenue.** Ben Pasternak launched Clout.me and $PASTERNAK on January 24, 2025; the token hit $80M in a day and fell 95% in a week. Rebranded to Believe on April 27 to 28, 2025 ($140M volume and $2.5M fees in two days). Peak May 13 to 15, 2025: $5.58M in daily fees, 7-day revenue of $14.17M versus pump.fun's $16M, about 4,000 launches a day, and a 13.6% share of Solana launchpads on May 15 that collapsed to 2.6% by May 17 (https://thedefiant.io/news/defi/believe-app-token-soars-900-after-generating-usd6-3-million-in-daily-revenue). Monthly fees: May 2025 $26.66M, June $7.95M, July $2.45M, August $603K, November $33.6K, December $2.9K, then effectively zero. All-time fees $40.9M, revenue $32.7M, lifetime volume $6.29B across 56,795 launches. The token is 99.6% below its high.

**Mechanics.** Every coin was a Meteora Dynamic Bonding Curve virtual pool graduating at about $100K market cap into a DAMM pool with locked LP. An anti-snipe launch fee started as high as 30% and decayed to a flat 2%. The original 2% split was 1% creator, 0.9% Believe, 0.1% Scout; on June 1, 2025 the creator share went to 70%, paid in SOL. After October 2025, 100% of new ecosystem fees were routed to BELIEVE buybacks through a public "flywheel wallet".

The launch primitive: post an idea on X, then reply `@launchcoin $TICKER (Token Name)`; the bot replied with the token page. The Scout Program let anyone reply to someone else's idea and earn 0.1% of volume forever. On May 22, 2025 X-reply launches were paused for spam and moved to website review. On June 6, 2025 fee claims were blocked for the first 24 hours of every coin, Believe gained the power to freeze claims on reported scams, and every contract address was made to end in `BLV`. Metadata (name, ticker, image, URLs) was editable after launch, which enabled impersonation. A Flywheel API v2 gave projects a multisig vault and batch Burn / Airdrop / Memo actions with JSON proof memos. v2 (January 14, 2026) pivoted to a "Human Sentiment Market" with perpetual Believe/Doubt tokens per person summing to $1. There was never a "Believe Score" feature; the closest thing is v2's "Belief Value".

**Pages.** Reconstructed: a homepage feed with a live leaderboard of trending coins; a coin page with price, market cap, 30m/24h change, volume, liquidity, buy/sell counts, holders, age and the launching X post embedded; an iOS-only app (3.8 stars) for fee claims and settings.

**Weaknesses.** The migration from LAUNCHCOIN to BELIEVE advertised a "25%" supply increase that was actually 33% (Cobie: "100 x 1.25 is 133"), zeroed LPs and 15% of non-migrated holders, and was front-run by top wallets. Twelve buyback statements went unfulfilled. A class action (SDNY, March 23, 2026) alleges $54M in fees on $6B volume against false "0 ownership" claims. The founder was arrested April 22, 2026 on assault charges. App Store reviews cite broken fee claims and no developer response.

**What clink.fun takes.** The durable ideas: launch-by-social-reply, the creator-majority split, the 24-hour claim lock, scout rewards for people who surface ideas, and a verifiable on-chain flywheel with proof memos. The lethal mistakes: mutable metadata, a supply-diluting migration, promises the contract did not enforce, and single-founder key-person risk. Every one of those is avoidable in code.

### 2.8 Bags (Solana and Robinhood Chain)

**Revenue.** Homepage claims "$5B+ trading volume, $30M+ creator earnings, 200K+ projects funded" and showcases @TheGivingBlock earning $411K from $ASTEROID. DefiLlama: cumulative fees $63.87M and revenue $31.93M ($31.67M Solana, $262K Robinhood Chain), 30-day fees $1.76M, Q1 2026 gross $23.88M. The peak was January 2026: on January 16 Bags held 33.5% of Jupiter's launchpad leaderboard by 24h volume ($293M versus pump.fun's $448M), and Alea Research recorded a 42.6% peak before the fall to single digits (https://thedefiant.io/news/defi/bags-launchpad-activity-surges-after-gas-token-soars-700, https://alearesearch.substack.com/p/bags-launchpad). The spike was $GAS: someone launched a coin for Steve Yegge's Gas Town project and assigned the fees to his X handle without telling him. He learned there was $49K waiting via a LinkedIn comment and later claimed about $300K; Geoffrey Huntley's $RALPH earned him about $300K in seven days. The ecosystem category is now under $4M in market cap.

**Mechanics.** Meteora DBC with single-sided virtual liquidity, migrating to DAMM v2 at 85 SOL (55 or 100 SOL for supply-locked variants). Seven fee modes via `bagsConfigType`: the default is 2% on the curve and 2% after, with 25% of post-graduation fees compounded into liquidity (37.5% protocol, 37.5% creator, 25% compounding); alternatives include 0.25%/1%, 1%/0.25%, a 10% flat "high" mode and a market-cap decay mode that goes from 2% to a 0.5% floor at about 25x the graduation cap. User copy simplifies it to "You earn 1% royalties of all trading volume."

Fee sharing is mandatory: up to 100 claimers identified by social handle (X, Kick, GitHub, and TikTok since April 2026), bps summing to 10,000, the creator must list themselves, more than 15 claimers auto-creates an address lookup table, and recipients cannot change after launch because "it would feel deceptive". Partners who route launches through their key take 25% of fees. Claimed amounts are public: hover the green checkmark on any token page. Optional dividends pay the top 100 holders every 24 hours once the pool hits 7 SOL. DAMM v2 direct launches skip the curve and seed a pool quoted in xStocks or Ondo tokenized equities, with fees paid in the quote mint.

On Robinhood Chain (chain 4663) Bags runs an x*y=k curve selling 830M of 1B in ETH, graduates into Uniswap v4 with locked LP, charges a flat 2% split 1% creator / 1% protocol, and takes 0.02 ETH to launch. "Index tokens" auto-convert creator fees into a fixed basket of one to ten tokenized stocks and airdrop them to holders pro rata roughly every minute once 0.001 ETH accrues (https://docs.bags.fm/robinhood/index-tokens.md). This is the closest existing product to clink.fun, and it ships on our chain.

**Every page.**

*Home.* Nav Home / Trade / Docs / Create. Hero "Launch something new", subhead "Launch a coin and earn royalties from every trade", three stat tiles, a "launch now" CTA, a creator success callout, a Trending carousel with 24h change, and an All Launches grid with tabs NEW / TRENDING / SOON / BONDED showing symbol, name, market cap, change and a contract address with copy button. Footer with iOS and Android badges.

*Trade.* A card grid with IPFS image, name, subtitle, % change, age and M / V / L (market cap, volume, liquidity).

*Coin page.* Claimed royalties on hover, social profiles for the fee recipients (X, GitHub, Kick, TikTok), chart, trade panel, group chat and holders. The client-rendered internals could not be fetched.

*Launch.* A circular image upload at the top, name (32), ticker (10), description, website, X, an "X account @ of who you'd like to share fees with" field, a fee-mode selector, a fee-share toggle with an allocation list, admin wallet, initial buy in USD, optional equity data. Launch Intent URLs pre-fill the whole form from query parameters, so any third party can deep-link a prepared launch. Recommended balance 0.2 SOL. Login via X, TikTok, GitHub or Kick creates an embedded wallet exportable to Phantom.

*Profile (`/@handle`).* Avatar, handle, view count, earnings, invites, a shareable URL, and a green Claim button beside each token with rewards.

*Developer dashboard* (dev.bags.fm) with leaderboard and partner keys; an *App Store* (March 2026) for third-party apps built on the API, backed by a $4M developer fund. *Mobile:* "BAGS: Trade Coins" at 4.4 stars with price alerts, follow-friends trade alerts, group chats and funding via Apple Pay, Coinbase, Phantom, MoonPay, Robinhood or SOL.

**Design system.** Dark ground with a green accent (logo, Claim button, claimed checkmark), grey secondary text, minimal cards, single-letter stat labels, lowercase CTAs.

**Integrations.** About 100 REST endpoints, an MIT SDK (`@bagsfm/bags-sdk`), a CLI (`bags launch`, `trade`, `fees`, `partner`, `pool`), wallet-signature agent auth with a documented skill workflow, Jupiter's launchpad screener, paid Dexscreener token-info orders via API, Meteora, Robinhood Chain.

**Weaknesses.** Volume collapse after January. Non-consensual tokenization ("a random stranger starting a Patreon or GoFundMe in your name"). The GSD Cloud rug (May 22, 2026): the hackathon winner's founder deleted accounts and extracted roughly $500K including a grant and a contest prize. Dividends to the top 100 favour whales. Immutable recipients block legitimate corrections. The fiat off-ramp is manual despite "cash out to your bank" marketing.

**What clink.fun takes.** Launch Intent URLs (a prefilled launch from a query string) are cheap to build and make every partner integration trivial. Public claimed-royalty amounts on the coin page. M / V / L labels. Fee-mode presets with a market-cap decay option. Index tokens are a direct competitor feature on Robinhood Chain; clink's answer is that our pools are quoted in the stocks themselves, so holders do not need a conversion step to have stock exposure. That distinction belongs on the homepage.

### 2.9 Moonshot (Solana, mobile)

Two products share the name. Moonshot the app (Buy Moonshots, Inc., built by the DEX Screener team, majority-owned by Jupiter since January 25, 2025) is a consumer mobile trading app with fiat rails. Moonshot the launchpad on dexscreener.com was renamed Moonit (moon.it) after the Jupiter deal.

**Revenue.** Pre-$TRUMP baseline was 3,500 to 4,900 daily traders and $20K to $40K daily revenue. During the $TRUMP weekend (January 18 to 20, 2025), when the official $TRUMP site named it "THE way to buy", it processed nearly $400M in 12 hours, 93,836 daily traders, $2.16M in fees on January 19, and over $12M in revenue in three days, and rose from #309 in US Finance to #1 Finance and #5 overall on the App Store, above Instagram and TikTok (https://www.cryptotimes.io/2025/01/19/trump-memecoin-pushes-moonshot-to-top-10-on-u-s-app-store/). DefiLlama today: 30-day fees $1.04M, annualized $12.75M, cumulative fees $63.66M (https://defillama.com/protocol/moonshot.com). The Onramper press release of April 15, 2026 claims more than two million users; Google Play shows 1M+ installs and 4.3 stars; the App Store shows 4.2 stars from 29K ratings. One source (MWM) reports a 98% download collapse in the week of March 16, 2026 attributed to an Apple removal after the 250x leverage launch; the app is live today with releases through late August 2026.

**Mechanics.** Moonit: 1B minted, 800M on the curve, two curve shapes ("Classic" accelerating and "Flat" uniform until threshold), graduation at about $75K market cap, 1% trade fee on and after the curve, migration of 88 SOL and 200M tokens into a Meteora DAMM v2 pool with permanently locked LP and dynamic fees (5% decaying to 1% after two hours), creator vesting of up to 400M through Jupiter Lock over 12 months, LP rewards split 80% creator / 20% platform and airdropped daily in SOL, and a free $299 DEX Screener Enhanced Token Info for graduates. Mint addresses end in `moon` (https://docs.moon.it/docs/welcome).

Moonshot Create (in-app, June 27, 2025): upload an image, open the Create tab, pay the network fee with Apple Pay or PayPal. Fields: image, name, ticker, description. Trading fee 0.5% pre-bond and 0.3% post-bond, creators earn "up to half of every swap fee", and tokens that reach $1M FDV get verification and front-page placement.

App fees: 2.5% on trades of $1 to $250 with a $0.99 minimum, 1% above $250. Wallet: a self-custodial MPC wallet from Turnkey with email plus Face ID and exportable recovery. Deposits settle to USDC. Fiat: MoonPay since July 2024 (cards, Apple Pay, Google Pay, PayPal, bank), later Coinbase, Robinhood, Venmo and Revolut as funding sources, and Onramper since April 2026 with 180+ local payment methods in 190+ countries (not the US).

**Every page.** Mobile only; the websites are marketing pages. Onboarding: email, Face ID, wallet auto-created, under a minute. Home/Discover: a curated list of roughly 100 to 200 coins rather than the full firehose, with trending, top gainers, sparklines, a fast-risers feed, one-tap buy, a news section and verified $1M-FDV creations pinned. Reviewers call it a "vibe-based discovery feed"; it is a scrolling list, not a TikTok swipe deck. Coin page: price chart (candlesticks since December 2025), market cap, volume, ATH, supply, contract, description, socials, buy/sell. Trade flow: pick coin, choose payment source (USDC balance or a fiat method), enter a USD amount, confirm. No limit or stop orders. Profile: portfolio, deposit/withdraw to bank or an external Solana address, recovery export, price alerts, referral.

**Design system.** Reviewers describe "a Coinbase and Venmo mashup with meme coin speculation" and "Crypto gamified". Dark UI, emoji-heavy notification copy, green/red percentage badges, avatar rows for social proof, verification badges, Face ID-first auth. No public palette.

**Weaknesses.** The $0.99 minimum punishes small buys; reviewers report fees "50x normal" during spikes. Trustpilot 2.8/5 with multi-week bank withdrawal delays and bot-only support. Congestion during dumps ("almost impossible to pull your money out"). No limit orders, no external dApp connections, no desktop. Regulatory exposure from 250x no-KYC leverage. Curation means listing coins late ("already up 30,000%").

**What clink.fun takes.** USD-denominated trade entry with a payment-source picker. A curated Discover list as a first-run surface for non-degens, separate from the firehose. Verification plus front-page placement as the reward for hitting a milestone. The MPC-plus-Face-ID onboarding sets the bar for what "no seed phrase" should feel like.

### 2.10 SunPump (TRON)

**Revenue.** Launched August 9 to 10, 2024 and passed $1.1M revenue in its first 11 days; the peak day (August 21, 2024) did $589K from 7,531 launches, beating pump.fun's fee take that day (https://cryptobriefing.com/sunpump-daily-revenue-memecoin/). DefiLlama all-time fees $6.46M: 2024 $5.59M, 2025 $0.70M, 2026 year-to-date $0.17M. Roughly 121K tokens created lifetime and 1,880 graduated to SunSwap. 100% of net revenue buys and burns SUN, funding 285M+ of the 650M SUN burned as of November 2025. SUNDOG reached about $1.1B market cap in 2024.

**Mechanics.** Supply 1B with 18 decimals, 800M on the curve, 200M to a SunSwap V2 pool. A fresh token shows `virtualLiquidity 23,835 TRX` and a market cap of about 32,710 TRX. Graduation is denominated in TRX, not dollars: 500,000 TRX market cap, which was "$69,420" in the 2024 press and is about $170K today because TRX rose, so the bar for every creator drifted up with no product change. At graduation about 100,000 TRX plus the 200M tokens go to SunSwap V2, 3,000 TRX is deducted as a liquidity fee, and the LP is burned. Creation costs about 20 TRX, trading 1%. There is no creator fee share; creators earn only through their optional pre-buy. Referral pays 10% of invitee fees (20% for a "Meme Star" tier and for holders of 1M SUN), pre-graduation only, paid in TRX every two weeks. Contracts and functions (`createAndInitPurchase`, `purchaseToken`, `saleToken`, `getPrice`) are documented at https://docs.sun.io/protocols/sunpump/reference/contract.

**Every page** (from the production bundle's route table and the docs). Routes: `/home`, `/launch`, `/token/:address`, `/portfolio`, `/ranking`, `/referral`, `/invite`, `/campaign`, `/skill`. Home: a campaign banner carousel, a King of the Hill hero card, a token grid with search, favorites and a WebSocket ticker; cards show logo, name/ticker, creator, market cap, curve progress, holders and 24h change, and tokens carry flags for X-launched (`tweetUsername`) and DLive livestreams. Token page: logo, name, ticker, creator, description, price in TRX with 24h change, market cap, "Virtual Liquidity" (which switches to real SunSwap liquidity after graduation), 24h volume, launch time, a candlestick chart from a separate kline API, a buy/sell panel with a 5% default slippage, realtime transaction history, holders, comments, a report button, the curve progress bar, and a "CEX Alliance" apply modal for creators (HTX, Poloniex, BingX, Bitget). Launch: symbol (10), name (20), description (256), image, optional links, optional pre-purchase in the same transaction, reCAPTCHA. Portfolio: holdings and launched tokens. Ranking: market cap or 24h volume. Referral: invite code, details, rewards paid. Campaign: trading competitions. Skill: the SUN AI CLI, MCP server and skills entry point.

**Design system.** React, Vite and Ant Design. Font stack `PingFang SC, sans-serif` (Chinese-first). Dark backgrounds `#121215` and `#1B1B1F`, white text, amber accent `#FFB020`, green/red prices. Bilingual English and Simplified Chinese, with a deliberate Chinese-narrative meme push since October 2025.

**Weaknesses.** An 89% fee decline from 2024 to 2025 and near dormancy now. The TRX-pegged graduation. No creator economics and nothing to retain builders. TronLink dependence and Chromium-only browsers. No sniper tax or MEV protection. No public API docs.

**What clink.fun takes.** The "Virtual Liquidity" label that switches to real liquidity after graduation is an honest way to present a curve's fake depth. Sunflare (a feature slot at 80% progress) rewards momentum. The CEX Alliance apply modal is a reminder that the coin page can be the front door to things beyond trading. The TRX-pegged graduation is the warning: clink's graduation targets are set per market in the quote stock, so if a stock's price doubles the graduation bar in dollars doubles too. That needs either a USD-anchored target read from an oracle or clear copy explaining the bar moves with the stock.

---

## Part 3: The same page, ten ways

### 3.1 The homepage

Every launchpad homepage is a feed, and the design decisions are about what to pin above it and how to sort it.

| Launchpad | Pinned hero | Default sort | Other sorts / tabs | Card contents | Signature motion |
|---|---|---|---|---|---|
| pump.fun | "Now Trending" (highest cap not yet graduated), meta chips | Featured | Bump Order, Creation Time | image, name/ticker, creator, mcap, replies | Card bumps to top with shake on trade or reply |
| Bonk.fun | Featured Coins, Hot Projects | Last Trade | Creation Time, Heating Up, Market Cap; All / Watchlist / Graduated | standardized image, name/ticker, CA, age, mcap, progress bar | Live updates, orange hover glows |
| Four.meme | 24h hot list, Hottest USD1 strip, trending keywords | newly created | trading, graduated | mcap, progress bar, badges at 80% and $44,444 | Streaming list updates |
| Zora | none; the feed is the product | algorithmic feed | Explore: Featured, Video, Top Creators, by paired asset | media-first card, sparkline, ticker | Double-tap to buy, haptics |
| Virtuals | Launch Radar (upcoming launches) | Prototype / Sentient tabs | none documented | image, ticker, price, dev-lock badge | none notable |
| Clanker | Looping stats ticker | Trending grid | Tokens page (404 at crawl) | image, name, ticker, price, 24h change | Ticker loop |
| Believe | Live leaderboard | trending | none | price, change, volume, launching post | offline |
| Bags | Trending carousel, creator success callout | NEW | TRENDING, SOON, BONDED | symbol, name, mcap, change, CA copy | Carousel |
| Moonshot | Curated Discover list, fast risers | curated | trending, top gainers, news | sparkline, % badge | Live prices |
| SunPump | Campaign carousel, King of the Hill | market cap | volume, favorites | logo, mcap, progress, holders, change | WebSocket ticker |

Three observations. First, every Solana launchpad pins a "king of the hill" (the highest-cap pre-graduation coin) because it is the single most useful piece of information on the page: it is where the volume is right now. Second, the two social-first products (Zora, Moonshot) refuse to show the firehose at all and lost the degen audience for it, while every firehose product added a curated layer on top (Featured, Hot Projects, Champagne, Sunflare). The right answer is both, with the curated layer default for a new visitor and the firehose one click away. Third, the only motion anyone remembers is pump.fun's bump. It is one CSS animation on a list reorder and it does more for perceived liveness than any WebSocket ticker.

### 3.2 The coin page

| Element | Who does it best | Detail |
|---|---|---|
| Chart | Bonk.fun, Four.meme | Full TradingView Charting Library, not the lightweight widget |
| Empty chart state | Clanker | "No Data Here means no swap yet" |
| Curve progress | pump.fun | Percentage directly under the trade pane |
| Progress copy | Bonk.fun | "Current $X / Target $Y" |
| Fake vs real depth | SunPump | "Virtual Liquidity" label switches to real after graduation |
| Trade pane | pump.fun | Presets 0.1 / 0.5 / 1 SOL, percentage sells, slippage |
| Quote awareness | Bonk.fun | Balances switch between SOL and USD1 by pool |
| Post-trade | Bonk.fun | Share modal with market cap in the copy |
| Holders | Four.meme | List plus Bubble Map of top 20, with Developer and Bonding Curve labels |
| Fees transparency | Bags | Claimed royalties on hover; recipients with social profiles |
| Vesting summary | Clanker | Dev Buy / Vaulted % / Unlock date / "No issues" |
| Safety | Four.meme | Contract verification status, MEV toggle, report button |
| Social proof | Clanker, Believe | The originating cast or post embedded |
| Discussion | pump.fun | Threads with image replies; Zora's swap-with-comment |
| Live | pump.fun | Livestream embedded on the coin page itself |
| Beyond trading | Virtuals, SunPump | "Hire" next to "Trade"; CEX Alliance apply |

The coin page that combines these does not exist yet. clink.fun already has the five-view chart and the trade feed; the gaps are the holders map, the fee transparency block, the vesting summary and embedded social proof.

### 3.3 The create page

Fields, in order of how many of the ten collect them:

1. Image (10 of 10). Max sizes range from 1MB (Clanker) to 6GB (Zora, which accepts video). Bonk.fun and Zora add a crop tool; Bags uses a circular preview.
2. Name (10). Limits: 20 (SunPump), 32 (Bonk.fun, Bags).
3. Symbol (10). Limit is 10 almost everywhere.
4. Description (9). 256 (SunPump), 400 (Four.meme). Zora calls it a caption; Boop calls it "cult lore".
5. Website / X / Telegram (9). Usually behind "Show more options".
6. Dev buy in the same transaction (9). Every platform frames it as sniper protection.
7. Fee recipient(s) (6). Bags: up to 100 by social handle; pump.fun: up to 10 by bps; Clanker: up to 7 with payout-token choice; Bonk.fun and Boop: delegate to one social user.
8. Quote asset (5). Four.meme (BNB/USDT/USD1/NVDAb), Bonk.fun (SOL/USD1/TRUMP), Zora (ETH/USDC/stock/SOL), Clanker (USDC default, stock gated), Bags (SOL or xStocks/Ondo).
9. Launch mode or fee preset (5). pump.fun's Mayhem/Cashback toggles, Four.meme's Free vs X Mode, Bonk.fun's Memes vs Bonkers, Bags's seven modes, Clanker's fee presets.
10. Category label (1). Four.meme.
11. Scheduled launch (3). Four.meme, Virtuals, Clanker's Preclank.
12. Vesting / locks (4). Bonk.fun buckets, Clanker vault, Virtuals pre-buy vest, Moonit Jupiter Lock.
13. Prefill from URL (1). Bags Launch Intent.
14. Saved configurations (1). Bonk.fun.

clink.fun's launch page already collects 1 through 7 plus market selection and weights, which no one else has in this form. Adding a category label, a scheduled launch time, a Launch Intent URL, saved configurations and a fee-mode preset would make it the most complete create form in the category.

### 3.4 The profile page

Every profile has created coins and holdings. The differentiators: pump.fun's followers/following and Callouts; Zora's lifetime earnings chart, PnL cards and Autosell ladder; Bags's public earnings, view count and per-token Claim buttons; Bonk.fun's Fees tab with pre- and post-migration claims; Four.meme's watchlist, following and points; Boop's staking screen. A profile that shows realized PnL, claimable fees per token and a shareable earnings card covers the three things a user actually returns for.

### 3.5 Incentive surfaces

| Surface | Who | Mechanism |
|---|---|---|
| Points leaderboard | Bonk.fun, Four.meme, Virtuals (retired) | Points for launching, trading, events; future-token promise |
| Trading competition | Bonk.fun ($80K, $200K weekly), Zora ($150K weekly), Four.meme campaigns, SunPump | Realized PnL leaderboards with a countdown |
| Creator rewards page | Bonk.fun | Projects earning by market-cap threshold |
| Daily graduation pool | Bonk.fun Bond Rewards | Graduated deployers split a SOL + USD1 pool at UTC midnight |
| Referral | Four.meme (10%), SunPump (10 to 20%), Moonshot | Percentage of invitee fees |
| Hackathon | Bonk.fun ($200K), Bags ($4M fund) | Top projects by market cap or judged |
| Bounties | pump.fun GO | Escrowed tasks from $5 |
| Holder dividends | Bags (top 100 daily), Four.meme tax tokens, Boop (62.5% of fees) | Push to wallets, no claim |
| Milestone tiers | Boop Temple of Moon | Fortnightly pools by market cap tier, held 30 minutes to count |

Two patterns recur in the ones that lasted: pay out on a fixed schedule with a visible countdown, and pay for outcomes (graduation, PnL, market-cap tier) rather than actions (launch count), because paying for actions produced Bonk.fun's 13,169-token wallet.

---

## Part 4: Mechanics side by side

| | pump.fun | Bonk.fun | Four.meme | Bags | Moonit | SunPump | Boop | Virtuals | Clanker | Zora |
|---|---|---|---|---|---|---|---|---|---|---|
| Curve | constant product, virtual reserves | constant product | constant product | Meteora DBC | classic or flat | constant product | constant product with damping | constant product | none | none (V4 pool) |
| Supply | 1B | 1B (custom ok) | 1B | 1B | 1B | 1B | 1B | 1B | 100B | 1B |
| On curve | 793.1M | 793.1M | 800M | varies | 800M | 800M | 743.2M | n/a | n/a | n/a |
| Graduation | ~85 SOL (~$69K) | 85 SOL | 24 BNB | 85 SOL | ~$75K | 500K TRX | ~86 SOL | 42K VIRTUAL | instant | instant |
| Destination | PumpSwap | Raydium CPMM | PancakeSwap V2 | Meteora DAMM v2 | Meteora DAMM v2 | SunSwap V2 | Raydium/Meteora | Uniswap V2 / Meteora | Uniswap V4 | Uniswap V4 |
| Curve fee | 1.25% | 1.5% | 1% | 2% default | 1% | 1% | 1% | 1% | 1 to 3% | 1% |
| Creator share | 0.30% tiered, splittable x10 | 0 or mode-based | 0 to 1% | 37.5% of 2%, x100 recipients | up to 50% | none | 62.5% of 2% to holders or delegate | 70% of 1% | up to 80% of LP fees, x7 recipients | 50% of 1% |
| Anti-snipe | none | none | 100% decaying by block | none | dynamic 5% to 1% | none | none | 99% decaying 1%/min | 80% decaying over 2 min, auctions, block delay | 99% decaying over 10s |
| Metadata | frozen | frozen | name locked at 100 holders | frozen | frozen | frozen | frozen | frozen to $600K | EAS-mutable | fixed pair |
| Quote assets | SOL, USDC | SOL, USD1, TRUMP | BNB, USDT, USD1, bStocks | SOL, xStocks | SOL | TRX | SOL | VIRTUAL | USDC, WETH, stocks | ZORA, creator coin, custom |

Two rows matter most for clink.fun. The anti-snipe row: five of ten now ship a decaying launch fee, and the ones that do not (pump.fun, Bonk.fun, Bags) are the ones whose creators complain most about bundlers. `ClinkLaunchpad` has no launch-window fee today; a per-launch decaying fee with a founder-chosen window (Virtuals' four options are a good UI) is the single highest-value contract addition on this list. The quote-assets row: stock-quoted pools went from zero platforms in mid-2025 to four (Four.meme, Bags, Zora, Clanker) in the last twelve months. The category clink.fun was built for is now contested, and clink's edge is that stocks are the only quote, with up to five per coin, rather than an optional pairing behind a checkbox.

---

## Part 5: Design systems, with the actual tokens where they were recoverable

| Launchpad | Background | Accent | Buy / Sell | Type | Radius | Voice |
|---|---|---|---|---|---|---|
| pump.fun | dark | mint/lime green, gradient capsule | green / red | heavy geometric sans | small | playful, 3D mascots at the gate |
| Bonk.fun | `#0a0a0a`, cards `#141414` | `#fc8e03` orange, `#ffd302` yellow | `#48e704` / `#ef4444` | system stack, mono addresses | 0.5rem | "Let's BONK!" |
| Four.meme | `#010a10` | `#76F951` neon green | green / red | system sans | 30px panels | terse |
| Zora | white or near-black | none; monochrome | green / pink | clean grotesque | media-edge | "post", not "launch" |
| Virtuals | dark | lime for graduation, yellow/orange DYOR | green / red | sans | medium | calm, one emoji max |
| Clanker | dark | badges | green / red | mono-heavy | small | functional |
| Bags | dark | green (logo, Claim, checkmark) | green / red | sans, M/V/L labels | medium | lowercase |
| Moonshot | dark | brand purple/blue | green / red badges | system | large, consumer | emoji notifications |
| SunPump | `#121215`, `#1B1B1F` | `#FFB020` amber | green / red | PingFang SC | Ant Design | bilingual |
| Boop | `#0D121C` | `#0CAEE4` cyan, `#6E57F9` purple, `#FF8A14`, `#F8CC32` | green / `#F04438` | Poppins + DotMatrix | 16 / 24px, pills | "start ur cult" |

Nine of ten are dark. Nine of ten use green/red. The only two that look like anything other than a trading terminal are Zora (monochrome, media-first, green/pink) and Moonshot (consumer fintech). clink.fun's current `ink` ramp plus a single accent sits in the majority; the decision to make is whether the stock pairing warrants a more "brokerage" register (Moonshot's Coinbase-meets-Venmo) than a "trenches" one. Given the audience the product is for (people who want stock exposure through a meme), the brokerage register is the differentiator, and Zora's proof that green/pink reads as "not a casino" is worth a test.

---

## Part 6: What died and why, in one table

| Platform | Peak share | Weeks to collapse | Proximate cause | Structural cause |
|---|---|---|---|---|
| Believe | 13.6% (May 15, 2025) | under 1 | spam, X-launch pause | mutable metadata, founder risk, promises the contract did not enforce |
| Bonk.fun | 78% (Jul 2025) | 5 | pump.fun's fee response | paying for launch count, not owning the contract |
| Heaven | 28% (Aug 2025) | 4 | narrative rotation | nothing beyond the fee gimmick |
| Four.meme | beat pump.fun daily (Oct 2025) | 4 | CZ meme season ended | FCFS curves, two exploits, geoblocks |
| Bags | 42.6% (Jan 2026) | 3 | Gas Town unwind | non-consensual tokenization backlash, hackathon rug |
| Boop | first-week beat LaunchLab | 1 | rules changed repeatedly | KOL-farming airdrop |
| Zora (social) | 64.6% of launches (Aug 2025) | ~26 | Base pulled the feed | backing-chain drawdowns, ZORA-denominated rewards |
| Virtuals (launchpad) | AI agent mania (Jan 2025) | ~20 | narrative | Genesis gaming; saved by pivoting to ACP |

pump.fun survived the same drawdowns because it kept shipping surfaces (app, Live, Terminal, GO) and because it controls its own contract and AMM. The two platforms that pivoted rather than died (Virtuals to agent commerce, Zora to attention markets on Solana) each had an asset the launchpad was merely the front door for.

---

## Part 7: The clink.fun feature list, ranked

Everything below is derived from the ten profiles. Ranking is by impact divided by effort against the codebase as it stands (Foundry contract, node API with event indexer, React and Vite front end).

**Contract (`ClinkLaunchpad.sol`)**
1. Decaying launch fee with a founder-chosen window (Virtuals, Clanker, Zora, Four.meme, Heaven). Excess fee either to the pool (Zora remint) or to a buyback of the coin (Four.meme). Highest value item on the list; every 2026 launchpad has it.
2. Multi-recipient creator fee split, up to 10 recipients, bps summing to 10,000, one change per token (pump.fun), with per-recipient payout-token choice (Clanker).
3. A "cashback" flag that routes the creator share to traders pro rata (pump.fun Cashback Coins).
4. Graduation safety: verify no pre-existing pool at the target and initialise price from the curve (the Four.meme exploit).
5. A USD-anchored or clearly labelled graduation target per stock (the SunPump drift).
6. Optional LP remint: a slice of fees deepens the pool permanently (Zora).
7. Creator vault with lock and linear vest, disclosed on the coin page (Clanker, Bonk.fun).

**API and indexer**
8. Public claimed-fee totals per coin and per recipient (Bags).
9. Holder distribution with Developer and Curve labels, plus top-20 concentration (Four.meme, Clanker).
10. Realized FIFO PnL per wallet (Zora).
11. Launch Intent URLs that prefill the launch form from query parameters (Bags), and a saved-configuration store (Bonk.fun).
12. Scheduled launches with a public radar page (Virtuals, Four.meme, Clanker Preclank). This is also the hook the launch-relay bot should use.

**Front end**
13. The bump: reorder the feed on trade with a shake (pump.fun).
14. "King of the hill": pin the highest-cap pre-graduation coin (pump.fun, SunPump).
15. Standardized card images (Bonk.fun) and M / V / L stat labels (Bags).
16. Filter the feed by paired stock (Zora's paired-asset explore), with Trending / Top / New per stock.
17. Trade pane presets in the quote stock and in USD (pump.fun, Moonshot), balances that follow the pool's quote (Bonk.fun).
18. Post-trade share modal with market cap in the copy (Bonk.fun).
19. Chart empty state "No swap yet" (Clanker; clink's current empty state already points at the curve view, which is better).
20. "Virtual liquidity" label that becomes real liquidity after graduation (SunPump).
21. Vesting summary line "Dev buy / Vaulted / Unlock / No issues" (Clanker).
22. Category label on launch and as a feed filter (Four.meme).
23. Advanced three-column view: New / Almost Graduated / Graduated with quick-buy controls (pump.fun, Bonk.fun).
24. Profile with claimable fees per coin, lifetime earnings chart and shareable PnL cards (Bags, Zora).
25. Autosell ladder (Zora).
26. A daily or weekly outcome-based reward pool with a countdown (Bonk.fun Bond Rewards, Zora leaderboard).
27. Stock-pairing jurisdiction acknowledgement in the launch flow (Clanker's three checkboxes), reviewed by counsel.

**Distribution**
28. Launch-by-social-reply (Believe, Clanker, Boop, SunPump), gated by account age or score and rate-limited per account, with the 24-hour claim lock (Believe).
29. An agent skill file and CLI (Clanker, Zora, Bags, SunPump, pump.fun all ship one; it is table stakes for agent-driven launches and lines up with the MCP and x402 items already on the clink roadmap).
30. Telegram MiniApp (Four.meme) before a native app; nobody in the ten got a native app right on the first try except Moonshot, which is a different business.

---

## Appendix: five more, one idea each

**Boop.fun (Solana, May 2025, Dingaling).** $BOOP hit $500M market cap in 90 minutes; day one 10,877 tokens and 154 graduations; launches fell 90% in three days; all-time fees $4.48M and $390 in 2026. The idea worth keeping is fee delegation to a social handle with holder rewards pushed to wallets without a claim, and the "Temple of Moon": fortnightly pools split across eight market-cap tiers (15 spots at $1M, down to one at $50M) where a tier only counts if held for 30 minutes. The failure was changing the rules four times (5% to stakers became 0.5% plus 4.5% burned; 1% fee became 2%; Raydium became Meteora; daily rewards paused).

**Heaven (Solana, August 2025).** Its own AMM with no graduation, a six-second decaying sniper tax, Ellipsis MEV protection, and a review at $100K volume that sorts tokens into Creator (1.5% fee), Community (0.1%) or Blocked. 100% of protocol fees buy and burn LIGHT every five seconds. $200M volume and $1.6M revenue in two weeks, then nothing. The tiering by review is the one honest answer to "creator fees reward abandoned devs".

**Flap.sh (BNB, X Layer, Monad, Robinhood Chain).** Modular: tax tokens at 1/3/5/10%, custom quote assets, a Vault Factory for third-party reward templates, and on Robinhood Chain a Stocks Vault where a meme trades against tokenized AAPL, NVDA or SPY and pays stock-token dividends. This is the third stock-pairing product on our chain after Bags and Zora. Its landing is a trending table with market cap, 24h volume, tax, price and change columns.

**Time.fun.** One token equals one minute of a creator's time, redeemable through escrow with a five-day refund. $92K lifetime fees. The reminder that a coin can carry a utility the contract enforces.

**PumpSwap.** The volume benchmark for any post-graduation venue: 0.25% base swap fee (0.20% LP, 0.05% protocol) plus a 0.05% creator fee, all-time fees $782M and $421M in 2026 alone, peak day $5.45M. clink's graduated pools live on Uniswap V4 on Robinhood Chain; whatever fee schedule we choose should be benchmarked against this.

---

## Sources

Every figure above carries its URL inline. The research was compiled from DefiLlama's fee adapters and raw API, each platform's own docs and support centres, shipped front-end bundles where the site was reachable (Bonk.fun, SunPump), the Wayback Machine where it was not (Boop), and reporting from The Block, The Defiant, CoinDesk, DL News, CryptoSlate, CoinGecko, KuCoin, Bitget, Phemex, Alea Research and Pine Analytics. Where a platform's own site could not be crawled (Four.meme geoblocks, Believe is offline, Virtuals and Bags are client-rendered) the section says so.
