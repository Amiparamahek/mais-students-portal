import { useEffect, useRef } from 'react';

const INTERVAL_MS = 5000;

// Ajax refresh: runs `fetcher` now, then every few seconds, and again when the tab is
// shown or the window regains focus. Only the data is re-requested; the page never reloads.
// Same arguments as useEffect, so a page switches over by changing `useEffect(` to `useLiveFetch(`.
export default function useLiveFetch(fetcher, deps = []) {
  const latest = useRef(fetcher);
  latest.current = fetcher;

  useEffect(() => {
    const run = () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const result = latest.current();
        if (result && typeof result.catch === 'function') result.catch(() => {});
      } catch (_) {
        // A failed refresh keeps the data already on screen; the next tick tries again.
      }
    };

    run();
    const timer = setInterval(run, INTERVAL_MS);
    window.addEventListener('focus', run);
    // A server event (new reply, approval, attendance) refreshes the data at once.
    const onServerEvent = () => latest.current && latest.current();
    document.addEventListener('visibilitychange', run);
    window.addEventListener('mais:event', onServerEvent);
    return () => {
      window.removeEventListener('mais:event', onServerEvent);
      clearInterval(timer);
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', run);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
