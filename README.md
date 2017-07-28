React+Redux (without the boilerplate)
=======

[![npm version](https://badge.fury.io/js/redux-registry.svg)](https://badge.fury.io/js/redux-registry)
[![Build Status via Travis CI](https://travis-ci.org/kwhitley/redux-registry.svg?branch=master)](https://travis-ci.org/kwhitley/redux-registry)

## Why?

Because Redux is amazing, but the verbosity (const definitions, switch statements in primary
reducers, etc) and fragmentation seems backwards.  This module adds a heap of magic with just
enough flexibility to be useful.

## Installation

```
npm install redux-registry
```

## Dependencies (only if using in React)

```
npm install --save react-redux redux
```

## Usage

###### register1.js
```js
import { ReduxRegister } from 'redux-registry'
import { fromJS } from 'immutable'

// Define the register and give it a name.  This will create a "user" branch in the root scope.
let register = new ReduxRegister('user')

// Give it an initial state (null in this case), and append "actions" that reduce the state
register
  .setInitialState(null)
  .add({
    name: 'login',
    create: (user) => ({ user }), // no "type" attribute is needed, as everything is internally namespaced
    reduce: (state, action) => fromJS(action.user)
  })
  .add({
    name: 'login2', // no action creator is even required if the only payload can be a single "value" attribute
    reduce: (state, action) => fromJS(action.value)
  })
  .add({
    name: 'logout',
    reduce: (state) => null
  })
  .add({
    name: 'refresh',
    reduce: (state, action) => state.set('expires', action.value)
  })
;

export default register
```

###### registry.js
```js
// imports a shared instance by default
import ReduxRegistry from 'redux-registry'

// to prevent version restrictions on peer dependencies, import your own
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// import registers
import register1 from './register1.js'
import register2 from './another-register.js'
import register3 from './we-could-have-added-just-one-without-the-array.js'

// set "connect" and "bindActionCreators" functions, then add registers
export default ReduxRegistry
  .setConnect(connect) // internally sets "connect" function
  .setBindActionCreators(bindActionCreators) // internally sets "bindActionCreators" function
  .add(register1) // can register each register individually
  .add([ register2, register3 ]) // or in an array
```

###### index.js (root of client app)
```js
import React from 'react'
import ReactDOM from 'react-dom'
import { List, Map, fromJS } from 'immutable'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import { combineReducers } from 'redux-immutable'

// example connected component
import App from './App'

// import ReduxRegistry and extract reducers from shared instance
import ReduxRegistry from './registry' // note the export default in registry.js above
let { reducers } = ReduxRegistry

// create redux state store with default state of Map()
const appReducer = combineReducers(reducers)

// define root reducer
const rootReducer = (state, action) => appReducer(state, action)

// create redux store
const store = createStore(
  rootReducer,
  Map(),
  window.devToolsExtension ? window.devToolsExtension() : c => c
)

ReactDOM.render(<Provider store={store}><App unconnectedProp={'foo'} /></Provider>)
```


###### App.js
```js
import React, { Component } from 'react'
import { connect } from 'redux-registry'

export const App = ({ unconnectedProp, username, user }) => (
  <div className="app">
    <div>User: {username}</div>
    <div>Age: {user.age} (can pull entire state branches or named nodes if using immutable)</div>
    <div>this prop came from upstream: { unconnectedProp }</div>
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

