type LogLevel = "debug" | "info" | "warn" | "error";

class ClientLogger {
  private level: LogLevel;

  constructor() {
    this.level = "info";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog("debug")) return;
    console.debug(`[DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog("info")) return;
    console.log(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog("warn")) return;
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    if (!this.shouldLog("error")) return;
    console.error(`[ERROR] ${message}`, ...args);
  }
}

export const clientLogger = new ClientLogger();
