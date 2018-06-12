import React, { Component } from "react";
import * as Tone from "tone";
import logo from "./logo.svg";
import "./App.css";
const EQUALIZER_CENTER_FREQUENCIES = [
  100,
  125,
  160,
  200,
  250,
  315,
  400,
  500,
  630,
  800,
  1000,
  1250,
  1600,
  2000,
  2500,
  3150,
  4000,
  5000,
  6300,
  8000,
  10000
];
function createSynth() {
  const envelope = {
    attack: 0.1,
    release: 4,
    releaseCurve: "linear"
  };
  const filterEnvelope = {
    baseFrequency: 160,
    octaves: 2,
    attack: 0,
    decay: 0,
    release: 1000
  };
  const voice0 = {
    oscillator: {
      type: "sawtooth"
    },
    envelope,
    filterEnvelope
  };

  const voice1 = {
    oscillator: {
      type: "sine"
    },
    envelope,
    filterEnvelope
  };

  return new Tone.DuoSynth({
    harmonicity: 1,
    vibratoRate: 0.5,
    vibratoAmount: 0.1,
    voice0,
    voice1,
    volume: -20
  });
}
function initializeSynths() {
  const equalizer = EQUALIZER_CENTER_FREQUENCIES.map(frequency => {
    const filter = Tone.context.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = frequency;
    filter.Q.value = 4.31;
    filter.gain.value = 0;
    return filter;
  });
  const leftSynth = createSynth();
  const rightSynth = createSynth();
  const leftPanner = new Tone.Panner(-0.5).toMaster();
  const rightPanner = new Tone.Panner(0.5).toMaster();
  const echo = new Tone.FeedbackDelay("16n", 0.2);
  const delay = Tone.context.createDelay(6.0);
  const delayFade = Tone.context.createGain();
  delay.delayTime.value = 6.0;
  delayFade.gain.value = 0.75;
  leftSynth.connect(leftPanner);
  rightSynth.connect(rightPanner);
  leftPanner.connect(equalizer[0]);
  rightPanner.connect(equalizer[0]);
  equalizer.forEach((equalizerBand, index) => {
    if (index < equalizer.length - 1) {
      equalizerBand.connect(equalizer[index + 1]);
    } else {
      equalizerBand.connect(echo);
    }
  });
  echo.toMaster();
  echo.connect(delay);
  delay.connect(Tone.context.destination);
  delay.connect(delayFade);
  delayFade.connect(delay);
  return {
    equalizer,
    leftSynth,
    rightSynth
  };
}

const { leftSynth, rightSynth, equalizer } = initializeSynths();
class App extends Component {
  constructor(props) {
    super(props);
    const TONES = ["C", "D", "E", "G", "A", "B"];
    const getNote = (note, octave) => `${TONES[note]}${octave}`;
    this.state = {
      loop1: new Tone.Loop(time => {
        leftSynth.triggerAttackRelease(getNote(0, 5), "1:2", time);
        leftSynth.setNote(getNote(1, 5), "+0:2");
        leftSynth.triggerAttackRelease(getNote(2, 5), "0:2", "+6:0");
        leftSynth.triggerAttackRelease(getNote(3, 4), "0:2", "+11:2");
        leftSynth.triggerAttackRelease(getNote(2, 5), "2:0", "+19:0");
        leftSynth.setNote(getNote(3, 5), "+19:1:2");
        leftSynth.setNote(getNote(4, 5), "+19:3:0");
        leftSynth.setNote(getNote(3, 5), "+19:2:2");
      }, "34m"),
      loop2: new Tone.Loop(time => {
        rightSynth.triggerAttackRelease(getNote(1, 4), "1:2", "+5:0");
        rightSynth.setNote(getNote(2, 4), "+6:0");
        rightSynth.triggerAttackRelease(getNote(5, 3), "1m", "+11:2:2");
        rightSynth.setNote(getNote(3, 3), "+12:0:2");
        rightSynth.triggerAttackRelease(getNote(3, 4), "0:2", "+23:2");
      }, "37m"),
      playing: false
    };
  }
  clickButton() {
    if (!this.state.playing) {
      this.state.loop1.start();
      this.state.loop2.start();
      Tone.Transport.start();
      this.setState({ playing: true });
    } else {
      this.state.loop1.stop();
      this.state.loop2.stop();
      Tone.Transport.stop();
      this.setState({ playing: false });
    }
  }
  updateEq(e, i) {
    equalizer[i].gain.value = +e;
  }
  render() {
    const sliders = EQUALIZER_CENTER_FREQUENCIES.map((eq, i) => {
      const labelText = eq >= 1000 ? `${eq / 1000}K` : eq;
      return (
        <div key={i}>
          <label>{`${labelText}`}</label>
          <input
            onChange={e => this.updateEq(e.target.value, i)}
            type="range"
            defaultValue={0}
            min={-12}
            max={12}
            step={0.1}
          />
        </div>
      );
    });
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Music</h2>
        </div>
        <button onClick={this.clickButton.bind(this)}>Play sound</button>
        {sliders}
      </div>
    );
  }
}

export default App;
