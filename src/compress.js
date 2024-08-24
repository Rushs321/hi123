"use strict";

const sharp = require('sharp');
const redirect = require('./redirect');

const sharpStream = () => sharp({ animated: !process.env.NO_ANIMATE, unlimited: true });

function compress(req, res, input) {
    const format = req.params.webp ? 'webp' : 'jpeg';

    // Pipe the input body stream into the sharp instance
    input.body.pipe(
        sharpStream()
            .grayscale(req.params.grayscale)
            .toFormat(format, {
                quality: req.params.quality || 75, // Default quality to 75 if not provided
                progressive: true,
                optimizeScans: true,
            })
            .toBuffer((error, outputBuffer, info) => {
            if (error || !info || res.headersSent) {
                return redirectFunc(req, res);
            }
                res.setHeader('content-type', `image/${imgFormat}`);
            res.setHeader('content-length', info.size);
            res.setHeader('x-original-size', req.params.originSize);
            res.setHeader('x-bytes-saved', req.params.originSize - info.size);
            res.status(200).send(outputBuffer);
        });
                
    );
}


module.exports = compress;
