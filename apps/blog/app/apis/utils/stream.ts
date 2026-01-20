/* eslint-disable @typescript-eslint/no-this-alias */
import { isObject } from '@zcat/ui';

import {
  findDoubleNewlineIndex,
  LineDecoder,
  type Bytes,
} from './line-decoder';
import { SSEDecoder, type ServerSentEvent } from './sse-decoder';

export class Stream<Item> implements AsyncIterable<Item> {
  controller: AbortController;

  constructor(
    private iterator: () => AsyncIterator<Item>,
    controller: AbortController,
  ) {
    this.controller = controller;
  }

  [Symbol.asyncIterator](): AsyncIterator<Item> {
    return this.iterator();
  }

  /**
   * Generates a Stream from a newline-separated ReadableStream
   * where each item is a JSON value.
   */
  static from<Item>(
    readableStream: ReadableStream,
    controller: AbortController,
  ): Stream<Item> {
    let consumed = false;

    async function* iterLines(): AsyncGenerator<string, void, unknown> {
      const lineDecoder = new LineDecoder();

      const iter = ReadableStreamToAsyncIterable<Bytes>(readableStream);
      for await (const chunk of iter) {
        for (const line of lineDecoder.decode(chunk)) {
          yield line;
        }
      }

      for (const line of lineDecoder.flush()) {
        yield line;
      }
    }

    async function* iterator(): AsyncIterator<Item, any, undefined> {
      if (consumed) {
        throw new Error(
          'Cannot iterate over a consumed stream, use `.tee()` to split the stream.',
        );
      }
      consumed = true;
      let done = false;
      try {
        for await (const line of iterLines()) {
          if (done) {
            continue;
          }
          if (line === '[DONE]') {
            done = true;
            continue;
          }

          if (line) {
            yield JSON.parse(line.replace('data: ', ''));
          }
        }
        done = true;
      } catch (e) {
        // If the user calls `stream.controller.abort()`, we should exit without throwing.
        if (e instanceof Error && e.name === 'AbortError') return;
        throw e;
      } finally {
        // If the user `break`s, abort the ongoing request.
        if (!done) {
          controller.abort();
        }
      }
    }

    return new Stream(iterator, controller);
  }

  map<R>(fn: (item: Item) => R): Stream<R> {
    const self = this;
    return new Stream(async function* () {
      for await (const item of self) {
        yield fn(item);
      }
    }, this.controller);
  }

  /**
   * Splits the stream into two streams which can be
   * independently read from at different speeds.
   */
  tee(): [Stream<Item>, Stream<Item>] {
    const left: Array<Promise<IteratorResult<Item>>> = [];
    const right: Array<Promise<IteratorResult<Item>>> = [];
    const iterator = this.iterator();

    const teeIterator = (
      queue: Array<Promise<IteratorResult<Item>>>,
    ): AsyncIterator<Item> => {
      return {
        next: () => {
          if (queue.length === 0) {
            const result = iterator.next();
            left.push(result);
            right.push(result);
          }
          return queue.shift()!;
        },
      };
    };

    return [
      new Stream(() => teeIterator(left), this.controller),
      new Stream(() => teeIterator(right), this.controller),
    ];
  }

  /**
   * Converts this stream to a newline-separated ReadableStream of
   * JSON stringified values in the stream
   * which can be turned back into a Stream with `Stream.fromReadableStream()`.
   */
  toReadableStream(): ReadableStream {
    const self = this;
    let iter: AsyncIterator<Item>;
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start() {
        iter = self[Symbol.asyncIterator]();
      },
      async pull(ctrl) {
        try {
          const { value, done } = await iter.next();
          if (done) return ctrl.close();

          const bytes = encoder.encode(JSON.stringify(value) + '\n');

          ctrl.enqueue(bytes);
        } catch (err) {
          ctrl.error(err);
        }
      },
      async cancel() {
        await iter.return?.();
      },
    });
  }
}

export async function* _iterSSEMessages(
  response: Response,
  controller: AbortController,
): AsyncGenerator<ServerSentEvent, void, unknown> {
  if (!response.body) {
    controller.abort();
    throw new Error(`Attempted to iterate over a response with no body`);
  }

  const sseDecoder = new SSEDecoder();
  const lineDecoder = new LineDecoder();

  const iter = ReadableStreamToAsyncIterable<Bytes>(response.body);
  for await (const sseChunk of iterSSEChunks(iter)) {
    for (const line of lineDecoder.decode(sseChunk)) {
      const sse = sseDecoder.decode(line);
      if (sse) yield sse;
    }
  }

  for (const line of lineDecoder.flush()) {
    const sse = sseDecoder.decode(line);
    if (sse) yield sse;
  }
}

/**
 * Given an async iterable iterator, iterates over it and yields full
 * SSE chunks, i.e. yields when a double new-line is encountered.
 */
async function* iterSSEChunks(
  iterator: AsyncIterableIterator<Bytes>,
): AsyncGenerator<Uint8Array> {
  let data = new Uint8Array();

  for await (const chunk of iterator) {
    if (chunk == null) {
      continue;
    }

    const binaryChunk =
      chunk instanceof ArrayBuffer
        ? new Uint8Array(chunk)
        : typeof chunk === 'string'
          ? new TextEncoder().encode(chunk)
          : chunk;

    const newData = new Uint8Array(data.length + binaryChunk.length);
    newData.set(data);
    newData.set(binaryChunk, data.length);
    data = newData;

    let patternIndex;
    while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
      yield data.slice(0, patternIndex);
      data = data.slice(patternIndex);
    }
  }

  if (data.length > 0) {
    yield data;
  }
}

/**
 * 检查给定流是否为 AsyncIterableIterator。
 * @template T 流数据的类型。
 * @param {unknown} stream 要检查的流。
 * @returns {stream is AsyncIterableIterator<T>} 该流是否为 AsyncIterableIterator。
 */
function isAsyncIterableIterator<T>(
  stream: unknown,
): stream is AsyncIterableIterator<T> {
  return (
    isObject<Record<symbol, unknown>>(stream) &&
    stream[Symbol.asyncIterator] !== undefined
  );
}

/**
 * 检查给定流是否为 ReadableStream。
 * @template T 流数据的类型。
 * @param {unknown} stream 要检查的流。
 * @returns {stream is ReadableStream<T>} 该流是否为 ReadableStream。
 */
function isReadableStream<T>(stream: unknown): stream is ReadableStream<T> {
  return stream instanceof ReadableStream;
}

/**
 * 将 ReadableStream 转换为 AsyncIterableIterator。
 * @template T 流数据的类型。
 * @param {unknown} stream 要转换的流。
 * @returns {AsyncIterableIterator<T>} 转换后的流。
 */
export function ReadableStreamToAsyncIterable<T>(
  stream: unknown,
): AsyncIterableIterator<T> {
  if (isAsyncIterableIterator<T>(stream)) {
    return stream;
  }
  if (!isReadableStream<T>(stream)) {
    return {
      [Symbol.asyncIterator]() {
        return this;
      },
      next() {
        return Promise.resolve({ done: true, value: undefined });
      },
    };
  }

  const reader = stream.getReader();
  return {
    async next() {
      try {
        const result = await reader.read();
        if (result?.done) reader.releaseLock(); // release lock when stream becomes closed
        return result;
      } catch (e) {
        reader.releaseLock(); // release lock when stream becomes errored
        throw e;
      }
    },
    async return() {
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
      return { done: true, value: undefined };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}
