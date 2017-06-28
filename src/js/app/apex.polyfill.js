/* global apex, jQuery */

window.apex = {}

let json = {
  'regions': [ {
    'todoList': [
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

  }]

}

let ajaxCallbacks = []

ajaxCallbacks['GET'] = function () {
  return json
}
ajaxCallbacks['POST'] = function (data) {
  json.regions[0].todoList.concat(data.regions[0].todoList)
  return data
}
ajaxCallbacks['DELETE'] = function (data) {
  json.regions[0].todoList = json.regions[0].todoList.filter(function (todo) {
    for (let i = 0; i < data.regions[0].todoList.length; i++) {
      return (!todo.id === data.regions[0].todoList[i].id)
    }
  })
  return data
}
ajaxCallbacks['PUT'] = function (data) {
  data.regions[0].todoList.forEach(function (currTodo) {
    for (let i = 0; i < json.regions[0].todoList.length; i++) {
      if (json.regions[0].todoList[i].id === currTodo.id) {
        json.regions[0].todoList[i] = currTodo
        return
      }
    }
  })
  return data
}

apex.server = {
  plugin: function (data, options) {
    let deferred = jQuery.Deferred()
    console.log(1, ajaxCallbacks[data.regions[0].action](data))
    deferred.resolve(ajaxCallbacks[data.regions[0].action](data))
    return deferred.promise()
  }
}

apex.debug = function (msg) {
  console.log(msg)
}

apex.region = {
  create: function () {}
}

apex.jQuery = jQuery
