/* global apex */

;(function ($, apex) {
  // Constants
  const cAjaxGet = 'GET'
  const cAjaxDelete = 'DELETE'
  const cAjaxPut = 'PUT'
  const cAjaxPost = 'POST'
  const cAjaxSort = 'SORT'
  const cClassItem = 'todo-item'
  const cClassItemText = 'todo-item-text'
  const cClassDelItem = 'todo-item-delete'
  const cClassNoDataFound = 'no-data-found'
  const cClassList = 'todo-list-items'
  const cClassWidget = 'todo-list'
  const cClassInput = 'todo-input'
  const cClassSort = 'ui-sort'
  const cClassItemActions = 'todo-actions'
  const cKeyEnter = 13
  // Events
  const cEventAfterData = 'aftergetdata'
  const cEventAfterDelete = 'afterdelete'
  const cEventAfterAdd = 'afteradd'
  const cEventAfterUpdate = 'afterupdate'
  const cEventSortUpdate = 'sortupdate'
  const cEventSortStart = 'sortstart'
  const cEventSortStop = 'sortstop'
  const cEventAfterSort = 'aftersort'

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
      this._getData()
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
      this._createEventHandler({
        element: this.element,
        eventName: cEventAfterData,
        callback: this._onAfterGetData
      })

      this._createEventHandler({
        element: this._todoList$,
        eventName: 'click .' + cClassDelItem,
        callback: this._onRemoveTodoClick
      })

      this._createEventHandler({
        element: this._todoList$,
        eventName: 'click .' + cClassItemText,
        callback: this._onTodoClick
      })

      this._createEventHandler({
        element: this._todoList$,
        eventName: 'blur .' + cClassItemText,
        callback: this._onTodoBlur
      })

      if (this.options.sortable) {
        this._createEventHandler({
          element: this._todoList$,
          eventName: cEventSortStart,
          callback: this._onSortStart
        })
        this._createEventHandler({
          element: this._todoList$,
          eventName: cEventSortStop,
          callback: this._onSortStop
        })
        this._createEventHandler({
          element: this._todoList$,
          eventName: cEventSortUpdate,
          callback: this._onSortUpdate
        })
      }

      this._createEventHandler({
        element: this._todoInput$,
        eventName: 'keydown',
        callback: this._onTodoInput
      })
    },

    // ## Private methods

    // Render a textbox to add a new To-Do
    _renderTodoInput: function () {
      this._todoInput$ = $(`<div class="${cClassInput}"><input type="text" id="${this.element.id}_input" placeholder="${this.options.inputPlaceholder}"></input></div>`)
    },

    // Render a single To-Do
    _renderTodo: function (todo) {
      let todo$ = $(`<li data-id="${todo.id}" class="${cClassItem}"></li>`)
      let actions$ = $(`<div class="${cClassItemActions}"></div>`)

      todo$.append(`<span class="${cClassItemText}" contenteditable="true">${todo.title}</span>`)
      actions$.append($(`<span class="${cClassDelItem}"> ${this.options.deleteIcon}</span>`))
      actions$.append($(`<span class="${cClassSort}">${this.options.sortIcon}</span>`))
      todo$.append(actions$)

      return todo$
    },

    // Render a list of To-Do's
    _renderTodoList: function () {
      this._todoList$ = $(`<ul class="${cClassList}"></ul>`)
      if (this.options.sortable) {
        this._todoList$.sortable({handle: '.ui-sort'})
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
      this.widget$ = $(`<div class="${cClassWidget}"></div>`)

      // Add all components in container
      this.widget$.append(this._todoInput$, this._todoList$, this._noDataFound$)

      // Add to DOM
      this.element.append(this.widget$)
    },

    _getData: function () {
      let self = this
      let promise = apex.server.plugin(this.ajaxIdentifier, {
        x01: cAjaxGet
      })
      promise.done(function (data) {
        self._sortPositions(data.items)
        data.items.forEach($.proxy(self._addToList, self))
        self._toggleNoDataFound()
        self._trigger(cEventAfterData, null, this.todoList)
      })
    },

    _sortPositions: function (arr) {
      arr.sort(function (a, b) {
        if (a.position > b.position) {
          return 1
        } else {
          return 0
        }
      })
      return arr
    },

    _onAfterGetData: function () {
      apex.debug('new data')
    },

    _onRemoveTodoClick: function (event) {
      let todo = this._getTodo($(event.target).closest('.' + cClassItem).data('id'))
      this._removeTodo(todo)
    },

    _onTodoInput: function (event) {
      if (event.keyCode === cKeyEnter) {
        this.add({
          id: this.todoList.length + 1,
          title: this._todoInput$.find('input').val()
        })
        this._todoInput$.find('input').val('')
      }
    },

    _onSortUpdate: function (event, ui) {
      // Get array of todo id's in new order
      ui.item.data('sort', false)
      let todoList = this._todoList$.find('.' + cClassItem).toArray()
      let positions = todoList.map(function (el, idx) {
        return $(el).data('id')
      })
      this._updatePositions(positions)
    },

    _onSortStop: function (event, ui) {
      let todo = this._getTodo(ui.item.data('id'))
      this.update(todo.id, {
        title: ui.item.find('.' + cClassItemText).text()
      })
    },

    _onSortStart: function (event, ui) {
      ui.item.data('sort', true)
    },

    _onTodoClick: function (event) {
      $(event.target).focus()
    },

    _onTodoBlur: function (event) {
      let todo = this._getTodo($(event.target).closest('.' + cClassItem).data('id'))
      if (!todo.element.data('sort')) {
        this.update(todo.id, {
          title: $(event.target).text()
        })
      }
    },

    _addToList: function (todo) {
      todo.element = this._renderTodo(todo)
      this.todoList.push(todo)
      this._todoList$.append(todo.element)
      this._toggleNoDataFound()
    },

    _toggleNoDataFound: function () {
      if (this.todoList.length === 0) {
        this._noDataFound$.show()
      } else {
        this._noDataFound$.hide()
      }
    },

    _getTodo: function (id) {
      for (let i = 0; i < this.todoList.length; i++) {
        if (this.todoList[i].id === id) {
          return this.todoList[i]
        }
      }
    },

    _removeTodo: function (todo) {
      let self = this
      let promise = apex.server.plugin(this.ajaxIdentifier, {
        x01: cAjaxDelete,
        x02: todo.id
      })
      promise.done(function (data) {
        apex.debug(data)
        todo.element.remove()
        self.todoList = self.todoList.filter(function (currTodo) {
          return (currTodo.id !== todo.id)
        })
        self._toggleNoDataFound()
        self._trigger(cEventAfterDelete, null, this.todoList)
      })
    },

    _addTodo: function (todo) {
      let self = this
      let promise = apex.server.plugin(this.ajaxIdentifier, {
        x01: cAjaxPost,
        x02: todo.id,
        x03: todo.title
      })
      promise.done(function (data) {
        apex.debug(data)
        self._addToList(todo)
        self._trigger(cEventAfterAdd, null, this.todoList)
      })
    },

    _updateTodo: function (todo) {
      let self = this
      let promise = apex.server.plugin(this.ajaxIdentifier, {
        x01: cAjaxPut,
        x02: todo.id,
        x03: todo.title
      })
      promise.done(function (data) {
        apex.debug(data)
        var todo$ = self._renderTodo(todo)
        todo.element.replaceWith(todo$)
        todo.element = todo$
        self._trigger(cEventAfterUpdate, null, this.todoList)
      })
    },

    _updatePositions: function (positions) {
      let self = this
      let promise = apex.server.plugin(this.ajaxIdentifier, {
        x01: cAjaxSort,
        x02: positions.toString(',')
      })
      promise.done(function (data) {
        apex.debug(data)
        positions.forEach(function (id, key) {
          self._getTodo(id).position = key + 1
        })
        self._sortPositions(self.todoList)
        self._trigger(cEventAfterSort, null, this.todoList)
      })
    },

    // ## Public methods

    add: function (todo) {
      this._addTodo(todo)
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
      this._updateTodo(todo)
    },

    list: function () {
      return this.todoList
    }
  })
})(apex.jQuery, apex)
