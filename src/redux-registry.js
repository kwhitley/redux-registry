export const ReduxRegister = function(namespace) {
  const createWithAutoType = (name) => (creator) => (...args) => Object.assign({ type: name }, creator(...args))
  const namespacedName = (namespace) => (name) => `${namespace}:${name}`

  this.creators = {}
  this.reducers = {}
  this.defs = []

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

  this.add = function(def) {
    if (Array.isArray(def)) {
      def.forEach(d => this.add(d))
    } else {
      if (typeof def !== 'object') {
        throw new Error('ReduxRegistry: .add() requires an object definition')
      }

      if (!def.reduce) {
        throw new Error('ReduxRegistry: .add(def = {}) ... requires a "reduce" function attribute')
      }

      if (typeof def.reduce !== 'function') {
        throw new Error('ReduxRegistry: .add(def = {}) ... "reduce" attribute must be a function')
      }

      if (!def.name) {
        throw new Error('ReduxRegistry: .add(def = {}) ... requires a "name" attribute')
      }

      if (typeof def.name !== 'string') {
        throw new Error('ReduxRegistry: .add(def = {}) ... "name" attribute must be a string')
      }

      if (!this._namespace) {
        throw new Error('ReduxRegistry: .add(def = {}) ... namespace should be defined using constructor(namespace) or .setNamespace(namespace) function')
      }

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
    }

    return this
  }

  this.create = (name) => {
    if (!name || typeof name !== 'string') {
      throw new Error(`ReduxRegister: .create(name)(args) ... invalid definition "name"`)
    }

    let creator = this.creators[name]

    if (!creator) {
      throw new Error(`ReduxRegister: .create(name)(args) ... definition "${name}" not found`)
    }

    return (...args) => creator(...args)
  }

  this.reduce = (state, action) => {
    if (!action || typeof action !== 'object') {
      throw new Error(`ReduxRegister: .reduce(state, action) ... "action" should be an action object`)
    }

    if (!action.type || typeof action.type !== 'string') {
      throw new Error(`ReduxRegister: .reduce(state, action) ... "action" should have a valid "type" (string) attribute`)
    }

    let def = this.get(action.type)

    if (!def) {
      throw new Error(`ReduxRegister: .reduce(state, action) ... action "${action.type}" could not be resolved`)
    }

    return def.reduce(state, action)
  }

  this.remove = function(name) {
    if (Array.isArray(name)) {
      name.forEach(n => this.remove(n))
    } else {
      if (typeof name !== 'string') {
        throw new Error(`ReduxRegistry: .remove(name) ... "name" should be a string`)
      }

      // remove from definitions
      let match = this.defs.find(d => d.name === name)

      if (!match) {
        throw new Error(`ReduxRegistry: .remove(name) ... cannot find definition "${name}" in definitions`)
      }

      this.defs = this.defs.filter(d => d !== match)
      delete this.creators[name]
      delete this.reducers[match.namespacedName]

    }

    return this
  }

  this.getNames = function() {
    return this.defs.map(def => def.name)
  }

  this.getNamespace = function() {
    return this._namespace
  }

  this.get = function(name) {
    if (!name || typeof name !== 'string') {
      throw new Error(`ReduxRegister: .get(definitionName)(args) ... invalid definition name (must be a string)`)
    }

    return this.defs.find(def => def.name === name || def.namespacedName === name)
  }

  this.deserializeState = function(fn, state) {
    return fn(state)
  }

  this.reducer = (function(state = initialState, action) {
    let state1 = state

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

  return this.setInitialState()
}


export const ReduxRegistry = function() {
  // INTERNAL REFERENCES TO BE SET VIA .setConnect() and .setBindActionCreators()
  let _bindActionCreators = () => {}
  let _connect = () => {}

  // EXPOSED FOR EXPORTING
  this.registers = {}
  this.creators = {}
  this.reducers = {}

  // NEW METHOD TO CONNECT NAMED PROPS TO STATE VALUES/BRANCHES
  this.connectedProps = (propsMap = {}) => {
    if (typeof propsMap !== 'object') {
      throw Error(`ReduxRegistry: .connectedProps(propsMap) requires a propsMap object`)
    }

    return (state) => Object.keys(propsMap).reduce((map, key) => {
      map[key] = state.getIn(propsMap[key].split('.'))

      return map
    }, {})
  }

  // NEW METHOD TO CONNECT NAMED PROPS TO ACTION DISPATCHERS
  this.connectedDispatchers = (creatorsMap = {}) => {
    if (typeof creatorsMap !== 'object') {
      throw Error(`ReduxRegistry: .connectedDispatchers(creatorsMap) requires a creatorsMap object`)
    }

    return (dispatch) => {
      return Object.keys(creatorsMap).reduce((map, key) => {
        let actionRefs = creatorsMap[key].split('.')
        let actionName = actionRefs && actionRefs.length > 1 ? actionRefs[1] : actionRefs[0]
        let branch = this.creators[actionRefs[0]]
        let dispatchers = _bindActionCreators(branch, dispatch)

        map[key] = actionRefs.length > 1 ? dispatchers[actionName] : dispatchers

        return map
      }, {})
    }
  }

  // CONNECTS REACT COMPONENT (param1) PROPS TO OBJECT MAP OF PROPS/DISPATCHERS (param2)
  this.connect = (map) => {
    if (!map.props && !map.dispatchers) {
      throw Error(`ReduxRegistry: .connect(map) ... map requires either "props" or "dispatchers" defined`)
    }

    if (map.props && typeof map.props !== 'object') {
      throw Error(`ReduxRegistry: .connect(map) ... "props" attribute of map must be an object`)
    }

    if (map.dispatchers && typeof map.dispatchers !== 'object') {
      throw Error(`ReduxRegistry: .connect(map) ... "dispatchers" attribute of map must be an object`)
    }

    return (component) =>
      _connect(this.connectedProps(map.props), this.connectedDispatchers(map.dispatchers))(component)
  }

  this.setConnect = (fn) => {
    if (typeof fn !== 'function' || !fn.name || fn.name !== 'connect') {
      throw Error(`ReduxRegistry: .setConnect(connect) requires a "connect" function from "react-redux"`)
    }

    _connect = fn;
    return this
  }

  this.setBindActionCreators = (fn) => {
    if (typeof fn !== 'function' || !fn.name || fn.name !== 'bindActionCreators') {
      throw Error(`ReduxRegistry: .setBindActionCreators(bindActionCreators) requires a "bindActionCreators" function from "redux"`)
    }

    _bindActionCreators = fn
    return this
  }

  this.add = (register) => {
    if (Array.isArray(register)) {
      register.forEach(r => this.add(r))
    } else {
      let { registers, reducers, creators } = this

      let namespace = register.getNamespace()

      if (!namespace) {
        throw Error(`ReduxRegistry: .add(register) ... register does not have a name`)
      }

      registers[namespace] = register
      creators[namespace] = register.creators
      reducers[namespace] = register.reducer
    }

    return this
  }

  // sugar method for this.get(registerName).create(actionName)
  this.create = (registerName) => this.get(registerName).create // returns regiter's action creator

  this.get = (registerName) => {
    if (!registerName || typeof registerName !== 'string') {
      throw new Error(`ReduxRegister: .get(registerName) ... invalid definition "registerName"`)
    }

    let register = this.registers[registerName]

    if (!register) {
      throw new Error(`ReduxRegister: .get(registerName) ... register "${registerName}" not found`)
    }

    return register
  }

  this.getRegisterFromAction = (action) => {
    if (!action || typeof action !== 'object' || !action.type || typeof action.type !== 'string') {
      throw new Error(`ReduxRegistry: .getRegisterFromAction(action) ... invalid action`, action)
    }

    let namespace = action.type.split(':')

    if (namespace.length < 2) {
      throw new Error(`ReduxRegistry: .getRegisterFromAction(action) ... invalid action namespace`, action.type)
    }

    return this.get(namespace[0])
  }

  this.reduce = (state, action) => this.getRegisterFromAction(action).reduce(state, action)

  this.remove = (namespace) => {
    if (Array.isArray(namespace)) {
      namespace.forEach(n => this.remove(n))
    } else {
      if (typeof namespace !== 'string') {
        throw Error(`ReduxRegistry: .remove(name) ... requires a register "name" to successfully remove`)
      }

      let { registers, reducers, creators } = this

      if (!registers[namespace]) {
        throw Error(`ReduxRegistry: .remove("${namespace}") ... register with namespace "${namespace}" not found`)
      }

      delete registers[namespace]
      delete creators[namespace]
      delete reducers[namespace]
    }

    return this
  }

  return this
}

const globalRegistry = new ReduxRegistry()

export const connect = globalRegistry.connect
export default globalRegistry
