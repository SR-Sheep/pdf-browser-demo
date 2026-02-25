// 이미지 핸들러 클래스
class ImageHandler {
    constructor(elementManager) {
        this.elementManager = elementManager;
    }

    async uploadImage(file) {
        if (!isValidImage(file)) {
            throw new Error('유효한 이미지 파일이 아닙니다. PNG 또는 JPEG만 지원합니다.');
        }

        try {
            const imageData = await this.convertToBase64(file);
            const dimensions = await this.getImageDimensions(imageData);

            // 최대 크기 제한
            const maxSize = 300;
            let width = dimensions.width;
            let height = dimensions.height;

            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = width * ratio;
                height = height * ratio;
            }

            return {
                imageData,
                width,
                height
            };
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
            throw error;
        }
    }

    convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    getImageDimensions(base64Data) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.onerror = reject;
            img.src = base64Data;
        });
    }

    addImageToCanvas(imageData, width, height, x = 100, y = 100) {
        const element = this.elementManager.addImageElement(x, y, imageData, width, height);
        return element;
    }

    validateImage(file) {
        if (!file) {
            return { valid: false, error: '파일이 선택되지 않았습니다.' };
        }

        if (!isValidImage(file)) {
            return { valid: false, error: 'PNG 또는 JPEG 형식만 지원합니다.' };
        }

        // 파일 크기 체크 (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return { valid: false, error: '파일 크기는 10MB 이하여야 합니다.' };
        }

        return { valid: true };
    }
}
