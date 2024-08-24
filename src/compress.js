"use strict";

const sharp = require('sharp');
const redirect = require('./redirect');

const sharpStream = () => sharp({ animated: !process.env.NO_ANIMATE, unlimited: true });

async function compress(request, reply) {
    const imgFormat = request.params.webp ? 'webp' : 'jpeg';

    try {
        // Ensure request.body is available as a stream
        const inputStream = request.body;

        // Pipe the input body stream into the sharp instance
        const outputBuffer = await sharpStream()
            .grayscale(request.params.grayscale)
            .toFormat(imgFormat, {
                quality: request.params.quality,
                progressive: true,
                optimizeScans: true,
            })
            .toBuffer();

        const info = await sharpStream()
            .metadata(); // Retrieve metadata to get the size

        if (!info || reply.sent) {
            return redirect(request, reply);
        }

        // Setting response headers
        reply
            .header('Content-Type', `image/${imgFormat}`)
            .header('Content-Length', info.size)
            .header('X-Original-Size', request.params.originSize)
            .header('X-Bytes-Saved', request.params.originSize - info.size)
            .status(200)
            .send(outputBuffer);
    } catch (error) {
        return redirect(request, reply);
    }
}

module.exports = compress;
