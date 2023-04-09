import { Client } from '@notionhq/client'
import {
  QueryDatabaseParameters,
  QueryDatabaseResponse,
  GetDatabaseResponse,
  CreateDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
})

export const queryDb = async (
  databaseId: string,
  filter: string | null
): Promise<QueryDatabaseResponse['results'][]> => {
  const resArr: any[] = []
  const f = buildFilter(filter)
  const res = await notion.databases.query({
    database_id: databaseId,
    filter: f,
  })
  resArr.push(res.results)

  // fetch all pages
  let hasMore = res.has_more
  let nextCursor = res.next_cursor
  while (true) {
    if (!hasMore || nextCursor == null) {
      break
    }
    const tmp = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "機能名",
        multi_select: {
          is_not_empty: true
        }
      },
      start_cursor: nextCursor,
    })
    hasMore = tmp.has_more
    nextCursor = tmp.next_cursor
    resArr.push(tmp.results)
  }
  return resArr
}

const buildFilter = (
    filter: string | null
  ): QueryDatabaseParameters['filter'] => {
    let f: QueryDatabaseParameters['filter'] = {
      and: [],
      or: [],
    }
    try {
      if (filter) {
        f = JSON.parse(filter)
      }
    } catch (e) {
      console.log(e)
    }
    return f
  }