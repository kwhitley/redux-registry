'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReduxRegistry = function () {
  function ReduxRegistry() {
    var _this = this;

    var init = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, ReduxRegistry);

    this.create = this.creators = {};
    this.reduce = this.reducers = {};
    this.setInitialState().setDefs().setPrefix();

    Object.keys(init).forEach(function (key) {
      var setterName = 'set' + key[0].toUpperCase() + key.slice(1);
      var setter = _this[setterName];
      if (!setter) {
        throw new ReferenceError('function ' + setterName + '() not found in ReduxFactory');
      }
      setter && setter.call(_this, init[key]);
    });
    return this;
  }

  _createClass(ReduxRegistry, [{
    key: 'setInitialState',
    value: function setInitialState() {
      var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      this.initialState = state;
      this.state = state;
      return this;
    }
  }, {
    key: 'setDefs',
    value: function setDefs() {
      var _this2 = this;

      var defs = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      this.defs = defs;
      defs.forEach(function (def) {
        return _this2.add(def);
      });
      return this;
    }
  }, {
    key: 'setPrefix',
    value: function setPrefix() {
      var prefix = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      this.prefix = prefix;
      return this;
    }
  }, {
    key: 'add',
    value: function add(def) {
      if (!def.create) {
        throw new Error('ReduxFactory: no create() function defined');
      }
      if (!def.reduce) {
        throw new Error('ReduxFactory: no reduce() function defined');
      }
      if (!def.name) {
        var name = def.create() && def.create().type;
        if (!name) {
          throw new Error('ReduxFactory: \'type\' not defined for creator function');
        } else {
          def.name = name;
        }
      }

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
    }
  }, {
    key: 'remove',
    value: function remove(name) {
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
    }
  }, {
    key: 'getNames',
    value: function getNames() {
      return this.defs.map(function (def) {
        return def.name;
      });
    }
  }, {
    key: 'get',
    value: function get(name) {
      return this.defs.find(function (def) {
        return def.name === name || def.alias === name;
      });
    }
  }, {
    key: 'reducer',
    value: function reducer() {
      var state = arguments.length <= 0 || arguments[0] === undefined ? this.initialState : arguments[0];
      var action = arguments[1];

      if (!action || !action.type) {
        return state;
      }

      var reducer = this.reduce[action.type];

      if (!reducer) {
        throw new ReferenceError('ReduxFactory: reducer for \'' + action.type + '\' not defined');
        return state;
      }

      return reducer(state, action);
    }
  }]);

  return ReduxRegistry;
}();

exports.default = ReduxRegistry;