/**
 * ConfigOps Hub SDK — Node.js
 *
 * 3 行代码接入配置中心，支持 ETag 缓存、自动轮询、本地缓存。
 *
 * @example
 * import { ConfigOps } from '@configops/sdk';
 *
 * const config = new ConfigOps({
 *   apiKey: 'cop_xxxxxxxx',
 *   baseUrl: 'https://app.configops.dev',
 *   env: 'PROD',
 * });
 *
 * const configs = await config.fetch();
 * console.log(configs['database.host']); // 'localhost'
 */

export interface ConfigOpsOptions {
  /** API Key，从 ConfigOps Hub 设置页生成 */
  apiKey: string;
  /** ConfigOps Hub 服务地址，默认 http://localhost:3000 */
  baseUrl?: string;
  /** 环境，默认 DEV */
  env?: 'DEV' | 'TEST' | 'PROD';
  /** 自动轮询间隔（毫秒），默认 30000 (30s)，设为 0 关闭 */
  pollInterval?: number;
  /** 请求超时（毫秒），默认 5000 */
  timeout?: number;
}

export class ConfigOps {
  private apiKey: string;
  private baseUrl: string;
  private env: string;
  private pollInterval: number;
  private timeout: number;

  private cachedConfigs: Record<string, string> | null = null;
  private etag: string | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private fetchPromise: Promise<Record<string, string>> | null = null;

  constructor(options: ConfigOpsOptions) {
    if (!options.apiKey || !options.apiKey.startsWith('cop_')) {
      throw new Error('API Key must start with "cop_"');
    }

    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'http://localhost:3000').replace(/\/$/, '');
    this.env = options.env || 'DEV';
    this.pollInterval = options.pollInterval ?? 30000;
    this.timeout = options.timeout ?? 5000;
  }

  /**
   * 拉取配置。使用 ETag 缓存 — 如果配置未变更，返回本地缓存（几乎零开销）。
   * 多次调用会自动去重（同一个 Promise）。
   */
  async fetch(): Promise<Record<string, string>> {
    // Deduplicate concurrent calls
    if (this.fetchPromise) return this.fetchPromise;

    this.fetchPromise = this._doFetch();
    try {
      return await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async _doFetch(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    // Send ETag for caching
    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(
        `${this.baseUrl}/api/sdk/configs?env=${this.env}`,
        { headers, signal: controller.signal }
      );

      if (res.status === 304) {
        // Not modified — return cached configs
        return this.cachedConfigs || {};
      }

      if (res.status === 401) {
        throw new Error('Invalid API key');
      }

      if (res.status === 403) {
        throw new Error('API key has been revoked');
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch configs: ${res.status}`);
      }

      const data = await res.json();

      // Update cache
      this.cachedConfigs = data.configs;
      this.etag = data.etag || res.headers.get('etag');

      return data.configs;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 获取单个配置值。如果缓存为空，会先拉取一次。
   */
  async get(key: string): Promise<string | undefined> {
    if (!this.cachedConfigs) {
      await this.fetch();
    }
    return this.cachedConfigs?.[key];
  }

  /**
   * 获取单个配置值（同步）。如果缓存为空返回 undefined。
   */
  getSync(key: string): string | undefined {
    return this.cachedConfigs?.[key];
  }

  /**
   * 启动自动轮询。每次轮询使用 ETag，未变更时几乎零开销。
   * @param onUpdated 配置变更时的回调
   */
  startPolling(onUpdated?: (configs: Record<string, string>) => void): void {
    if (this.pollTimer) return;

    this.pollTimer = setInterval(async () => {
      const previousEtag = this.etag;
      try {
        const configs = await this.fetch();
        if (this.etag !== previousEtag && onUpdated) {
          onUpdated(configs);
        }
      } catch {
        // Silently ignore polling errors
      }
    }, this.pollInterval);
  }

  /**
   * 停止自动轮询。
   */
  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * 清除本地缓存。
   */
  clearCache(): void {
    this.cachedConfigs = null;
    this.etag = null;
  }
}

export default ConfigOps;
