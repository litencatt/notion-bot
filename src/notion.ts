import { Client } from '@notionhq/client'
import {
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
})
const tagDbId =  process.env.NOTION_TAG_DB_ID
const tagDbName =  process.env.NOTION_TAG_DB_NAME
const docDbId =  process.env.NOTION_DOC_DB_ID

export const queryDbSchema = async() => {
  return notion.databases.retrieve({
    database_id: docDbId,
  })
}

export const queDb = async(props: any[]): Promise<QueryDatabaseResponse['results']> => {
  const filter = buildFilter(props)
  console.log(filter)

  const pages = []
  let cursor = undefined
  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: docDbId,
      filter: filter,
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

  return pages
}

export const queryDb = async (
  service: string,
  tags: string[],
  type: string
): Promise<QueryDatabaseResponse['results']> => {
  const pages = []

  // Get page id form tag name
  const tagDbFilter = buildTagFilter(tags)
  console.log(tagDbFilter)
  const { results } = await notion.databases.query({
    database_id: tagDbId,
    filter: tagDbFilter
  })
  const tagPage = results[0]
  console.log(results)

  const pageIds = results.map( page => page.id )
  const tagDbRelationFilter = buildRelationFilter(pageIds)
  console.log(tagDbRelationFilter)

  let cursor = undefined
  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: docDbId,
      filter: tagDbRelationFilter,
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
  // console.log(pages)
  return pages
}

function buildFilter(props: any[]): QueryDatabaseParameters['filter'] {
  const propName = "Name"
  if (props.length == 1) {
    return propFilter(props[0])
  } else {
    const f = []
    for (const prop of props) {
      const flt = propFilter(prop)
      f.push(flt)
    }
    return {
      and: f
    }
  }
}

function propFilter(prop: any): QueryDatabaseParameters['filter'] {
  switch (prop.type) {
    case "select":
      return {
        property: prop.name, // 出版社
        select: {
          equals: prop.selectedOption // オライリー
        }
      }
      break;
    case "multi_select":
      return {
        property: prop.name,
        multi_select: {
          contains: prop.selectedOption
        }
      }
      break;
    case "relation":
      break;
    default:
        console.log("Not supported type")
  }
}

function buildTagFilter(tagNames: string[]): QueryDatabaseParameters['filter'] {
  const propName = "Name"
  if (tagNames.length == 1) {
    return {
      property: propName,
      title: {
        contains: tagNames[0]
      }
    }
  } else {
    const f = []
    for (const tagName of tagNames) {
      f.push({
        property: propName,
        title: {
          contains: tagName
        }
      })
    }
    return {
      or: f
    }
  }
}

function buildRelationFilter(tagPageIds: string[]): QueryDatabaseParameters['filter'] {
  if (tagPageIds.length == 1) {
    return {
      property: tagDbName,
      relation: {
        contains: tagPageIds[0]
      }
    }
  } else {
    const f = []
      for (const pageId of tagPageIds) {
        f.push({
          property: tagDbName,
          relation: {
            contains: pageId
          }
        })
      }
    return {
      or: f
    }
  }
}