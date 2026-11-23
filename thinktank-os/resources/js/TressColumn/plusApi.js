// Plus+ API client. Same-origin fetch, XSRF token from the cookie,
// same pattern as the Tress relay client in rpc.js. All routes are
// signed-in only; the server enforces the tier for each one.

function xsrfToken() {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

async function request(path, { method = 'GET', body = null } = {}) {
    const headers = { Accept: 'application/json' };
    const token = xsrfToken();
    if (token) headers['X-XSRF-TOKEN'] = token;
    let payload = null;
    if (body !== null) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }
    const response = await fetch(path, {
        method,
        headers,
        credentials: 'same-origin',
        body: payload,
    });
    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }
    if (!response.ok) {
        const message =
            (data && typeof data.error === 'string' && data.error) ||
            'The request failed. Check the network and try again.';
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }
    return data;
}

export const plusApi = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    del: (path) => request(path, { method: 'DELETE' }),
};
