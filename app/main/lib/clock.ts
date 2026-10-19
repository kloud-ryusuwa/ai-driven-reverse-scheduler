import { getDemoSettings } from "./demo";

export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class FixedClock implements Clock {
  constructor(private fixed: Date) {}

  now(): Date {
    return new Date(this.fixed);
  }
}

export class DemoClock implements Clock {
  now(): Date {
    const value = getDemoSettings().now;
    return value ? new Date(value) : new Date();
  }
}
