import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook que garante uma referência estável de callback sem precisar listar dependências
 * Similar ao useEvent (RFC do React)
 * 
 * @example
 * ```tsx
 * const handleClick = useStableCallback(() => {
 *   console.log(someState); // Sempre acessa o valor mais recente
 * });
 * ```
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}
