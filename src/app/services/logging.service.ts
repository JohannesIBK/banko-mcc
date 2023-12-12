import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private logLevel = 0;

  constructor() {}

  warn(message: string) {
    if (this.logLevel > 2) {
      return;
    }

    console.warn(message);
  }

  info(message: string) {
    if (this.logLevel > 1) {
      return;
    }

    console.info(message);
  }

  error(message: string) {
    if (this.logLevel > 3) {
      return;
    }

    console.error(message);
  }

  debug(message: string) {
    if (this.logLevel > 0) {
      return;
    }

    console.debug(message);
  }
}
