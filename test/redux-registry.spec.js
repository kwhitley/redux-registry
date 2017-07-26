import { List, Map, fromJS} from 'immutable'
import { expect} from 'chai'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import GlobalRegistry, { ReduxRegister, ReduxRegistry } from '../src/redux-registry'
import * as testData from './test-data'

describe('class ReduxRegistry', () => {
  it ('shared instance is default export of module', () => {
    expect(GlobalRegistry.constructor.name).to.equal('ReduxRegistry')
  })

  it ('successfully exported as named constant "ReduxRegistry" by module', () => {
    let registery = new ReduxRegistry
    expect(registery.constructor.name).to.equal('ReduxRegistry')
  })

  it ('has no registers by default', () => {
    let registery = new ReduxRegistry
    expect(registery.registers).to.eql({})
  })

  describe('.setConnect(connect)', () => {
    it('is chainable', () => {
      let registry = new ReduxRegistry()

      expect(registry.setConnect(connect)).to.eql(registry)
    })

    it('requires a "connect" function from "react-redux"', () => {
      let registry = new ReduxRegistry()

      expect(() => { registry.setConnect() }).to.throw()
      expect(() => { registry.setConnect(() => {}) }).to.throw()
      expect(() => { registry.setConnect(connect) }).to.not.throw()
    })
  })

  describe('.setBindActionCreators(bindActionCreators)', () => {
    it('is chainable', () => {
      let registry = new ReduxRegistry()

      expect(registry.setBindActionCreators(bindActionCreators)).to.eql(registry)
    })

    it('requires a "bindActionCreators" function from "redux"', () => {
      let registry = new ReduxRegistry()

      expect(() => { registry.setBindActionCreators() }).to.throw()
      expect(() => { registry.setBindActionCreators(() => {}) }).to.throw()
      expect(() => { registry.setBindActionCreators(bindActionCreators) }).to.not.throw()
    })
  })

  describe('.add(register or array of registers)', () => {
    it('is chainable', () => {
      let registry = new ReduxRegistry()
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

      expect(typeof registry.actions.pets).to.equal('object')
    })

    it('correctly adds multiple registers, if passed as array (multiple)', () => {
      let registry = new ReduxRegistry()
      let register1 = new ReduxRegister('pets')
      let register2 = new ReduxRegister('toys')
      registry.add([register1, register2])

      expect(Object.keys(registry.registers).length).to.equal(2)
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

  // registerWithTwoDefs.add(testData.def1)
  // registerWithTwoDefs.add(testData.def2)

  // describe('ReduxRegistry', () => {

  //   it('initialState: property defines initial state', () => {
  //     let register = new ReduxRegistry({
  //       initialState: testData.initialState
  //     })

  //     expect(register.state).to.equal(fromJS({
  //       todos: []
  //     }))
  //   })
  // })

  // describe('add()', () => {
  //   let register = new ReduxRegistry({
  //     initialState: testData.initialState
  //   })

  //   it('adds a definition', () => {
  //     register.add(testData.def1)

  //     expect(register.getNames()).to.have.length(1)
  //   })

  //   it('adds another definition', () => {
  //     register.add(testData.def2)

  //     expect(register.getNames()).to.have.length(2)
  //   })

  //   it('is chainable', () => {
  //     let ref1 = register
  //     let ref2 = register.add(testData.def2)

  //     expect(ref1).to.equal(ref2)
  //   })
  // })

  // describe('get(name)', () => {
  //   let register = registerWithTwoDefs
  //   let def = register.get('ADD_TODO')

  //   it('should fetch definition by name', () => {
  //     expect(def).to.be.ok
  //   })

  //   it('should fetch definition by alias', () => {
  //     expect(register.get('addTodo')).to.be.ok
  //   })

  //   it('definition should have name attribute embedded', () => {
  //     expect(register.get('addTodo').name).to.be.ok
  //   })
  // })

  // describe('remove()', () => {
  //   it('is chainable', () => {
  //     let register = new ReduxRegistry
  //     register.add(testData.def1)
  //     let ref1 = register
  //     let ref2 = register.remove('ADD_TODO')

  //     expect(ref1).to.equal(ref2)
  //   })

  //   it('works with remove(name)', () => {
  //     let register = new ReduxRegistry
  //     register.add(testData.def1).add(testData.def2)
  //     register.remove('ADD_TODO')

  //     expect(register.defs).to.have.length(1)
  //   })

  //   it('works with remove(alias)', () => {
  //     let register = new ReduxRegistry
  //     register.add(testData.def1).add(testData.def2)
  //     register.remove('addTodo')

  //     expect(register.defs).to.have.length(1)
  //   })

  //   it('works with get(name).remove() reference', () => {
  //     let register = new ReduxRegistry
  //     register.add(testData.def1).add(testData.def2)
  //     register.get('ADD_TODO').remove()

  //     expect(register.defs).to.have.length(1)
  //   })

  //   it('removes creator function from .create/.creators', () => {
  //     let register = new ReduxRegistry
  //     register.add(testData.def1).add(testData.def2)
  //     register.remove('addTodo')

  //     expect(Object.keys(register.create)).to.have.length(1)
  //     expect(Object.keys(register.creators)).to.have.length(1)
  //   })

  //   it('removes reducer function from .reduce/.reducers', () => {
  //     let register = new ReduxRegistry
  //     register.add(testData.def1).add(testData.def2)
  //     register.remove('TOGGLE_TODO')

  //     expect(Object.keys(register.reduce)).to.have.length(2)
  //     expect(Object.keys(register.reducers)).to.have.length(2)
  //   })

  //   it('throws error if action is not found', () => {
  //     let register = new ReduxRegistry
  //     let fn = function() { register.remove() }

  //     expect(fn).to.throw(ReferenceError)
  //   })
  // })

  // describe('definitions', () => {
  //   let register = registerWithTwoDefs
  //   let def = register.get('ADD_TODO')

  //   it('definition should be added through add(def) function', () => {
  //     expect(register.defs).to.have.length(2)
  //   })

  //   it('definition should include create function', () => {
  //     expect(def.create).to.be.ok
  //   })

  //   it('definition should include reduce function', () => {
  //     expect(def.reduce).to.be.ok
  //   })
  // })

  // describe('.create index', () => {
  //   let register = registerWithTwoDefs

  //   it('is created when definitions are added', () => {
  //     expect(register.create.ADD_TODO).to.be.ok
  //     expect(register.create.TOGGLE_TODO).to.be.ok
  //   })

  //   it('includes aliases in index', () => {
  //     expect(register.create.addTodo).to.be.ok
  //   })

  //   it('action creators work as expected', () => {
  //     var action = register.create.ADD_TODO('foo')
  //     expect(action).to.eql({
  //       type: 'ADD_TODO',
  //       text: 'foo'
  //     })
  //   })
  // })

  // describe('.reduce index', () => {
  //   let register = registerWithTwoDefs

  //   it('is created when definitions are added', () => {
  //     expect(register.reduce.ADD_TODO).to.be.ok
  //     expect(register.reduce.TOGGLE_TODO).to.be.ok
  //   })

  //   it('includes aliases in index', () => {
  //     expect(register.reduce.addTodo).to.be.ok
  //   })
  // })

  // describe('reducer(state, action)', () => {
  //   let register = registerWithTwoDefs

  //   it('returns state if no action given', () => {
  //     expect(register.reducer(1)).to.equal(1)
  //   })

  //   it('returns a default state of {} if not defined through initialState/setInitialState()', () => {
  //     expect(register.reducer()).to.eql({})
  //   })

  //   it('returns initialState as default state (if defined)', () => {
  //     register.setInitialState(testData.initialState)
  //     expect(register.reducer().toJS()).to.eql(testData.initialState.toJS())
  //   })

  //   it('can reduce an action', () => {
  //     let action = register.create.ADD_TODO('foo')
  //     let state = testData.initialState
  //     state = register.reducer(state, action)

  //     expect(state.get('todos').size).to.equal(1)
  //     expect(state.get('todos').toJS()).to.eql([
  //       { index: 0, text: 'foo', completed: false }
  //     ])
  //   })
  // })

  // describe('reducer(state, [actions])', () => {
  //   let register = registerWithTwoDefs
  //   let actions = [
  //     register.create.addTodo('foo'),
  //     register.create.addTodo('bar'),
  //     register.create.TOGGLE_TODO(1)
  //   ]
  //   let state = testData.initialState

  //   it('correctly reduces array of actions', () => {
  //     state = register.reducer(state, actions)
  //     expect(state.get('todos').toJS()).to.eql([
  //       { index: 0, text: 'foo', completed: false },
  //       { index: 1, text: 'bar', completed: true }
  //     ])
  //   })
  // })
})
