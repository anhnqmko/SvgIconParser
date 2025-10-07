/**
 * SVG Icon Parser Server
 * Express server để trace ảnh thành SVG
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { preprocessImage } = require('./src/preprocessSharp');
const { traceBW } = require('./src/tracePotrace');
const { traceColor } = require('./src/tracePosterize');

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình Multer để upload file vào memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/png', 'image/jpeg', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file PNG, JPEG, hoặc WEBP'));
        }
    }
});

// Serve static files
app.use(express.static('public'));

/**
 * Endpoint trace ảnh đen-trắng
 */
app.post('/trace/bw', upload.single('image'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Kiểm tra file upload
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                error: {
                    code: 'NO_IMAGE',
                    message: 'Không có file ảnh được upload'
                }
            });
        }
        
        // Tiền xử lý ảnh
        const { buffer, width, height } = await preprocessImage(req.file.buffer, 'bw');
        
        // Trace bằng Potrace
        const { svg, paths } = await traceBW(buffer, width, height);
        
        const durationMs = Date.now() - startTime;
        
        // Trả về kết quả
        res.json({
            ok: true,
            svg: svg,
            meta: {
                width: width,
                height: height,
                durationMs: durationMs,
                paths: paths,
                mode: 'bw',
                preset: 'logo'
            }
        });
        
    } catch (error) {
        console.error('Error in /trace/bw:', error);
        res.status(500).json({
            ok: false,
            error: {
                code: 'PROCESSING_ERROR',
                message: error.message
            }
        });
    }
});

/**
 * Endpoint trace ảnh màu
 */
app.post('/trace/color', upload.single('image'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Kiểm tra file upload
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                error: {
                    code: 'NO_IMAGE',
                    message: 'Không có file ảnh được upload'
                }
            });
        }
        
        // Tiền xử lý ảnh
        const { buffer, width, height } = await preprocessImage(req.file.buffer, 'color');
        
        // Trace bằng Posterize
        const { svg, paths } = await traceColor(buffer, width, height);
        
        const durationMs = Date.now() - startTime;
        
        // Trả về kết quả
        res.json({
            ok: true,
            svg: svg,
            meta: {
                width: width,
                height: height,
                durationMs: durationMs,
                paths: paths,
                mode: 'color',
                preset: 'posterize'
            }
        });
        
    } catch (error) {
        console.error('Error in /trace/color:', error);
        res.status(500).json({
            ok: false,
            error: {
                code: 'PROCESSING_ERROR',
                message: error.message
            }
        });
    }
});

// Error handler cho Multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                ok: false,
                error: {
                    code: 'FILE_TOO_LARGE',
                    message: 'File vượt quá giới hạn 10MB'
                }
            });
        }
        return res.status(400).json({
            ok: false,
            error: {
                code: 'UPLOAD_ERROR',
                message: err.message
            }
        });
    }
    
    if (err) {
        return res.status(415).json({
            ok: false,
            error: {
                code: 'INVALID_FILE',
                message: err.message
            }
        });
    }
    
    next();
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📁 Truy cập giao diện test tại http://localhost:${PORT}/index.html`);
});
