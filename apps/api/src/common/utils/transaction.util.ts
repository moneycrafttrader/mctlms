import { Logger } from '@nestjs/common';

export interface TransactionStep {
  name: string;
  execute: () => Promise<void>;
  rollback: () => Promise<void>;
}

export class Transaction {
  private readonly logger = new Logger('Transaction');
  private completedSteps: number[] = [];

  async run(steps: TransactionStep[]): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      try {
        await steps[i].execute();
        this.completedSteps.push(i);
        this.logger.log(`Step ${i} (${steps[i].name}) completed`);
      } catch (err) {
        this.logger.error(`Step ${i} (${steps[i].name}) failed: ${(err as Error).message}`);
        await this.rollback(steps);
        throw err;
      }
    }
  }

  private async rollback(steps: TransactionStep[]): Promise<void> {
    const reversed = [...this.completedSteps].reverse();
    for (const i of reversed) {
      try {
        await steps[i].rollback();
        this.logger.log(`Rollback step ${i} (${steps[i].name}) completed`);
      } catch (rollbackErr) {
        this.logger.error(`Rollback step ${i} (${steps[i].name}) failed: ${(rollbackErr as Error).message}`);
      }
    }
  }
}
