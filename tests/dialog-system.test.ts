import { describe, it, expect, beforeEach } from 'vitest'
import { DialogSystem } from '../src/game/systems/DialogSystem'

describe('DialogSystem - text crawl speed', () => {
  it('SLOW speed: char delay is 80ms', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Hello World'] }], 'SLOW')
    // After 79ms, no chars revealed
    sys.update(79)
    expect(sys.getCharIndex()).toBe(0)
    // After 1 more ms (80 total), 1 char revealed
    sys.update(1)
    expect(sys.getCharIndex()).toBe(1)
  })

  it('NORMAL speed: char delay is 40ms', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Hello'] }], 'NORMAL')
    sys.update(39)
    expect(sys.getCharIndex()).toBe(0)
    sys.update(1)
    expect(sys.getCharIndex()).toBe(1)
  })

  it('FAST speed: char delay is 16ms', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Hello'] }], 'FAST')
    sys.update(15)
    expect(sys.getCharIndex()).toBe(0)
    sys.update(1)
    expect(sys.getCharIndex()).toBe(1)
  })

  it('multiple chars revealed when dt covers multiple intervals', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['ABCDE'] }], 'NORMAL') // 40ms each
    sys.update(120) // 3 chars
    expect(sys.getCharIndex()).toBe(3)
  })
})

describe('DialogSystem - handleConfirm page advance', () => {
  it('skips to end of page on first confirm if not complete', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Hello World'] }])
    // Don't advance time - charIndex=0
    sys.handleConfirm()
    expect(sys.isPageComplete()).toBe(true)
    expect(sys.isActive()).toBe(true) // still on page 1
  })

  it('advances to next page on confirm when page is complete', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Hi'] }, { lines: ['Bye'] }])
    sys.update(1000) // complete page 1
    expect(sys.isPageComplete()).toBe(true)
    sys.handleConfirm()
    expect(sys.getCharIndex()).toBe(0)
    expect(sys.isActive()).toBe(true)
  })

  it('closes dialog after last page confirm', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Hi'] }])
    sys.update(1000)
    sys.handleConfirm()
    expect(sys.isActive()).toBe(false)
  })
})

describe('DialogSystem - choice cursor up/down', () => {
  it('cursor moves down when choices exist', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Pick:'], choices: ['A', 'B', 'C'] }])
    sys.update(1000)
    expect(sys.getChoiceCursor()).toBe(0)
    sys.handleDown()
    expect(sys.getChoiceCursor()).toBe(1)
    sys.handleDown()
    expect(sys.getChoiceCursor()).toBe(2)
  })

  it('cursor does not go below last choice', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Pick:'], choices: ['A', 'B'] }])
    sys.update(1000)
    sys.handleDown()
    sys.handleDown()
    sys.handleDown()
    expect(sys.getChoiceCursor()).toBe(1)
  })

  it('cursor moves up', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Pick:'], choices: ['A', 'B', 'C'] }])
    sys.update(1000)
    sys.handleDown()
    sys.handleDown()
    sys.handleUp()
    expect(sys.getChoiceCursor()).toBe(1)
  })

  it('cursor does not go above 0', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Pick:'], choices: ['A', 'B'] }])
    sys.update(1000)
    sys.handleUp()
    expect(sys.getChoiceCursor()).toBe(0)
  })
})

describe('DialogSystem - name entry', () => {
  it('adds characters to currentName', () => {
    const sys = new DialogSystem()
    sys.startNameEntry('player', '', () => {})
    sys.nameAddChar('R')
    sys.nameAddChar('E')
    sys.nameAddChar('D')
    expect(sys.currentName).toBe('RED')
  })

  it('deletes last character', () => {
    const sys = new DialogSystem()
    sys.startNameEntry('player', 'RED', () => {})
    sys.nameDeleteChar()
    expect(sys.currentName).toBe('RE')
  })

  it('does not exceed max name length (7)', () => {
    const sys = new DialogSystem()
    sys.startNameEntry('player', '', () => {})
    for (let i = 0; i < 10; i++) sys.nameAddChar('A')
    expect(sys.currentName.length).toBe(7)
  })

  it('confirm calls onConfirm with name and deactivates', () => {
    let confirmedName = ''
    const sys = new DialogSystem()
    sys.startNameEntry('rival', 'BLUE', (name) => { confirmedName = name })
    sys.nameAddChar('S') // BLUES would be > max, test with BLUE
    // Actually currentName = 'BLUE' + 'S' = 'BLUES'
    sys.handleConfirm()
    expect(confirmedName).toBe('BLUES')
    expect(sys.isActive()).toBe(false)
  })

  it('empty name does not confirm', () => {
    let called = false
    const sys = new DialogSystem()
    sys.startNameEntry('player', '', () => { called = true })
    sys.handleConfirm()
    expect(called).toBe(false)
    expect(sys.isActive()).toBe(true)
  })
})

describe('DialogSystem - isActive lifecycle', () => {
  it('is not active initially', () => {
    const sys = new DialogSystem()
    expect(sys.isActive()).toBe(false)
  })

  it('becomes active after startDialog', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Hi'] }])
    expect(sys.isActive()).toBe(true)
  })

  it('becomes inactive after all pages confirmed', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Hi'] }])
    sys.update(1000)
    sys.handleConfirm()
    expect(sys.isActive()).toBe(false)
  })

  it('reset clears state', () => {
    const sys = new DialogSystem()
    sys.startDialog([{ lines: ['Hi'] }])
    sys.reset()
    expect(sys.isActive()).toBe(false)
    expect(sys.getCharIndex()).toBe(0)
  })
})
