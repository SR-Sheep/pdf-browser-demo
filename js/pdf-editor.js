// PDF 편집 및 내보내기 클래스 (pdf-lib 사용)
class PDFEditor {
    constructor() {
        this.originalPdfBytes = null;
    }

    async loadOriginalPDF(arrayBuffer) {
        this.originalPdfBytes = arrayBuffer;
    }

    async exportPDF(originalPdfFile, elements, canvasDimensions) {
        try {
            // 원본 PDF 로드
            const arrayBuffer = await originalPdfFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            // 첫 페이지 가져오기 (다중 페이지는 향후 구현)
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();

            // 각 요소를 PDF에 추가
            for (const element of elements) {
                if (element.type === 'text') {
                    await this.addTextElement(pdfDoc, firstPage, element, pdfHeight, canvasDimensions);
                } else if (element.type === 'image') {
                    await this.addImageElement(pdfDoc, firstPage, element, pdfHeight, canvasDimensions);
                }
            }

            // PDF 직렬화
            const pdfBytes = await pdfDoc.save();
            return pdfBytes;
        } catch (error) {
            console.error('PDF 내보내기 실패:', error);
            throw new Error('PDF를 생성할 수 없습니다: ' + error.message);
        }
    }

    async addTextElement(pdfDoc, page, element, pdfHeight, canvasDimensions) {
        try {
            // 스케일 계산
            const scale = pdfHeight / canvasDimensions.height;

            // Canvas 좌표를 PDF 좌표로 변환
            const pdfX = element.x * scale;
            const pdfY = pdfHeight - (element.y * scale) - (element.fontSize * scale);

            // 텍스트를 이미지로 렌더링 (한글 지원)
            const textImage = await this.renderTextAsImage(element);

            // 이미지를 PDF에 임베드
            const imageBytes = base64ToArrayBuffer(textImage);
            const pdfImage = await pdfDoc.embedPng(imageBytes);

            const imgDims = pdfImage.scale(scale);

            // 이미지 그리기
            page.drawImage(pdfImage, {
                x: pdfX,
                y: pdfY,
                width: imgDims.width,
                height: imgDims.height
            });
        } catch (error) {
            console.error('텍스트 요소 추가 실패:', error);
            throw error;
        }
    }

    async renderTextAsImage(element) {
        return new Promise((resolve, reject) => {
            try {
                // 임시 캔버스 생성
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 폰트 설정
                ctx.font = `${element.fontSize}px ${element.fontFamily}`;

                // 텍스트 크기 측정
                const metrics = ctx.measureText(element.content);
                const textWidth = metrics.width;
                const textHeight = element.fontSize * 1.5; // 여유 공간 포함

                // 캔버스 크기 설정 (고해상도)
                const dpi = 2;
                canvas.width = textWidth * dpi;
                canvas.height = textHeight * dpi;

                // 스케일 조정
                ctx.scale(dpi, dpi);

                // 배경을 투명하게
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 텍스트 스타일 재설정 (scale 후 재설정 필요)
                ctx.font = `${element.fontSize}px ${element.fontFamily}`;
                ctx.fillStyle = element.color;
                ctx.textBaseline = 'top';

                // 텍스트 그리기
                ctx.fillText(element.content, 0, 0);

                // PNG로 변환
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
            } catch (error) {
                reject(error);
            }
        });
    }

    async addImageElement(pdfDoc, page, element, pdfHeight, canvasDimensions) {
        try {
            // 스케일 계산
            const scale = pdfHeight / canvasDimensions.height;

            // Canvas 좌표를 PDF 좌표로 변환
            const pdfX = element.x * scale;
            const pdfY = pdfHeight - (element.y * scale) - (element.height * scale);

            // 이미지 임베드
            let image;
            if (element.imageData.includes('data:image/png')) {
                const imageBytes = base64ToArrayBuffer(element.imageData);
                image = await pdfDoc.embedPng(imageBytes);
            } else if (element.imageData.includes('data:image/jpeg') || element.imageData.includes('data:image/jpg')) {
                const imageBytes = base64ToArrayBuffer(element.imageData);
                image = await pdfDoc.embedJpg(imageBytes);
            } else {
                throw new Error('지원하지 않는 이미지 형식입니다.');
            }

            // 이미지 그리기
            page.drawImage(image, {
                x: pdfX,
                y: pdfY,
                width: element.width * scale,
                height: element.height * scale
            });
        } catch (error) {
            console.error('이미지 요소 추가 실패:', error);
            throw error;
        }
    }

    async getFont(pdfDoc, fontFamily) {
        // 표준 PDF 폰트 매핑
        const fontMap = {
            'Helvetica': PDFLib.StandardFonts.Helvetica,
            'Times-Roman': PDFLib.StandardFonts.TimesRoman,
            'Courier': PDFLib.StandardFonts.Courier
        };

        const standardFont = fontMap[fontFamily] || PDFLib.StandardFonts.Helvetica;
        return await pdfDoc.embedFont(standardFont);
    }

    async downloadPDF(pdfBytes, filename = 'edited-document.pdf') {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, filename);
    }
}
