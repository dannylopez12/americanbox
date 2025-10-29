// src/hooks/useAutoRefresh.ts
import { useEffect, useRef, type DependencyList } from "react";

type Options = {
  /**
   * Interval in milliseconds between refreshes.
   * Defaults to 45 seconds.
   */
  delay?: number;
  /**
   * Allows turning the polling on/off without tearing down the component.
   */
  enabled?: boolean;
  /**
   * When true, executes the callback right away before scheduling the interval.
   */
  immediate?: boolean;
  /**
   * Additional dependencies that should restart the refresh cycle when they change.
   */
  deps?: DependencyList;
};

/**
 * Small polling helper to keep admin lists in sync without manual "Actualizar" buttons.
 * It keeps the latest callback reference and restarts the timer when the provided deps change.
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  options: Options = {}
) {
  const { delay = 45_000, enabled = true, immediate = false, deps = [] } = options;
  const cbRef = useRef(callback);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const exec = async () => {
      try {
        await cbRef.current();
      } catch (err) {
        console.error("[useAutoRefresh] callback error", err);
      } finally {
        if (!disposed) {
          timer = setTimeout(exec, delay);
        }
      }
    };

    if (immediate) {
      void exec();
    } else {
      timer = setTimeout(exec, delay);
    }

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, delay, immediate, ...deps]);
}
