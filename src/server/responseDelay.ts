import type { ServerResponse } from "node:http";

export function applyResponseDelay(res: ServerResponse, delayMs: number): void {
  if (delayMs <= 0) {
    return;
  }

  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);
  const bufferedWrites: Array<{ chunk: any; encoding?: any }> = [];
  let ended = false;

  res.write = ((chunk: any, encoding?: any, cb?: any) => {
    if (ended) {
      return false;
    }

    bufferedWrites.push({ chunk, encoding });
    if (typeof cb === "function") {
      cb();
    }
    return true;
  }) as ServerResponse["write"];

  res.end = ((chunk?: any, encoding?: any, cb?: any) => {
    if (ended) {
      return res;
    }

    ended = true;
    if (chunk !== undefined) {
      bufferedWrites.push({ chunk, encoding });
    }

    setTimeout(() => {
      for (const item of bufferedWrites) {
        originalWrite(item.chunk, item.encoding);
      }
      if (typeof cb === "function") {
        originalEnd(cb);
      } else {
        originalEnd();
      }
    }, delayMs);

    return res;
  }) as ServerResponse["end"];
}
