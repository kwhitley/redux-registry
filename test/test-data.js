import {List, Map, fromJS} from 'immutable';

export var initialState = Map({ todos: List() });

export var def1 = {
  alias: 'addTodo',
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
};

export var def2 = {
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
};
