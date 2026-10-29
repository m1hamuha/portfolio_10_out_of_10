type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || "info";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (context) {
      formatted += ` ${JSON.stringify(context)}`;
    }
    
    if (error) {
      formatted += ` Error: ${error.message}`;
      if (process.env.NODE_ENV === "development" && error.stack) {
        formatted += `\n${error.stack}`;
      }
    }
    
    return formatted;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;
    
    const sensitiveKeys = [
      "password",
      "token",
      "apiKey",
      "secret",
      "authorization",
      "access_token",
      "refresh_token",
    ];
    
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeContext(value as Record<string, any>);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  debug(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog("debug")) return;
    const entry = this.createEntry("debug", message, context, error);
    console.debug(this.formatEntry(entry));
  }

  info(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog("info")) return;
    const entry = this.createEntry("info", message, context, error);
    console.log(this.formatEntry(entry));
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog("warn")) return;
    const entry = this.createEntry("warn", message, context, error);
    console.warn(this.formatEntry(entry));
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog("error")) return;
    const entry = this.createEntry("error", message, context, error);
    console.error(this.formatEntry(entry));
  }
}

export const logger = new Logger();
