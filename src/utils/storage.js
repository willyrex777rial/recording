import localforage from 'localforage';

// Configure localforage to use IndexedDB as primary, with fallbacks
localforage.config({
  driver: [
    localforage.INDEXEDDB,
    localforage.WEBSQL,
    localforage.LOCALSTORAGE
  ],
  name: 'VoiceLogPro',
  version: 1.0,
  storeName: 'sessions', // Should be alphanumeric, with underscores.
  description: 'Stores recorded sessions and transcripts'
});

export const saveSession = async (session) => {
  try {
    const id = session.id || Date.now().toString();
    const sessionToSave = { ...session, id, updatedAt: Date.now() };
    await localforage.setItem(id, sessionToSave);
    return sessionToSave;
  } catch (err) {
    console.error('Error saving session:', err);
    throw err;
  }
};

export const getSession = async (id) => {
  try {
    return await localforage.getItem(id);
  } catch (err) {
    console.error('Error getting session:', err);
    throw err;
  }
};

export const getAllSessions = async () => {
  try {
    const sessions = [];
    await localforage.iterate((value, key, iterationNumber) => {
      sessions.push(value);
    });
    // Sort by updated descending (newest first)
    return sessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    console.error('Error getting all sessions:', err);
    return [];
  }
};

export const deleteSession = async (id) => {
  try {
    await localforage.removeItem(id);
    return true;
  } catch (err) {
    console.error('Error deleting session:', err);
    return false;
  }
};
