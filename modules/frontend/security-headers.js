function handler(event) {
    var response = event.response;
    var headers = response.headers;

    // Add security headers
    headers['strict-transport-security'] = {
        value: 'max-age=63072000; includeSubDomains; preload'
    };

    headers['content-security-policy'] = {
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' api.farmermarket.online; frame-ancestors 'none';"
    };

    headers['x-content-type-options'] = {
        value: 'nosniff'
    };

    headers['x-frame-options'] = {
        value: 'DENY'
    };

    headers['x-xss-protection'] = {
        value: '1; mode=block'
    };

    headers['referrer-policy'] = {
        value: 'strict-origin-when-cross-origin'
    };

    headers['permissions-policy'] = {
        value: 'camera=(), microphone=(), geolocation=()'
    };

    return response;
}
