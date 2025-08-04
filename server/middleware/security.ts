import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Input validation middleware
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

// Sanitize user input
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    // Basic XSS prevention - remove script tags and javascript: protocols
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize keys too
      const cleanKey = key.replace(/[<>]/g, '');
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Error handling middleware
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`Error ${req.method} ${req.path}:`, error);
  
  // Don't leak internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error.status || error.statusCode) {
    return res.status(error.status || error.statusCode).json({
      message: error.message || 'An error occurred'
    });
  }
  
  res.status(500).json({
    message: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
};

// Logging middleware for audit trail
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    // Log suspicious activity
    if (res.statusCode >= 400) {
      console.warn('Suspicious activity:', logData);
    }
    
    // Log all API calls for debugging
    if (req.path.startsWith('/api')) {
      console.log('API call:', logData);
    }
  });
  
  next();
};