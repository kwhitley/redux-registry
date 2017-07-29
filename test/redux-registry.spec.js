import { List, Map, fromJS} from 'immutable'
import { expect} from 'chai'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import GlobalRegistry, { ReduxRegister, ReduxRegistry } from '../src/redux-registry'
import * as testData from './test-data'

describe('class ReduxRegistry', () => {
  let registry = new ReduxRegistry

  it ('shared instance is default export of module', () => {
    expect(GlobalRegistry.constructor.name).to.equal('ReduxRegistry')
  })

  it ('successfully exported as named constant "ReduxRegistry" by module', () => {
    expect(registry.constructor.name).to.equal('ReduxRegistry')
  })

  it ('has no registers by default', () => {
    expect(registry.registers).to.eql({})
  })

  describe('.setConnect(connect)', () => {
    it('is chainable', () => {
      expect(registry.setConnect(connect)).to.eql(registry)
    })

    it('requires a "connect" function from "react-redux"', () => {
      expect(() => { registry.setConnect() }).to.throw()
      expect(() => { registry.setConnect(() => {}) }).to.throw()
      expect(() => { registry.setConnect(connect) }).to.not.throw()
    })
  })

  describe('.setBindActionCreators(bindActionCreators)', () => {
    it('is chainable', () => {
      expect(registry.setBindActionCreators(bindActionCreators)).to.eql(registry)
    })

    it('requires a "bindActionCreators" function from "redux"', () => {
      expect(() => { registry.setBindActionCreators() }).to.throw()
      expect(() => { registry.setBindActionCreators(() => {}) }).to.throw()
      expect(() => { registry.setBindActionCreators(bindActionCreators) }).to.not.throw()
    })
  })

  describe('.add(register or array of registers)', () => {
    it('is chainable', () => {
      let register = new ReduxRegister('pets')
      registry.add(register)

      expect(registry.add(register)).to.eql(registry)
    })

    it('throws exception if invalid register is passed (single)', () => {
      let registry = new ReduxRegistry()
      let register1 = new ReduxRegister()

      expect(() => { registry.add(() => {}) }).to.throw()
      expect(() => { registry.add() }).to.throw()
      expect(() => { registry.add('foo') }).to.throw()
      expect(() => { registry.add(register1) }).to.throw()
    })

    it('throws exception if invalid registers are added (multiple)', () => {
      let registry = new ReduxRegistry()
      let register1 = new ReduxRegister('pets')
      let register2 = new ReduxRegister()

      expect(() => { registry.add([register1, register2]) }).to.throw()
    })

    it('adds a register entry (single)', () => {
      let registry = new ReduxRegistry()
      let register = new ReduxRegister('pets')
      registry.add(register)

      expect(registry.registers.pets.constructor.name).to.equal('ReduxRegister')
    })

    it('adds an action entry (single)', () => {
      let registry = new ReduxRegistry()
      let register = new ReduxRegister('pets')
      registry.add(register)

      expect(typeof registry.creators.pets).to.equal('object')
    })

    it('correctly adds multiple registers, if passed as array (multiple)', () => {
      let register1 = new ReduxRegister('pets')
      let register2 = new ReduxRegister('toys')
      registry.add([register1, register2])

      expect(Object.keys(registry.registers).length).to.equal(2)
    })
  })

  describe('.connect(map)', () => {
    let registry = new ReduxRegistry()
    let register = new ReduxRegister('foo')
    register.add(testData.basicDef)
    registry.add(register)

    it('requires an object with "props" and/or "dispatchers"', () => {
      expect(() => { registry.connect(1) }).to.throw()
      expect(() => { registry.connect({}) }).to.throw()
      expect(() => { registry.connect({ props: 1 }) }).to.throw()
      expect(() => { registry.connect({ props: {} }) }).to.not.throw()
      expect(() => { registry.connect({ dispatchers: 1 }) }).to.throw()
      expect(() => { registry.connect({ dispatchers: {} }) }).to.not.throw()
    })
  })

  describe('.connectedDispatchers(creatorsMap)', () => {
    let registry = new ReduxRegistry()
    let register = new ReduxRegister('foo')
    register.add(testData.basicDef)
    registry.add(register)

    it('requires an object', () => {
      expect(() => { registry.connectedDispatchers(1) }).to.throw()
      expect(() => { registry.connectedDispatchers({}) }).to.not.throw()
    })
  })

  describe('.connectedProps(propsMap)', () => {
    let registry = new ReduxRegistry()
    let register = new ReduxRegister('foo')
    register.add(testData.basicDef)
    registry.add(register)

    it('requires an object', () => {
      expect(() => { registry.connectedProps(1) }).to.throw()
      expect(() => { registry.connectedProps({}) }).to.not.throw()
    })

    it('returns a mapping of the state', () => {
      let state = fromJS({ foo: { bar: 'baz' }})

      expect(registry.connectedProps({ 'test': 'foo.bar' })(state)).to.eql({
        test: 'baz'
      })
    })
  })

  describe('.create(registerName)(actionName)', () => {
    let registry = new ReduxRegistry()
    let register = new ReduxRegister('foo')
    register.add(testData.basicDef)
    registry.add(register)

    it('throws an error if invalid "registerName"', () => {
      expect(() => { registry.create(1) }).to.throw()
      expect(() => { registry.create('food') }).to.throw()
      expect(() => { registry.create('foo') }).to.not.throw()
    })

    it('throws an error if invalid "actionName"', () => {
      expect(() => { registry.create('foo')(1) }).to.throw()
      expect(() => { registry.create('foo')('addTodos') }).to.throw()
      expect(() => { registry.create('foo')('addTodo') }).to.not.throw()
    })

    it('returns an action creator function', () => {
      expect(typeof registry.create('foo')('addTodo')).to.equal('function')
    })

    describe('.create(registryName)(actionName)(...args)', () => {
      it('properly creates an action', () => {
        expect(registry.create('foo')('addTodo')('bar')).to.eql({
          type: 'foo:addTodo',
          text: 'bar'
        })
      })
    })
  })

  describe('.get(registerName)', () => {
    it('throws an error if invalid "registerName" type', () => {
      let register = new ReduxRegister('foo')
      registry.add(register)

      expect(() => { registry.get(1) }).to.throw()
    })

    it('throws an error if "registerName" not found', () => {
      let registry = new ReduxRegistry()
      let register = new ReduxRegister('foo')
      registry.add(register)

      expect(() => { registry.get('foo') }).to.not.throw()
      expect(() => { registry.get('food') }).to.throw()
    })

    it('returns appropriate register', () => {
      let registry = new ReduxRegistry()
      let register = new ReduxRegister('foo')
      registry.add(register)

      expect(registry.get('foo')).to.eql(register)
    })
  })

  describe('.getRegisterFromAction(action)', () => {
    let registry = new ReduxRegistry()
    let register = new ReduxRegister('foo')
    registry.add(register)

    let invalidAction1 = { foo: 1 }
    let invalidAction2 = { type: 'foo' }
    let invalidAction3 = { type: 'food:addTodo' }
    let validAction = { type: 'foo:addTodo' }

    it('throws an error if invalid "action" type', () => {
      expect(() => { registry.getRegisterFromAction(invalidAction1) }).to.throw()
      expect(() => { registry.getRegisterFromAction(invalidAction2) }).to.throw()
      expect(() => { registry.getRegisterFromAction(invalidAction3) }).to.throw()
      expect(() => { registry.getRegisterFromAction(validAction) }).to.not.throw()
    })

    it('successfully returns a register from action object', () => {
      expect(registry.getRegisterFromAction(validAction)).to.eql(register)
    })
  })

  describe('.reduce(state, action)', () => {
    let registry = new ReduxRegistry()
    let register = new ReduxRegister('foo')
    register.add({
      name: 'add',
      reduce: (state, action) => state + action.value
    })
    registry.add(register)

    let invalidAction1 = { foo: 1 }
    let invalidAction2 = { type: 'foo' }
    let invalidAction3 = { type: 'food:addTodo' }
    let validAction = { type: 'foo:add', value: 2 }

    it('throws an error if invalid "action" type', () => {
      expect(() => { registry.reduce(0, invalidAction1) }).to.throw()
      expect(() => { registry.reduce(0, invalidAction2) }).to.throw()
      expect(() => { registry.reduce(0, invalidAction3) }).to.throw()
    })

    it('successfully reduces an action', () => {
      expect(registry.reduce(5, validAction)).to.equal(7)
    })
  })

  describe('.remove(register name or array of register names)', () => {
    it('is chainable', () => {
      let registry = new ReduxRegistry()
      let register = new ReduxRegister('pets')
      registry.add(register)

      expect(registry.add(register)).to.eql(registry)
    })

    it('throws exception if not string or array of strings', () => {
      let registry = new ReduxRegistry()
      let register = new ReduxRegister('foo')
      registry.add(register)

      expect(() => { registry.remove(() => {}) }).to.throw()
      expect(() => { registry.remove() }).to.throw()
      expect(() => { registry.remove('foo') }).to.not.throw()

      registry.add(register)
      expect(() => { registry.remove(['foo']) }).to.not.throw()
    })

    it('throws exception when invalid register name', () => {
      let registry = new ReduxRegistry()
      registry.add(new ReduxRegister('cats'))

      expect(() => { registry.remove('foo') }).to.throw()
      expect(() => { registry.remove('cats') }).to.not.throw()
    })

    it('successfully removes single register', () => {
      let registry = new ReduxRegistry()
      let register1 = new ReduxRegister('cats')
      let register2 = new ReduxRegister('toys')

      expect(Object.keys(registry.registers).length).to.equal(0)

      registry.add(register1)
      expect(Object.keys(registry.registers).length).to.equal(1)

      registry.remove('cats')
      expect(Object.keys(registry.registers).length).to.equal(0)
    })

    it('successfully removes multiple registers', () => {
      let registry = new ReduxRegistry()
      let register1 = new ReduxRegister('cats')
      let register2 = new ReduxRegister('toys')


      expect(Object.keys(registry.registers).length).to.equal(0)

      registry.add(register1)
      registry.add(register2)
      expect(Object.keys(registry.registers).length).to.equal(2)

      registry.remove(['cats', 'toys'])
      expect(Object.keys(registry.registers).length).to.equal(0)
    })
  })
})
