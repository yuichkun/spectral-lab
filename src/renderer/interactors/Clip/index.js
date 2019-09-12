// @flow
import { Clip } from '../../store/models';
import uid from 'uid';
import range from 'lodash/range';
import { ticksPerBar, ticksPerBeat } from '../../../constants/defaults';

export const createDefaultClip = async (parentTrackId: string, data?: Object): Promise<string> => {
  const clipId = data && data.id ? data.id : uid();
  await Clip.insert({
    data: Object.assign({
      id: clipId,
      trackId: parentTrackId,
      bars: range(4).map(i => generateBarData(i * ticksPerBar))
    }, data)
  });
  return clipId;
};

const generateBarData = (offsetTime: number): Object => ({
  id: uid(),
  offsetTime,
  beats: range(4).map(i => generateBeatData(i * ticksPerBeat))
});

const generateBeatData = (offsetTime: number): Object => ({
  id: uid(),
  offsetTime: offsetTime
});
