# age-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/age-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/age-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)

MCP server: compute the duration between two dates as years / months / days,
plus total seconds / hours / days. Handles irregular month lengths and
leap years correctly. No deps.

## Tool

### `between`

```json
{ "from": "1990-05-10T00:00:00Z", "to": "2026-05-11T00:00:00Z" }
```

→

```json
{
  "from": "1990-05-10T00:00:00.000Z",
  "to":   "2026-05-11T00:00:00.000Z",
  "years": 36, "months": 0, "days": 1,
  "total_days": 13150, "total_hours": 315600, "total_seconds": 1136160000,
  "display": "36 years, 1 day"
}
```

If `to` is omitted, defaults to now. If `from > to`, the result is negative.

## Configure

```json
{ "mcpServers": { "age": { "command": "npx", "args": ["-y", "@mukundakatta/age-mcp"] } } }
```

## License

MIT.
