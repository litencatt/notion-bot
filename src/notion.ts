import { Client } from '@notionhq/client'
import {
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
})
const tagDbId =  process.env.NOTION_TAG_DB_ID
const tagDbName =  process.env.NOTION_TAG_DB_Name
const docDbId =  process.env.NOTION_DOC_DB_ID

export const queryDb = async (
  propertyName:string
): Promise<QueryDatabaseResponse['results']> => {
  const pages = []
  const f:QueryDatabaseParameters['filter'] = {
    and: []
  }

  // Get page id form tag name
  const { results } = await notion.databases.query({
    database_id: tagDbId,
    filter: {
      property: "Name",
      title: {
        contains: propertyName
      }
    }
  })
  const tagPage = results[0]
  console.log(tagPage.id)
 
  let cursor = undefined
  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: docDbId,
      filter: {
        property: tagDbName,
        relation: {
          contains: tagPage.id
        }
      },
      start_cursor: cursor
    })
    if (results.length == 0) {
      break
    }

    pages.push(...results)

    if (!next_cursor) {
      break
    }
    cursor = next_cursor
  }
  console.log(pages)
  return pages
}