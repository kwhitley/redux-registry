import { List, Map, fromJS} from 'immutable'
import { expect} from 'chai'

import GlobalRegistry, { ReduxRegister, ReduxRegistry } from '../src/redux-registry'
import * as testData from './test-data'

describe('class ReduxRegister', () => {
  it ('successfully exported as named constant "ReduxRegister" by module', () => {
    let register = new ReduxRegister
    expect(register.constructor.name).to.equal('ReduxRegister')
  })
  let defaultRegister = new ReduxRegister('name')

  describe('constructor', () => {
    it('returns ReduxRegister instance', () => {
      expect(defaultRegister.constructor.name).to.equal('ReduxRegister')
    })

    it('accepts a namespace (string)', () => {
      expect(defaultRegister._namespace).to.equal('name')
    })

    it('sets an initial state of {}', () => {
      expect(defaultRegister.state).to.eql({})
    })

    it('has no initial definitions', () => {
      expect(defaultRegister.defs).to.eql([])
    })
  })

  describe('.setInitialState(state)', () => {
    it('is chainable', () => {
      let register = new ReduxRegister('name')
      register.setInitialState([])

      expect(register.setInitialState([])).to.eql(register)
    })

    it('sets internal state', () => {
      let register = new ReduxRegister('name')
      register.setInitialState([])

      expect(register.state).to.eql([])
    })
  })

  describe('.setNamespace(name)', () => {
    it('is chainable', () => {
      let register = new ReduxRegister()

      expect(register.setNamespace('foo')).to.eql(register)
    })

    it('sets internal namespace', () => {
      let register = new ReduxRegister('foo')
      expect(register._namespace).to.equal('foo')

      register.setNamespace('food')
      expect(register._namespace).to.equal('food')
    })
  })

  describe('.add(definition)', () => {
    it('is chainable', () => {
      let register = new ReduxRegister('foo')

      expect(register.add(testData.basicDef)).to.eql(register)
    })

    it('requires an object definition', () => {
      let register = new ReduxRegister('foo')

      expect(() => { register.add('foo') }).to.throw()
    })

    it('requires a "reducer" attribute (that must be a function)', () => {
      let register = new ReduxRegister('foo')

      expect(() => { register.add({}) }).to.throw()
      expect(() => { register.add({ name: 'foo', reduce: 'foo' }) }).to.throw()
      expect(() => { register.add({ name: 'foo', reduce: () => {} }) }).to.not.throw()
    })

    it('requires a "name" or "alias" attribute', () => {
      let register = new ReduxRegister('foo')

      expect(() => { register.add({ reducer: () => {}}) }).to.throw()
    })

    it('requires internal namespace to be set first', () => {
      let register = new ReduxRegister()

      // will throw
      expect(() => { register.add(testData.basicDef) }).to.throw()

      // will not
      register.setNamespace('foo')
      expect(() => { register.add(testData.basicDef) }).to.not.throw()
    })

    it('adds only one register definition', () => {
      let register = new ReduxRegister('foo')

      register.add(testData.basicDef)
      expect(register.defs.length).to.equal(1)
    })

    it('creates a default action if none is defined', () => {
      let register = new ReduxRegister('foo')
      let def = testData.defWithoutCreate

      register.add(def)
      let creator = register.create(def.name)

      expect(typeof creator).to.equal('function')
    })

    it('automatically creates a useable action creator', () => {
      let register = new ReduxRegister('foo')
      let def = testData.defWithoutCreate

      register.add(def)
      let creator = register.create(def.name)

      expect(creator(1)).to.eql({
        type: `foo:${def.name}`,
        value: 1
      })
    })

    it('allows for custom action creators', () => {
      let register = new ReduxRegister('foo')
      let def = testData.complexActionDef

      register.add(def)
      let creator = register.create(def.name)

      expect(creator('foo', 'bar', 'baz')).to.eql({
        type: `foo:${def.name}`,
        a: 'foo',
        b: 'bar',
        c: 'baz',
      })
    })

    it('accepts array of definitions', () => {
      let register = new ReduxRegister('foo')
      let def1 = testData.basicDef
      let def2 = testData.defWithoutCreate

      register.add([ def1, def2 ])

      expect(register.getNames().length).to.equal(2)
    })
  })

  describe('.create(name)', () => {
    it('throws exception if name is not valid', () => {
      let register = new ReduxRegister('foo')
      register.add({ name: 'cat', reduce: () => {} })

      expect(() => { register.create({ fake: true }) }).to.throw()
    })

    it('throws exception if name mismatch', () => {
      let register = new ReduxRegister('foo')
      register.add({ name: 'cat', reduce: () => {} })

      expect(() => { register.create('dog') }).to.throw()
    })

    it('returns an action creator function', () => {
      let register = new ReduxRegister('foo')
      register.add({ name: 'cat', reduce: () => {} })

      expect(typeof register.create('cat')).to.equal('function')
    })
  })

  describe('.create(name)(...args)', () => {
    it('successfully creates action object from args', () => {
      let register = new ReduxRegister('foo')
      register.add({ name: 'cat', create: (a,b) => ({ a, b }), reduce: () => {} })

      expect(register.create('cat')('mittens', 'fuzz')).to.eql({
        type: `foo:cat`,
        a: 'mittens',
        b: 'fuzz'
      })
    })
  })

  describe('.get(definitionName)', () => {
    it('throws an error if invalid "definitionName" type', () => {
      let register = new ReduxRegister('foo')

      expect(() => { register.get(1) }).to.throw()
      expect(() => { register.get('foo') }).to.not.throw()
    })

    it('returns undefined if not found', () => {
      let register = new ReduxRegister('foo')

      expect(register.get('missing')).to.equal(undefined)
    })

    it('returns valid definition object if found', () => {
      let register = new ReduxRegister('foo')

      register.add({ name: 'bar', reduce: () => {} })

      expect(register.get('bar').name).to.equal('bar')
      expect(register.get('bar').namespacedName).to.equal('foo:bar')
      expect(typeof register.get('bar').create).to.equal('function')
      expect(typeof register.get('bar').reduce).to.equal('function')
    })

    it('can find by name (e.g. "bar") or namespaced name (e.g. "foo:bar")', () => {
      let register = new ReduxRegister('foo')

      register.add({ name: 'bar', reduce: () => {} })

      expect(typeof register.get('bar')).to.equal('object')
      expect(typeof register.get('foo:bar')).to.equal('object')
    })
  })

  describe('.getNamespace()', () => {
    it('returns undefined if no namespace set', () => {
      let register = new ReduxRegister()

      expect(register.getNamespace()).to.equal(undefined)
    })

    it('returns a register namespace if set', () => {
      let register = new ReduxRegister('foo')

      expect(register.getNamespace()).to.equal('foo')
    })
  })

  describe('.getNames()', () => {
    it('returns an empty array if no registered defintions', () => {
      let register = new ReduxRegister('foo')

      expect(register.getNames()).to.eql([])
    })

    it('returns an array of definition names (e.g. ["cat", "dog"])', () => {
      let register = new ReduxRegister('foo')

      register.add({ name: 'cat', reduce: () => {} })
              .add({ name: 'dog', reduce: () => {} })

      expect(register.getNames()).to.eql(['cat', 'dog'])
    })
  })

  describe('.reduce(state, action)', () => {
    it('throws error if not valid "action" object', () => {
      let register = new ReduxRegister('foo')

      register.add({ name: 'cat', reduce: () => {} })

      expect(() => { register.reduce(false, true) }).to.throw()
      expect(() => { register.reduce(false, {}) }).to.throw()
      expect(() => { register.reduce(false, 'string') }).to.throw()
    })

    it('throws error if definition not found from action "type"', () => {
      let register = new ReduxRegister('foo')

      register.add({ name: 'cat', reduce: () => {} })

      expect(() => { register.reduce(false, { type: 'foo:dog' }) }).to.throw()
      expect(() => { register.reduce(false, { type: 'foo:cat' }) }).to.not.throw()
    })

    it('successfully reduces action on state', () => {
      let register = new ReduxRegister('foo')

      register
        .add({ name: 'push', reduce: (state, action) => state.push(action.value) })

      expect(() => { register.reduce({}, { type: 'push', value: 1 }) }).to.throw()
      expect(register.reduce(List(), { type: 'push', value: 1 })).to.eql(List([1]))
      expect(register.reduce(List([1]), { type: 'push', value: 5 })).to.eql(List([1, 5]))
    })
  })

  describe('.remove(name)', () => {
    it('is chainable', () => {
      let register = new ReduxRegister('foo')

      register.add({ name: 'cat', reduce: () => {} })

      expect(register.remove('cat')).to.eql(register)
    })

    it('throws errors if not a string, or if register not found', () => {
      let register = new ReduxRegister('foo')

      register.add({ name: 'cat', reduce: () => {} })

      expect(() => { register.remove() }).to.throw()
      expect(() => { register.remove('foo') }).to.throw()
      expect(() => { register.remove('cat') }).to.not.throw()
    })

    it('successfully removes a definition without affecting others', () => {
      let register = new ReduxRegister('foo')

      register.add({ name: 'cat', reduce: () => {} })
              .add({ name: 'dog', reduce: () => {} })
              .remove('cat')

      expect(register.get('cat')).to.equal(undefined)
      expect(typeof register.get('dog')).to.equal('object')
      expect(register.getNames()).to.eql(['dog'])
    })

    it('successfully removes multiple definitions from array of names', () => {
      let register = new ReduxRegister('foo')

      register.add({ name: 'cat', reduce: () => {} })
              .add({ name: 'dog', reduce: () => {} })

      expect(register.getNames().length).to.equal(2)
      register.remove(['cat', 'dog'])
      expect(register.getNames().length).to.equal(0)
    })
  })
})
