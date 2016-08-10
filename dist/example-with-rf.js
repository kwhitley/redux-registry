'use strict';

var _reduxRegistry = require('./redux-registry');

var _reduxRegistry2 = _interopRequireDefault(_reduxRegistry);

var _immutable = require('immutable');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var state = (0, _immutable.Map)({ todos: (0, _immutable.List)() });

var rf = new _reduxRegistry2.default({ initialState: state });

rf.addAction({
  create: function create(text) {
    return {
      type: 'ADD_TODO',
      text: text
    };
  },
  reduce: function reduce(state, action) {
    return state.updateIn(['todos'], function (todos) {
      return todos.push({
        index: todos.size,
        text: action.text,
        completed: false
      });
    });
  }
}).addAction({
  create: function create(index) {
    return {
      type: 'TOGGLE_TODO',
      index: index
    };
  },
  reduce: function reduce(state, action) {
    return state.updateIn(['todos', action.index], function (todo) {
      todo.completed = !todo.completed;
      return todo;
    });
  }
});

state = rf.reducer(state, { type: 'ADD_TODO', text: 'something' });