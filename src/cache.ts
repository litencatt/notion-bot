import { redis } from "./redis"
import * as notion from "./notion"

export const getDatabases = async () => {
  const dbsKey = "dbs"
  const ttlInSeconds = 300
  const cachedDbs = await redis.get(dbsKey)
  if (cachedDbs) {
    return JSON.parse(cachedDbs)
  } else {
    const dbs = await notion.getDatabases()
    redis.set(dbsKey, JSON.stringify(dbs), "EX", ttlInSeconds)
    return dbs
  }
}
