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
        this.zoomInBtn = document.getElementById('zoom-in-btn');
        this.zoomOutBtn = document.getElementById('zoom-out-btn');
        this.zoomLevel = document.getElementById('zoom-level');
        this.fitWidthBtn = document.getElementById('fit-width-btn');
        this.fitPageBtn = document.getElementById('fit-page-btn');
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
                // 같은 파일을 다시 선택할 수 있도록 초기화
                e.target.value = '';
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

        // 줌 컨트롤
        this.zoomInBtn.addEventListener('click', () => {
            this.app.zoomIn();
        });

        this.zoomOutBtn.addEventListener('click', () => {
            this.app.zoomOut();
        });

        this.fitWidthBtn.addEventListener('click', () => {
            this.app.fitWidth();
        });

        this.fitPageBtn.addEventListener('click', () => {
            this.app.fitPage();
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
        this.zoomInBtn.disabled = false;
        this.zoomOutBtn.disabled = false;
        this.fitWidthBtn.disabled = false;
        this.fitPageBtn.disabled = false;
    }

    disableEditingButtons() {
        this.addTextBtn.disabled = true;
        this.addImageBtn.disabled = true;
        this.downloadBtn.disabled = true;
        this.zoomInBtn.disabled = true;
        this.zoomOutBtn.disabled = true;
        this.fitWidthBtn.disabled = true;
        this.fitPageBtn.disabled = true;
    }

    updateZoomLevel(scale) {
        const percentage = Math.round(scale * 100);
        this.zoomLevel.textContent = `${percentage}%`;
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
