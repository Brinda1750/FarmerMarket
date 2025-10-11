var synthetics = require('Synthetics');
var log = require('SyntheticsLogger');

const apiHealthHandler = async function () {
    const baseUrl = `https://api.${process.env.DOMAIN_NAME || 'farmermarket.online'}`;

    const endpoints = [
        { path: '/auth/health', expectedStatus: 200 },
        { path: '/rest/', expectedStatus: 200 },
        { path: '/realtime/', expectedStatus: 200 }
    ];

    let successCount = 0;
    const results = [];

    for (const endpoint of endpoints) {
        try {
            const url = `${baseUrl}${endpoint.path}`;
            log.info(`Checking endpoint: ${url}`);

            const response = await synthetics.executeHttpStep('apiCheck', new synthetics.HttpStepConfig(
                url,
                new synthetics.HttpRequest([
                    synthetics.getHttpRequestOptions({
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    })
                ]),
                undefined,
                (responseObject) => {
                    if (responseObject.statusCode !== endpoint.expectedStatus) {
                        throw new Error(`Expected status ${endpoint.expectedStatus} but got ${responseObject.statusCode}`);
                    }

                    log.info(`Endpoint ${endpoint.path} responded with status ${responseObject.statusCode}`);
                    successCount++;

                    results.push({
                        endpoint: endpoint.path,
                        status: responseObject.statusCode,
                        responseTime: responseObject.responseTime
                    });
                }
            ));

        } catch (error) {
            log.error(`Failed to check endpoint ${endpoint.path}: ${error.message}`);
            results.push({
                endpoint: endpoint.path,
                error: error.message
            });
        }
    }

    // Check if at least one endpoint is healthy
    if (successCount === 0) {
        throw new Error('All API endpoints are unhealthy');
    }

    log.info(`API health check passed. ${successCount}/${endpoints.length} endpoints healthy`);
    return JSON.stringify(results);
};

exports.handler = async () => {
    return await apiHealthHandler();
};
