self.onmessage = async (e) => {
    try {
        const url = e.data;
        const res = await fetch(url, { cache: "force-cache" });
        const text = await res.text();     // parse off the main thread
        const fc = JSON.parse(text);
        postMessage({ ok: true, fc });
    } catch (err) {
        postMessage({ ok: false, error: String(err) });
    }
};
