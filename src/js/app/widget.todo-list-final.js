/* global apex */

;(function ($, apex) {
  // Constants
  const cAjaxGet = 'GET'
  const cAjaxDelete = 'DELETE'
  const cAjaxPut = 'PUT'
  const cAjaxPost = 'POST'
  const cClassItem = 'todo-item'
  const cClassItemText = 'todo-item-text'
  const cClassDelItem = 'todo-item-delete'
  const cClassNoDataFound = 'no-data-found'
  const cClassList = 'todo-list-items'
  const cClassInput = 'todo-input'
  const cClassSort = 'ui-sort'
  const cClassItemActions = 'todo-actions'
  const cKeyEnter = 13
  // Events
  const cEventAfterGet = 'afterget'
  const cEventAfterDelete = 'afterdelete'
  const cEventAfterAdd = 'afteradd'
  const cEventAfterUpdate = 'afterupdate'
  const cEventSortUpdate = 'sortupdate'

  $.widget('demo.todoList', {
    version: '5.0',
    widgetEventPrefix: 'todolist',
    options: {
      ajaxIdentifier: '',
      sortable: true,
      sortIcon: '&#8285;',
      deleteIcon: 'x',
      noDataFound: 'This list is empty'
    },
    todoList: [],
    _todoInput$: null,
    _todoList$: null,
    _noDataFound$: null,

    // ## Default methods

    _create: function () {
      // _create is executed only once
      this._render()
      this._addEventHandlers()
      this._get()
      this._initRegion()
    },

    _init: function () {
      // executed on $().todoList()
      return this.todoList
    },

    _destroy: function () {
      this.element.empty()
    },

    _createEventHandler: function (options) {
      let eventHandler = {}
      eventHandler[options.eventName] = options.callback
      this._on(options.element, eventHandler)
    },

    _addEventHandlers: function () {
      // On delete To-Do
      this._createEventHandler({
        element: this._todoList$,
        eventName: 'click .' + cClassDelItem,
        callback: this._onRemoveTodoClick
      })
      // On To-Do click
      this._createEventHandler({
        element: this._todoList$,
        eventName: 'click .' + cClassItemText,
        callback: this._onTodoClick
      })
      // On To-Do blur (lost focus)
      this._createEventHandler({
        element: this._todoList$,
        eventName: 'blur .' + cClassItemText,
        callback: this._onTodoBlur
      })

      // On sorting complete
      if (this.options.sortable) {
        this._createEventHandler({
          element: this._todoList$,
          eventName: cEventSortUpdate,
          callback: this._onSortUpdate
        })
      }

      // on keydown on To-Do input (add To-Do)
      this._createEventHandler({
        element: this._todoInput$,
        eventName: 'keydown',
        callback: this._onTodoInput
      })
    },

    // ## Private methods

    // Render a textbox to add a new To-Do
    _renderTodoInput: function () {
      this._todoInput$ = $(`<div class="${cClassInput} t-Form-inputContainer"><input type="text" id="${this.element.id}_input" placeholder="${this.options.inputPlaceholder}" class="apex-item-text"></input></div>`)
    },

    // Render a single To-Do
    _renderTodo: function (todo) {
      let todo$ = $(`<li data-id="${todo.id}" class="${cClassItem} u-color-${todo.position}-border"></li>`)
      let actions$ = $(`<div class="${cClassItemActions}"></div>`)

      todo$.append(`<span class="${cClassItemText}" contenteditable="true">${todo.title}</span>`)
      actions$.append($(`<span class="${cClassDelItem} t-Button t-Button--tiny"><i class="fa ${this.options.deleteIcon}"></i></span>`))
      actions$.append($(`<span class="${cClassSort} t-Button t-Button--tiny"><i class="fa ${this.options.sortIcon}"></i></span>`))
      todo$.append(actions$)

      return todo$
    },

    // Render a list of To-Do's
    _renderTodoList: function () {
      this._todoList$ = $(`<ul class="${cClassList}"></ul>`)
      if (this.options.sortable) {
        this._todoList$.sortable({handle: '.' + cClassSort})
      }
    },

    // Render a no data found message
    _renderNoDataFound: function () {
      this._noDataFound$ = $(`<div class="${cClassNoDataFound}">${this.options.noDataFound}</div>`)
      // Hide immediately
      this._noDataFound$.hide()
    },

    // Add HTML to DOM
    _render: function () {
      // Render components
      this._renderTodoInput()
      this._renderTodoList()
      this._renderNoDataFound()

      // Create widget container
      this.widget$ = this.element.addClass('t-Form--large')

      // Add all components in container
      this.widget$.append(this._todoInput$, this._todoList$, this._noDataFound$)

      // Add to DOM
      this.element.append(this.widget$)
    },

    // Add To-Do list to HTML
    _addToList: function (todoList) {
      let self = this
      todoList.forEach(function (todo) {
        todo.element = self._renderTodo(todo)
        self.todoList.push(todo)
        self._todoList$.append(todo.element)
      })
      return todoList
    },

    // Remove all deleted To-Do's
    _removeFromList: function (todoList) {
      let self = this
      // Save new state and remove elements
      todoList.forEach(function (todo) {
        self.todoList = self.todoList.filter(function (currTodo) {
          if (currTodo.id === todo.id) {
            currTodo.element.remove()
            return false
          } else {
            return true
          }
        })
      })
    },

    _updateList: function (todoList) {
      let self = this
      // Save new state
      todoList.forEach(function (todo) {
        self.todoList.forEach(function (currTodo) {
          if (currTodo.id === todo.id) {
            currTodo = todo
          // Repaint?
          }
        })
      })
    },

    // Hide or show a 'No data found' message
    _toggleNoDataFound: function () {
      if (this.todoList.length === 0) {
        this._noDataFound$.show()
      } else {
        this._noDataFound$.hide()
      }
    },

    // Delete a To-Do on button click
    _onRemoveTodoClick: function (event) {
      let todo = this._getTodo($(event.target).closest('.' + cClassItem).data('id'))
      this._remove(this._ajaxTodoList([todo]))
    },

    // Add a To-Do on Input
    _onTodoInput: function (event) {
      // Only when ENTER is pressed
      if (event.keyCode === cKeyEnter) {
        let todo = {
          title: this._todoInput$.find('input').val()
        }
        // Start AJAX process
        this._add([todo])
        // Clear input
        this._todoInput$.find('input').val('')
        event.preventDefault()
      }
    },

    // Update To-Do list after sorting
    _onSortUpdate: function (event, ui) {
      let self = this

      // Get array of todo id's in new order
      let todoList$ = this._todoList$.find('.' + cClassItem).toArray()
      // Update positions
      todoList$.forEach(function (el, idx) {
        self._getTodo($(el).data('id')).position = idx + 1
      })
      apex.debug(this.todoList)
      // Start AJAX process
      this._update(this._ajaxTodoList(this.todoList))
    },

    // When To-Do is clicked, give it focus
    _onTodoClick: function (event) {
      $(event.target).focus()
    },

    // When focus is lost, update To-Do
    _onTodoBlur: function (event) {
      let todo = this._getTodo($(event.target).closest('.' + cClassItem).data('id'))
      todo.title = $(event.target).text()
      this._update(this._ajaxTodoList([todo]))
    },

    // Get To-Do object by Id
    _getTodo: function (id) {
      for (let i = 0; i < this.todoList.length; i++) {
        if (this.todoList[i].id === id || parseInt(this.todoList[i].id) === id) {
          return this.todoList[i]
        }
      }
    },

    // Return the To-Do list so it can be used by AJAX callbacks
    _ajaxTodoList: function (todoList) {
      // The input parameter is a list of To-Do's which need to be send in AJAX request
      let filteredList = this.todoList.filter(function (todo) {
        return todoList.some(function (currTodo) {
          return currTodo.id === todo.id
        })
      })
      apex.debug(filteredList)
      return filteredList.map(function (todo) {
        return {
          id: todo.id,
          title: todo.title,
          position: todo.position
        }
      })
    },

    // Wrapper for all AJAX requests
    _startAjaxRequest: function (options) {
      let promise
      let self = this
      let deferred = $.Deferred()
      let data = {
        regions: [
          {
            id: this.element.closest('.t-Region').attr('id'),
            ajaxIdentifier: this.options.ajaxIdentifier
          }
        ]
      }
      // This plugin has no support for multiple regions so always [0]
      $.extend(data.regions[0], options)
      // Execute AJAX
      promise = apex.server.plugin(data)
      // Add debugging for all AJAX callbacks
      promise.then(function (pData) {
        apex.debug('Action:', options.action, ', Result data:', pData)
        // When resolved, apply context of widget and return To-Do list
        deferred.resolveWith(self, [pData.regions[0].todoList])
      })
      return deferred.promise()
    },

    // Get all To-Do's from the database
    _get: function () {
      let self = this
      this._startAjaxRequest({
        action: cAjaxGet
      })
        .then(this._addToList)
        .then(this._toggleNoDataFound)
        .done(function () {
          self._trigger(cEventAfterGet, null, self.todoList)
        })
    },

    // Add a To-Do in the database
    _add: function (todoList) {
      let self = this
      this._startAjaxRequest({
        action: cAjaxPost,
        todoList: todoList
      })
        .then(this._addToList)
        .done(function () {
          self._trigger(cEventAfterAdd, null, self.todoList)
        })
    },

    // Update a To-Do in the database
    _update: function (todoList) {
      let self = this
      this._startAjaxRequest({
        action: cAjaxPut,
        todoList: todoList
      })
        .then(this._updateList)
        .done(function (data) {
          self._trigger(cEventAfterUpdate, null, this.todoList)
        })
    },

    // Remove a To-Do in the database
    _remove: function (todoList) {
      let self = this
      this._startAjaxRequest({
        action: cAjaxDelete,
        todoList: todoList
      })
        .then(this._removeFromList)
        .then(this._toggleNoDataFound)
        .done(function () {
          self._trigger(cEventAfterDelete, null, self.todoList)
        })
    },

    // Initialize this special APEX region
    _initRegion: function () {
      let self = this
      apex.region.create(this.element.closest('.t-Region').attr('id'), {
        type: 'todoListPlugin',
        focus: function () {
          self._todoInput$.focus()
        },
        refresh: function () {
          self._get()
        },
        widget: function () {
          return self.widget$
        }
      })
    },

    // ## Public methods

    add: function (todo) {
      this._add([todo])
    },

    remove: function (id) {
      let todo = this._getTodo(id)
      this._removeTodo(todo)
    },

    update: function (id, options) {
      if (options.id) {
        throw new Error('The id cannot be updated')
      }
      let todo = this._getTodo(id)
      $.extend(todo, options)
      this._update(this._ajaxTodoList([todo]))
    },

    list: function () {
      return this.todoList
    }
  })
})(apex.jQuery, apex)
