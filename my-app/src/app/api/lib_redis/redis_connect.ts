import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";
const redis = Redis.fromEnv()

const limiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    analytics: true
})
export async function getLimit(request: NextRequest){
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    let ip = 'anonymous';
    
    if (forwardedFor) {
        ip = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
        ip = realIp;
    } 
    const { success, limit, reset, remaining } = await limiter.limit(ip);
    return {
        success,
        headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
        },
    };
}