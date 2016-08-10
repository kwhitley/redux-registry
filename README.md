# redux-registry

Redux registry for reducing boilerplate when registering actions.

##Installation

```js
npm install --save redux-registry
```

---

I noticed more than a bit of uneeded verbosity in redux definitions, with
most people defining constants at the top, adding loose action creators and reducer functions,
then wiring it all up with a switch.  In order to simplify the process I made the following assumptions:

- Action Names (e.g. 'ADD_TODO') can largely be extracted
from the creator function itself (create dummy action and
examine 'type' attribute).  This is what most tend to route
off of in the reducer function, which means instead of defining
at the top and reusing, we can use that as an index lookup.

- Reducers naturally occur with the matching action creator,
so why not define them together?  Limitation: reducers should be defined as:
```js
  func(state, action)
```
Taking the full action as a second param, rather than custom subsets.

- By doing this, we eliminate the need for redefining the reducer function
calls for the reducer, and make the assumption they use a
func(state, action) signature.

##Example Usage

```js

// NOT REQUIRED
import {Map, List} from 'immutable';

// IMPORT REDUXREGISTRY LIB
import ReduxRegister from './redux-registry';

let register = new ReduxRegistry;

// REGISTER ACTIONCREATORS+REDUCER PAIRS
register
  .add({
    alias: 'addTodo', // optional alias to avoid UPPER_SNAKE_CASE references in your app
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
  .add({
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

// CREATING ACTIONS (equivalent methods)
register.addTodo.create('foo');
register.ADD_TODO.create('foo');
register.get('ADD_TODO').create('foo');
// { type: 'ADD_TODO', text: 'foo' }

// QUICK INDEX OF REGISTERED PAIRS
register.getNames();
// ['ADD_TODO', 'TOGGLE_TODO']

// INDEX OF ACTION CREATORS (for redux/react)
register.creators;
// {
//    'addTodo': [Function],
//    'ADD_TODO': [Function],
//    'TOGGLE_TODO': [Function]
//  }

// INDEX OF REDUCERS (for redux/react)
register.reducers;
// {
//    'addTodo': [Function],
//    'ADD_TODO': [Function],
//    'TOGGLE_TODO': [Function]
//  }

// CREATE AN INITIAL APP STATE
let state = Map({
  todos: List()
});

// RUN REDUCER ON ACTIONS (no need to create switch as action routing is handled internally)
let action1 = register.create.addTodo('foo');
let action2 = register.create.addTodo('bar');
let action3 = register.create.TOGGLE_TODO(1);

state = register.reduce(state, action1);
state = register.reduce(state, action2);
state = register.reduce(state, action3);
// Map({
//  todos: List.of([
//    { index: 0, text: 'foo', completed: false },
//    { index: 1, text: 'bar', completed: true }
//  ])
// })

// ALTERNATIVELY CAN REDUCE ARRAYS OF ACTIONS
state = register.reduce(state, [action1, action2, action3]);
// Map({
//  todos: List.of([
//    { index: 0, text: 'foo', completed: false },
//    { index: 1, text: 'bar', completed: true }
//  ])
// })

`
