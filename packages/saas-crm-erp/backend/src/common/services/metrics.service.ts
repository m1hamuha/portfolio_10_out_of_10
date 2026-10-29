import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly register: client.Registry;
  private readonly httpRequestDuration: client.Histogram<string>;
  private readonly httpRequestTotal: client.Counter<string>;
  private readonly httpErrorTotal: client.Counter<string>;
  private readonly databaseQueryDuration: client.Histogram<string>;
  private readonly memoryUsage: client.Gauge<string>;
  private readonly cpuUsage: client.Gauge<string>;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    // HTTP metrics
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpErrorTotal = new client.Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'route', 'status_code'],
    });

    // Database metrics
    this.databaseQueryDuration = new client.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    });

    // System metrics
    this.memoryUsage = new client.Gauge({
      name: 'process_memory_usage_bytes',
      help: 'Memory usage of the process in bytes',
      labelNames: ['type'],
    });

    this.cpuUsage = new client.Gauge({
      name: 'process_cpu_usage_percent',
      help: 'CPU usage of the process in percent',
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.httpErrorTotal);
    this.register.registerMetric(this.databaseQueryDuration);
    this.register.registerMetric(this.memoryUsage);
    this.register.registerMetric(this.cpuUsage);
  }

  onModuleInit() {
    // Start updating system metrics
    this.updateSystemMetrics();
    setInterval(() => this.updateSystemMetrics(), 10000); // Update every 10 seconds
  }

  private updateSystemMetrics() {
    const memory = process.memoryUsage();
    this.memoryUsage.labels('rss').set(memory.rss);
    this.memoryUsage.labels('heapTotal').set(memory.heapTotal);
    this.memoryUsage.labels('heapUsed').set(memory.heapUsed);
    this.memoryUsage.labels('external').set(memory.external);

    // Simple CPU usage calculation (for demonstration)
    const startUsage = process.cpuUsage();
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const totalUsage = (endUsage.user + endUsage.system) / 10000; // Convert to percent
      this.cpuUsage.set(totalUsage);
    }, 100);
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);

    this.httpRequestTotal.labels(method, route, statusCode.toString()).inc();

    if (statusCode >= 400) {
      this.httpErrorTotal.labels(method, route, statusCode.toString()).inc();
    }
  }

  recordDatabaseQuery(operation: string, table: string, duration: number) {
    this.databaseQueryDuration.labels(operation, table).observe(duration);
  }

  async getMetrics(): Promise<string> {
    return await this.register.metrics();
  }

  getMetricsContentType(): string {
    return this.register.contentType;
  }
}
