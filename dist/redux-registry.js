'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = ReduxRegistry;
function ReduxRegistry(init) {
  var _this3 = this;

  var initialState = {};

  this.setInitialState = function () {
    var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    initialState = state;
    this.state = state;

    // console.log('this reference from setInitialState()', this);
    return this;
  };

  this.setDefs = function () {
    var _this = this;

    var defs = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    this.defs = defs;
    defs.forEach(function (def) {
      return _this.add(def);
    });
    return this;
  };

  this.setPrefix = function () {
    var prefix = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    this.prefix = prefix;
    return this;
  };

  this.add = function (def) {
    if (!def.create) {
      throw new Error('ReduxRegistry: no create() function defined');
    }
    if (!def.reduce) {
      throw new Error('ReduxRegistry: no reduce() function defined');
    }
    if (!def.name) {
      var name = def.create() && def.create().type;
      if (!name) {
        throw new Error('ReduxRegistry: \'type\' not defined for creator function');
      } else {
        def.name = name;
      }
    };

    // add shorthand .remove() handle
    def.remove = function () {
      this.remove(def.name);
    }.bind(this);

    // add definition
    this.defs.push(def);
    var alias = def.alias || def.name;

    // add action creator reference to .create index
    this.create[def.name] = this.create[alias] = def.create;

    // add reducer reference to .reduce index
    this.reduce[def.name] = this.reduce[alias] = def.reduce;

    return this;
  };

  this.remove = function (name) {
    // remove from definitions
    var match = this.defs.find(function (d) {
      return d.name === name || d.alias === name;
    });

    if (!match) {
      throw new ReferenceError('cannot find \'' + name + '\' to remove');
    }

    this.defs = this.defs.filter(function (d) {
      return d !== match;
    });
    delete this.create[match.name];
    delete this.create[match.alias];
    delete this.reduce[match.name];
    delete this.reduce[match.alias];

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
    var _this2 = this;

    var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
    var action = arguments[1];

    var state1 = state;

    if (Array.isArray(action)) {
      var _ret = function () {
        var s = state;
        action.forEach(function (a) {
          s = _this2.reducer(s, a);
        }, _this2);

        return {
          v: s
        };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }

    if (!action || !action.type || action.type.indexOf('@@') === 0) {
      return state;
    }

    var reducer = reducers[action.type];

    if (!reducer) {
      return state;
    }

    var state2 = reducer(state1, action);

    return state2;
  }.bind(this);

  var creators = this.create = this.creators = {};
  var reducers = this.reduce = this.reducers = {};
  this.setInitialState().setDefs().setPrefix();

  Object.keys(init || {}).forEach(function (key) {
    var setterName = 'set' + key[0].toUpperCase() + key.slice(1);
    var setter = _this3[setterName];
    if (!setter) {
      throw new ReferenceError('function ' + setterName + '() not found in ReduxRegistry');
    }
    setter && setter.call(_this3, init[key]);
  });

  return this;
}