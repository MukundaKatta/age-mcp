#!/usr/bin/env node
/**
 * age MCP server. One tool: `between`.
 *
 * Compute the duration between two dates as years/months/days. Walks the
 * calendar one component at a time (years first, then months, then days)
 * so day-of-month boundaries are handled correctly across irregular months.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.1.0';

export interface AgeResult {
  from: string;
  to: string;
  years: number;
  months: number;
  days: number;
  total_days: number;
  total_hours: number;
  total_seconds: number;
  display: string;
}

function parseDate(s: string): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('invalid date: ' + s);
  return d;
}

/**
 * Add `n` months to `d`, clamping the day-of-month to the last day of the
 * target month (so Jan 31 + 1 month = Feb 28/29).
 */
function addMonths(d: Date, n: number): Date {
  const targetMonth = d.getUTCMonth() + n;
  const targetYear = d.getUTCFullYear();
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(d.getUTCDate(), lastDay);
  return new Date(
    Date.UTC(targetYear, targetMonth, day, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()),
  );
}

export function between(fromInput: string, toInput: string = new Date().toISOString()): AgeResult {
  const from = parseDate(fromInput);
  const to = parseDate(toInput);
  if (from > to) {
    const r = between(toInput, fromInput);
    return {
      ...r,
      from: from.toISOString(),
      to: to.toISOString(),
      years: -r.years,
      months: -r.months,
      days: -r.days,
      total_days: -r.total_days,
      total_hours: -r.total_hours,
      total_seconds: -r.total_seconds,
      display: '-' + r.display,
    };
  }
  // Walk forward by years, then months, then days. Each step clamps day-of-
  // month so Jan 31 + 1 month = Feb 28/29.
  let cur = from;
  let years = 0;
  while (true) {
    const next = addMonths(cur, 12);
    if (next > to) break;
    cur = next;
    years++;
  }
  let months = 0;
  while (true) {
    const next = addMonths(cur, 1);
    if (next > to) break;
    cur = next;
    months++;
  }
  const days = Math.floor((to.getTime() - cur.getTime()) / 86_400_000);
  const totalMs = to.getTime() - from.getTime();
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    years,
    months,
    days,
    total_days: Math.floor(totalMs / 86_400_000),
    total_hours: Math.floor(totalMs / 3_600_000),
    total_seconds: Math.floor(totalMs / 1000),
    display: displayAge(years, months, days),
  };
}

function displayAge(y: number, m: number, d: number): string {
  const parts: string[] = [];
  if (y) parts.push(y + (y === 1 ? ' year' : ' years'));
  if (m) parts.push(m + (m === 1 ? ' month' : ' months'));
  if (d || parts.length === 0) parts.push(d + (d === 1 ? ' day' : ' days'));
  return parts.join(', ');
}

const server = new Server({ name: 'age', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'between',
    description:
      'Compute the duration between two ISO 8601 dates as { years, months, days } plus total seconds/hours/days.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'ISO 8601 start (e.g. birthday).' },
        to: { type: 'string', description: 'Optional ISO 8601 end. Defaults to now.' },
      },
      required: ['from'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name !== 'between') return errorResult('unknown tool: ' + name);
    const a = args as unknown as { from: string; to?: string };
    return jsonResult(between(a.from, a.to));
  } catch (err) {
    return errorResult('age failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`age MCP server v${VERSION} ready on stdio\n`);
}
