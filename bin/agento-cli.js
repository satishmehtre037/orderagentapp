#!/usr/bin/env node

/**
 * Agento AI Official CLI Tool
 * Package: @webcorestudio/agento-cli / agento-cli
 * Developed by WebCore Studio
 */

const args = process.argv.slice(2);
const command = args[0] || 'help';

const API_BASE = process.env.AGENTO_API_URL || 'https://orderagentapp.webcorestudio.dev';

async function main() {
  switch (command) {
    case 'version':
    case '--version':
    case '-v':
      console.log('agento-cli v1.0.0 (Agento AI by WebCore Studio)');
      break;

    case 'status':
    case 'health':
      console.log(`Checking Agento AI API status at ${API_BASE}...`);
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        const json = await res.json();
        console.log('Status: Online');
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Status: Offline or unreachable');
        console.error(e.message);
      }
      break;

    case 'appointments': {
      const sub = args[1] || 'list';
      const bizIdIndex = args.indexOf('--business-id');
      const bizId = bizIdIndex !== -1 ? args[bizIdIndex + 1] : process.env.AGENTO_BUSINESS_ID;

      if (!bizId) {
        console.error('Error: --business-id <UUID> or AGENTO_BUSINESS_ID environment variable is required.');
        process.exit(1);
      }

      if (sub === 'list') {
        const res = await fetch(`${API_BASE}/api/hospital/appointments?business_id=${bizId}`, {
          headers: { 'x-business-id': bizId },
        });
        const json = await res.json();
        console.log(JSON.stringify(json, null, 2));
      } else {
        console.log(`Unknown appointments subcommand: ${sub}`);
      }
      break;
    }

    case 'cron': {
      const sub = args[1] || 'trigger';
      const job = args[2] || 'all';
      const bizIdIndex = args.indexOf('--business-id');
      const bizId = bizIdIndex !== -1 ? args[bizIdIndex + 1] : process.env.AGENTO_BUSINESS_ID;
      const secret = process.env.CRON_SECRET || 'bizbot_cron_secret_2026';

      console.log(`Triggering cron scan '${job}'...`);
      const res = await fetch(`${API_BASE}/api/hospital/cron/trigger/${job}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': secret,
          ...(bizId ? { 'x-business-id': bizId } : {}),
        },
        body: JSON.stringify({ business_id: bizId }),
      });
      const json = await res.json();
      console.log(JSON.stringify(json, null, 2));
      break;
    }

    case 'help':
    default:
      console.log(`
Agento AI CLI — Official Command Line Tool for Agento AI by WebCore Studio

Usage:
  npx @webcorestudio/agento-cli <command> [options]
  agento <command> [options]

Commands:
  status, health                                Check production API status and latency
  appointments list --business-id <UUID>        Fetch OPD consultation bookings for a tenant
  cron trigger <job> [--business-id <UUID>]     Trigger background scans (reminders, feedback_surveys, all)
  version, --version, -v                        Show CLI version
  help                                          Show this help manual

Environment Variables:
  AGENTO_API_URL        API base URL (default: https://orderagentapp.webcorestudio.dev)
  AGENTO_BUSINESS_ID    Default business tenant UUID
  CRON_SECRET           Cron runner authorization secret

Documentation:
  https://orderagentapp.webcorestudio.dev/cli
  https://orderagentapp.webcorestudio.dev/api-docs
`);
      break;
  }
}

main().catch((err) => {
  console.error('CLI execution error:', err.message);
  process.exit(1);
});
