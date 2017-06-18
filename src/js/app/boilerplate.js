/* global jQuery */
;(function ($) {
  $.widget('demo.todoList', {
    version: '5.0',
    widgetEventPrefix: 'todolist',
    options: {
      multiple: false
    },

    _create: function () {
      // _create is executed only once
    },

    _init: function () {
      // executed on $().todoList()
      console.log('init is executed on an empty invocation')
    },

    _destroy: function () {
      this.element.empty()
    },

    _eventHandlers: {
      click: function (event) {}
    }
  })
})(jQuery)
