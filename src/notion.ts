import {
    Client,
    isFullDatabase,
    isFullPage,
  } from '@notionhq/client'
import {
  QueryDatabaseParameters,
  GetDatabaseResponse,
  PageObjectResponse,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints'

export const client = new Client({
  auth: process.env.NOTION_API_TOKEN,
})
const tagDbId =  process.env.NOTION_TAG_DB_ID
const tagDbName =  process.env.NOTION_TAG_DB_NAME
const docDbId =  process.env.NOTION_DOC_DB_ID

export const searchDb = async () => {
  const { results } = await client.search({
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
  const res = await client.databases.retrieve({ database_id: databaseId })
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
  return client.databases.retrieve({
    database_id: docDbId,
  })
}

export const queryDb = async(data: any) => {
  console.dir(data, {depth: null})
  let filter = null
  if (data.selected_prop_type) {
    filter = {
      property: data.selected_prop_name,
      [data.selected_prop_type]: {
        [data.selected_prop_field]: data.selected_prop_value
      }
    }
  } else {
    filter = {and: []}
  }
  console.dir(filter, {depth: null})

  const pages = []
  let cursor = undefined
  while (true) {
    const { results, next_cursor } = await client.databases.query({
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

  return {pages, filter}
}

export const queryRelationDb = async(database_id: string) => {
  const pages = []
  let cursor = undefined
  while (true) {
    const { results, next_cursor } = await client.databases.query({
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

export const getPageTitle = (
  row: PageObjectResponse
) => {
  let title = 'Untitled'
  Object.entries(row.properties).find(([_, prop]) => {
    if (prop.type === 'title' && prop.title.length > 0) {
      title = prop.title[0].plain_text
      return true
    }
  })
  return title
}

export const getFilterFields = async (
  type: string
) => {
  switch (type) {
    case 'checkbox':
      return [
        'equals',
        'does_not_equal',
      ]
    case 'created_time':
    case 'last_edited_time':
    case 'date':
      return [
        'after',
        'before',
        'equals',
        'is_empty',
        'is_not_empty',
        'next_month',
        'next_week',
        'next_year',
        'on_or_after',
        'on_or_before',
        'past_month',
        'past_week',
        'past_year',
        'this_week',
      ]
    case 'rich_text':
    case 'title':
      return [
        'contains',
        'does_not_contain',
        'does_not_equal',
        'ends_with',
        'equals',
        'is_empty',
        'is_not_empty',
        'starts_with',
      ]
    case 'number':
      return [
        'equals',
        'does_not_equal',
        'greater_than',
        'greater_than_or_equal_to',
        'less_than',
        'less_than_or_equal_to',
        'is_empty',
        'is_not_empty',
      ]
    case 'select':
      return [
        'equals',
        'does_not_equal',
        'is_empty',
        'is_not_empty',
      ]
    case 'multi_select':
    case 'relation':
      return [
        'contains',
        'does_not_contain',
        'is_empty',
        'is_not_empty',
      ]
    case 'status':
      return [
        'equals',
        'does_not_equal',
        'is_empty',
        'is_not_empty',
      ]
    case 'files':
    case 'formula':
    case 'people':
    case 'rollup':
    default:
      console.error(`type: ${type} is not support type`)
      return null
  }
}

export const getSelectedDbPropValues = async (
  res: GetDatabaseResponse,
  selectedPropName: string
) => {
  let props = []
  Object.entries(res.properties).forEach(([_, prop]) => {
    if (prop.name != selectedPropName) {
      return
    }
    switch (prop.type) {
      case 'multi_select':
        props = prop.multi_select.options.map(o => o.name)
        break
      case 'select':
        console.dir(prop.select.options, {depth: null})
        props = prop.select.options.map(o => o.name)
        break
      default:
        console.error(`type: ${prop.type} is not supported`)
    }
  })
  return props
}

export const getDatabases = async () => {
  const dbs = await searchDb();
  const dbChoices = []
  for (const db of dbs) {
    if (db.object != "database") {
      continue
    }
    if (!isFullDatabase(db)) {
      continue
    }
    dbChoices.push({
      title: db.title.length > 0 ? db.title[0].plain_text : "Untitled",
      value: db.id,
    })
  }
  const sortedDbChoices = dbChoices.sort((a,b)=> {
    return a.title.localeCompare(b.title)
  })
  return sortedDbChoices
}

export const getDatabaseTitle = async (db: GetDatabaseResponse) => {
  if (db.object != "database") {
    return "Untitled"
  }
  if (!isFullDatabase(db)) {
    return "Untitled"
  }
  return db.title.length > 0 ? db.title[0].plain_text : "Untitled"
}

export const getPageUrls = async (res: QueryDatabaseResponse) => {
  const urls = []
  for (const page of res.results) {
    if (page.object != "page") {
      continue
    }
    if (!isFullPage(page)) {
      continue
    }
    const title = getPageTitle(page)
    urls.push(`・ <${page.url}|${title}>`)
  }
  return urls
}