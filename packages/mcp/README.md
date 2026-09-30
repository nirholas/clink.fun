# clink-mcp

Launch coins paired with tokenized stocks on Robinhood Chain from any MCP
client. This is a stdio bridge to the hosted [clink.fun](https://github.com/nirholas/clink.fun)
MCP server: tools are discovered from the server at startup, so the package
never falls behind the live tool set.

The assistant can browse markets and coins, price trades and plan a launch.
It cannot sign. `plan_launch` returns a link; you open it, connect your own
wallet, review, and sign. Nothing is deployed or spent until you do.

## Use it

Clients that take a remote URL (Claude on the web and desktop via Settings,
Connectors, Add custom connector; Claude Code) do not need this package:

```bash
claude mcp add --transport http clink https://clink-fun-93741856042.us-central1.run.app/mcp
```

Clients that start servers over stdio:

```json
{
  "mcpServers": {
    "clink": { "command": "npx", "args": ["-y", "clink-mcp"] }
  }
}
```

`CLINK_MCP_URL` points the bridge at a different deployment.

## Tools

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

## Example

> Launch a coin called Chip Dip, ticker CHIPS, 70% NVDA and 30% AMD, with this
> logo: https://example.com/chips.png

The assistant calls `plan_launch`, shows the summary and the link, and after
you sign, `launch_status` returns the coin address.
