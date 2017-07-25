export const ReduxRegister = function(namespace) {
  const createWithAutoType = (name) => (creator) => (value) => Object.assign({ type: name }, creator(value))
  const namespacedName = (namespace) => (name) => `${namespace}:${name}`

  this.creators = {}
  this.reducers = {}

  var initialState = {}
  this._namespace = namespace

  this.setInitialState = function(state = {}) {
    initialState = state
    this.state = state

    return this
  }

  this.setNamespace = (name) => {
    this._namespace = name

    return this
  }

  this.setDefs = function(defs = []) {
    this.defs = defs
    defs.forEach(def => this.add(def))
    return this
  }

  this.setPrefix = function(prefix = '') {
    this.prefix = prefix
    return this
  }

  this.add = function(def) {
    if (!def.reduce) {
      throw new Error('ReduxRegistry: no reduce() function defined')
    }

    // name === alias in register definitions
    def.name = def.name || def.alias
    def.namespacedName = namespacedName(this._namespace)(def.name)

    // create default action creator
    if (!def.create) {
      def.create = (value) => ({ value })
    }

    // action creators get auto-typed
    def.create = createWithAutoType(def.namespacedName)(def.create)

    // add shorthand .remove() handle
    def.remove = (function() {
      this.remove(def.name)
    }).bind(this)

    // add definition
    this.defs.push(def)

    // add action creator reference to .create index
    this.creators[def.name] = def.create

    // add reducer reference to .reduce index
    this.reducers[def.namespacedName] = def.reduce

    return this
  }

  this.remove = function(name) {
    // remove from definitions
    let match = this.defs.find(d => d.name === name)

    if (!match) {
      throw new ReferenceError(`cannot find '${name}' to remove`)
    }

    this.defs = this.defs.filter(d => d !== match)
    delete this.creators[name]
    delete this.reducers[match.namespacedName]

    return this
  }

  this.getNames = function() {
    return this.defs.map(def => def.name)
  }

  this.get = function(name) {
    return this.defs.find(def => def.name === name || def.alias === name)
  }

  this.deserializeState = function(fn, state) {
    return fn(state)
  }

  this.reducer = (function(state = initialState, action) {
    let state1 = state

    console.log('reducing action', action)
    if (Array.isArray(action)) {
      let s = state
      action.forEach(a => {
        s = this.reducer(s, a)
      }, this)

      return s
    }


    if (!action || !action.type || action.type.indexOf('@@') === 0) {
      return state
    }

    let reducer = this.reducers[action.type]

    if (!reducer) {
      return state
    }

    let state2 = reducer(state1, action)

    return state2
  }).bind(this)

  this
    .setInitialState()
    .setDefs()
    .setPrefix()

  return this
}


export const ReduxRegistry = function() {
  // need to be connected or registry will fail
  this._bindActionCreators = () => {}
  this._connect = () => {}
  this.registers = {}

  // NEW METHOD TO CONNECT NAMED PROPS TO STATE VALUES/BRANCHES
  this.connectedProps = (propsMap = {}) => (state) => Object.keys(propsMap).reduce((map, key) => {
    map[key] = state.getIn(propsMap[key].split('.'))

    return map
  }, {})

  // NEW METHOD TO CONNECT NAMED PROPS TO ACTION DISPATCHERS
  this.connectedDispatchers = (actionsMap = {}) => (dispatch) => {
    return Object.keys(actionsMap).reduce((map, key) => {
      let actionRefs = actionsMap[key].split('.')
      let actionName = actionRefs && actionRefs.length > 1 ? actionRefs[1] : actionRefs[0]
      let branch = this.getActions()[actionRefs[0]]
      let dispatchers = this._bindActionCreators(branch, dispatch)

      map[key] = actionRefs.length > 1 ? dispatchers[actionName] : dispatchers

      return map
    }, {})
  }

  // CONNECTS REACT COMPONENT (param1) PROPS TO OBJECT MAP OF PROPS/DISPATCHERS (param2)
  this.connect = (map) => (component) =>
    this._connect(this.connectedProps(map.props), this.connectedDispatchers(map.dispatchers))(component)

  this.getReducers = () => Object.keys(this.registers).reduce((out, key) => {
    out[key] = this.registers[key].reducer
    return out
  }, {})

  this.getActions = () => Object.keys(this.registers).reduce((out, key) => {
    out[key] = this.registers[key].creators
    return out
  }, {})

  this.setConnect = (fn) => {
    this._connect = fn;
    return this
  }

  this.setBindActionCreators = (fn) => { this._bindActionCreators = fn; return this }

  this.addRegisters = (registers = {}) => {
    this.registers = registers

    // embed actions
    this.actions = Object.keys(this.registers).reduce((out, key) => {
      out[key] = this.registers[key].creators
      return out
    }, {})

    // embed reducers
    this.reducers = Object.keys(this.registers).reduce((out, key) => {
      out[key] = this.registers[key].reducer
      return out
    }, {})

    return this
  }

  return this
}

const globalRegistry = new ReduxRegistry()

export const connect = globalRegistry.connect
export default globalRegistry
