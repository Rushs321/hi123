"use strict";

const sharp = require('sharp');
const redirect = require('./redirect');

const sharpStream = (grayscale, format, quality) => 
    sharp({ animated: !process.env.NO_ANIMATE, unlimited: true })
        .grayscale(grayscale)
        .toFormat(format, {
            quality: quality,
            progressive: true,
            optimizeScans: true,
        });

async function compress(request, reply) {
    const imgFormat = request.params.webp ? 'webp' : 'jpeg';
    const { grayscale, quality, originSize } = request.params;

    // Setting up the stream pipeline
    const transformStream = sharpStream(grayscale, imgFormat, quality);

    reply.type(`image/${imgFormat}`);

    try {
        // Start piping the request body stream through the transform and to the response
        request.raw.pipe(transformStream)
            .on('info', (info) => {
                reply.header('content-length', info.size);
                reply.header('x-original-size', originSize);
                reply.header('x-bytes-saved', originSize - info.size);
            })
            .on('error', (error) => {
                if (!reply.sent) {
                    redirect(request, reply); // Handle errors by redirecting
                }
            })
            .pipe(reply.raw); // Pipe the transformed data directly to the response
    } catch (error) {
        redirect(request, reply); // Handle any synchronous errors
    }
}

module.exports = compress;
