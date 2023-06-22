import { IpcMain } from 'electron';
import log from 'electron-log';
import { TrackerClientInterface } from '../models/interface';
import { AniListTrackerClient, AniListTrackerMetadata } from './trackers/anilist';
import { MALTrackerClient, MALTrackerMetadata } from './trackers/myanimelist';
import ipcChannels from '../constants/ipcChannels.json';
import { TrackEntry, TrackerSeries, TrackStatus } from '../models/types';
import { MUTrackerClient, MUTrackerMetadata } from './trackers/mangaupdate';

const TRACKER_CLIENTS: { [key: string]: TrackerClientInterface } = {
  [AniListTrackerMetadata.id]: new AniListTrackerClient(),
  [MALTrackerMetadata.id]: new MALTrackerClient(),
  [MUTrackerMetadata.id]: new MUTrackerClient(),
};

function getAuthUrls(): { [trackerId: string]: string } {
  log.info(`Getting auth urls from trackers`);
  const authUrls: { [trackerId: string]: string } = {};
  Object.entries(TRACKER_CLIENTS).forEach(([trackerId, trackerClient]) => {
    authUrls[trackerId] = trackerClient.getAuthUrl();
  });
  return authUrls;
}

function getToken(trackerId: string, accessCode: string): Promise<string | null> {
  const tracker = TRACKER_CLIENTS[trackerId];
  log.info(`Getting access token for tracker ${trackerId}`);
  return tracker.getToken(accessCode);
}

function getUsername(trackerId: string): Promise<string | null> {
  const tracker = TRACKER_CLIENTS[trackerId];
  log.info(`Getting username from tracker ${trackerId}`);
  return tracker.getUsername();
}

function search(trackerId: string, query: string): Promise<TrackerSeries[]> {
  const tracker = TRACKER_CLIENTS[trackerId];
  log.info(`Searching for '${query}' from tracker ${trackerId}`);
  return tracker.search(query);
}

function getLibraryEntry(trackerId: string, seriesId: string): Promise<TrackEntry | null> {
  const tracker = TRACKER_CLIENTS[trackerId];
  log.info(`Getting library entry for ${seriesId} from tracker ${trackerId}`);
  return tracker.getLibraryEntry(seriesId);
}

function addLibraryEntry(trackerId: string, trackEntry: TrackEntry): Promise<TrackEntry | null> {
  const tracker = TRACKER_CLIENTS[trackerId];
  log.info(`Adding library entry for ${trackEntry.seriesId} from tracker ${trackerId}`);

  const validatedTrackEntry = {
    ...trackEntry,
    progress: trackEntry.progress === undefined ? 0 : trackEntry.progress,
    status: trackEntry.status === undefined ? TrackStatus.Reading : trackEntry.status,
  };

  return tracker.addLibraryEntry(validatedTrackEntry);
}

function updateLibraryEntry(trackerId: string, trackEntry: TrackEntry): Promise<TrackEntry | null> {
  const tracker = TRACKER_CLIENTS[trackerId];
  log.info(`Updating library entry for ${trackEntry.seriesId} from tracker ${trackerId}`);
  return tracker.updateLibraryEntry(trackEntry);
}

function setAccessToken(trackerId: string, accessToken: string): void {
  const tracker = TRACKER_CLIENTS[trackerId];
  log.info(`Setting access token for tracker ${trackerId}`);
  return tracker.setAccessToken(accessToken);
}

// eslint-disable-next-line import/prefer-default-export
export const createTrackerIpcHandlers = (ipcMain: IpcMain) => {
  log.debug('Creating tracker IPC handlers in main...');

  ipcMain.handle(ipcChannels.TRACKER_MANAGER.GET_ALL, async () => {
    return Object.values(TRACKER_CLIENTS).map((client: TrackerClientInterface) =>
      client.getMetadata()
    );
  });

  ipcMain.handle(ipcChannels.TRACKER.GET_AUTH_URLS, () => {
    return getAuthUrls();
  });
  ipcMain.handle(ipcChannels.TRACKER.GET_TOKEN, (_event, trackerId: string, accessCode: string) => {
    return getToken(trackerId, accessCode);
  });
  ipcMain.handle(ipcChannels.TRACKER.GET_USERNAME, (_event, trackerId: string) => {
    return getUsername(trackerId);
  });
  ipcMain.handle(ipcChannels.TRACKER.SEARCH, (_event, trackerId: string, query: string) => {
    return search(trackerId, query);
  });
  ipcMain.handle(
    ipcChannels.TRACKER.GET_LIBRARY_ENTRY,
    (_event, trackerId: string, seriesId: string) => {
      return getLibraryEntry(trackerId, seriesId);
    }
  );
  ipcMain.handle(
    ipcChannels.TRACKER.ADD_LIBRARY_ENTRY,
    (_event, trackerId: string, trackEntry: TrackEntry) => {
      return addLibraryEntry(trackerId, trackEntry);
    }
  );
  ipcMain.handle(
    ipcChannels.TRACKER.UPDATE_LIBRARY_ENTRY,
    (_event, trackerId: string, trackEntry: TrackEntry) => {
      return updateLibraryEntry(trackerId, trackEntry);
    }
  );
  ipcMain.handle(
    ipcChannels.TRACKER.SET_ACCESS_TOKEN,
    (_event, trackerId: string, accessToken: string) => {
      return setAccessToken(trackerId, accessToken);
    }
  );
};
