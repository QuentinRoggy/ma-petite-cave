import env from '#start/env'

function parseRedisUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
  }
}

const redis = parseRedisUrl(env.get('REDIS_URL'))

export default {
  defaultConnection: {
    host: redis.host,
    port: redis.port,
    password: redis.password,
  },

  queue: {},

  worker: {},

  jobs: {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 200,
  },
}
