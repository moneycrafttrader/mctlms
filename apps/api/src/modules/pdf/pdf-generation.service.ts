import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

const PDF_TIMEOUT_MS = 30_000;

@Injectable()
export class PdfGenerationService {
  private readonly logger = new Logger(PdfGenerationService.name);
  private browser: puppeteer.Browser | null = null;
  private lastHealthCheck = 0;

  async onModuleInit() {
    await this.launchBrowser();
  }

  async onModuleDestroy() {
    await this.closeBrowser();
  }

  async generatePdf(html: string): Promise<Buffer> {
    await this.ensureBrowser();
    let page: puppeteer.Page | null = null;

    try {
      page = await this.browser!.newPage();

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

  private async launchBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      this.lastHealthCheck = Date.now();
      this.logger.log('Puppeteer browser launched');

      this.browser.on('disconnected', () => {
        this.logger.warn('Browser disconnected — will relaunch on next request');
        this.browser = null;
      });
    } catch (err: any) {
      this.logger.error(`Failed to launch browser: ${err.message}`);
      this.browser = null;
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
  }
}
