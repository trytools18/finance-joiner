import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useAuthReady
 * - Ensures Supabase auth session is initialized before enabling data queries
 * - Exposes userId and an isReady flag to gate React Query hooks
 */
export function useAuthReady() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.session?.user?.id ?? null);
      setIsReady(true);
    });

    // Subscribe to auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setIsReady(true);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { userId, isReady };
}
