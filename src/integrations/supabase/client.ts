
// Supabase is no longer used in this project
// This file is kept for compatibility but all functions are disabled

export const supabase = {
  from: () => ({
    select: () => Promise.reject(new Error('Supabase not available')),
    insert: () => Promise.reject(new Error('Supabase not available')),
    update: () => Promise.reject(new Error('Supabase not available')),
    delete: () => Promise.reject(new Error('Supabase not available')),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => Promise.resolve() }),
    subscribe: () => Promise.resolve(),
    unsubscribe: () => Promise.resolve(),
  }),
  removeAllChannels: () => Promise.resolve(),
};
