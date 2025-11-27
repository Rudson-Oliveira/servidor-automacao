import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 📊 HOOK DE MONITORAMENTO DE PERFORMANCE
 * 
 * Funcionalidades:
 * 1. ✅ Medir tempo de render de componentes
 * 2. ✅ Detectar componentes lentos (>16ms)
 * 3. ✅ Contar re-renders
 * 4. ✅ Medir tempo de mount/unmount
 * 5. ✅ Coletar métricas agregadas
 */

export interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  slowRenders: number; // Renders >16ms
  lastRenderTime: number;
  mountTime: number;
  isSlowComponent: boolean;
}

interface UsePerformanceMonitorOptions {
  componentName: string;
  enabled?: boolean;
  slowThreshold?: number; // ms
  logToConsole?: boolean;
}

export function usePerformanceMonitor({
  componentName,
  enabled = process.env.NODE_ENV === 'development',
  slowThreshold = 16, // 60fps = 16.67ms por frame
  logToConsole = false,
}: UsePerformanceMonitorOptions): PerformanceMetrics {
  const renderCountRef = useRef(0);
  const totalRenderTimeRef = useRef(0);
  const slowRendersRef = useRef(0);
  const lastRenderTimeRef = useRef(0);
  const mountTimeRef = useRef(0);
  const renderStartRef = useRef(0);

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    componentName,
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    slowRenders: 0,
    lastRenderTime: 0,
    mountTime: 0,
    isSlowComponent: false,
  });

  // Medir tempo de mount
  useEffect(() => {
    if (!enabled) return;

    const mountStart = performance.now();
    mountTimeRef.current = mountStart;

    if (logToConsole) {
      console.log(`🚀 [Performance] ${componentName} montado`);
    }

    return () => {
      const unmountTime = performance.now();
      const lifetimeMs = unmountTime - mountStart;

      if (logToConsole) {
        console.log(`💀 [Performance] ${componentName} desmontado após ${lifetimeMs.toFixed(2)}ms`);
      }
    };
  }, [enabled, componentName, logToConsole]);

  // Medir tempo de cada render
  useEffect(() => {
    if (!enabled) return;

    const renderEnd = performance.now();
    const renderStart = renderStartRef.current || renderEnd;
    const renderTime = renderEnd - renderStart;

    renderCountRef.current += 1;
    totalRenderTimeRef.current += renderTime;
    lastRenderTimeRef.current = renderTime;

    if (renderTime > slowThreshold) {
      slowRendersRef.current += 1;
      
      if (logToConsole) {
        console.warn(
          `⚠️ [Performance] ${componentName} render lento: ${renderTime.toFixed(2)}ms (limite: ${slowThreshold}ms)`
        );
      }
    }

    const newMetrics: PerformanceMetrics = {
      componentName,
      renderCount: renderCountRef.current,
      totalRenderTime: totalRenderTimeRef.current,
      averageRenderTime: totalRenderTimeRef.current / renderCountRef.current,
      slowRenders: slowRendersRef.current,
      lastRenderTime: renderTime,
      mountTime: mountTimeRef.current,
      isSlowComponent: slowRendersRef.current / renderCountRef.current > 0.3, // >30% renders lentos
    };

    setMetrics(newMetrics);

    if (logToConsole && renderCountRef.current % 10 === 0) {
      console.log(`📊 [Performance] ${componentName} métricas:`, newMetrics);
    }
  });

  // Marcar início do render
  renderStartRef.current = performance.now();

  return metrics;
}

/**
 * 📈 HOOK PARA COLETAR MÉTRICAS GLOBAIS
 */

interface GlobalMetrics {
  fps: number;
  memory: number; // MB
  totalComponents: number;
  slowComponents: number;
}

export function useGlobalPerformanceMetrics(): GlobalMetrics {
  const [metrics, setMetrics] = useState<GlobalMetrics>({
    fps: 60,
    memory: 0,
    totalComponents: 0,
    slowComponents: 0,
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        lastTime = currentTime;

        // Medir memória (se disponível)
        const memory = (performance as any).memory
          ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
          : 0;

        setMetrics(prev => ({
          ...prev,
          fps,
          memory,
        }));
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return metrics;
}

/**
 * 🎯 HOOK PARA PROFILING DE FUNÇÕES
 */

export function useProfileFunction<T extends (...args: any[]) => any>(
  fn: T,
  functionName: string,
  logToConsole = false
): T {
  return useCallback(
    ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      const duration = end - start;

      if (logToConsole) {
        console.log(`⏱️ [Profile] ${functionName} executou em ${duration.toFixed(2)}ms`);
      }

      // Se for uma Promise, medir tempo assíncrono
      if (result instanceof Promise) {
        return result.finally(() => {
          const asyncEnd = performance.now();
          const asyncDuration = asyncEnd - start;
          
          if (logToConsole) {
            console.log(`⏱️ [Profile] ${functionName} (async) completou em ${asyncDuration.toFixed(2)}ms`);
          }
        });
      }

      return result;
    }) as T,
    [fn, functionName, logToConsole]
  );
}
