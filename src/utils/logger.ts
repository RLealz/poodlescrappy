export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

class Logger {
    private level: LogLevel = LogLevel.INFO;

    private log(level: LogLevel, message: string, meta?: unknown) {
        if (level < this.level) return;

        const timestamp = new Date().toISOString();
        const levelName = LogLevel[level];
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';

        const logLine = `[${timestamp}] [${levelName}] ${message}${metaStr}`;

        if (level >= LogLevel.ERROR) {
            console.error(logLine);
        } else if (level >= LogLevel.WARN) {
            console.warn(logLine);
        } else {
            console.log(logLine);
        }
    }

    debug(message: string, meta?: unknown) {
        this.log(LogLevel.DEBUG, message, meta);
    }

    info(message: string, meta?: unknown) {
        this.log(LogLevel.INFO, message, meta);
    }

    warn(message: string, meta?: unknown) {
        this.log(LogLevel.WARN, message, meta);
    }

    error(message: string, error?: unknown) {
        const errorMeta = error instanceof Error
            ? { message: error.message, stack: error.stack }
            : { error: String(error) };
        this.log(LogLevel.ERROR, message, errorMeta);
    }

    setLevel(level: LogLevel) {
        this.level = level;
    }
}

export const logger = new Logger();
