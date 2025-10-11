var synthetics = require('Synthetics');
var log = require('SyntheticsLogger');

const homepageHandler = async function () {
    const url = `https://${process.env.DOMAIN_NAME || 'farmermarket.online'}`;

    let page;
    try {
        page = await synthetics.getPage();

        // Navigate to the homepage
        log.info(`Navigating to ${url}`);
        const response = await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 30000});

        // Check response status
        if (response.status() !== 200) {
            throw new Error(`Failed to load page. Status: ${response.status()}`);
        }

        // Wait for main content
        await page.waitForTimeout(2000);

        // Take screenshot
        await synthetics.takeScreenshot('homepage');

        // Check for specific elements
        const title = await page.title();
        log.info(`Page title: ${title}`);

        // Check if page has content
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.length < 100) {
            throw new Error('Page appears to be empty or not fully loaded');
        }

        log.info('Homepage loaded successfully');
        return 'Homepage check passed';

    } catch (error) {
        log.error(`Homepage check failed: ${error.message}`);
        throw error;
    } finally {
        if (page) {
            await page.close();
        }
    }
};

exports.handler = async () => {
    return await homepageHandler();
};
