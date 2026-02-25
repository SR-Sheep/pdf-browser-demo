// 유틸리티 함수들

// 고유 ID 생성
function generateUniqueId() {
    return 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// HEX 색상을 RGB로 변환
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// Base64 문자열을 ArrayBuffer로 변환
function base64ToArrayBuffer(base64) {
    const base64Data = base64.split(',')[1];
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Canvas 좌표를 PDF 좌표로 변환
function canvasToPDFCoords(canvasY, canvasHeight, pdfPageHeight) {
    const scale = pdfPageHeight / canvasHeight;
    return pdfPageHeight - (canvasY * scale);
}

// 파일이 유효한 이미지인지 확인
function isValidImage(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    return file && validTypes.includes(file.type);
}

// 파일이 유효한 PDF인지 확인
function isValidPDF(file) {
    return file && file.type === 'application/pdf';
}
