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

export const getDbRetrieve = async (dbId: string, option: any) => {
  const dbRetrieveKey = `dbRetrieve:${dbId}`
  const ttlInSeconds = 300
  const cachedDbRetrieve = await redis.get(dbRetrieveKey)
  if (cachedDbRetrieve) {
    return JSON.parse(cachedDbRetrieve)
  } else {
    const dbRetrieve = await notion.retrieveDb(dbId, {})
    redis.set(dbRetrieveKey, JSON.stringify(dbRetrieve), "EX", ttlInSeconds)
    return dbRetrieve
  }
}
