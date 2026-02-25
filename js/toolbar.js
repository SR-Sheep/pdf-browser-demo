// 툴바 관리 클래스
class Toolbar {
    constructor(app) {
        this.app = app;

        // 버튼 요소들
        this.uploadPdfBtn = document.getElementById('upload-pdf-btn');
        this.pdfUploadInput = document.getElementById('pdf-upload');
        this.addTextBtn = document.getElementById('add-text-btn');
        this.addImageBtn = document.getElementById('add-image-btn');
        this.imageUploadInput = document.getElementById('image-upload');
        this.deleteBtn = document.getElementById('delete-btn');
        this.prevPageBtn = document.getElementById('prev-page-btn');
        this.nextPageBtn = document.getElementById('next-page-btn');
        this.pageIndicator = document.getElementById('page-indicator');
        this.downloadBtn = document.getElementById('download-btn');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // PDF 업로드
        this.uploadPdfBtn.addEventListener('click', () => {
            this.pdfUploadInput.click();
        });

        this.pdfUploadInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.app.loadPDF(e.target.files[0]);
            }
        });

        // 텍스트 추가
        this.addTextBtn.addEventListener('click', () => {
            this.app.addText();
        });

        // 이미지 추가
        this.addImageBtn.addEventListener('click', () => {
            this.imageUploadInput.click();
        });

        this.imageUploadInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.app.addImage(e.target.files[0]);
            }
        });

        // 삭제
        this.deleteBtn.addEventListener('click', () => {
            this.app.deleteSelectedElement();
        });

        // 페이지 네비게이션
        this.prevPageBtn.addEventListener('click', () => {
            this.app.previousPage();
        });

        this.nextPageBtn.addEventListener('click', () => {
            this.app.nextPage();
        });

        // PDF 다운로드
        this.downloadBtn.addEventListener('click', () => {
            this.app.downloadPDF();
        });
    }

    enableEditingButtons() {
        this.addTextBtn.disabled = false;
        this.addImageBtn.disabled = false;
        this.downloadBtn.disabled = false;
    }

    disableEditingButtons() {
        this.addTextBtn.disabled = true;
        this.addImageBtn.disabled = true;
        this.downloadBtn.disabled = true;
    }

    updatePageIndicator(currentPage, totalPages) {
        this.pageIndicator.textContent = `페이지 ${currentPage} / ${totalPages}`;

        this.prevPageBtn.disabled = currentPage <= 1;
        this.nextPageBtn.disabled = currentPage >= totalPages;
    }

    enableDeleteButton() {
        this.deleteBtn.disabled = false;
    }

    disableDeleteButton() {
        this.deleteBtn.disabled = true;
    }
}
