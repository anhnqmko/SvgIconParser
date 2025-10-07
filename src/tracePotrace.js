/**
 * Module trace ảnh đen-trắng bằng Potrace
 * @module tracePotrace
 */

const potrace = require('potrace');

/**
 * Trace ảnh đen-trắng thành SVG
 * @param {Buffer} imageBuffer - Buffer của ảnh đã tiền xử lý
 * @param {number} width - Chiều rộng ảnh
 * @param {number} height - Chiều cao ảnh
 * @returns {Promise<{svg: string, paths: number}>}
 */
async function traceBW(imageBuffer, width, height) {
    return new Promise((resolve, reject) => {
        const params = {
            turdSize: 3,              // Fine-tune Lần 3
            turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
            alphaMax: 1.0,            // Fine-tune Lần 3
            optTolerance: 0.18,       // Fine-tune Lần 3
            threshold: potrace.Potrace.THRESHOLD_AUTO
        };
        
        potrace.trace(imageBuffer, params, (err, svg) => {
            if (err) {
                return reject(new Error(`Lỗi trace Potrace: ${err.message}`));
            }
            
            // Đảm bảo SVG có xmlns, viewBox, width/height
            let processedSvg = svg;
            
            // Kiểm tra và thêm xmlns nếu chưa có
            if (!processedSvg.includes('xmlns=')) {
                processedSvg = processedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            
            // Kiểm tra và thêm viewBox nếu chưa có
            if (!processedSvg.includes('viewBox=')) {
                processedSvg = processedSvg.replace(
                    '<svg',
                    `<svg viewBox="0 0 ${width} ${height}"`
                );
            }
            
            // Kiểm tra và thêm width/height nếu chưa có
            if (!processedSvg.includes('width=')) {
                processedSvg = processedSvg.replace(
                    '<svg',
                    `<svg width="${width}" height="${height}"`
                );
            }
            
            // Đếm số path trong SVG
            const pathMatches = processedSvg.match(/<path/g);
            const pathCount = pathMatches ? pathMatches.length : 0;
            
            resolve({
                svg: processedSvg,
                paths: pathCount
            });
        });
    });
}

module.exports = {
    traceBW
};
