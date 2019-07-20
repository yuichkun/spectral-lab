import { Model } from '@vuex-orm/core';
import {
  NOTE_ON, NOTE_OFF, MODULATION,
  NOTE, SPECTROGRAM, AUDIO_BUFFER, CLIP,
  TRACK, SONG, APP
} from '../constants/model-types';
import { makeMandatory } from './utils';
import { bpm, beatsInBar, ticksPerBeat } from '../constants/defaults';
import { SELECT } from '../constants/mouse-modes';
import { pick, random, sum } from 'lodash';
import { SCALE_COLORS } from '../constants/colors';

class BaseModel extends Model {
  get path () {
    if (!this.parent) return [this];
    return [...this.parent.path, this];
  }
  get absoluteTime () {
    const offsetTimes = this.path.map(modelInstance => {
      const offset = modelInstance.offsetTime;
      return offset == null ? 0 : offset;
    });
    return sum(offsetTimes);
  }
}

export class NoteOn extends BaseModel {
  static entity = 'noteOns';

  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      noteId: this.attr(null),
      type: this.string(NOTE_ON),
      noteOnVelocity: this.number(0.5), // from 0.0 to 1.0.
      pitchBend: this.number(0), // in midi note number. Negative float is acceptable.
      timbre: this.number(0.5), // from 0.0 to 1.0.
      pressure: this.number(0.5), // from 0.0 to 1.0.
      selected: this.boolean(false)
    };
  }
  get parent () {
    return Note.find(this.noteId);
  }
}

export class Modulation extends BaseModel {
  static entity = 'modulations';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      noteId: this.attr(null),
      type: this.string(MODULATION),
      offsetTime: this.number(1), // in tick
      pitchBend: this.number(null).nullable(), // in midi note number. Negative float is acceptable.
      pressure: this.number(null).nullable(), // from 0.0 to 1.0.
      timbre: this.number(null).nullable(), // from 0.0 to 1.0.
      selected: this.boolean(false)
    };
  }
  get parent () {
    return Note.find(this.noteId);
  }
}

export class NoteOff extends BaseModel {
  static entity = 'noteOffs';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      noteId: this.attr(null),
      type: this.string(NOTE_OFF),
      offsetTime: this.number(1), // in tick
      noteOffVelocity: this.number(0),
      pitchBend: this.number(null).nullable(), // in midi note number. Negative float is acceptable.
      pressure: this.number(null).nullable(), // from 0.0 to 1.0.
      timbre: this.number(null).nullable(), // from 0.0 to 1.0.
      selected: this.boolean(false)
    };
  }
  get parent () {
    return Note.find(this.noteId);
  }
}

export class Note extends BaseModel {
  static entity = 'notes';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(NOTE),
      clipId: this.attr(null, makeMandatory('clipId')),
      noteNumber: this.number(60),
      offsetTime: this.number(0), // in tick
      noteOn: this.hasOne(NoteOn, 'noteId'),
      noteOff: this.hasOne(NoteOff, 'noteId'),
      modulations: this.hasMany(Modulation, 'noteId'),
      selected: this.boolean(false)
    };
  }
  get noteActions () {
    return [
      this.noteOn,
      ...this.modulations,
      this.noteOff
    ];
  }
  get pitchTransition () {
    const pitchBendMods = this.modulations.filter(mod => mod.pitchBend !== null);
    const isEmpty = pitchBendMods.length === 0;
    const lastPitchBend = isEmpty ? this.noteOn.pitchBend : pitchBendMods[pitchBendMods.length - 1].pitchBend;
    return [
      {
        offsetTime: this.offsetTime,
        pitch: this.noteNumber + this.noteOn.pitchBend,
        ...pick(this.noteOn, ['id', 'type'])
      },
      ...pitchBendMods.map(modulation => ({
        offsetTime: this.offsetTime + modulation.offsetTime,
        pitch: this.noteNumber + modulation.pitchBend,
        ...pick(modulation, ['id', 'type'])
      })),
      this.noteOff && {
        offsetTime: this.offsetTime + this.noteOff.offsetTime,
        pitch: this.noteNumber + lastPitchBend,
        ...pick(this.noteOff, ['id', 'type'])
      }
    ].filter(v => v);
  }
  get parent () {
    return Clip.find(this.clipId);
  }
}

export class AudioBuffer extends BaseModel {
  static entity = 'audioBuffers';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(AUDIO_BUFFER),
      clipId: this.attr(null, makeMandatory('clipId')),
      offsetTime: this.number(0),
      data: this.attr(null),
      originalFilePath: this.string(''),
      spectrogram: this.hasOne(Spectrogram, 'audioBufferId')
    };
  }
  get parent () {
    return Clip.find(this.clipId);
  }
}

export class Spectrogram extends BaseModel {
  static entity = 'spectrograms';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(SPECTROGRAM),
      audioBufferId: this.attr(null),
      times: this.attr([]),
      freqs: this.attr([]),
      magnitude2d: this.attr([[]])
    };
  }
  get parent () {
    return AudioBuffer.find(this.audioBufferId);
  }
}

export class Clip extends BaseModel {
  static entity = 'clips';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(CLIP),
      offsetTime: this.number(0), // in tick
      duration: this.number(4 * beatsInBar * ticksPerBeat), // 4 bars
      notes: this.hasMany(Note, 'clipId'),
      audioBuffer: this.hasOne(AudioBuffer, 'clipId'),
      selected: this.boolean(false),
      trackId: this.attr(null),
      color: this.attr(() => SCALE_COLORS.hHelmholtz[random(11)])
    };
  };
  get parent () {
    return Track.find(this.trackId);
  }
}

export class Track extends BaseModel {
  static entity = 'tracks';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(TRACK),
      bpmTransition: this.attr([]),
      selected: this.boolean(false),
      songId: this.attr(null),
      clips: this.hasMany(Clip, 'trackId')
    };
  }
  get parent () {
    return Song.find(this.songId);
  }
}

export class Song extends BaseModel {
  static entity = 'songs';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(SONG),
      bpm: this.number(bpm),
      beatsInBar: this.number(beatsInBar),
      ticksPerBeat: this.number(ticksPerBeat),
      tracks: this.hasMany(Track, 'songId')
    };
  }
  get parent () {
    return null;
  }
}

export class App extends BaseModel {
  static entity = 'app';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(APP),
      mouseMode: this.attr(SELECT)
    };
  }
  get parent () {
    return null;
  }
}