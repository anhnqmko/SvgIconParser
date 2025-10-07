/**
 * Module tiền xử lý ảnh bằng Sharp
 * @module preprocessSharp
 */

const sharp = require('sharp');

/**
 * Tiền xử lý ảnh dựa vào chế độ (bw hoặc color)
 * @param {Buffer} imageBuffer - Buffer của ảnh đầu vào
 * @param {string} mode - Chế độ: 'bw' hoặc 'color'
 * @returns {Promise<{buffer: Buffer, width: number, height: number}>}
 */
async function preprocessImage(imageBuffer, mode) {
    try {
        let pipeline = sharp(imageBuffer);
        
        // Xoay theo EXIF
        pipeline = pipeline.rotate();
        
        // Lấy metadata để kiểm tra kích thước
        const metadata = await pipeline.metadata();
        const originalWidth = metadata.width;
        const originalHeight = metadata.height;
        
        // Resize nếu chiều rộng > 1600px
        if (originalWidth > 1600) {
            pipeline = pipeline.resize(1600, null, {
                kernel: sharp.kernel.lanczos3,
                withoutEnlargement: true
            });
        }
        
        // Xử lý theo chế độ
        if (mode === 'bw') {
            // Pipeline cho ảnh đen-trắng
            pipeline = pipeline
                .median(1)              // Khử nhiễu nhẹ
                .normalize()            // Kéo giãn histogram
                .grayscale()            // Chuyển sang grayscale
                .threshold(128)         // Threshold với giá trị mặc định 128
                .blur(0.3);             // Trở về giá trị ban đầu
        } else if (mode === 'color') {
            // Pipeline cho ảnh màu
            pipeline = pipeline
                .blur(0.6)              // Trở về giá trị ban đầu
                .normalize();           // Normalize nhẹ
        }
        
        // Xuất buffer và metadata cuối cùng
        const processedBuffer = await pipeline.png().toBuffer();
        const finalMetadata = await sharp(processedBuffer).metadata();
        
        return {
            buffer: processedBuffer,
            width: finalMetadata.width,
            height: finalMetadata.height
        };
    } catch (error) {
        throw new Error(`Lỗi tiền xử lý ảnh: ${error.message}`);
    }
}

module.exports = {
    preprocessImage
};
