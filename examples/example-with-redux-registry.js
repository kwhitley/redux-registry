import ReduxRegistry, { ReduxRegister } from './redux-registry'
import { Map, List } from 'immutable'

var state = Map({ title: 'New Todos', todos: List() })

var register = new ReduxRegister('todos')

register
  .add({
    name: 'setTitle',
    reduce: (state, action) => state.set('title', action.value)
  })
  .add({
    name: 'createTodo',
    reduce: (state, action) => state.updateIn(['todos'],
      todos => todos.push({
        index: todos.size,
        text: action.value,
        completed: false
      })
    )
  })
  .add({
    name: 'toggle',
    reduce: (state, action) => state.updateIn(['todos', action.value],
      todo => {
        todo.completed = !todo.completed
        return todo
      }
    )
  })

export default ReduxRegistry.add()

// example dispatching manually-created actions
state = ReduxRegistry.reducer(state, { type: 'todos:createTodo', value: 'something' })

// example dispatching auto-created actions (namespacing handled internally)
state = ReduxRegistry.reducer(state, register.create('createTodo')('something'))
