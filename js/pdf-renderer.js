// PDF 렌더링 클래스 (PDF.js 사용)
class PDFRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.5;
        this.currentPageObj = null;

        // PDF.js worker 설정
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    async loadPDF(file) {
        if (!isValidPDF(file)) {
            throw new Error('유효한 PDF 파일이 아닙니다.');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;

            await this.renderPage(this.currentPage);
            return true;
        } catch (error) {
            console.error('PDF 로드 실패:', error);
            throw new Error('PDF를 로드할 수 없습니다.');
        }
    }

    async renderPage(pageNumber) {
        if (!this.pdfDoc || pageNumber < 1 || pageNumber > this.totalPages) {
            return;
        }

        try {
            this.currentPage = pageNumber;
            this.currentPageObj = await this.pdfDoc.getPage(pageNumber);

            const viewport = this.currentPageObj.getViewport({ scale: this.scale });

            this.canvas.width = viewport.width;
            this.canvas.height = viewport.height;

            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };

            await this.currentPageObj.render(renderContext).promise;

            return {
                width: viewport.width,
                height: viewport.height
            };
        } catch (error) {
            console.error('페이지 렌더링 실패:', error);
            throw error;
        }
    }

    getPageDimensions() {
        if (!this.currentPageObj) {
            return { width: 0, height: 0 };
        }

        const viewport = this.currentPageObj.getViewport({ scale: this.scale });
        return {
            width: viewport.width,
            height: viewport.height
        };
    }

    async nextPage() {
        if (this.currentPage < this.totalPages) {
            await this.renderPage(this.currentPage + 1);
            return true;
        }
        return false;
    }

    async previousPage() {
        if (this.currentPage > 1) {
            await this.renderPage(this.currentPage - 1);
            return true;
        }
        return false;
    }

    getCurrentPage() {
        return this.currentPage;
    }

    getTotalPages() {
        return this.totalPages;
    }

    async setZoom(scale) {
        this.scale = scale;
        if (this.currentPageObj) {
            await this.renderPage(this.currentPage);
        }
        return this.scale;
    }

    getZoom() {
        return this.scale;
    }

    async zoomIn() {
        const newScale = Math.min(this.scale + 0.25, 3.0); // 최대 300%
        return await this.setZoom(newScale);
    }

    async zoomOut() {
        const newScale = Math.max(this.scale - 0.25, 0.5); // 최소 50%
        return await this.setZoom(newScale);
    }

    async fitWidth(containerWidth) {
        if (!this.currentPageObj) return this.scale;

        const originalViewport = this.currentPageObj.getViewport({ scale: 1.0 });
        const newScale = (containerWidth - 40) / originalViewport.width; // 40px 여백
        return await this.setZoom(newScale);
    }

    async fitPage(containerWidth, containerHeight) {
        if (!this.currentPageObj) return this.scale;

        const originalViewport = this.currentPageObj.getViewport({ scale: 1.0 });
        const scaleWidth = (containerWidth - 40) / originalViewport.width;
        const scaleHeight = (containerHeight - 40) / originalViewport.height;
        const newScale = Math.min(scaleWidth, scaleHeight);
        return await this.setZoom(newScale);
    }

    getOriginalPageDimensions() {
        if (!this.currentPageObj) {
            return { width: 0, height: 0 };
        }

        const viewport = this.currentPageObj.getViewport({ scale: 1.0 });
        return {
            width: viewport.width,
            height: viewport.height
        };
    }
}
