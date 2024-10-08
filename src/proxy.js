const fetch = require('node-fetch');
const pick = require('lodash').pick; // Directly import the pick function
const { generateRandomIP, randomUserAgent } = require('./utils');
const copyHdrs = require('./copyHeaders');
const applyCompression = require('./compress');
const performBypass = require('./bypass');
const handleRedirect = require('./redirect');
const checkCompression = require('./shouldCompress');

const viaHeaders = [
    '1.1 example-proxy-service.com (ExampleProxy/1.0)',
    '1.0 another-proxy.net (Proxy/2.0)',
    '1.1 different-proxy-system.org (DifferentProxy/3.1)',
    '1.1 some-proxy.com (GenericProxy/4.0)',
];

function randomVia() {
    const index = Math.floor(Math.random() * viaHeaders.length);
    return viaHeaders[index];
}

async function processRequest(request, reply) {
    const { url, jpeg, bw, l } = request.query;

    if (!url) {
        const ipAddress = generateRandomIP();
        const ua = randomUserAgent();
        const hdrs = {
            ...pick(request.headers, ['cookie', 'dnt', 'referer']),
            'x-forwarded-for': ipAddress,
            'user-agent': ua,
            'via': randomVia(),
        };

        Object.entries(hdrs).forEach(([key, value]) => reply.header(key, value));
        
        return reply.send(`1we23`);
    }

    const urlList = Array.isArray(url) ? url.join('&url=') : url;
    const cleanUrl = urlList.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

    request.params.url = cleanUrl;
    request.params.webp = !jpeg;
    request.params.grayscale = bw !== '0';
    request.params.quality = parseInt(l, 10) || 40;

    const randomIP = generateRandomIP();
    const userAgent = randomUserAgent();

    try {
        const response = await fetch(request.params.url, {
            headers: {
                ...pick(request.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': userAgent,
                'x-forwarded-for': randomIP,
                'via': randomVia(),
            },
            timeout: 10000,
            follow: 5, // max redirects
            compress: true,
        });

        if (!response.ok) {
            return handleRedirect(request, reply);
        }

        copyHdrs(response, reply);
        reply.header('content-encoding', 'identity');
        request.params.originType = response.headers.get('content-type') || '';
        request.params.originSize = parseInt(response.headers.get('content-length'), 10) || 0;

        if (checkCompression(request)) {
            // Pass the response body stream to compress
            return applyCompression(request, reply, response.body);
        } else {
            reply.header('x-proxy-bypass', 1);

            ['accept-ranges', 'content-type', 'content-length', 'content-range'].forEach(headerName => {
                if (headerName in response.headers) {
                    reply.header(headerName, response.headers[headerName]);
                }
            });

            // Directly pipe the response body to the reply
            response.body.pipe(reply.raw);
        }
    } catch (err) {
        return handleRedirect(request, reply);
    }
}

module.exports = processRequest;
