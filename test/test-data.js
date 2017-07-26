import {List, Map, fromJS} from 'immutable'

export var initialState = Map({ todos: List() })

export var aliasDef = {
  name: 'addTodo',
  create: (text) => ({ text }),
  reduce: (state, action) => state.updateIn(['todos'], todos => todos.push({
                                index: todos.size,
                                text: action.text,
                                completed: false
                              }))
}

export var defWithoutCreate = {
  name: 'toggleTodo',
  reduce: (state, action) => state.updateIn(['todos', action.value], todo => {
                                todo.completed = !todo.completed
                                return todo
                              })
}

export var defWithoutNameOrAlias = {
  create: (index) => ({ type: 'TOGGLE_TODO', index }),
  reduce: (state, action) => state.updateIn(['todos', action.index], todo => {
                                todo.completed = !todo.completed
                                return todo
                              })
}
