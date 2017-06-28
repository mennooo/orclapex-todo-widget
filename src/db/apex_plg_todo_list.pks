create or replace package apex_plg_todo_list as

  ------------------------------------------------------------------------------
  -- function render
  ------------------------------------------------------------------------------
  function render(
    p_region              in apex_plugin.t_region
  , p_plugin              in apex_plugin.t_plugin
  , p_is_printer_friendly in boolean
  ) return apex_plugin.t_region_render_result;

  ------------------------------------------------------------------------------
  -- function ajax
  ------------------------------------------------------------------------------  
  function ajax (
    p_region in apex_plugin.t_region
  , p_plugin in apex_plugin.t_plugin
  ) return apex_plugin.t_region_ajax_result;

end apex_plg_todo_list;
/

