export default function ReduxRegistry(init) {
  var initialState = {};

  this.setInitialState = function(state = {}) {
    initialState = state;
    this.state = state;

    // console.log('this reference from setInitialState()', this);
    return this;
  };

  this.setDefs = function(defs = []) {
    this.defs = defs;
    defs.forEach(def => this.add(def));
    return this;
  };

  this.setPrefix = function(prefix = '') {
    this.prefix = prefix;
    return this;
  };

  this.add = function(def) {
    if (!def.create) {
      throw new Error('ReduxRegistry: no create() function defined');
    }
    if (!def.reduce) {
      throw new Error('ReduxRegistry: no reduce() function defined');
    }
    if (!def.name) {
      let name = def.create() && def.create().type;
      if (!name) {
        throw new Error('ReduxRegistry: \'type\' not defined for creator function');
      } else {
        def.name = name;
      }
    };

    // add shorthand .remove() handle
    def.remove = (function() {
      this.remove(def.name);
    }).bind(this);

    // add definition
    this.defs.push(def);
    let alias = def.alias || def.name;

    // add action creator reference to .create index
    this.create[def.name] = this.create[alias] = def.create;

    // add reducer reference to .reduce index
    this.reduce[def.name] = this.reduce[alias] = def.reduce;

    return this;
  };

  this.remove = function(name) {
    // remove from definitions
    let match = this.defs.find(d => d.name === name || d.alias === name);

    if (!match) {
      throw new ReferenceError(`cannot find '${name}' to remove`);
    }

    this.defs = this.defs.filter(d => d !== match);
    delete this.create[match.name];
    delete this.create[match.alias];
    delete this.reduce[match.name];
    delete this.reduce[match.alias];

    return this;
  };

  this.getNames = function() {
    return this.defs.map(def => def.name);
  };

  this.get = function(name) {
    return this.defs.find(def => def.name === name || def.alias === name);
  };

  this.deserializeState = function(fn, state) {
    return fn(state);
  };

  this.reducer = (function(state = initialState, action) {
    let state1 = state;

    if (Array.isArray(action)) {
      let s = state;
      action.forEach(a => {
        s = this.reducer(s, a);
      }, this);

      return s;
    }

    if (!action || !action.type || action.type.indexOf('@@') === 0) {
      return state;
    }

    let reducer = reducers[action.type];

    if (!reducer) {
      return state;
    }

    let state2 = reducer(state1, action);

    if (state1 === state2) {
      console.log(`after dispatching ${action.type}, state ${state1===state2 ? 'DID' : 'did not'} mutate`);
    }

    return state2;
  }).bind(this);

  let creators = this.create = this.creators = {};
  let reducers = this.reduce = this.reducers = {};
  this
    .setInitialState()
    .setDefs()
    .setPrefix()
  ;

  Object.keys(init || {}).forEach(key => {
    let setterName = 'set' + key[0].toUpperCase() + key.slice(1);
    let setter = this[setterName];
    if (!setter) {
      throw new ReferenceError(`function ${setterName}() not found in ReduxRegistry`);
    }
    setter && setter.call(this, init[key]);
  });

  return this;
}
