import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';

const PDF_TIMEOUT_MS = 30_000;

@Injectable()
export class PdfGenerationService {
  private readonly logger = new Logger(PdfGenerationService.name);
  private browser: puppeteer.Browser | null = null;
  private lastHealthCheck = 0;
  private browserAvailable = false;
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  async onModuleInit() {
    await this.launchBrowser();
    this.logger.log(`Puppeteer browser ${this.browserAvailable ? '✓ available' : '✗ unavailable'}`);
  }

  async onModuleDestroy() {
    await this.closeBrowser();
  }

  isAvailable(): boolean {
    return this.browserAvailable;
  }

  async generatePdf(html: string): Promise<Buffer> {
    await this.ensureBrowser();
    if (!this.browser) {
      throw new Error('PDF generation unavailable: no browser instance');
    }
    let page: puppeteer.Page | null = null;

    try {
      page = await this.browser.newPage();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF generation timed out after 30s')), PDF_TIMEOUT_MS);
      });

      const generatePromise = (async () => {
        await page!.setContent(html, { waitUntil: 'domcontentloaded' });
        const buffer = await page!.pdf({
          format: 'A4',
          margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
          printBackground: true,
        });
        return Buffer.from(buffer);
      })();

      const result = await Promise.race([generatePromise, timeoutPromise]);
      this.lastHealthCheck = Date.now();
      return result;
    } catch (err: any) {
      this.logger.error(`PDF generation error: ${err.message}`);
      if (err.message?.includes('Target closed') || err.message?.includes('Protocol error')) {
        this.browser = null;
        this.browserAvailable = false;
        this.launchBrowser().catch((e) => this.logger.error(`Browser relaunch failed: ${e.message}`));
      }
      throw err;
    } finally {
      if (page) {
        try { await page.close(); } catch { /* page already closed */ }
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.browser) return false;
    try {
      const pid = this.browser.process()?.pid;
      if (!pid) return false;
      const version = await this.browser.version();
      return !!version;
    } catch {
      return false;
    }
  }

  private async ensureBrowser(): Promise<void> {
    if (this.browser) {
      const healthy = await this.healthCheck();
      if (healthy) return;
      this.logger.warn('Browser unhealthy, relaunching');
      await this.closeBrowser();
    }
    await this.launchBrowser();
  }

  private resolveExecutablePath(): string | undefined {
    const envPath = this.configService.get<string>('PUPPETEER_EXECUTABLE_PATH');
    if (envPath && fs.existsSync(envPath)) {
      this.logger.log(`Using Puppeteer executable from PUPPETEER_EXECUTABLE_PATH: ${envPath}`);
      return envPath;
    }
    if (fs.existsSync('/usr/bin/chromium')) {
      this.logger.log('Using Chromium at /usr/bin/chromium');
      return '/usr/bin/chromium';
    }
    if (fs.existsSync('/usr/bin/chromium-browser')) {
      this.logger.log('Using Chromium at /usr/bin/chromium-browser');
      return '/usr/bin/chromium-browser';
    }
    return undefined;
  }

  private async launchBrowser(): Promise<void> {
    const executablePath = this.resolveExecutablePath();
    const launchOptions: any = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };
    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    try {
      this.browser = await puppeteer.launch(launchOptions);
      this.browserAvailable = true;
      this.lastHealthCheck = Date.now();
      this.logger.log('Puppeteer browser launched');

      this.browser.on('disconnected', () => {
        this.logger.warn('Browser disconnected — will relaunch on next request');
        this.browser = null;
        this.browserAvailable = false;
      });
    } catch (err: any) {
      this.logger.error(`Failed to launch browser: ${err.message}`);
      this.browser = null;
      this.browserAvailable = false;
    }
  }

  private async closeBrowser(): Promise<void> {
    if (!this.browser) return;
    try {
      await this.browser.close();
    } catch (err: any) {
      this.logger.warn(`Browser close error: ${err.message}`);
    }
    this.browser = null;
    this.browserAvailable = false;
  }
}
