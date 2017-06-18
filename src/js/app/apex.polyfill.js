/* global apex, jQuery */

window.apex = {}

let todoList = {
  name: 'myList',
  'items': [
    {
      'id': 1,
      'title': 'task 1',
      'position': 2
    },
    {
      'id': 2,
      'title': 'task 2',
      'position': 1
    }
  ]
}

let ajaxCallbacks = []

ajaxCallbacks['GET'] = function () {
  return todoList
}
ajaxCallbacks['PUT'] = function (data) {
  todoList.items.map(function (item) {
    if (item.id === data.x02) {
      item.title = data.x03
    }
    return item
  })
  return {
    result: `${data.x03} has been updated`
  }
}
ajaxCallbacks['POST'] = function (data) {
  todoList.items.push({
    id: data.x02,
    title: data.x03
  })
  return {
    result: `${data.x03} has been added`
  }
}
ajaxCallbacks['DELETE'] = function (data) {
  todoList.items = todoList.items.filter(function (item) {
    return (item.id !== data.x02)
  })
  return {
    result: `${data.x02} has been deleted`
  }
}
ajaxCallbacks['SORT'] = function (data) {
  let positions = data.x02.split(',')
  positions.forEach(function (id, key) {
    for (let i = 0; i < todoList.items.length; i++) {
      if (todoList.items[i].id === id) {
        todoList.items[i].position = key + 1
      }
    }
  })
  return {
    result: `The new positions have been saved`
  }
}

apex.server = {
  plugin: function (ajaxIdentifier, data, options) {
    let deferred = jQuery.Deferred()
    deferred.resolve(ajaxCallbacks[data.x01](data))
    return deferred.promise()
  }
}

apex.debug = function (msg) {
  console.log(msg)
}

apex.jQuery = jQuery
