'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var ReduxRegister = exports.ReduxRegister = function ReduxRegister(namespace) {
  var _this = this;

  var createWithAutoType = function createWithAutoType(name) {
    return function (creator) {
      return function () {
        return Object.assign({ type: name }, creator.apply(undefined, arguments));
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
  this.defs = [];

  var initialState = {};
  this._namespace = namespace;

  this.setInitialState = function () {
    var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    initialState = state;
    this.state = state;

    return this;
  };

  this.setNamespace = function (name) {
    _this._namespace = name;

    return _this;
  };

  this.add = function (def) {
    var _this2 = this;

    if (Array.isArray(def)) {
      def.forEach(function (d) {
        return _this2.add(d);
      });
    } else {
      if ((typeof def === 'undefined' ? 'undefined' : _typeof(def)) !== 'object') {
        throw new Error('ReduxRegistry: .add() requires an object definition');
      }

      if (!def.reduce) {
        throw new Error('ReduxRegistry: .add(def = {}) ... requires a "reduce" function attribute');
      }

      if (typeof def.reduce !== 'function') {
        throw new Error('ReduxRegistry: .add(def = {}) ... "reduce" attribute must be a function');
      }

      if (!def.name) {
        throw new Error('ReduxRegistry: .add(def = {}) ... requires a "name" attribute');
      }

      if (typeof def.name !== 'string') {
        throw new Error('ReduxRegistry: .add(def = {}) ... "name" attribute must be a string');
      }

      if (!this._namespace) {
        throw new Error('ReduxRegistry: .add(def = {}) ... namespace should be defined using constructor(namespace) or .setNamespace(namespace) function');
      }

      def.namespacedName = namespacedName(this._namespace)(def.name);

      // create default action creator
      if (!def.create) {
        def.create = function (value) {
          return { value: value };
        };
      }

      // action creators get auto-typed
      def.create = createWithAutoType(def.namespacedName)(def.create);

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
    }

    return this;
  };

  this.create = function (name) {
    if (!name || typeof name !== 'string') {
      throw new Error('ReduxRegister: .create(name)(args) ... invalid definition "name"');
    }

    var creator = _this.creators[name];

    if (!creator) {
      throw new Error('ReduxRegister: .create(name)(args) ... definition "' + name + '" not found');
    }

    return function () {
      return creator.apply(undefined, arguments);
    };
  };

  this.reduce = function (state, action) {
    if (!action || (typeof action === 'undefined' ? 'undefined' : _typeof(action)) !== 'object') {
      throw new Error('ReduxRegister: .reduce(state, action) ... "action" should be an action object');
    }

    if (!action.type || typeof action.type !== 'string') {
      throw new Error('ReduxRegister: .reduce(state, action) ... "action" should have a valid "type" (string) attribute');
    }

    var def = _this.get(action.type);

    if (!def) {
      throw new Error('ReduxRegister: .reduce(state, action) ... action "' + action.type + '" could not be resolved');
    }

    return def.reduce(state, action);
  };

  this.remove = function (name) {
    var _this3 = this;

    if (Array.isArray(name)) {
      name.forEach(function (n) {
        return _this3.remove(n);
      });
    } else {
      (function () {
        if (typeof name !== 'string') {
          throw new Error('ReduxRegistry: .remove(name) ... "name" should be a string');
        }

        // remove from definitions
        var match = _this3.defs.find(function (d) {
          return d.name === name;
        });

        if (!match) {
          throw new Error('ReduxRegistry: .remove(name) ... cannot find definition "' + name + '" in definitions');
        }

        _this3.defs = _this3.defs.filter(function (d) {
          return d !== match;
        });
        delete _this3.creators[name];
        delete _this3.reducers[match.namespacedName];
      })();
    }

    return this;
  };

  this.getNames = function () {
    return this.defs.map(function (def) {
      return def.name;
    });
  };

  this.getNamespace = function () {
    return this._namespace;
  };

  this.get = function (name) {
    if (!name || typeof name !== 'string') {
      throw new Error('ReduxRegister: .get(definitionName)(args) ... invalid definition name (must be a string)');
    }

    return this.defs.find(function (def) {
      return def.name === name || def.namespacedName === name;
    });
  };

  this.deserializeState = function (fn, state) {
    return fn(state);
  };

  this.reducer = function () {
    var _this4 = this;

    var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
    var action = arguments[1];

    var state1 = state;

    if (Array.isArray(action)) {
      var _ret2 = function () {
        var s = state;
        action.forEach(function (a) {
          s = _this4.reducer(s, a);
        }, _this4);

        return {
          v: s
        };
      }();

      if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
    }

    if (!action || !action.type || action.type.indexOf('@@') === 0) {
      return state;
    }

    var reducer = this.reducers[action.type];

    if (!reducer) {
      return state;
    }

    var state2 = reducer(state1, action);

    return state2;
  }.bind(this);

  return this.setInitialState();
};

var ReduxRegistry = exports.ReduxRegistry = function ReduxRegistry() {
  var _this5 = this;

  // INTERNAL REFERENCES TO BE SET VIA .setConnect() and .setBindActionCreators()
  var _bindActionCreators = function _bindActionCreators() {};
  var _connect = function _connect() {};

  // EXPOSED FOR EXPORTING
  this.registers = {};
  this.creators = {};
  this.reducers = {};

  // NEW METHOD TO CONNECT NAMED PROPS TO STATE VALUES/BRANCHES
  this.connectedProps = function () {
    var propsMap = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    if ((typeof propsMap === 'undefined' ? 'undefined' : _typeof(propsMap)) !== 'object') {
      throw Error('ReduxRegistry: .connectedProps(propsMap) requires a propsMap object');
    }

    return function (state) {
      return Object.keys(propsMap).reduce(function (map, key) {
        map[key] = state.getIn(propsMap[key].split('.'));

        return map;
      }, {});
    };
  };

  // NEW METHOD TO CONNECT NAMED PROPS TO ACTION DISPATCHERS
  this.connectedDispatchers = function () {
    var creatorsMap = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    if ((typeof creatorsMap === 'undefined' ? 'undefined' : _typeof(creatorsMap)) !== 'object') {
      throw Error('ReduxRegistry: .connectedDispatchers(creatorsMap) requires a creatorsMap object');
    }

    return function (dispatch) {
      return Object.keys(creatorsMap).reduce(function (map, key) {
        var actionRefs = creatorsMap[key].split('.');
        var actionName = actionRefs && actionRefs.length > 1 ? actionRefs[1] : actionRefs[0];
        var branch = _this5.creators[actionRefs[0]];

        if (!branch) {
          throw Error('ReduxRegistry: could not find action branch named "' + actionRefs[0] + '".  Are you sure you spelled that correctly?');
        }
        var dispatchers = _bindActionCreators(branch, dispatch);

        map[key] = actionRefs.length > 1 ? dispatchers[actionName] : dispatchers;

        return map;
      }, {});
    };
  };

  // CONNECTS REACT COMPONENT (param1) PROPS TO OBJECT MAP OF PROPS/DISPATCHERS (param2)
  this.connect = function (map) {
    if (!map.props && !map.dispatchers) {
      throw Error('ReduxRegistry: .connect(map) ... map requires either "props" or "dispatchers" defined');
    }

    if (map.props && _typeof(map.props) !== 'object') {
      throw Error('ReduxRegistry: .connect(map) ... "props" attribute of map must be an object');
    }

    if (map.dispatchers && _typeof(map.dispatchers) !== 'object') {
      throw Error('ReduxRegistry: .connect(map) ... "dispatchers" attribute of map must be an object');
    }

    return function (component) {
      return _connect(_this5.connectedProps(map.props), _this5.connectedDispatchers(map.dispatchers))(component);
    };
  };

  this.setConnect = function (fn) {
    if (typeof fn !== 'function') {
      throw Error('ReduxRegistry: .setConnect(connect) requires a "connect" function from "react-redux"');
    }

    _connect = fn;
    return _this5;
  };

  this.setBindActionCreators = function (fn) {
    if (typeof fn !== 'function') {
      throw Error('ReduxRegistry: .setBindActionCreators(bindActionCreators) requires a "bindActionCreators" function from "redux"');
    }

    _bindActionCreators = fn;
    return _this5;
  };

  this.add = function (register) {
    if (Array.isArray(register)) {
      register.forEach(function (r) {
        return _this5.add(r);
      });
    } else {
      var registers = _this5.registers;
      var reducers = _this5.reducers;
      var creators = _this5.creators;


      var namespace = register.getNamespace();

      if (!namespace) {
        throw Error('ReduxRegistry: .add(register) ... register does not have a name');
      }

      registers[namespace] = register;
      creators[namespace] = register.creators;
      reducers[namespace] = register.reducer;
    }

    return _this5;
  };

  // sugar method for this.get(registerName).create(actionName)
  this.create = function (registerName) {
    return _this5.get(registerName).create;
  }; // returns regiter's action creator

  this.get = function (registerName) {
    if (!registerName || typeof registerName !== 'string') {
      throw new Error('ReduxRegister: .get(registerName) ... invalid definition "registerName"');
    }

    var register = _this5.registers[registerName];

    if (!register) {
      throw new Error('ReduxRegister: .get(registerName) ... register "' + registerName + '" not found');
    }

    return register;
  };

  this.getRegisterFromAction = function (action) {
    if (!action || (typeof action === 'undefined' ? 'undefined' : _typeof(action)) !== 'object' || !action.type || typeof action.type !== 'string') {
      throw new Error('ReduxRegistry: .getRegisterFromAction(action) ... invalid action', action);
    }

    var namespace = action.type.split(':');

    if (namespace.length < 2) {
      throw new Error('ReduxRegistry: .getRegisterFromAction(action) ... invalid action namespace', action.type);
    }

    return _this5.get(namespace[0]);
  };

  this.reduce = function (state, action) {
    return _this5.getRegisterFromAction(action).reduce(state, action);
  };

  this.remove = function (namespace) {
    if (Array.isArray(namespace)) {
      namespace.forEach(function (n) {
        return _this5.remove(n);
      });
    } else {
      if (typeof namespace !== 'string') {
        throw Error('ReduxRegistry: .remove(name) ... requires a register "name" to successfully remove');
      }

      var registers = _this5.registers;
      var reducers = _this5.reducers;
      var creators = _this5.creators;


      if (!registers[namespace]) {
        throw Error('ReduxRegistry: .remove("' + namespace + '") ... register with namespace "' + namespace + '" not found');
      }

      delete registers[namespace];
      delete creators[namespace];
      delete reducers[namespace];
    }

    return _this5;
  };

  return this;
};

var globalRegistry = new ReduxRegistry();

var connect = exports.connect = globalRegistry.connect;
exports.default = globalRegistry;