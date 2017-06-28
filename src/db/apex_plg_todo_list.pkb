create or replace package body apex_plg_todo_list as

  -- Value of the current AJAX action
  g_ajax_action   apex_plg_utils.json_attribute_t;

  -- All possible AJAX actions
  gc_ajax_get     constant apex_plg_utils.json_attribute_t := 'GET';
  gc_ajax_put     constant apex_plg_utils.json_attribute_t := 'PUT';
  gc_ajax_post    constant apex_plg_utils.json_attribute_t := 'POST';
  gc_ajax_delete  constant apex_plg_utils.json_attribute_t := 'DELETE';
  
  -- The "Target Type" attribute is a static select list with these values
  gc_region_source constant varchar2(20) := 'REGION_SOURCE';
  gc_plsql         constant varchar2(20) := 'PLSQL';
  
  -- Definition of a To-Do
  type todo_rt is record (
    id        number
  , title     varchar(4000)
  , position  number
  );
  
  -- Definition of a To-Do list
  type todo_list is table of todo_rt index by pls_integer;
  
  -- ## Global variables ##
  g_todo_list     todo_list;  
  g_list_id       apex_plg_utils.json_attribute_t;  
  g_list_id_item  varchar2(30);
  
  -- Positions of the columns for a To-Do in the Region Source
  g_column_id         apex_plg_utils.column_name_t;
  g_column_title      apex_plg_utils.column_name_t;
  g_column_position   apex_plg_utils.column_name_t;
  g_column_list_id    apex_plg_utils.column_name_t;
  
  -- Current region id of the plugin
  g_region            apex_plugin.t_region;

  ------------------------------------------------------------------------------
  -- procedure set_column_definitions
  ------------------------------------------------------------------------------
  procedure set_column_definitions is
  
  begin
  
    g_column_id         := g_region.attribute_01;
    g_column_title      := g_region.attribute_02;
    g_column_position   := g_region.attribute_03;
    g_column_list_id    := g_region.attribute_09;
  
    apex_plg_utils.g_column_definitions(g_column_id).data_type := apex_plg_utils.gc_col_number;
    apex_plg_utils.g_column_definitions(g_column_id).json_name := 'id';
    
    apex_plg_utils.g_column_definitions(g_column_title).data_type := apex_plg_utils.gc_col_varchar2;
    apex_plg_utils.g_column_definitions(g_column_title).json_name := 'title';
    
    apex_plg_utils.g_column_definitions(g_column_position).data_type := apex_plg_utils.gc_col_number;
    apex_plg_utils.g_column_definitions(g_column_position).json_name := 'position';
    
    apex_plg_utils.g_column_definitions(g_column_list_id).data_type := apex_plg_utils.gc_col_flex;
    apex_plg_utils.g_column_definitions(g_column_list_id).json_name := 'listId';

  end set_column_definitions;

  ------------------------------------------------------------------------------
  -- procedure set_ajax_data
  ------------------------------------------------------------------------------  
  procedure set_ajax_data
  is
  
    cursor todo_list is
      select ajax.*
        from json_table(apex_plg_utils.g_ajax_json_clob, '$[*].regions[*].todoList[*]' 
                columns(id        varchar2(4000) path '$.id'
                      , title     varchar2(4000) path '$.title'
                      , position  number path '$.position')) ajax;      
  
  begin

    -- Set the action
    select ajax.*
      into g_ajax_action
      from json_table(apex_plg_utils.g_ajax_json_clob, '$[*].regions[*]' 
              columns(action varchar2(20) path '$.action')) ajax;
  
    -- Set the To-Do list
    open todo_list;
    fetch todo_list bulk collect into g_todo_list;
    close todo_list;
    
  end set_ajax_data;

  ------------------------------------------------------------------------------
  -- procedure print_todo_list
  ------------------------------------------------------------------------------
  procedure print_todo_list is
  
    l_column_list       apex_plugin_util.t_column_value_list2;
    l_column_name       apex_plg_utils.column_name_t;
    l_column_definition apex_plg_utils.column_definition_t;
    
    l_statement         varchar2(4000);
    e_no_data_found     exception;
  
  begin
  
    l_statement := 'select * from (#SOURCE#) order by #POSITION_COLUMN#';
    l_statement := replace(l_statement, '#SOURCE#', g_region.source);
    l_statement := replace(l_statement, '#POSITION_COLUMN#', g_column_position);
  
    l_column_list := apex_plugin_util.get_data2 (
      p_sql_statement       => l_statement
    , p_min_columns         => 3
    , p_max_columns         => 100
    , p_component_name      => g_region.static_id
    , p_search_type         => apex_plugin_util.c_search_lookup
    , p_search_column_name  => g_column_list_id
    , p_search_string       => g_list_id
    );
    
    if l_column_list(1).value_list.count = 0 then
      raise e_no_data_found;
    end if;
    
    apex_plg_utils.set_column_positions(l_column_list);
    
    apex_json.write(
      p_name  => apex_plg_utils.g_column_definitions(g_column_list_id).json_name
    , p_value => g_list_id
    );
    
    apex_json.open_array('todoList');
    
    -- Loop trough each record of the first column (each record is a To-Do)
    for rec_idx in 1..l_column_list(1).value_list.count loop
    
      apex_json.open_object;
    
      -- write value of defined columns
      l_column_name := apex_plg_utils.g_column_definitions.first;
      
      while l_column_name is not null loop
      
        l_column_definition := apex_plg_utils.g_column_definitions(l_column_name);
      
        apex_plg_utils.print_column_value(
          p_column_definition   => l_column_definition
        , p_value               => l_column_list(l_column_definition.position).value_list(rec_idx)
        , p_data_type           => l_column_list(l_column_definition.position).data_type
        );
              
        l_column_name := apex_plg_utils.g_column_definitions.next(l_column_name);
      
      end loop;
      
      apex_json.close_object;
    
    end loop;
  
    apex_json.close_array;
  
  exception 
    when e_no_data_found then
      apex_json.open_array('todoList');
      apex_json.close_array();
    
  
  end print_todo_list;
  
  ------------------------------------------------------------------------------
  -- procedure ins_todo
  ------------------------------------------------------------------------------
  procedure ins_todo is
    
    l_target_type   apex_plg_utils.plugin_attribute_t := g_region.attribute_07;
    
    l_source        varchar2(4000);
    
    l_statement     varchar2(4000);
    
    l_source_binds  sys.dbms_sql.varchar2_table;
    l_cursor        int;
    l_rows          int;
    
    l_todo          todo_rt;
    
  begin
  
    apex_debug.message(
        p_message => 'Inserting a new To-Do via %s'
      , p0 => l_target_type
    );
    
    
    if l_target_type = gc_region_source then
    
    
      -- insert title and position
      l_statement := 
        'insert into (#SOURCE#) (#LIST_ID_COLUMN#, #TITLE_COLUMN#, #POSITION_COLUMN#) 
         values (:listid, :title, (select max(#POSITION_COLUMN#) + 1 
           from (#SOURCE#))) 
        returning #ID_COLUMN#, #POSITION_COLUMN# into :id, :position';
     
      -- Replace subtitutions
      l_statement := replace(l_statement, '#SOURCE#', g_region.source);
      l_statement := replace(l_statement, '#LIST_ID_COLUMN#',dbms_assert.enquote_name(g_column_list_id));
      l_statement := replace(l_statement, '#TITLE_COLUMN#',dbms_assert.enquote_name(g_column_title));
      l_statement := replace(l_statement, '#POSITION_COLUMN#', dbms_assert.enquote_name(g_column_position));
      l_statement := replace(l_statement, '#ID_COLUMN#', dbms_assert.enquote_name(g_column_id));

      -- We need to execute the statement with dbms_sql to add the extra :title bind
      l_source_binds := wwv_flow_utilities.get_binds(g_region.source);
      
      -- Loop trough all To-Do's which should be added
      for idx in 1..g_todo_list.count loop
      
        l_cursor := dbms_sql.open_cursor; 
        dbms_sql.parse(l_cursor, l_statement, dbms_sql.native);
        
        -- Bind all variables from the source using the v() function
        for idx in 1..l_source_binds.count loop
          dbms_sql.bind_variable(l_cursor, l_source_binds(idx), v(substr(l_source_binds(idx), 2))); 
        end loop;
        
        -- Add extra bind variable for :listid and :title
        dbms_sql.bind_variable(l_cursor, ':listid', g_list_id);
        dbms_sql.bind_variable(l_cursor, ':title', g_todo_list(idx).title);
        dbms_sql.bind_variable(l_cursor, ':id', l_todo.id);
        dbms_sql.bind_variable(l_cursor, ':position', l_todo.position);
        
        l_rows := dbms_sql.execute(l_cursor);
        
        dbms_sql.variable_value(l_cursor, ':id', l_todo.id);        
        dbms_sql.variable_value(l_cursor, ':position', l_todo.position);

        
        apex_json.open_array('todoList');
        apex_json.open_object;
        apex_json.write(apex_plg_utils.g_column_definitions(g_column_id).json_name, l_todo.id);
        apex_json.write(apex_plg_utils.g_column_definitions(g_column_title).json_name, g_todo_list(idx).title);
        apex_json.write(apex_plg_utils.g_column_definitions(g_column_position).json_name, l_todo.position);
        apex_json.close_object;
        apex_json.close_array();
  
        apex_debug.message(
          p_message => 'Inserted %s new To-Do: %s'
        , p0 => l_rows
        , p1 => l_statement
        );
        
        dbms_sql.close_cursor(l_cursor);
      
      end loop;
    
    end if;
    
  end ins_todo;
  
  ------------------------------------------------------------------------------
  -- procedure upd_todo
  ------------------------------------------------------------------------------
  procedure upd_todo is
    
    l_target_type   apex_plg_utils.plugin_attribute_t := g_region.attribute_07;
    
    l_source        varchar2(4000);
    
    l_statement     varchar2(4000);
    
    l_source_binds  sys.dbms_sql.varchar2_table;
    l_cursor        int;
    l_rows          int;
    
  begin
  
    apex_debug.message(
        p_message => 'Updating a To-Do via %s'
      , p0 => l_target_type
    );
    
    
    if l_target_type = gc_region_source then
    
      -- insert title and position
      l_statement := 'update (#SOURCE#) set #TITLE_COLUMN# = :title, #POSITION_COLUMN# = :position where #TODO_ID_COLUMN# = :id';
     
      -- Replace subtitutions
      l_statement := replace(l_statement, '#SOURCE#', g_region.source);
      l_statement := replace(l_statement, '#TITLE_COLUMN#',dbms_assert.enquote_name(g_column_title));
      l_statement := replace(l_statement, '#POSITION_COLUMN#',dbms_assert.enquote_name(g_column_position));
      l_statement := replace(l_statement, '#TODO_ID_COLUMN#', dbms_assert.enquote_name(g_column_id));

      -- We need to execute the statement with dbms_sql to add the extra :title bind
      l_source_binds := wwv_flow_utilities.get_binds(g_region.source);
      
      apex_json.open_array('todoList');
      
      -- Loop trough all To-Do's which should be updated
      for idx in 1..g_todo_list.count loop
      
        l_cursor := dbms_sql.open_cursor; 
        dbms_sql.parse(l_cursor, l_statement, dbms_sql.native); 
        
        -- Bind all variables from the source using the v() function
        for idx in 1..l_source_binds.count loop
          dbms_sql.bind_variable(l_cursor, l_source_binds(idx), v(substr(l_source_binds(idx), 2))); 
        end loop;
        
        -- Add extra bind variable for :id and :title
        dbms_sql.bind_variable(l_cursor, ':id', g_todo_list(idx).id);
        dbms_sql.bind_variable(l_cursor, ':title', g_todo_list(idx).title);
        dbms_sql.bind_variable(l_cursor, ':position', g_todo_list(idx).position);
        
        l_rows := dbms_sql.execute(l_cursor);
        
        
        apex_json.open_object;
        apex_json.write(apex_plg_utils.g_column_definitions(g_column_id).json_name, g_todo_list(idx).id);
        apex_json.write(apex_plg_utils.g_column_definitions(g_column_title).json_name, g_todo_list(idx).title);
        apex_json.write(apex_plg_utils.g_column_definitions(g_column_position).json_name, g_todo_list(idx).position);
        apex_json.close_object;
  
        apex_debug.message(
          p_message => 'Updated %s To-Do: %s'
        , p0 => l_rows
        , p1 => g_todo_list(idx).id
        );
        
        dbms_sql.close_cursor(l_cursor);
      
      end loop;
        
    apex_json.close_array();
    
    end if;
    
  end upd_todo;
  
  ------------------------------------------------------------------------------
  -- procedure del_todo
  ------------------------------------------------------------------------------
  procedure del_todo is
    
    l_target_type   apex_plg_utils.plugin_attribute_t := g_region.attribute_07;
    
    l_source        varchar2(4000);
    
    l_statement     varchar2(4000);
    
    l_source_binds  sys.dbms_sql.varchar2_table;
    l_cursor        int;
    l_rows          int;
    
  begin
  
    apex_debug.message(
        p_message => 'Updating a To-Do via %s'
      , p0 => l_target_type
    );
    
    
    if l_target_type = gc_region_source then
    
      -- insert title and position
      l_statement := 
        'delete from (#SOURCE#) where #TODO_ID_COLUMN# = :id';
     
      -- Replace subtitutions
      l_statement := replace(l_statement, '#SOURCE#', g_region.source);
      l_statement := replace(l_statement, '#TODO_ID_COLUMN#', dbms_assert.enquote_name(g_column_id));

      -- We need to execute the statement with dbms_sql to add the extra :title bind
      l_source_binds := wwv_flow_utilities.get_binds(g_region.source);
      
      -- Loop trough all To-Do's which should be updated
      for idx in 1..g_todo_list.count loop
      
        l_cursor := dbms_sql.open_cursor; 
        dbms_sql.parse(l_cursor, l_statement, dbms_sql.native); 
        
        -- Bind all variables from the source using the v() function
        for idx in 1..l_source_binds.count loop
          dbms_sql.bind_variable(l_cursor, l_source_binds(idx), v(substr(l_source_binds(idx), 2))); 
        end loop;
        
        -- Add extra bind variable for :id and :title
        dbms_sql.bind_variable(l_cursor, ':id', g_todo_list(idx).id);
        
        l_rows := dbms_sql.execute(l_cursor);
        
        apex_json.open_array('todoList');        
        apex_json.open_object;
        apex_json.write(apex_plg_utils.g_column_definitions(g_column_id).json_name, g_todo_list(idx).id);
        apex_json.close_object;        
        apex_json.close_array();
  
        apex_debug.message(
          p_message => 'Deleted %s To-Do: %s'
        , p0 => l_rows
        , p1 => l_statement
        );
        
        dbms_sql.close_cursor(l_cursor);
      
      end loop;
    
    end if;
  end del_todo;

  ------------------------------------------------------------------------------
  -- function render
  ------------------------------------------------------------------------------
  function render(
    p_region              in apex_plugin.t_region
  , p_plugin              in apex_plugin.t_plugin
  , p_is_printer_friendly in boolean
  ) return apex_plugin.t_region_render_result
  is
  
    l_ajax_identifier   apex_plg_utils.ajax_identifier_t;
    l_javascript        apex_plg_utils.javascript_t;
    
    l_options           json_object_t := json_object_t();
    
    l_result            apex_plugin.t_region_render_result;
  
  begin
  
    l_ajax_identifier := apex_plugin.get_ajax_identifier;
    
    -- Create container
    htp.prn('<div class="todo-list"></div>');
    
    l_options.put('ajaxIdentifier', apex_plugin.get_ajax_identifier);
    l_options.put('sortable', p_region.attribute_04 = 'Y');
    l_options.put('inputPlaceholder', p_region.attribute_05);
    l_options.put('deleteIcon', p_region.attribute_06);
    l_options.put('sortIcon', 'fa-arrows-v');
    l_options.put('noDataFound', p_region.no_data_found_message);
  
    -- Add onload js code to create an instance of the widget
    l_javascript := '$("##REGION#").find(".todo-list").todoList(#OPTIONS#);';
    
    -- Replace substitutions strings
    l_javascript := replace(l_javascript, '#REGION#', p_region.static_id);
    l_javascript := replace(l_javascript, '#OPTIONS#', l_options.stringify);
    
    apex_javascript.add_onload_code (
      p_code => l_javascript
    );
  
    -- Set navigable = TRUE to focus on new To-Do input field
    l_result.is_navigable := true;
    l_result.navigable_dom_id := p_region.static_id || '_input';
    
    return l_result;
    
  end render;

  ------------------------------------------------------------------------------
  -- function ajax
  ------------------------------------------------------------------------------  
  function ajax (
    p_region in apex_plugin.t_region
  , p_plugin in apex_plugin.t_plugin
  ) return apex_plugin.t_region_ajax_result
  is
  
    l_result        apex_plugin.t_region_ajax_result;
  
  begin
  
    g_region := p_region;
    g_list_id_item := g_region.attribute_10;
    g_list_id := v(g_list_id_item);

    set_column_definitions;
  
    -- Show the contents of APEX_JSON in debug
    apex_plg_utils.debug_json;
    
    -- Transforms the AJAX_JSON into json_array_t
    apex_plg_utils.set_ajax_json;
    
    -- Load the AJAX data into memory
    set_ajax_data;
    
  
    apex_debug.message(
        p_message => 'AJAX process %s'
      , p0 => g_ajax_action
    );
  
    if g_ajax_action = gc_ajax_get then
    
      print_todo_list;
    
    elsif g_ajax_action = gc_ajax_post then
    
      ins_todo;
    
    elsif g_ajax_action = gc_ajax_put then
    
      upd_todo;
    
    elsif g_ajax_action = gc_ajax_delete then
    
      del_todo;
    
    end if;
  
    return l_result;
  
  end ajax;

end apex_plg_todo_list;
