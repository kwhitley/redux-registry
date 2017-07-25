'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var ReduxRegister = exports.ReduxRegister = function ReduxRegister(namespace) {
  var _this = this;

  var createWithAutoType = function createWithAutoType(name) {
    return function (creator) {
      return function (value) {
        return Object.assign({ type: name }, creator(value));
      };
    };
  };
  var namespacedName = function namespacedName(namespace) {
    return function (name) {
      return namespace + ':' + name;
    };
  };

  this.creators = {};
  this.reducers = {};

  console.log('creating register', namespace, this.creators);
  var initialState = {};
  this._namespace = namespace;

  this.setInitialState = function () {
    var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    initialState = state;
    this.state = state;

    // console.log('this reference from setInitialState()', this)
    return this;
  };

  this.setNamespace = function (name) {
    _this._namespace = name;

    return _this;
  };

  this.setDefs = function () {
    var _this2 = this;

    var defs = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    this.defs = defs;
    defs.forEach(function (def) {
      return _this2.add(def);
    });
    return this;
  };

  this.setPrefix = function () {
    var prefix = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    this.prefix = prefix;
    return this;
  };

  this.add = function (def) {
    // if (!def.create) {
    //   throw new Error('ReduxRegistry: no create() function defined')
    // }
    if (!def.reduce) {
      throw new Error('ReduxRegistry: no reduce() function defined');
    }

    // name === alias in register definitions
    def.name = def.name || def.alias;
    def.namespacedName = namespacedName(this._namespace)(def.name);

    // create default action creator
    if (!def.create) {
      def.create = function (value) {
        return { value: value };
      };
    }

    // action creators get auto-typed
    def.create = createWithAutoType(def.namespacedName)(def.create);

    // console.log('creating dummy action', def.create('foo'))

    // add shorthand .remove() handle
    def.remove = function () {
      this.remove(def.name);
    }.bind(this);

    // add definition
    this.defs.push(def);

    // add action creator reference to .create index
    this.creators[def.name] = def.create;

    // add reducer reference to .reduce index
    this.reducers[def.namespacedName] = def.reduce;

    return this;
  };

  this.remove = function (name) {
    // remove from definitions
    var match = this.defs.find(function (d) {
      return d.name === name;
    });

    if (!match) {
      throw new ReferenceError('cannot find \'' + name + '\' to remove');
    }

    this.defs = this.defs.filter(function (d) {
      return d !== match;
    });
    delete this.creators[name];
    delete this.reducers[match.namespacedName];

    return this;
  };

  this.getNames = function () {
    return this.defs.map(function (def) {
      return def.name;
    });
  };

  this.get = function (name) {
    return this.defs.find(function (def) {
      return def.name === name || def.alias === name;
    });
  };

  this.deserializeState = function (fn, state) {
    return fn(state);
  };

  this.reducer = function () {
    var _this3 = this;

    var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
    var action = arguments[1];

    var state1 = state;

    console.log('reducing action', action);
    if (Array.isArray(action)) {
      var _ret = function () {
        var s = state;
        action.forEach(function (a) {
          s = _this3.reducer(s, a);
        }, _this3);

        return {
          v: s
        };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }

    if (!action || !action.type || action.type.indexOf('@@') === 0) {
      return state;
    }

    var reducer = this.reducers[action.type];

    console.log('action.type', action.type);
    console.log('reducer', reducer);

    if (!reducer) {
      return state;
    }

    var state2 = reducer(state1, action);

    return state2;
  }.bind(this);

  this.setInitialState().setDefs().setPrefix();

  return this;
};

var ReduxRegistry = exports.ReduxRegistry = function ReduxRegistry() {
  var _this4 = this;

  // need to be connected or registry will fail
  this._bindActionCreators = function () {};
  this._connect = function () {};
  this.registers = {};

  // NEW METHOD TO CONNECT NAMED PROPS TO STATE VALUES/BRANCHES
  this.connectedProps = function () {
    var propsMap = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    return function (state) {
      return Object.keys(propsMap).reduce(function (map, key) {
        map[key] = state.getIn(propsMap[key].split('.'));

        return map;
      }, {});
    };
  };

  // NEW METHOD TO CONNECT NAMED PROPS TO ACTION DISPATCHERS
  this.connectedDispatchers = function () {
    var actionsMap = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    return function (dispatch) {
      return Object.keys(actionsMap).reduce(function (map, key) {
        var actionRefs = actionsMap[key].split('.');
        var actionName = actionRefs && actionRefs.length > 1 ? actionRefs[1] : actionRefs[0];
        console.log('this.getActions', actionRefs[0], _this4.getActions());
        var branch = _this4.getActions()[actionRefs[0]];
        var dispatchers = _this4._bindActionCreators(branch, dispatch);

        map[key] = actionRefs.length > 1 ? dispatchers[actionName] : dispatchers;

        return map;
      }, {});
    };
  };

  // CONNECTS REACT COMPONENT (param1) PROPS TO OBJECT MAP OF PROPS/DISPATCHERS (param2)
  this.connect = function (map) {
    return function (component) {
      return _this4._connect(_this4.connectedProps(map.props), _this4.connectedDispatchers(map.dispatchers))(component);
    };
  };

  this.getReducers = function () {
    return Object.keys(_this4.registers).reduce(function (out, key) {
      out[key] = _this4.registers[key].reducer;
      return out;
    }, {});
  };

  this.getActions = function () {
    return Object.keys(_this4.registers).reduce(function (out, key) {
      out[key] = _this4.registers[key].creators;
      return out;
    }, {});
  };

  this.setConnect = function (fn) {
    console.log('adding react-redux connect', fn, _this4);
    _this4._connect = fn;
    return _this4;
  };

  this.setBindActionCreators = function (fn) {
    _this4._bindActionCreators = fn;return _this4;
  };

  this.addRegisters = function () {
    var registers = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _this4.registers = registers;
    console.log('this.registers', _this4.registers);

    // embed actions
    _this4.actions = Object.keys(_this4.registers).reduce(function (out, key) {
      out[key] = _this4.registers[key].creators;
      return out;
    }, {});

    // embed reducers
    _this4.reducers = Object.keys(_this4.registers).reduce(function (out, key) {
      out[key] = _this4.registers[key].reducer;
      return out;
    }, {});

    return _this4;
  };

  return this;
};

var globalRegistry = new ReduxRegistry();

var connect = exports.connect = globalRegistry.connect;
exports.default = globalRegistry;