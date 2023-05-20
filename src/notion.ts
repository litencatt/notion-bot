import { Client } from '@notionhq/client'
import {
  QueryDatabaseParameters,
  QueryDatabaseResponse,
  GetDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
})
const tagDbId =  process.env.NOTION_TAG_DB_ID
const tagDbName =  process.env.NOTION_TAG_DB_NAME
const docDbId =  process.env.NOTION_DOC_DB_ID

export const searchDb = async () => {
  const { results } = await notion.search({
    filter: {
      value: 'database',
      property: 'object'
    }
  })
  return results
}

export const retrieveDb = async (
  databaseId: string,
  options: any
): Promise<GetDatabaseResponse> => {
  const res = await notion.databases.retrieve({ database_id: databaseId })
  return retrieveResponse(res, options)
}

// Now suppots res.properties only.
const retrieveResponse = (res: GetDatabaseResponse, options: any) => {
  if (!options.propertyList) {
    return res
  }

  const showProperties = options.propertyList.split(',')
  const output: any = []
  Object.entries(res.properties).forEach(([_, prop]) => {
    if (!showProperties.includes(prop.name)) {
      return
    }
    const prefix = options.onlyValue ? '' : `${prop.name}: `
    let o = ''
    if (prop.type == 'title') {
      o = prop.name
    } else if (prop.type == 'select') {
      o = prop.select.options.map((o) => o.name).join(',')
    } else if (prop.type == 'multi_select') {
      o = prop.multi_select.options.map((o) => o.name).join(',')
    }
    output.push(`${prefix}${o}`)
  })
  return output.join('\n')
}

export const queryDbSchema = async() => {
  return notion.databases.retrieve({
    database_id: docDbId,
  })
}

export const queDb = async(data: any): Promise<QueryDatabaseResponse['results']> => {
  const filter = {
    property: data.selected_prop_name,
    [data.selected_prop_type]: {
      [data.selected_prop_field]: data.selected_prop_value
    }
  }
  console.dir(filter, {depth: null})

  const pages = []
  let cursor = undefined
  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: data.selected_db_id,
      // @ts-ignore
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

export const queryRelationDb = async(database_id: string) => {
  const pages = []
  let cursor = undefined
  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: database_id,
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
  if (props.length == 1) {
    const f = propFilter(props[0])
    console.log(f)
    return f
  } else {
    const f = { and: []}
    for (const prop of props) {
      const flt = propFilter(prop)
      f.and.push(flt)
    }
    console.log(f)
    return f
  }
}

function propFilter(prop: any): QueryDatabaseParameters['filter'] {
  switch (prop.type) {
    case "select":
      return {
        property: prop.name, // 出版社
        select: {
          equals: prop.selectedOptions[0] // オライリー
        }
      }
      break;
    case "multi_select":
      const f = { or: []}
      for (const so of prop.selectedOptions) {
        f.or.push({
          property: prop.name,
          multi_select: {
            contains: so
          }
        })
      }
      return f
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