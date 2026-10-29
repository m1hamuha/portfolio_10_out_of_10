import { Page, ConsoleMessage } from '@playwright/test';

export interface ConsoleEntry {
  type: string;
  text: string;
  location?: {
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
}

export class ConsoleAuditor {
  private readonly page: Page;
  public readonly errors: ConsoleEntry[] = [];
  public readonly warnings: ConsoleEntry[] = [];

  constructor(page: Page) {
    this.page = page;
    this.page.on('console', (msg: ConsoleMessage) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();

      // Filter out benign Vite HMR reconnection logs
      if (text.includes('[vite] connecting...') || text.includes('[vite] connected.')) {
        return;
      }

      if (type === 'error') {
        this.errors.push({ type, text, location });
      } else if (type === 'warning') {
        this.warnings.push({ type, text, location });
      }
    });

    this.page.on('pageerror', (err: Error) => {
      this.errors.push({
        type: 'uncaught-exception',
        text: err.stack || err.message,
      });
    });
  }

  public assertClean(): void {
    if (this.errors.length > 0) {
      const formatted = this.errors
        .map((e) => `[${e.type}] ${e.text} (${e.location?.url || 'unknown'}:${e.location?.lineNumber || 0})`)
        .join('\n');
      throw new Error(`Clean console assertion failed: ${this.errors.length} error(s) logged:\n${formatted}`);
    }

    if (this.warnings.length > 0) {
      const formatted = this.warnings
        .map((w) => `[${w.type}] ${w.text}`)
        .join('\n');
      throw new Error(`Clean console assertion failed: ${this.warnings.length} warning(s) logged:\n${formatted}`);
    }
  }

  public clear(): void {
    this.errors.length = 0;
    this.warnings.length = 0;
  }
}
