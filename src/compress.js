const sharp = require('sharp');
const redirect = require('./redirect');

async function compressImg(req, res, inputStream) {
    const format = req.params.webp ? 'webp' : 'jpeg';

    // Set up the sharp instance with the desired options
    inputStream.pipe(
        sharp()
            .grayscale(req.params.grayscale)
            .toFormat(format, {
                quality: req.params.quality,
                progressive: true,
                optimizeScans: true
            })
            .toBuffer((err, output, info) => {
                if (err || !info || res.headersSent) {
                    return redirect(req, res);
                }

                // Send the processed image
                res.header('content-type', `image/${format}`);
                res.header('content-length', info.size);
                res.header('x-original-size', req.params.originSize);
                res.header('x-bytes-saved', req.params.originSize - info.size);
                res.status(200).send(output);
            })
    );
}

module.exports = compressImg;
