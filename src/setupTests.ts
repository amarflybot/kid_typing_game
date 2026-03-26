import '@testing-library/jest-dom'

class MockOscillatorNode {
  frequency = { value: 0 }
  type: OscillatorType = 'sine'
  connect() {}
  start() {}
  stop() {}
}

class MockGainNode {
  gain = {
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
  }
  connect() {}
}

class MockAudioContext {
  state: AudioContextState = 'running'
  currentTime = 0
  resume = async () => {}
  createOscillator() {
    return new MockOscillatorNode()
  }
  createGain() {
    return new MockGainNode()
  }
  destination = {}
}

if (typeof window !== 'undefined') {
  window.AudioContext = MockAudioContext as unknown as typeof AudioContext
  window.webkitAudioContext = MockAudioContext as unknown as typeof AudioContext
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => window.setTimeout(cb, 0)
  }
}
