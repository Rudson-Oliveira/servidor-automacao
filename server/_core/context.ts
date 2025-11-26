import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { checkRateLimit, getRateLimitIdentifier, getResetTimeInSeconds } from "./rate-limit";
import { TRPCError } from "@trpc/server";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Rate limiting
  const ip = opts.req.ip || opts.req.socket.remoteAddress;
  const identifier = getRateLimitIdentifier(user?.id, ip);
  const rateLimit = checkRateLimit(identifier);

  if (!rateLimit.allowed) {
    const retryAfter = getResetTimeInSeconds(rateLimit.resetTime);
    opts.res.setHeader('Retry-After', retryAfter.toString());
    opts.res.setHeader('X-RateLimit-Limit', '100');
    opts.res.setHeader('X-RateLimit-Remaining', '0');
    opts.res.setHeader('X-RateLimit-Reset', rateLimit.resetTime.toString());
    
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Muitas requisições. Tente novamente em ${retryAfter} segundos.`,
    });
  }

  // Adicionar headers de rate limit
  opts.res.setHeader('X-RateLimit-Limit', '100');
  opts.res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
  opts.res.setHeader('X-RateLimit-Reset', rateLimit.resetTime.toString());

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
