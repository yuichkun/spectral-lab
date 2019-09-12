// @flow
import { Clip } from '../../store/models';
import uid from 'uid';
import range from 'lodash/range';
import { ticksPerBar } from '../../../constants/defaults';
import { getSelectedTrackIds } from '../Track';
import { generateBarData } from '../Bar';

export const insertDefaultClip = async (parentTrackId: string, data?: Object): Promise<string> => {
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

export const moveToSelectedTrack = async (id: string) => {
  const trackIds = getSelectedTrackIds();
  if (!trackIds.length) return;
  await setTrackId(id, trackIds[0]);
};

export const setTrackId = async (clipId: string, trackId: string) => {
  await Clip.update({
    where: clipId,
    data: {
      trackId: trackId
    }
  });
};
