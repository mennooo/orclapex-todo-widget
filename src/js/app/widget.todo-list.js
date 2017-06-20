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
    listId: null,
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
      this.widget$ = $(`<div class="${cClassWidget} t-Form--large"></div>`)

      // Add all components in container
      this.widget$.append(this._todoInput$, this._todoList$, this._noDataFound$)

      // Add to DOM
      this.element.append(this.widget$)
    },

    _addToList: function (todoList) {
      let self = this
      todoList.forEach(function (todo) {
        todo.element = self._renderTodo(todo)
        self.todoList.push(todo)
        self._todoList$.append(todo.element)
      })
      this._toggleNoDataFound()
    },

    _toggleNoDataFound: function () {
      if (this.todoList.length === 0) {
        this._noDataFound$.show()
      } else {
        this._noDataFound$.hide()
      }
    },

    _onAfterGetData: function () {
      apex.debug('new data')
    },

    _onRemoveTodoClick: function (event) {
      let todo = this._getTodo($(event.target).closest('.' + cClassItem).data('id'))
      todo.element.remove()
      this._remove(this._ajaxTodoList(todo))
    },

    _onTodoInput: function (event) {
      if (event.keyCode === cKeyEnter) {
        let todo = {
          title: this._todoInput$.find('input').val()
        }
        this._addToList([todo])
        this._add(this._ajaxTodoList(todo))
        this._todoInput$.find('input').val('')
        event.preventDefault()
      }
    },

    _onSortUpdate: function (event, ui) {
      let self = this
      ui.item.data('sort', false)
      // Get array of todo id's in new order
      let todoList$ = this._todoList$.find('.' + cClassItem).toArray()
      // Update positions
      todoList$.forEach(function (el, idx) {
        self._getTodo($(el).data('id')).position = idx + 1
      })
      this._update(this._ajaxTodoList())
    },

    _onTodoClick: function (event) {
      $(event.target).focus()
    },

    _onTodoBlur: function (event) {
      let todo = this._getTodo($(event.target).closest('.' + cClassItem).data('id'))
      todo.title = $(event.target).text()
      this._update(this._ajaxTodoList(todo))
    },

    _getTodo: function (id) {
      for (let i = 0; i < this.todoList.length; i++) {
        if (this.todoList[i].id === id || parseInt(this.todoList[i].id) === id) {
          return this.todoList[i]
        }
      }
    },

    _ajaxTodoList: function (todo) {
      let filteredList = this.todoList.filter(function (currTodo) {
        return (!todo || todo.id === currTodo.id)
      })
      return filteredList.map(function (todo) {
        return {
          id: todo.id,
          title: todo.title,
          position: todo.position
        }
      })
    },

    _remove: function (todoList) {
      let self = this
      let promise = apex.server.plugin({
        regions: [
          {
            id: this.element.closest('.t-Region').attr('id'),
            ajaxIdentifier: this.options.ajaxIdentifier,
            action: cAjaxDelete,
            todoList: todoList
          }
        ]
      })
      promise.done(function (data) {
        apex.debug(data)
        todoList.forEach(function (todo) {
          self.todoList = self.todoList.filter(function (currTodo) {
            return (currTodo.id !== todo.id)
          })
        })
        self._toggleNoDataFound()
        self._trigger(cEventAfterDelete, null, this.todoList)
      })
    },

    _get: function () {
      let self = this
      let promise = apex.server.plugin({
        regions: [
          {
            id: this.element.closest('.t-Region').attr('id'),
            ajaxIdentifier: this.options.ajaxIdentifier,
            action: cAjaxGet
          }
        ]
      })
      promise.done(function (data) {
        self.listId = data.regions[0].listId
        $.proxy(self._addToList(data.regions[0].todoList), self)
        self._toggleNoDataFound()
        self._trigger(cEventAfterData, null, this.todoList)
      })
    },

    _add: function (todoList) {
      let self = this
      let promise = apex.server.plugin({
        regions: [
          {
            id: this.element.closest('.t-Region').attr('id'),
            ajaxIdentifier: this.options.ajaxIdentifier,
            action: cAjaxPost,
            todoList: todoList
          }
        ]
      })
      promise.done(function (data) {
        apex.debug(data)
        self._trigger(cEventAfterAdd, null, this.todoList)
      })
    },

    _update: function (todoList) {
      apex.debug(todoList)
      let self = this
      let promise = apex.server.plugin({
        regions: [
          {
            id: this.element.closest('.t-Region').attr('id'),
            ajaxIdentifier: this.options.ajaxIdentifier,
            action: cAjaxPut,
            todoList: todoList
          }
        ]
      })
      promise.done(function (data) {
        apex.debug(data)
        self._trigger(cEventAfterUpdate, null, this.todoList)
      })
    },

    // ## Public methods

    add: function (todo) {
      this._add(todo)
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
      this._update(this._ajaxTodoList(todo))
    },

    list: function () {
      return this.todoList
    }
  })
})(apex.jQuery, apex)
