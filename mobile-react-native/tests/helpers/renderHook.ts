import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const flushAsyncWork = async (cycles = 3): Promise<void> => {
  for (let index = 0; index < cycles; index += 1) {
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
};

type HookHarness<T> = {
  flush: (cycles?: number) => Promise<void>;
  readonly current: T;
  rerender: () => Promise<void>;
  unmount: () => Promise<void>;
};

export async function renderHook<T>(useHook: () => T): Promise<HookHarness<T>> {
  let currentValue: T | undefined;
  let renderer: TestRenderer.ReactTestRenderer | undefined;

  const HookComponent = () => {
    currentValue = useHook();
    return null;
  };

  await act(async () => {
    renderer = TestRenderer.create(
      React.createElement(HookComponent) as unknown as React.ReactElement
    );
    await flushAsyncWork();
  });

  return {
    get current(): T {
      if (currentValue === undefined) {
        throw new Error('Hook result is not available yet.');
      }
      return currentValue;
    },
    async flush(cycles = 3) {
      await act(async () => {
        await flushAsyncWork(cycles);
      });
    },
    async rerender() {
      await act(async () => {
        renderer?.update(
          React.createElement(HookComponent) as unknown as React.ReactElement
        );
        await flushAsyncWork();
      });
    },
    async unmount() {
      await act(async () => {
        renderer?.unmount();
        await flushAsyncWork();
      });
    },
  };
}
