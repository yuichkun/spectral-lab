// @flow
import { Clip } from '../store/models';
import { remote } from 'electron';
import { midiWriter } from '../modules';
const { dialog } = remote;

export const exportSelectedClips = async (): Promise<void> => {
  const exportDirs = await dialog.showOpenDialog({
    message: 'Choose a directory where you export',
    properties: ['openDirectory', 'createDirectory']
  });
  if (!exportDirs || exportDirs === []) return;
  const selectedClips = Clip.query().where('selected', true).withAllRecursive().get();
  await Promise.all(selectedClips.map(clip => midiWriter.exportClip(clip, exportDirs[0])));
  console.log('All clips are exported successfully');
};
