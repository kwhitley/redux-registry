[redux](http://redux.js.org), minus the boilerplate
=======
#### (for use with [immutable.js](https://facebook.github.io/immutable-js/) and [React.js](https://facebook.github.io/react/))

[![npm version](https://badge.fury.io/js/redux-registry.svg)](https://badge.fury.io/js/redux-registry)
[![Build Status via Travis CI](https://travis-ci.org/kwhitley/redux-registry.svg?branch=master)](https://travis-ci.org/kwhitley/redux-registry)
[![Coverage Status](https://coveralls.io/repos/github/kwhitley/redux-registry/badge.svg?branch=master)](https://coveralls.io/github/kwhitley/redux-registry?branch=master)

## Why?

Because [redux](http://redux.js.org) is amazing, but the verbosity (const definitions, switch statements in primary
reducers, etc) and fragmentation of the redux definitions can be painful to implement.  This module adds a heap of magic with just
enough flexibility to be useful.  It basically just removes the repetitive parts and simplifies the cutting and pasting.

## Installation

```
npm install redux-registry
```

## Dependencies (only if using in React)

```
npm install --save react-redux redux
```

## Usage

The basic steps are as follows:
1. Create registers.  The namespace included will be the name of the state branch in your redux store once registered
```js
  let register = new ReduxRegister('todos')
```

2. Set initial state and add definitions to register.  These include a `name` (name of action), `reduce` function and optionally a creator (simple creator functions that output something like { type: 'todos:addTodo', value: 'text' } will be automatically created).  No "type" declaration necessary (this is why reducers are paired in the definition)!
```js
  import { List } from 'immutable'

  register
    .setInitialState(List())
    .add({
      name: 'addTodo',
      create: (value) => ({ value }), // this is created by default if not overwritten and may be omitted
      reduce: (state, action) => state.push(action.value)
     })
```

3. Create a registry (ReduxRegistry class)
```js
  let registry = new ReduxRegistry
```

4. Add registers to the registry
```js
  registry.add(register)
```

5. Create/Reduce functions through the registry.  The registry internally namespaces and pairs everything to ensure proper reduction of actions.  No switch statements, const definitions, etc are necessary.
```js
  let action = registry.create('todos')('addTodo')('go to the store')

  // assumes a state from somewhere, usually passed in from a redux store
  state = registry.reduce(state, action)

  // example state after execution:
  // { todos: ['go to the store'] }
```

6. Wire up to redux
```js
import { createStore } from 'redux'
import { combineReducers } from 'redux-immutable'

// import ReduxRegistry and extract reducers from shared instance
import ReduxRegistry from './registry'
let { reducers } = ReduxRegistry

// create redux state store with default state of Map()
const appReducer = combineReducers(reducers)

// define root reducer
const rootReducer = (state, action) => appReducer(state, action)

// create redux store
const store = createStore(
  rootReducer,
  Map(), // initial state
  window.devToolsExtension ? window.devToolsExtension() : c => c
)

// use store like you normally would (e.g. in Provider)
ReactDOM.render(<Provider store={store}><App /></Provider>)
```

7. [OPTIONAL] - The ReduxRegistry class includes a "connect" method (similar signature to react-redux) that saves a lot of hassle in wiring up props/action creators to components.  This is exported as a named const "connect" from the core module (which default exports a shared ReduxRegistry instance).  In order to use this added magic, I require that you register the "connect" function from react-redux and "bindActionCreators" from react (the exported connect function uses these internally).
###### registry.js
```js

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import ReduxRegistry from 'redux-registry'

export default ReduxRegistry
  .setConnect(connect) // internally sets "connect" function
  .setBindActionCreators(bindActionCreators) // internally sets "bindActionCreators" function

// continue adding registers (shown above)
```

Then in a component:

```js
import React, { Component } from 'react'
import { connect } from 'redux-registry'

export const App = ({ username, user }) => (
  <div className="app">
    <div>User: {username}</div>
    <div>Age: {user.age} (can pull entire state branches or named nodes if using immutable)</div>
    <button onClick={logoutAction}>Logout fires action dispatcher</button>
  </div>
)

export default connect({
  props: {
    username: 'user.name',
    user: 'user',
  },
  dispatchers: {
    'logoutAction': 'user.logout'
  }
})(App)
```


# Contributing

1. Fork the library and start by running:
```
npm run test:watch
```
2. Please submit PRs with full test coverage, additions to README, etc.
3. Issues will be addressed, but PRs with corrections are preferred.  If submitting a PR, please attempt
   to follow my coding syntax/style.

