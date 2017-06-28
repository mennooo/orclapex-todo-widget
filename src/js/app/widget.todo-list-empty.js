/* global apex */

;(function ($, apex) {
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
    },

    _init: function () {
      // executed on $().todoList()
    },

    _destroy: function () {
    },

    _createEventHandler: function (options) {
    },

    _addEventHandlers: function () {
      // On delete To-Do
      
      // On To-Do click
      
      // On To-Do blur (lost focus)

      // On sorting complete

      // on keydown on To-Do input (add To-Do)
    },

    // ## Private methods

    // Render a textfield to add a new To-Do
    _renderTodoInput: function () {
    },

    // Render a single To-Do
    _renderTodo: function (todo) {
    },

    // Render a list of To-Do's
    _renderTodoList: function () {
    },

    // Render a no data found message
    _renderNoDataFound: function () {
    },

    // Add HTML to DOM
    _render: function () {
    },

    // Remove all deleted To-Do's
    _removeFromList: function (todoList) {
    },

    // Update To-Do's in the list
    _updateList: function (todoList) {
    },

    // Hide or show a 'No data found' message
    _toggleNoDataFound: function () {
    },

    // Delete a To-Do on button click
    _onRemoveTodoClick: function (event) {
    },

    // Add a To-Do on Input
    _onTodoInput: function (event) {
    },

    // Update To-Do list after sorting
    _onSortUpdate: function (event, ui) {
    },

    // When To-Do is clicked, give it focus
    _onTodoClick: function (event) {
    },

    // When focus is lost, update To-Do
    _onTodoBlur: function (event) {
    },

    // Get To-Do object by Id
    _getTodo: function (id) {
    },

    // Wrapper for all AJAX requests
    _startAjaxRequest: function (options) {
    },

    // Get all To-Do's from the database
    _get: function () {
    },

    // Add a To-Do in the database
    _add: function (todoList) {
    },

    // Update a To-Do in the database
    _update: function (todoList) {
    },

    // Remove a To-Do in the database
    _remove: function (todoList) {
    },

    // Initialize this special APEX region
    _initRegion: function () {
    },

    // ## Public methods

    add: function (todo) {
    },

    remove: function (id) {
    },

    update: function (id, options) {
    },

    // Return an array of To-Do's
    list: function () {
    }
  })
})(apex.jQuery, apex)
