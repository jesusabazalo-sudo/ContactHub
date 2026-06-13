import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../features/auth/AuthProvider';
import {
  emptyAutofillProfile,
  ensureAutofillProfile,
  getAuthProfile,
  mergeAutofillProfile,
  readAutofillProfile,
  type AutofillProfile,
} from '../lib/autofillProfile';

export type { AutofillProfile };

export function useAutofillProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AutofillProfile>(() => getAuthProfile(user));
  const [loading, setLoading] = useState(Boolean(user));

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(emptyAutofillProfile);
      setLoading(false);
      return emptyAutofillProfile;
    }

    setLoading(true);
    try {
      const base = getAuthProfile(user);
      const ensured = await ensureAutofillProfile(user);
      const row = await readAutofillProfile(user);
      const merged = mergeAutofillProfile({ ...base, ...ensured }, row);
      setProfile(merged);
      return merged;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  return useMemo(
    () => ({
      ...profile,
      loading,
      refreshProfile,
    }),
    [loading, profile, refreshProfile],
  );
}
