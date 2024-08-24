"use strict";

const sharp = require('sharp');
const redirect = require('./redirect');

const sharpStream = () => sharp({ animated: !process.env.NO_ANIMATE, unlimited: true });

async function compress(request, reply, inputStream) {
    const imgFormat = request.params.webp ? 'webp' : 'jpeg';

    try {
        // Create a sharp instance with stream
        const transformStream = sharpStream()
            .grayscale(request.params.grayscale)
            .toFormat(imgFormat, {
                quality: request.params.quality,
                progressive: true,
                optimizeScans: true,
            });

        // Set response headers before piping
        reply.header('content-type', `image/${imgFormat}`);
        reply.header('x-original-size', request.params.originSize);

        // Pipe the input stream through sharp and into the reply
        inputStream.pipe(transformStream).pipe(reply.raw);

        // To handle size and bytes-saved headers, use `transformStream` events
        transformStream.on('info', info => {
            reply.header('content-length', info.size);
            reply.header('x-bytes-saved', request.params.originSize - info.size);
        });

    } catch (error) {
        // Error handling
        redirect(request, reply);
    }
}

module.exports = compress;
