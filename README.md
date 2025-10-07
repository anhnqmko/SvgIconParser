# SVG Icon Parser

Ứng dụng Node.js + Express để chuyển đổi ảnh bitmap (PNG, JPEG, WEBP) thành vector SVG sử dụng Potrace.

## Tính năng

- **Trace B/W (Đen trắng)**: Chuyển đổi ảnh thành SVG đen trắng với thuật toán Potrace
- **Trace Color (Nhiều màu)**: Chuyển đổi ảnh thành SVG nhiều màu với thuật toán Posterize
- **Upload hoặc Paste**: Hỗ trợ upload file hoặc paste ảnh từ clipboard (Ctrl+V)
- **Drag & Drop**: Kéo thả ảnh vào khu vực upload
- **Preview & Export**: Xem preview SVG và copy mã nguồn

## Cài đặt

```bash
# Clone hoặc tải project về
cd SvgIconParser

# Cài đặt dependencies
npm install

# Chạy server
npm start
```

Server sẽ chạy tại: **http://localhost:3000**

## API Endpoints

### POST /trace/bw
Trace ảnh đen trắng thành SVG

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `image`
- Accepted types: `image/png`, `image/jpeg`, `image/webp`
- Max size: 10MB

**Response:**
```json
{
  "ok": true,
  "svg": "<svg ...>...</svg>",
  "meta": {
    "width": 800,
    "height": 600,
    "durationMs": 1234,
    "paths": 15,
    "mode": "bw",
    "preset": "logo"
  }
}
```

### POST /trace/color
Trace ảnh nhiều màu thành SVG

**Request:** Giống `/trace/bw`

**Response:**
```json
{
  "ok": true,
  "svg": "<svg ...>...</svg>",
  "meta": {
    "width": 800,
    "height": 600,
    "durationMs": 2345,
    "paths": 48,
    "mode": "color",
    "preset": "posterize"
  }
}
```

## Cấu trúc thư mục

```
SvgIconParser/
├── src/
│   ├── preprocessSharp.js    # Module tiền xử lý ảnh với Sharp
│   ├── tracePotrace.js        # Module trace đen trắng
│   └── tracePosterize.js      # Module trace nhiều màu
├── public/
│   ├── index.html             # Giao diện test
│   ├── style.css              # CSS styling
│   └── app.js                 # Client-side JavaScript
├── server.js                  # Express server
└── package.json
```

## Công nghệ sử dụng

- **Express**: Web framework
- **Multer**: File upload middleware
- **Sharp**: Image processing (resize, threshold, blur...)
- **Potrace**: Bitmap to vector tracing

## Workflow xử lý

### B/W Mode
1. Rotate theo EXIF
2. Resize nếu > 1600px (kernel Lanczos3)
3. Median filter (khử nhiễu)
4. Normalize (kéo giãn histogram)
5. Grayscale
6. Threshold (Otsu auto)
7. Blur nhẹ (0.3) để giảm răng cưa
8. Trace với Potrace

### Color Mode
1. Rotate theo EXIF
2. Resize nếu > 1600px (kernel Lanczos3)
3. Blur (0.6) để ổn định rìa
4. Normalize
5. Posterize với 12 steps

## License

ISC
