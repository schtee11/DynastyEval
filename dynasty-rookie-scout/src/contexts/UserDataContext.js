import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchAllNotes, upsertNote, deleteNote, fetchBookmarks, addBookmark, removeBookmark } from '../services/apiClient';

const UserDataContext = createContext();

/**
 * Provides notes and bookmarks (watchlist) data across the app.
 * Only loads when the user is authenticated.
 */
export const UserDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState({}); // { playerId: content }
  const [bookmarks, setBookmarks] = useState(new Set()); // Set of playerIds
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotes({});
      setBookmarks(new Set());
      setLoaded(false);
      return;
    }
    const load = async () => {
      try {
        const [notesRes, bookmarksRes] = await Promise.all([
          fetchAllNotes(),
          fetchBookmarks(),
        ]);
        const notesMap = {};
        for (const n of (notesRes.notes || [])) {
          notesMap[n.player_id] = n.content;
        }
        setNotes(notesMap);
        setBookmarks(new Set((bookmarksRes.bookmarks || []).map(b => String(b.player_id))));
      } catch { /* ignore */ }
      setLoaded(true);
    };
    load();
  }, [user]);

  const saveNote = useCallback(async (playerId, content) => {
    const pid = String(playerId);
    if (!content || !content.trim()) {
      setNotes(prev => { const next = { ...prev }; delete next[pid]; return next; });
      try { await deleteNote(pid); } catch { /* ignore */ }
    } else {
      setNotes(prev => ({ ...prev, [pid]: content }));
      try { await upsertNote(pid, content); } catch { /* ignore */ }
    }
  }, []);

  const getNote = useCallback((playerId) => notes[String(playerId)] || '', [notes]);

  const toggleBookmark = useCallback(async (playerId) => {
    const pid = String(playerId);
    const isBookmarked = bookmarks.has(pid);
    setBookmarks(prev => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(pid); else next.add(pid);
      return next;
    });
    try {
      if (isBookmarked) await removeBookmark(pid);
      else await addBookmark(pid);
    } catch { /* ignore */ }
  }, [bookmarks]);

  const isBookmarked = useCallback((playerId) => bookmarks.has(String(playerId)), [bookmarks]);

  return (
    <UserDataContext.Provider value={{ notes, saveNote, getNote, bookmarks, toggleBookmark, isBookmarked, loaded }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => useContext(UserDataContext);
