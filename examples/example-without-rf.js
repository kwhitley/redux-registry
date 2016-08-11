import {Map, List} from 'immutable';

var state = Map({ todos: List() });

const ADD_TODO = 'ADD_TODO';
const TOGGLE_TODO = 'TOGGLE_TODO';

export function addTodo(text) {
  return {
    type: ADD_TODO,
    text: text
  };
}

function addTodoReducer(state, action) {
  return state.updateIn(['todos'], todos => todos.push({
    index: todos.size,
    text: action.text,
    completed: false
  }));
}

export function toggleTodo(index) {
  return {
    type: TOGGLE_TODO,
    index: index
  }
}

function toggleTodoReducer(state, action) {
  return state.updateIn(['todos', action.index], todo => {
    todo.completed = !todo.completed;
    return todo;
  });
}

export function reducer(state, action) {
  switch (action.type) {
    case ADD_TODO: return addTodoReducer(state, action);
    case TOGGLE_TODO: return toggleTodoReducer(state, action);
  }
  return state;
}

state = reducer(state, { type: 'ADD_TODO', text: 'something' });
