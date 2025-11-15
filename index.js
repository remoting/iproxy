export default {
  async fetch(request) {
    /**
     * An object with different URLs to fetch
     * @param {Object} ORIGINS
     */
    const ORIGINS = {
      "js.remoting.workers.dev": "generativelanguage.googleapis.com"
    };

    const url = new URL(request.url);

    // Check if incoming hostname is a key in the ORIGINS object
    if (url.hostname in ORIGINS) {
      const target = ORIGINS[url.hostname];
      url.hostname = target;
      return fetch(url.toString(), request);
    }
    // Otherwise, process request as normal
    return fetch(request);
  },
};