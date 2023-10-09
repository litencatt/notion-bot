export type MetaData = {
  channel_id: string
  thread_ts: string
  selected_db_id?: string
  selected_db_name?: string
  search_string?: string
  next_cursor?: string
  filter_values?: FilterValue[]
  filters?: object
}

export type FilterValue = {
  prop_name: string
  prop_type: string
  prop_field?: string
  prop_value?: string | boolean
}
