import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import sendResponse from "../../shared/sendResponse";

const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.expiresAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export const createRateLimiter = (
  maxRequests: number,
  windowMs: number,
  keyGenerator: (req: Request) => string,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.expiresAt < now) {
      entry = {
        count: 0,
        expiresAt: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    if (entry.count >= maxRequests) {
      return sendResponse(res, {
        statusCode: httpStatus.TOO_MANY_REQUESTS,
        success: false,
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds allowed.`,
        data: null,
      });
    }

    entry.count++;

    next();
  };
};

export const stripeCallbackRateLimiter = createRateLimiter(
  10,
  60000,
  (req: Request) => {
    const accountId = req.query.account_id as string;

    if (!accountId) {
      return `stripe_callback_${req.ip}`;
    }

    return `stripe_callback_${accountId}`;
  },
);

export const authRateLimiter = createRateLimiter(
  5,
  60000,
  (req: Request) => `auth_${req.ip}`,
);
