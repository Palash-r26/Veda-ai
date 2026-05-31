/**
 * Structured Logging Utility for Veda-ai
 * Standardizes log levels, formatting, and ISO timestamps for production readiness.
 */

const RESET = '\x1b[0m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const GREY = '\x1b[90m';
const BOLD = '\x1b[1m';

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, levelColor: string, message: string): string {
    return `${GREY}[${this.getTimestamp()}]${RESET} ${levelColor}${BOLD}[${level}]${RESET} ${message}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('INFO', BLUE, message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('WARN', YELLOW, message), ...args);
  }

  error(message: string, error?: any, ...args: any[]): void {
    let errorDetails = '';
    if (error) {
      if (error instanceof Error) {
        errorDetails = `\n${error.stack}`;
      } else {
        errorDetails = `\n${JSON.stringify(error)}`;
      }
    }
    console.error(this.formatMessage('ERROR', RED, message) + errorDetails, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatMessage('DEBUG', GREY, message), ...args);
    }
  }
}

export const logger = new Logger();
export default logger;
