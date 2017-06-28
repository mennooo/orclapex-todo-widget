create or replace package apex_plg_utils as

  subtype ajax_identifier_t is varchar2(255);
  subtype javascript_t is varchar2(4000);
  subtype plugin_attribute_t  is varchar2(32767);
  subtype json_attribute_t  is varchar2(32767);
  
  subtype column_data_type_t is varchar2(10);
  
  -- More column_datatypes exist but are not common
  gc_col_varchar2 constant column_data_type_t := 'VARCHAR2';
  gc_col_number   constant column_data_type_t := 'NUMBER';
  gc_col_flex     constant column_data_type_t := 'FLEX';
  gc_col_date     constant column_data_type_t := 'DATE';
  
  subtype column_name_t is varchar(30);
  
  type column_definition_t is record (
    column_name   column_name_t
  , data_type     column_data_type_t
  , json_name     varchar2(100)
  , position      number
  );
  
  type column_definitions_tt is table of column_definition_t index by column_name_t;
  
  g_column_definitions  column_definitions_tt;
  
  g_ajax_json_array json_array_t := json_array_t();
  g_ajax_json_clob  clob;

  ------------------------------------------------------------------------------
  -- procedure set_column_positions
  ------------------------------------------------------------------------------  
  procedure set_column_positions(
    p_column_list in apex_plugin_util.t_column_value_list2
  );
  
  ------------------------------------------------------------------------------
  -- procedure print_column_value
  ------------------------------------------------------------------------------
  procedure print_column_value(
    p_column_definition   column_definition_t
  , p_value               apex_plugin_util.t_value
  , p_data_type           apex_application_global.t_dbms_id
  );

  ------------------------------------------------------------------------------
  -- procedure debug_json
  ------------------------------------------------------------------------------  
  procedure debug_json;
  
  ------------------------------------------------------------------------------
  -- procedure debug_json
  ------------------------------------------------------------------------------
  procedure set_ajax_json;

end apex_plg_utils;
/

