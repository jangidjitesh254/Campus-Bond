import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SearchContext = createContext({
  searchQuery: '',
  setSearchQuery: () => {},
  debouncedSearch: '',
  searchPlaceholder: '',
  setSearchPlaceholder: () => {},
});

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search hackathons, project teams, skills...');
  const location = useLocation();

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Adjust placeholder automatically based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/market')) {
      setSearchPlaceholder('Search textbooks, notes, electronics, lab kits...');
    } else if (path.startsWith('/lostfound') || path.startsWith('/lost-found')) {
      setSearchPlaceholder('Search lost IDs, keys, calculators, bottles...');
    } else if (path.startsWith('/clubs')) {
      setSearchPlaceholder('Search campus clubs, technical societies...');
    } else if (path.startsWith('/chat') || path.startsWith('/messages')) {
      setSearchPlaceholder('Search conversations and chats...');
    } else {
      setSearchPlaceholder('Search hackathons, project teams, skills, topics...');
    }
  }, [location.pathname]);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        debouncedSearch,
        searchPlaceholder,
        setSearchPlaceholder,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
