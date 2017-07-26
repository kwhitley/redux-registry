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

  this._bindActionCreators = function () {};
  this._connect = function () {};
  this.registers = {};
  this.actions = {};
  this.reducers = {};

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
        var branch = _this5.getActions()[actionRefs[0]];
        var dispatchers = _this5._bindActionCreators(branch, dispatch);

        map[key] = actionRefs.length > 1 ? dispatchers[actionName] : dispatchers;

        return map;
      }, {});
    };
  };

  // CONNECTS REACT COMPONENT (param1) PROPS TO OBJECT MAP OF PROPS/DISPATCHERS (param2)
  this.connect = function (map) {
    return function (component) {
      return _this5._connect(_this5.connectedProps(map.props), _this5.connectedDispatchers(map.dispatchers))(component);
    };
  };

  this.getReducers = function () {
    return Object.keys(_this5.registers).reduce(function (out, key) {
      out[key] = _this5.registers[key].reducer;
      return out;
    }, {});
  };

  this.getActions = function () {
    return Object.keys(_this5.registers).reduce(function (out, key) {
      out[key] = _this5.registers[key].creators;
      return out;
    }, {});
  };

  this.setConnect = function (fn) {
    if (typeof fn !== 'function' || !fn.name || fn.name !== 'connect') {
      throw Error('ReduxRegistry: .setConnect(connect) requires a "connect" function from "react-redux"');
    }

    _this5._connect = fn;
    return _this5;
  };

  this.setBindActionCreators = function (fn) {
    if (typeof fn !== 'function' || !fn.name || fn.name !== 'bindActionCreators') {
      throw Error('ReduxRegistry: .setBindActionCreators(bindActionCreators) requires a "bindActionCreators" function from "redux"');
    }

    _this5._bindActionCreators = fn;
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
      var actions = _this5.actions;


      var namespace = register.getNamespace();

      if (!namespace) {
        throw Error('ReduxRegistry: .add(register) ... register does not have a name');
      }

      registers[namespace] = register;
      actions[namespace] = register.creators;
      reducers[namespace] = register.reducer;
    }

    return _this5;
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
      var actions = _this5.actions;


      if (!registers[namespace]) {
        throw Error('ReduxRegistry: .remove("' + namespace + '") ... register with namespace "' + namespace + '" not found');
      }

      delete registers[namespace];
      delete actions[namespace];
      delete reducers[namespace];
    }

    return _this5;
  };

  return this;
};

var globalRegistry = new ReduxRegistry();

var connect = exports.connect = globalRegistry.connect;
exports.default = globalRegistry;