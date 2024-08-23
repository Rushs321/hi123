const imgProc = require('sharp');
const redirectFunc = require('./redirect');

async function compressImg(request, reply, imgStream) {
    const imgFormat = request.params.webp ? 'webp' : 'jpeg';
    const grayscale = Boolean(request.params.grayscale);
    const quality = parseInt(request.params.quality, 10) || 75; // Default quality to 75 if not provided
    const originSize = parseInt(request.params.originSize, 10) || 0; // Default to 0 if not provided

    try {
        // Create a Sharp instance that processes the stream
        const sharpStream = imgProc()
            .grayscale(grayscale)
            .toFormat(imgFormat, {
                quality,
                progressive: true,
                optimizeScans: true,
                chromaSubsampling: '4:4:4',
            });

        // Pipe the input stream through Sharp
        const outputBuffer = await new Promise((resolve, reject) => {
            const buffers = [];
            imgStream.pipe(sharpStream)
                .on('data', chunk => buffers.push(chunk))
                .on('end', () => resolve(Buffer.concat(buffers)))
                .on('error', reject);
        });

        // Get the output buffer's size
        const outputSize = outputBuffer.length;

        reply.header('content-type', `image/${imgFormat}`);
        reply.header('content-length', outputSize);
        reply.header('x-original-size', originSize);
        reply.header('x-bytes-saved', originSize - outputSize);
        return reply.code(200).send(outputBuffer);
    } catch (error) {
        return redirectFunc(request, reply);
    }
}

module.exports = compressImg;
