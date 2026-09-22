import { useCallback, useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "plan"; id: string; token: string | null };

function readRoute(): Route {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("plan");
  if (!id) return { page: "home" };
  return { page: "plan", id, token: params.get("token") };
}

/** Hand-rolled routing: the whole app only ever has two "pages", so a
 * router library would be more machinery than the app needs. */
export function useRoute() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateToPlan = useCallback((id: string, token: string | null) => {
    const params = new URLSearchParams();
    params.set("plan", id);
    if (token) params.set("token", token);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(null, "", url);
    setRoute({ page: "plan", id, token });
  }, []);

  const navigateHome = useCallback(() => {
    window.history.pushState(null, "", window.location.pathname);
    setRoute({ page: "home" });
  }, []);

  return { route, navigateToPlan, navigateHome };
}
