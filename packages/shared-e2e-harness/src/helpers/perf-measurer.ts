import { Page } from '@playwright/test';

export interface NavigationMetrics {
  dnsTimeMs: number;
  ttfbMs: number;
  domInteractiveMs: number;
  domContentLoadedMs: number;
  totalLoadTimeMs: number;
}

export class PerfMeasurer {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Retrieves high-precision Navigation Timing API metrics from the browser
   */
  public async getNavigationMetrics(): Promise<NavigationMetrics> {
    return this.page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (!nav) {
        return {
          dnsTimeMs: 0,
          ttfbMs: 0,
          domInteractiveMs: 0,
          domContentLoadedMs: 0,
          totalLoadTimeMs: 0,
        };
      }
      return {
        dnsTimeMs: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
        ttfbMs: Math.round(nav.responseStart - nav.requestStart),
        domInteractiveMs: Math.round(nav.domInteractive - nav.startTime),
        domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        totalLoadTimeMs: Math.round(nav.loadEventEnd - nav.startTime),
      };
    });
  }

  /**
   * Times an asynchronous user interaction within the browser
   */
  public async measureAction(action: () => Promise<void>): Promise<number> {
    const start = performance.now();
    await action();
    return Math.round(performance.now() - start);
  }
}
