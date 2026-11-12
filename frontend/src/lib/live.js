// One live connection per signed-in page. Events are re-dispatched on window as "mais:event",
// so any page can refresh when something it shows has changed. Reconnects with backoff.
// Uses fetch (not EventSource) so the sign-in token can be sent in the Authorization header.
export function connectLive() {
  let stopped = false;
  let controller = null;
  let delay = 1000;

  const dispatch = (payload) => window.dispatchEvent(new CustomEvent('mais:event', { detail: payload }));

  const run = async () => {
    const token = localStorage.getItem('token');
    if (!token || stopped) return;
    controller = new AbortController();
    try {
      const res = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`events ${res.status}`);
      delay = 1000;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let end;
        while ((end = buffer.indexOf('\n\n')) >= 0) {
          const chunk = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          const line = chunk.split('\n').find((l) => l.startsWith('data: '));
          if (line) {
            try {
              dispatch(JSON.parse(line.slice(6)));
            } catch (_) {
              /* ignore a malformed event */
            }
          }
        }
      }
    } catch (_) {
      /* network drop or sign-out: retry below */
    }
    if (!stopped) {
      setTimeout(run, delay);
      delay = Math.min(delay * 2, 30000);
    }
  };

  run();
  return () => {
    stopped = true;
    controller?.abort();
  };
}
