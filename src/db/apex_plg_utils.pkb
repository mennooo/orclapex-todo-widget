create or replace package body apex_plg_utils as

  procedure build_json(
    p_member      in varchar2
  , p_object_name in varchar2
  , p_value       in apex_json.t_value
  , p_json        in out json_element_t
  ) is
    l_key           number;
    l_value         apex_json.t_value;
    
    l_json_object   json_object_t;
    l_child_object  json_object_t;
    l_json_array    json_array_t;
  
  begin
  
    if p_json is null then
      p_json := json_object_t();
    end if;

    if p_value.kind = apex_json.c_null then
    
      if p_json.is_object() then 
        l_json_object := treat(p_json as json_object_t);
        l_json_object.put_null(p_object_name);
        p_json := l_json_object;
      elsif p_json.is_array() then 
        l_json_array := treat(p_json as json_array_t);
        l_json_array.append_null();
        p_json := l_json_array;      
      end if;      
      
    elsif p_value.kind = apex_json.c_true then
    
      if p_json.is_object() then 
        l_json_object := treat(p_json as json_object_t);
        l_json_object.put(p_object_name, true);
        p_json := l_json_object;
      elsif p_json.is_array() then 
        l_json_array := treat(p_json as json_array_t);
        l_json_array.append(true);
        p_json := l_json_array;      
      end if;
      
    elsif p_value.kind = apex_json.c_false then
    
      if p_json.is_object() then 
        l_json_object := treat(p_json as json_object_t);
        l_json_object.put(p_object_name, false);
        p_json := l_json_object;
      elsif p_json.is_array() then 
        l_json_array := treat(p_json as json_array_t);
        l_json_array.append(false);
        p_json := l_json_array;      
      end if;
      
    elsif p_value.kind = apex_json.c_number then
    
      if p_json.is_object() then 
        l_json_object := treat(p_json as json_object_t);
        l_json_object.put(p_object_name, p_value.number_value);
        p_json := l_json_object;
      elsif p_json.is_array() then 
        l_json_array := treat(p_json as json_array_t);
        l_json_array.append(p_value.number_value);
        p_json := l_json_array;      
      end if;
      
    elsif p_value.kind = apex_json.c_varchar2 then
    
      if p_json.is_object() then 
        l_json_object := treat(p_json as json_object_t);
        l_json_object.put(p_object_name, p_value.varchar2_value);
        p_json := l_json_object;
      elsif p_json.is_array() then 
        l_json_array := treat(p_json as json_array_t);
        l_json_array.append(p_value.varchar2_value);
        p_json := l_json_array; 
      end if;
      
    elsif p_value.kind = apex_json.c_clob then
    
      if p_json.is_object() then 
        l_json_object := treat(p_json as json_object_t);
        l_json_object.put(p_object_name, p_value.clob_value);
        p_json := l_json_object;
      elsif p_json.is_array() then 
        l_json_array := treat(p_json as json_array_t);
        l_json_array.append(p_value.clob_value);
        p_json := l_json_array;      
      end if;
      
    elsif p_value.kind = apex_json.c_array then
    
      l_json_array := json_array_t();
      
      for idx in 1..p_value.number_value loop
      
        l_value := apex_json.get_value(
          p_path => p_member || '[' || idx || ']'
        );
        
        build_json(
          p_member  => p_member || '[' || idx || ']'
        , p_object_name => null
        , p_value   => l_value
        , p_json    => l_json_array
        );
      
      end loop;
      
      if p_json.is_object() then 
        l_json_object := treat(p_json as json_object_t);
        l_json_object.put(p_object_name, l_json_array);
        p_json := l_json_object;
      elsif p_json.is_array() then 
        l_json_array := treat(p_json as json_array_t);
        l_json_array.append(l_json_array);
        p_json := l_json_array;
      end if;
      
    elsif p_value.kind = apex_json.c_object then
      
      l_child_object := json_object_t();
      
      l_key := p_value.object_members.first;
      
      while l_key is not null loop
      
        l_value := apex_json.get_value(
          p_path => p_member || '.' || p_value.object_members(l_key)
        );
        
        build_json(
          p_member  => p_member || '.' || p_value.object_members(l_key)
        , p_object_name => p_value.object_members(l_key)
        , p_value   => l_value
        , p_json    => l_child_object
        );
        
        l_key := p_value.object_members.next(l_key);
      
      end loop;
    
      if p_json.is_object() then 
        l_json_object := treat(p_json as json_object_t);
        l_json_object.put(p_object_name, l_child_object);
        p_json := l_json_object;
      elsif p_json.is_array() then 
        l_json_array := treat(p_json as json_array_t);
        l_json_array.append(l_child_object);
        p_json := l_json_array;
      end if;

    end if;
  
  end build_json;

  ------------------------------------------------------------------------------
  -- procedure debug_json_value
  ------------------------------------------------------------------------------
  procedure debug_json_value(
    p_member  in varchar2
  , p_value   in apex_json.t_value
  ) is
  
    l_member  varchar2(32767);
    l_value   apex_json.t_value;
  
  begin
  
    if p_value.kind = apex_json.c_null then
      
      apex_debug.message(
        p_message => '{%s: null}' 
      , p0 => p_member
      );
      
    elsif p_value.kind = apex_json.c_true then
    
      apex_debug.message(
        p_message => '{%s: true}' 
      , p0 => p_member
      );
      
    elsif p_value.kind = apex_json.c_false then
    
      apex_debug.message(
        p_message => '{%s: false}' 
      , p0 => p_member
      );
      
    elsif p_value.kind = apex_json.c_number then
    
      apex_debug.message(
        p_message => '{%s: %s}' 
      , p0 => p_member
      , p1 => p_value.number_value
      );
      
    elsif p_value.kind = apex_json.c_varchar2 then
    
      apex_debug.message(
        p_message => 'string {%s: "%s"}' 
      , p0 => p_member
      , p1 => p_value.varchar2_value
      );
      
    elsif p_value.kind = apex_json.c_clob then
    
      apex_debug.message(
        p_message => '{%s: "%s"}' 
      , p0 => p_member
      , p1 => dbms_lob.substr(p_value.clob_value, 1, 3900)
      );
      
    elsif p_value.kind = apex_json.c_array then
    
      apex_debug.message(
        p_message => 'array %s: members: %s' 
      , p0 => p_member
      , p1 => p_value.number_value
      );
      
      for idx in 1..p_value.number_value loop
      
        debug_json_value(
          p_member => p_member || '[' || idx || ']'
        , p_value => apex_json.get_value(
            p_path => p_member || '[' || idx || ']'
          )
        );
      
      end loop;
      

      
    elsif p_value.kind = apex_json.c_object then
      
      -- recursive
      l_member := p_value.object_members.first;
      
      while l_member is not null loop
      
        l_value := apex_json.get_value(
          p_path => p_member || '.' || p_value.object_members(l_member));
        
        debug_json_value(p_member || '.' || p_value.object_members(l_member), l_value);
        
        l_member := p_value.object_members.next(l_member);
      
      end loop;

    end if;
  
  end debug_json_value;
  
  ------------------------------------------------------------------------------
  -- procedure set_column_positions
  ------------------------------------------------------------------------------  
  procedure set_column_positions(
    p_column_list in apex_plugin_util.t_column_value_list2
  ) is
  begin
    
    for idx in 1..p_column_list.count loop
      g_column_definitions(p_column_list(idx).name).position := idx;
    
    end loop;
    
  end set_column_positions;
  
  ------------------------------------------------------------------------------
  -- procedure print_column_value
  ------------------------------------------------------------------------------
  procedure print_column_value(
    p_column_definition   column_definition_t
  , p_value               apex_plugin_util.t_value
  , p_data_type           apex_application_global.t_dbms_id
  ) is
  
  begin
      
    if p_column_definition.data_type in (gc_col_varchar2, gc_col_flex) then
    
      apex_json.write(
        p_name  => p_column_definition.json_name
      , p_value => apex_plugin_util.get_value_as_varchar2(p_data_type, p_value)
      );
    
    elsif p_column_definition.data_type = gc_col_number then
    
      apex_json.write(
        p_name  => p_column_definition.json_name
      , p_value => p_value.number_value
      );
    
    elsif p_column_definition.data_type = gc_col_number then
    
      apex_json.write(
        p_name  => p_column_definition.json_name
      , p_value => p_value.number_value
      );
    
    end if;
    
  end print_column_value; 

  ------------------------------------------------------------------------------
  -- procedure debug_json
  ------------------------------------------------------------------------------
  procedure debug_json is
  
    l_json_value  apex_json.t_value;
    
    l_members     wwv_flow_t_varchar2;
    l_key         number;
    --l_value       apex_json.t_value;
    
   -- l_json_element  json_element_t;
  
  begin
    
    l_members := apex_json.get_members(p_path => '.');
    
    l_key := l_members.first;
    
    while l_key is not null loop
      
      l_json_value := apex_json.get_value(l_members(l_key));
      
      debug_json_value(l_members(l_key), l_json_value);
      
      /*l_json_element := null;
      
      build_json(
        p_member      => l_members(l_member)
      , p_object_name => l_members(l_member)
      , p_value       => l_json_value
      , p_json        => l_json_element
      );
      
      g_ajax_json_array.append(l_json_element);*/
      
      l_key := l_members.next(l_key);
      
    end loop;
  
  end debug_json;
  
  ------------------------------------------------------------------------------
  -- procedure debug_json
  ------------------------------------------------------------------------------
  procedure set_ajax_json is
  
    l_json_value  apex_json.t_value;
    
    l_members     wwv_flow_t_varchar2;
    l_key         number;
    l_value       apex_json.t_value;
    
    l_json_element  json_element_t;
  
  begin
    
    l_members := apex_json.get_members(p_path => '.');
    
    l_key := l_members.first;
    
    while l_key is not null loop
      
      l_json_value := apex_json.get_value(l_members(l_key));
      
      l_json_element := null;
      
      build_json(
        p_member      => l_members(l_key)
      , p_object_name => l_members(l_key)
      , p_value       => l_json_value
      , p_json        => l_json_element
      );
      
      g_ajax_json_array.append(l_json_element);
      
      l_key := l_members.next(l_key);
      
    end loop;
    
    g_ajax_json_clob := g_ajax_json_array.to_clob;
      
    apex_debug.message(g_ajax_json_array.stringify);
  
  end set_ajax_json;
  
end apex_plg_utils;
