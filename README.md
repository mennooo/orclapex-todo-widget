# apex-todo-widget
A To-Do list widget as an Oracle APEX plugin
 
## Update Jun 28, 2017
The way this plugin sends a JSON object via apex.server.plugin is not recommended. Just talked with Patrick Wolf, he explained that using the regions array in pData is not supposed to be a documented feature.

http://docs.oracle.com/database/apex-5.1/AEAPI/apex-server-namespace.htm#GUID-3D3C6215-079F-487B-A0D2-6B4F179EA90B

Please use the x01..x10 instead for now.
