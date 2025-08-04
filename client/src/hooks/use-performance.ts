import { useEffect, useRef, useState } from 'react';
import { PerformanceMonitor, MemoryMonitor } from '@/lib/performance';

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [memoryUsage, setMemoryUsage] = useState<any>(null);

  useEffect(() => {
    PerformanceMonitor.startTracking();
    MemoryMonitor.monitorMemoryLeaks();

    const updateMetrics = () => {
      setMetrics(PerformanceMonitor.getMetrics());
      setMemoryUsage(MemoryMonitor.getMemoryUsage());
    };

    // Update metrics every 10 seconds
    const interval = setInterval(updateMetrics, 10000);
    updateMetrics(); // Initial update

    return () => {
      clearInterval(interval);
      PerformanceMonitor.cleanup();
    };
  }, []);

  return { metrics, memoryUsage };
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    const startTime = performance.now();
    renderCount.current++;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      renderTimes.current.push(renderTime);

      // Keep only last 20 renders
      if (renderTimes.current.length > 20) {
        renderTimes.current.shift();
      }

      // Log slow renders
      if (renderTime > 16.67) { // Slower than 60fps
        console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }

      PerformanceMonitor.recordMetric(`render_${componentName}`, renderTime);
    };
  });

  return {
    renderCount: renderCount.current,
    averageRenderTime: renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0
  };
}

// Hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttled function calls
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const lastResult = useRef<ReturnType<T>>();

  return useRef((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      lastResult.current = func(...args);
    }
    return lastResult.current;
  }).current as T;
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  threshold = 0.1,
  rootMargin = '0px'
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [threshold, rootMargin]);

  return { targetRef, isIntersecting };
}