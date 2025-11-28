import { useEffect, useRef } from 'react';

/**
 * Hook para polling/interval controlado que não causa re-renders infinitos
 * 
 * @param callback - Função a ser executada no intervalo
 * @param delay - Delay em milissegundos (null para pausar)
 * 
 * @example
 * ```tsx
 * const [isPolling, setIsPolling] = useState(true);
 * 
 * useInterval(() => {
 *   fetchData();
 * }, isPolling ? 5000 : null); // Poll a cada 5s quando ativo
 * ```
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Atualizar ref quando callback mudar
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Configurar interval
  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}
