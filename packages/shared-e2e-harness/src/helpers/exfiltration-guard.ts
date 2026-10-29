import { Page, Request, Route } from '@playwright/test';

export interface ExfiltrationViolation {
  url: string;
  method: string;
  postData: string | null;
  timestamp: string;
}

export class ExfiltrationGuard {
  private readonly page: Page;
  public readonly violations: ExfiltrationViolation[] = [];
  private totalEgressBytes = 0;

  constructor(page: Page) {
    this.page = page;
  }

  public async start(): Promise<void> {
    await this.page.route('**/*', (route: Route) => {
      const request: Request = route.request();
      const url = request.url();
      const method = request.method();

      // Permit internal localhost traffic, browser data/blob URLs, and static font stylesheets
      const isInternal =
        url.startsWith('http://localhost:') ||
        url.startsWith('http://127.0.0.1:') ||
        url.startsWith('ws://localhost:') ||
        url.startsWith('ws://127.0.0.1:') ||
        url.startsWith('data:') ||
        url.startsWith('blob:') ||
        url.includes('fonts.googleapis.com') ||
        url.includes('fonts.gstatic.com') ||
        url.includes('api.fontshare.com') ||
        url.includes('cdn.fontshare.com');

      if (!isInternal) {
        const postData = request.postData();
        const payloadBytes = postData ? Buffer.byteLength(postData, 'utf-8') : 0;
        this.totalEgressBytes += payloadBytes;

        this.violations.push({
          url,
          method,
          postData,
          timestamp: new Date().toISOString(),
        });

        // Abort external exfiltration attempt
        return route.abort('blockedbyclient');
      }

      return route.continue();
    });
  }

  public assertZeroExfiltration(): void {
    if (this.violations.length > 0) {
      const details = this.violations
        .map((v) => `-> [${v.method}] ${v.url} (payload: ${v.postData || 'none'})`)
        .join('\n');
      throw new Error(
        `Data exfiltration security violation! ${this.violations.length} external request(s) attempted:\n${details}`,
      );
    }

    if (this.totalEgressBytes > 0) {
      throw new Error(`Data exfiltration assertion failed: ${this.totalEgressBytes} external egress bytes detected.`);
    }
  }

  public getEgressBytes(): number {
    return this.totalEgressBytes;
  }
}
