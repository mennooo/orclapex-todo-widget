/* global jQuery */

;(function ($) {
  $.widget('demo.todoList', {
    options: {
      ajaxIdentifier: '',
      sortable: true,
      sortIcon: '&#8285;',
      deleteIcon: 'x',
      noDataFound: 'This list is empty'
    },

    // ## Default methods

    _create: function () {
      // _create is executed only once
      console.log('A new instance is created')
    },

    _init: function () {
      // executed on $().todoList()
    },

    _destroy: function () {
    },

    _addEventHandlers: function () {
      // On To-Do delete

      // On To-Do click

      // On To-Do blur (lost focus)

      // On sorting complete

      // on keydown on To-Do input (add To-Do)
    }
  })
})(jQuery)
