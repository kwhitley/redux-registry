'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addTodo = addTodo;
exports.toggleTodo = toggleTodo;
exports.reducer = reducer;

var _immutable = require('immutable');

var state = (0, _immutable.Map)({ todos: (0, _immutable.List)() });

var ADD_TODO = 'ADD_TODO';
var TOGGLE_TODO = 'TOGGLE_TODO';

function addTodo(text) {
  return {
    type: ADD_TODO,
    text: text
  };
}

function addTodoReducer(state, action) {
  return state.updateIn(['todos'], function (todos) {
    return todos.push({
      index: todos.size,
      text: action.text,
      completed: false
    });
  });
}

function toggleTodo(index) {
  return {
    type: TOGGLE_TODO,
    index: index
  };
}

function toggleTodoReducer(state, action) {
  return state.updateIn(['todos', action.index], function (todo) {
    todo.completed = !todo.completed;
    return todo;
  });
}

function reducer(state, action) {
  switch (action.type) {
    case ADD_TODO:
      return addTodoReducer(state, action);
    case TOGGLE_TODO:
      return toggleTodoReducer(state, action);
  }
  return state;
}

state = reducer(state, { type: 'ADD_TODO', text: 'something' });