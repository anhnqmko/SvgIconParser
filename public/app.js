/**
 * SVG Icon Parser - Client Side Application
 */

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const imageInfo = document.getElementById('imageInfo');
const btnTraceBW = document.getElementById('btnTraceBW');
const btnTraceColor = document.getElementById('btnTraceColor');
const processingStatus = document.getElementById('processingStatus');
const errorMessage = document.getElementById('errorMessage');
const resultSection = document.getElementById('resultSection');
const resultMeta = document.getElementById('resultMeta');
const svgPreview = document.getElementById('svgPreview');
const svgCode = document.getElementById('svgCode');
const btnCopySVG = document.getElementById('btnCopySVG');
const copyStatus = document.getElementById('copyStatus');

// State
let currentImageFile = null;
let currentImageBlob = null;

// Allowed MIME types
const ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Validate file type
 */
function validateFile(file) {
    if (!ALLOWED_MIMES.includes(file.type)) {
        showError('INVALID_TYPE', 'Chỉ chấp nhận file PNG, JPEG hoặc WEBP');
        return false;
    }
    if (file.size > 10 * 1024 * 1024) {
        showError('FILE_TOO_LARGE', 'File vượt quá giới hạn 10MB');
        return false;
    }
    return true;
}

/**
 * Display image preview
 */
function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewContainer.classList.remove('hidden');
        
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
            const sizeKB = (file.size / 1024).toFixed(2);
            imageInfo.textContent = `${img.width} × ${img.height} px • ${sizeKB} KB`;
        };
        img.src = e.target.result;
        
        // Enable buttons
        btnTraceBW.disabled = false;
        btnTraceColor.disabled = false;
        
        // Hide result and error
        resultSection.classList.add('hidden');
        errorMessage.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

/**
 * Handle file selection
 */
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
        currentImageFile = file;
        currentImageBlob = null;
        displayImagePreview(file);
    }
});

/**
 * Handle paste event
 */
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    
    for (let item of items) {
        if (item.type.startsWith('image/')) {
            e.preventDefault();
            const blob = item.getAsFile();
            
            if (validateFile(blob)) {
                currentImageFile = null;
                currentImageBlob = blob;
                displayImagePreview(blob);
            }
            break;
        }
    }
});

/**
 * Show error message
 */
function showError(code, message) {
    errorMessage.innerHTML = `<strong>${code}:</strong> ${message}`;
    errorMessage.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

/**
 * Show processing status
 */
function showProcessing() {
    processingStatus.classList.remove('hidden');
    btnTraceBW.disabled = true;
    btnTraceColor.disabled = true;
    hideError();
}

/**
 * Hide processing status
 */
function hideProcessing() {
    processingStatus.classList.add('hidden');
    btnTraceBW.disabled = false;
    btnTraceColor.disabled = false;
}

/**
 * Trace image
 */
async function traceImage(endpoint, mode) {
    // Validate image exists
    const imageToSend = currentImageFile || currentImageBlob;
    if (!imageToSend) {
        showError('NO_IMAGE', 'Vui lòng chọn ảnh trước');
        return;
    }
    
    showProcessing();
    
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('image', imageToSend);
        
        // Send request
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.ok) {
            throw new Error(data.error?.message || 'Lỗi không xác định');
        }
        
        // Display result
        displayResult(data);
        
    } catch (error) {
        showError('REQUEST_ERROR', error.message);
    } finally {
        hideProcessing();
    }
}

/**
 * Display trace result
 */
function displayResult(data) {
    // Show result section
    resultSection.classList.remove('hidden');
    
    // Display metadata
    const meta = data.meta;
    resultMeta.innerHTML = `
        <strong>Chế độ:</strong> ${meta.mode === 'bw' ? 'Đen trắng' : 'Nhiều màu'} 
        (${meta.preset}) • 
        <strong>Kích thước:</strong> ${meta.width} × ${meta.height} px • 
        <strong>Số path:</strong> ${meta.paths} • 
        <strong>Thời gian:</strong> ${meta.durationMs} ms
    `;
    
    // Display SVG preview
    svgPreview.innerHTML = data.svg;
    
    // Display SVG code
    svgCode.value = data.svg;
    
    // Reset copy status
    copyStatus.classList.add('hidden');
    
    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Handle trace B/W button
 */
btnTraceBW.addEventListener('click', () => {
    traceImage('/trace/bw', 'bw');
});

/**
 * Handle trace Color button
 */
btnTraceColor.addEventListener('click', () => {
    traceImage('/trace/color', 'color');
});

/**
 * Handle copy SVG button
 */
btnCopySVG.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(svgCode.value);
        copyStatus.classList.remove('hidden');
        
        // Hide status after 2 seconds
        setTimeout(() => {
            copyStatus.classList.add('hidden');
        }, 2000);
    } catch (error) {
        alert('Không thể copy: ' + error.message);
    }
});

/**
 * Handle tab switching
 */
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Remove active class from all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab
        button.classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');
    });
});

/**
 * Drag and drop support
 */
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#764ba2';
    uploadArea.style.background = '#f0f2ff';
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '#f8f9ff';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '#f8f9ff';
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
        currentImageFile = file;
        currentImageBlob = null;
        displayImagePreview(file);
    }
});
