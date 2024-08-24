"use strict";

const sharp = require('sharp');
const redirect = require('./redirect');

const sharpStream = () => sharp({ animated: !process.env.NO_ANIMATE, unlimited: true });

async function compress(request, reply) {
    const imgFormat = request.params.webp ? 'webp' : 'jpeg';
    const input = request.raw; // Assuming `input` is obtained from the raw request

    try {
        const outputBuffer = await sharpStream()
            .grayscale(request.params.grayscale)
            .toFormat(imgFormat, {
                quality: request.params.quality || 75, // Default quality to 75 if not provided
                progressive: true,
                optimizeScans: true,
            })
            .toBuffer();

        // Setting response headers
        reply.header('content-type', `image/${imgFormat}`);
        reply.header('content-length', outputBuffer.length);
        reply.header('x-original-size', request.params.originSize);
        reply.header('x-bytes-saved', request.params.originSize - outputBuffer.length);

        // Sending the processed image
        reply.status(200).send(outputBuffer);

    } catch (error) {
        // Error handling
        redirect(request, reply);
    }
}

module.exports = compress;
