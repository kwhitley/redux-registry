import ReduxFactory from './redux-registry';
import {Map, List} from 'immutable';

var state = Map({ todos: List() });

var rf = new ReduxFactory({ initialState: state });

rf
  .addAction({
    create: function(text) {
      return {
        type: 'ADD_TODO',
        text: text
      };
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
  }
);

state = rf.reducer(state, { type: 'ADD_TODO', text: 'something' });
