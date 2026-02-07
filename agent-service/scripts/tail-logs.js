const { execSync } = require('child_process');

/**
 * 🛰️ TeachMeAI Log Tailer (v1.0)
 * A robust alternative to `gcloud alpha logging tail`.
 * 
 * Usage: node scripts/tail-logs.js [--project teachmeai-intake-app]
 */

const PROJECT_ID = process.argv.includes('--project')
    ? process.argv[process.argv.indexOf('--project') + 1]
    : 'teachmeai-intake-app';

const SERVICE_NAME = 'agent-service';
const POLL_INTERVAL_MS = 3000;
let lastSeenTimestamp = new Date(Date.now() - 60000).toISOString(); // Start 1 min ago

console.log(`\n🛰️  Starting Log Tailer for ${SERVICE_NAME} in project ${PROJECT_ID}...`);
console.log(`📡 Polling every ${POLL_INTERVAL_MS / 1000}s. Press Ctrl+C to stop.\n`);

function poll() {
    try {
        // We look for any logs for this service since the last timestamp
        const filter = `resource.labels.service_name="${SERVICE_NAME}" AND timestamp > "${lastSeenTimestamp}"`;
        const command = `gcloud logging read '${filter}' --project ${PROJECT_ID} --limit 30 --order asc --format="json"`;

        const output = execSync(command, { encoding: 'utf8' });
        const logs = JSON.parse(output || '[]');

        if (logs.length > 0) {
            logs.forEach(log => {
                const ts = new Date(log.timestamp).toLocaleTimeString();
                const severity = log.severity || 'INFO';
                const msg = log.jsonPayload?.msg || log.textPayload || log.jsonPayload?.event || '---';
                const marker = (log.textPayload?.includes('[LOG-SEARCH-ME]') || log.jsonPayload?.marker === '[LOG-SEARCH-ME]') ? '🔍 ' : '   ';

                // Simple Color coding
                let color = '\x1b[0m'; // Default
                if (severity === 'ERROR') color = '\x1b[31m'; // Red
                if (severity === 'WARNING') color = '\x1b[33m'; // Yellow
                if (marker.trim()) color = '\x1b[36m'; // Cyan for our markers

                console.log(`${color}${ts} [${severity}] ${marker}${msg}\x1b[0m`);

                // If it's a handoff or decision, print a bit more detail
                if (log.jsonPayload?.event === 'agent.handoff') {
                    console.log(`      🤝 Handoff: ${log.jsonPayload.from} -> ${log.jsonPayload.to}`);
                }
                if (log.jsonPayload?.event === 'agent.exit_check') {
                    console.log(`      🕵️  Exit Check: ${log.jsonPayload.agent} (ShouldExit: ${log.jsonPayload.shouldExit}) | Missing: ${log.jsonPayload.missing?.join(', ') || 'none'}`);
                }

                lastSeenTimestamp = log.timestamp;
            });
        }
    } catch (err) {
        if (err.message.includes('PermissionError') || err.message.includes('credentials')) {
            console.error('❌ Auth Error: Please run `gcloud auth login`');
            process.exit(1);
        }
        // Silence noise but keep loop going
    }

    setTimeout(poll, POLL_INTERVAL_MS);
}

poll();
