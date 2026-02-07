import { IntakeState } from '../intake/schema';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogValue {
    msg?: string;
    [key: string]: any;
}

const LEVEL_WEIGHTS: Record<LogLevel, number> = {
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
};

// Default level: INFO in prod, TRACE/DEBUG in dev
const CURRENT_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
    return LEVEL_WEIGHTS[level] >= LEVEL_WEIGHTS[CURRENT_LOG_LEVEL];
}

function redact(obj: any): any {
    if (!obj) return obj;
    if (typeof obj === 'string') {
        // Redact detected emails
        return obj.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    }
    if (Array.isArray(obj)) {
        return obj.map(redact);
    }
    if (typeof obj === 'object') {
        const copy: any = {};
        for (const k in obj) {
            if (k.toLowerCase().includes('email')) copy[k] = '[EMAIL]';
            else if (k.toLowerCase().includes('password')) copy[k] = '[REDACTED]';
            else if (k.toLowerCase().includes('token')) copy[k] = '[REDACTED]';
            else copy[k] = redact(obj[k]);
        }
        return copy;
    }
    return obj;
}

const MAX_BUFFER_SIZE = 50;
const LOG_BUFFER: any[] = [];

class Logger {
    private base: Record<string, any>;

    constructor(base: Record<string, any> = {}) {
        this.base = base;
    }

    child(bindings: Record<string, any>): Logger {
        return new Logger({ ...this.base, ...bindings });
    }

    log(level: LogLevel, data: Record<string, any> | string, msg?: string) {
        if (!shouldLog(level)) return;

        let payload: any = typeof data === 'string' ? { msg: data } : { ...data };
        if (msg) payload.msg = msg;

        // Apply Redaction
        payload = redact(payload);

        const entry = {
            ts: new Date().toISOString(),
            level,
            marker: '[LOG-SEARCH-ME]',
            ...this.base,
            ...payload
        };

        // Add to buffer
        LOG_BUFFER.unshift(entry);
        if (LOG_BUFFER.length > MAX_BUFFER_SIZE) LOG_BUFFER.pop();

        // Use a prefix so it hits textPayload while remaining greaseable
        console.log(`[LOG-SEARCH-ME] ${JSON.stringify(entry)}`);
    }

    getRecentLogs() {
        return LOG_BUFFER;
    }

    info(data: Record<string, any> | string, msg?: string) { this.log('info', data, msg); }
    warn(data: Record<string, any> | string, msg?: string) { this.log('warn', data, msg); }
    error(data: Record<string, any> | string, msg?: string) { this.log('error', data, msg); }
    debug(data: Record<string, any> | string, msg?: string) { this.log('debug', data, msg); }
    trace(data: Record<string, any> | string, msg?: string) { this.log('trace', data, msg); }
}

export const logger = new Logger({ service: 'agent-service' });
