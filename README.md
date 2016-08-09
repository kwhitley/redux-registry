# redux-factory

Redux factory for reducing boilerplate when registering actions.  Register actions with reducers, with names being auto-detected from created actions.

##Example Usage

`js
import ReduxFactory from './redux-factory';
import {Map, List} from 'immutable';

let rf = new ReduxFactory({
  initialState: Map({
    todos: List()
  })
});

rf
  .addAction({
    create: function(text) {
      return {
        type: 'ADD_TODO',
        text: text
      }
    },
    reduce: function(state, action) {
      return state.updateIn(['todos'], todos => todos.push({
        index: todos.size,
        text: action.text,
        completed: false
      }));
    }
  })
  .addAction({
    create: function(index) {
      return {
        type: 'TOGGLE_TODO',
        index: index
      }
    },
    reduce: function(state, action) {
      return state.updateIn(['todos', action.index], todo => {
        todo.completed = !todo.completed;
        return todo;
      });
    }
  })
;
`
