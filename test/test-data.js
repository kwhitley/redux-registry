import {List, Map, fromJS} from 'immutable'

export const initialState = Map({ todos: List() })

export const basicDef = {
  name: 'addTodo',
  create: (text) => ({ text }),
  reduce: (state, action) => state.updateIn(['todos'], todos => todos.push({
                                index: todos.size,
                                text: action.text,
                                completed: false
                              }))
}

export const defWithoutCreate = {
  name: 'toggleTodo',
  reduce: (state, action) => state.updateIn(['todos', action.value], todo => {
                                todo.completed = !todo.completed
                                return todo
                              })
}

export const complexActionDef = {
  name: 'complexAction',
  create: (a, b, c) => ({ a, b, c }),
  reduce: (state, action) => state
}

export const defWithoutNameOrAlias = {
  create: (index) => ({ type: 'TOGGLE_TODO', index }),
  reduce: (state, action) => state.updateIn(['todos', action.index], todo => {
                                todo.completed = !todo.completed
                                return todo
                              })
}
