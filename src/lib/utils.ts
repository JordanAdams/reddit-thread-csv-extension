export const mapAsync = async <T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  return reduceAsync(
    items,
    async (acc, item, index): Promise<R[]> => [
      ...acc,
      await mapper(item, index),
    ],
    [] as R[],
  );
};

export const forEachAsync = async <T>(
  items: T[],
  handler: (item: T, index: number) => Promise<void>,
): Promise<void> => {
  await reduceAsync(
    items,
    async (acc, item, index) => {
      await handler(item, index);
      return acc;
    },
    null,
  );
};

export const reduceAsync = async <T, R>(
  items: T[],
  reducer: (acc: R, item: T, index: number) => Promise<R>,
  initial: R,
): Promise<R> => {
  let acc = initial;

  for (const [index, item] of items.entries()) {
    acc = await reducer(acc, item, index);
  }

  return acc;
};

export const arrayChunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
};

export class RateLimiter {
  private jobs: Array<() => void> = [];

  private previousRun: number = Date.now();

  private callback?: number;

  constructor(private readonly rate: number) {
    this.start();
  }

  get nextRun(): number {
    return this.previousRun + this.rate;
  }

  enqueue<T>(job: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.jobs.push(() => {
        job().then(resolve, reject);
      });
    });
  }

  start() {
    if (!this.callback) {
      this.tickAfter(this.rate);
    }
  }

  stop() {
    if (this.callback) {
      window.clearTimeout(this.callback);
    }
  }

  private tickAfter(timeout: number) {
    this.callback = window.setTimeout(() => {
      if (Date.now() < this.nextRun) {
        this.tickAfter(Date.now() - this.nextRun);
        return;
      }

      const job = this.jobs.pop();
      if (!job) {
        this.tickAfter(0);
        return;
      }

      job();
      this.tickAfter(this.rate);
    }, timeout);
  }
}

export const decodeHTMLEntities = (str: string): string => {
  var textArea = document.createElement("textarea");
  textArea.innerHTML = str;
  return textArea.value;
};
