# redux-registry

Redux registry for reducing boilerplate when registering actions.

---

I noticed more than a bit of uneeded verbosity in redux definitions, with
most people defining constants at the top, adding loose action creators and reducer functions,
then wiring it all up with a switch.  In order to simplify the process I made the following assumptions:

1. Action Names (e.g. 'ADD_TODO') can largely be extracted
from the creator function itself (create dummy action and
examine 'type' attribute).  This is what most tend to route
off of in the reducer function, which means instead of defining
at the top and reusing, we can use that as an index lookup.

2. Reducers naturally occur with the matching action creator,
so why not define them together?  Limitation: reducers should be defined as:
```js
  func(state, action)
```
Taking the full action as a second param, rather than custom subsets.

3. By doing this, we eliminate the need for redefining the function
signature for the reducer, and make the assumption they can handle based on a
func(state, action) signature.

##Example Usage

```js
import ReduxRegister from './redux-registry';
import {Map, List} from 'immutable';

let register = new ReduxRegister;
let state = Map({
  todos: List()
});

register
  .add({
    alias: 'addTodo',
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

// CREATING ACTIONS
let action
  = register.addTodo.create({ text: 'foo' });
  = register.ADD_TODO.create({ text: 'foo' });
  = register.get('ADD_TODO').create({ text: 'foo' });
;
// { type: 'ADD_TODO', text: 'foo' }

// QUICK INDEX OF REGISTERED PAIRS
let idnex = register.getNames();
// ['ADD_TODO', 'TOGGLE_TODO']

// INDEX OF ACTION CREATORS (for redux/react)
let actionCreators = register.creators;
// {
//    'addTodo': [Function],
//    'ADD_TODO': [Function],
//    'TOGGLE_TODO': [Function]
//  }

// INDEX OF REDUCERS (for redux/react)
let reducers = register.reducers;
// {
//    'addTodo': [Function],
//    'ADD_TODO': [Function],
//    'TOGGLE_TODO': [Function]
//  }

// REGISTER REDUCER (no need to create switch as action routing is handled internally)
state = register.reduce(state, register.ADD_TODO.create({ text: 'foo' }));
// state == Map({
  todos: List.of([
    { type: 'ADD_TODO', text: 'foo', completed: false }
  ])
})

`
