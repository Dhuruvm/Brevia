import React from 'react';

// Performance optimization utilities

export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static observers: PerformanceObserver[] = [];

  static startTracking() {
    // Track long tasks that block the main thread
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks > 50ms are considered long
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
            this.recordMetric('longTasks', entry.duration);
          }
        }
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported');
      }

      // Track layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any; // Type assertion for layout shift entries
          if (layoutShift.value > 0.1) { // Significant layout shift
            console.warn(`Layout shift detected: ${layoutShift.value.toFixed(4)}`);
            this.recordMetric('layoutShifts', layoutShift.value);
          }
        }
      });

      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        console.warn('Layout shift observer not supported');
      }
    }
  }

  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  static getMetrics() {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        result[name] = {
          average: parseFloat(avg.toFixed(2)),
          maximum: parseFloat(max.toFixed(2)),
          minimum: parseFloat(min.toFixed(2)),
          count: values.length
        };
      }
    });
    
    return result;
  }

  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      
      if (duration > 1000) { // Log slow operations
        console.warn(`Slow operation "${name}": ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  static measureSync<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  static cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Memory usage monitoring
export class MemoryMonitor {
  static getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        unit: 'MB'
      };
    }
    return null;
  }

  static monitorMemoryLeaks() {
    setInterval(() => {
      const memory = this.getMemoryUsage();
      if (memory && memory.usedJSHeapSize > 100) { // Alert if > 100MB
        console.warn(`High memory usage: ${memory.usedJSHeapSize}MB`);
      }
    }, 30000); // Check every 30 seconds
  }
}

// Component lazy loading helper
export function createLazyComponent<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(factory);
}

// Export for convenience
export { PerformanceMonitor as default };