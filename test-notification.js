/**
 * Uji kirim notifikasi lewat API SIMRS.
 *
 * node test-notification.js <loginUser> <loginPass> <usernamePenerima> [judul] [pesan]
 *
 * Contoh:
 * node test-notification.js admin rahasia perawat1 "Tes lonceng" "Halo dari node"
 */

// Sertifikat lokal Laragon (.test) tidak ada di trust store Node, jadi fetch gagal
// dengan DEPTH_ZERO_SELF_SIGNED_CERT. Browser tetap aman karena pakai store Windows.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const baseUrl = (process.env.SIMRS_BASE_URL || 'https://simrs.test').replace(/\/$/, '');
const [loginUser, loginPass, targetUsername, title = 'Tes lonceng', message = 'Halo dari node'] = process.argv.slice(2);

if (!loginUser || !loginPass || !targetUsername) {
    console.error('Pakai: node test-notification.js <loginUser> <loginPass> <usernamePenerima> [judul] [pesan]');
    process.exit(1);
}

const cookies = new Map();

function storeCookies(response) {
    const lines = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [];

    for (const line of lines) {
        const pair = line.split(';')[0];
        const index = pair.indexOf('=');
        if (index > 0) {
            cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
        }
    }
}

function cookieHeader() {
    return [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
}

async function request(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    const stored = cookieHeader();
    if (stored) {
        headers.Cookie = stored;
    }

    const response = await fetch(url, {
        ...options,
        headers,
        redirect: 'manual',
    });
    storeCookies(response);

    if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (location) {
            return request(new URL(location, url).toString(), { method: 'GET' });
        }
    }

    return response;
}

async function main() {
    const loginPage = await request(`${baseUrl}/login`);
    const html = await loginPage.text();
    const tokenMatch = html.match(/name="_token" value="([^"]+)"/);
    if (!tokenMatch) {
        throw new Error(`Token CSRF tidak ditemukan. Status login page: ${loginPage.status}`);
    }

    const body = new URLSearchParams({
        _token: tokenMatch[1],
        username: loginUser,
        password: loginPass,
    });

    const loginResponse = await request(`${baseUrl}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'text/html',
        },
        body,
    });

    const afterLogin = await loginResponse.text();
    if (/name="username"/.test(afterLogin) && /name="password"/.test(afterLogin)) {
        throw new Error('Login gagal. Periksa username dan password.');
    }

    const xsrf = cookies.get('XSRF-TOKEN');
    if (!xsrf) {
        throw new Error('Cookie XSRF-TOKEN tidak ada setelah login.');
    }

    const pushResponse = await request(`${baseUrl}/notifications/push`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': decodeURIComponent(xsrf),
        },
        body: JSON.stringify({
            username: targetUsername,
            title,
            message,
        }),
    });

    const raw = await pushResponse.text();
    console.log(`HTTP ${pushResponse.status}`);
    try {
        console.log(JSON.stringify(JSON.parse(raw), null, 2));
    } catch {
        console.log(raw);
    }

    if (!pushResponse.ok) {
        process.exit(1);
    }
}

main().catch((error) => {
    const cause = error.cause && (error.cause.code || error.cause.message);
    console.error(cause ? `${error.message} (${cause})` : error.message);
    process.exit(1);
});
