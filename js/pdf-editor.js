// PDF 편집 및 내보내기 클래스 (pdf-lib 사용)
class PDFEditor {
    constructor() {
        this.originalPdfBytes = null;
    }

    async loadOriginalPDF(arrayBuffer) {
        this.originalPdfBytes = arrayBuffer;
    }

    async exportPDF(originalPdfFile, elementsByPage, canvasDimensions) {
        try {
            // 원본 PDF 로드
            const arrayBuffer = await originalPdfFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            // 모든 페이지 가져오기
            const pages = pdfDoc.getPages();

            // 각 페이지별로 요소 추가
            for (const [pageNum, elements] of Object.entries(elementsByPage)) {
                const pageIndex = parseInt(pageNum) - 1; // 페이지 번호는 1부터 시작, 인덱스는 0부터
                if (pageIndex < 0 || pageIndex >= pages.length) continue;

                const page = pages[pageIndex];
                const { width: pdfWidth, height: pdfHeight } = page.getSize();

                // 각 요소를 PDF에 추가
                for (const element of elements) {
                    if (element.type === 'text') {
                        await this.addTextElement(pdfDoc, page, element, pdfHeight, canvasDimensions);
                    } else if (element.type === 'image') {
                        await this.addImageElement(pdfDoc, page, element, pdfHeight, canvasDimensions);
                    }
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

            // 이미지 크기 계산
            // renderTextAsImage에서 dpi=2로 2배 크기 캔버스를 만들었으므로
            // 실제 텍스트 박스 크기에 맞게 조정
            const imgWidth = element.width * scale;
            const imgHeight = element.height * scale;

            // 이미지 그리기
            page.drawImage(pdfImage, {
                x: pdfX,
                y: pdfY,
                width: imgWidth,
                height: imgHeight
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

                // 여러 줄 텍스트 처리
                const lines = element.content.split('\n');
                const lineHeight = element.fontSize * 1.4; // 줄 간격

                // 최대 텍스트 너비 계산
                let maxWidth = 0;
                lines.forEach(line => {
                    const metrics = ctx.measureText(line);
                    maxWidth = Math.max(maxWidth, metrics.width);
                });

                // 캔버스 크기 설정 (텍스트 박스 크기 또는 측정된 크기)
                const textWidth = Math.max(maxWidth, element.width || 200);
                const textHeight = Math.max(lines.length * lineHeight, element.height || 60);

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

                // 여러 줄 텍스트 그리기
                lines.forEach((line, index) => {
                    ctx.fillText(line, 0, index * lineHeight);
                });

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
