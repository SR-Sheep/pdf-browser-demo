// 메인 애플리케이션 클래스
class PDFEditorApp {
    constructor() {
        // 컴포넌트 초기화
        this.pdfRenderer = new PDFRenderer(document.getElementById('pdf-canvas'));
        this.elementManager = new ElementManager();
        this.dragHandler = new DragHandler(document.getElementById('elements-overlay'), this.elementManager);
        this.imageHandler = new ImageHandler(this.elementManager);
        this.pdfEditor = new PDFEditor();
        this.toolbar = new Toolbar(this);

        // 상태
        this.pdfFile = null;
        this.noPdfMessage = document.getElementById('no-pdf-message');
        this.canvas = document.getElementById('pdf-canvas');
        this.overlay = document.getElementById('elements-overlay');
        this.isAddingText = false; // 텍스트 추가 모드

        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('PDF Editor 초기화 완료');
    }

    setupEventListeners() {
        // 오버레이 클릭 (텍스트 추가 모드 또는 요소 선택)
        this.overlay.addEventListener('click', (e) => {
            if (this.isAddingText) {
                this.handleAddTextClick(e);
            } else {
                this.handleElementClick(e);
            }
        });

        // 캔버스 클릭 (텍스트 추가 모드)
        this.canvas.addEventListener('click', (e) => {
            if (this.isAddingText) {
                this.handleAddTextClick(e);
            }
        });

        // 요소 더블클릭 (텍스트 편집)
        this.overlay.addEventListener('dblclick', (e) => {
            if (!this.isAddingText) {
                this.handleElementDoubleClick(e);
            }
        });

        // 배경 클릭 (선택 해제 또는 텍스트 추가 모드 취소)
        document.getElementById('pdf-editor-container').addEventListener('click', (e) => {
            if (e.target.id === 'pdf-editor-container') {
                if (this.isAddingText) {
                    this.cancelAddTextMode();
                } else {
                    this.deselectAllElements();
                }
            }
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            // Esc로 텍스트 추가 모드 취소
            if (e.key === 'Escape' && this.isAddingText) {
                this.cancelAddTextMode();
                e.preventDefault();
            }
            // Delete 키로 요소 삭제
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                const selectedElement = this.elementManager.getSelectedElement();
                if (selectedElement && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    this.deleteSelectedElement();
                    e.preventDefault();
                }
            }
        });
    }

    async loadPDF(file) {
        if (!isValidPDF(file)) {
            alert('유효한 PDF 파일을 선택해주세요.');
            return;
        }

        try {
            await this.pdfRenderer.loadPDF(file);
            this.pdfFile = file;

            // UI 업데이트
            this.noPdfMessage.style.display = 'none';
            this.canvas.style.display = 'block';

            // 요소 초기화
            this.elementManager.clearElements();
            this.renderElements();

            // 오버레이 크기 조정
            const dimensions = this.pdfRenderer.getPageDimensions();
            this.overlay.style.width = dimensions.width + 'px';
            this.overlay.style.height = dimensions.height + 'px';

            // 툴바 활성화
            this.toolbar.enableEditingButtons();
            this.toolbar.updatePageIndicator(
                this.pdfRenderer.getCurrentPage(),
                this.pdfRenderer.getTotalPages()
            );

            console.log('PDF 로드 완료:', file.name);
        } catch (error) {
            console.error('PDF 로드 실패:', error);
            alert('PDF를 로드할 수 없습니다: ' + error.message);
        }
    }

    addText() {
        // 텍스트 추가 모드 활성화
        this.isAddingText = true;
        this.overlay.style.cursor = 'crosshair';
        this.canvas.style.cursor = 'crosshair';

        // 툴바 버튼 상태 표시
        document.getElementById('add-text-btn').style.backgroundColor = '#007bff';
        document.getElementById('add-text-btn').style.color = 'white';
    }

    handleAddTextClick(e) {
        // 요소를 클릭한 경우 무시
        if (e.target.closest('.pdf-element')) {
            return;
        }

        // 클릭 위치 계산 (캔버스 또는 오버레이 기준)
        let rect, x, y;

        if (e.target.id === 'pdf-canvas') {
            rect = this.canvas.getBoundingClientRect();
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        } else {
            rect = this.overlay.getBoundingClientRect();
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        // 텍스트 요소 생성
        const element = this.elementManager.addTextElement(
            x,
            y,
            '',
            { fontSize: 16, fontFamily: 'Helvetica', color: '#000000' }
        );

        // 텍스트 추가 모드 종료
        this.cancelAddTextMode();

        this.renderElements();
        this.selectElement(element.id);

        // 바로 편집 모드로 전환
        setTimeout(() => {
            const elementDiv = document.querySelector(`.pdf-element[data-id="${element.id}"]`);
            if (elementDiv) {
                this.makeTextEditable(elementDiv, element);
            }
        }, 0);

        e.stopPropagation();
    }

    cancelAddTextMode() {
        this.isAddingText = false;
        this.overlay.style.cursor = '';
        this.canvas.style.cursor = '';

        // 툴바 버튼 상태 복원
        document.getElementById('add-text-btn').style.backgroundColor = '';
        document.getElementById('add-text-btn').style.color = '';
    }

    async addImage(file) {
        const validation = this.imageHandler.validateImage(file);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        try {
            const { imageData, width, height } = await this.imageHandler.uploadImage(file);
            const element = this.imageHandler.addImageToCanvas(imageData, width, height);

            this.renderElements();
            this.selectElement(element.id);

            console.log('이미지 추가 완료');
        } catch (error) {
            console.error('이미지 추가 실패:', error);
            alert('이미지를 추가할 수 없습니다: ' + error.message);
        }
    }

    deleteSelectedElement() {
        const success = this.elementManager.deleteSelectedElement();
        if (success) {
            this.renderElements();
            this.toolbar.disableDeleteButton();
        }
    }

    async downloadPDF() {
        if (!this.pdfFile) {
            alert('PDF 파일이 로드되지 않았습니다.');
            return;
        }

        const elements = this.elementManager.getAllElements();
        if (elements.length === 0) {
            alert('추가된 요소가 없습니다. 텍스트나 이미지를 추가해주세요.');
            return;
        }

        try {
            const canvasDimensions = this.pdfRenderer.getPageDimensions();
            const pdfBytes = await this.pdfEditor.exportPDF(
                this.pdfFile,
                elements,
                canvasDimensions
            );

            await this.pdfEditor.downloadPDF(pdfBytes, 'edited-document.pdf');
            console.log('PDF 다운로드 완료');
        } catch (error) {
            console.error('PDF 다운로드 실패:', error);
            alert('PDF를 다운로드할 수 없습니다: ' + error.message);
        }
    }

    renderElements() {
        this.overlay.innerHTML = '';

        const elements = this.elementManager.getAllElements();
        elements.forEach(element => {
            const div = this.createElementDiv(element);
            this.overlay.appendChild(div);
        });
    }

    createElementDiv(element) {
        const div = document.createElement('div');
        div.className = 'pdf-element';
        div.dataset.id = element.id;
        div.style.left = element.x + 'px';
        div.style.top = element.y + 'px';

        if (element.type === 'text') {
            div.classList.add('text-element');
            div.textContent = element.content;
            div.style.fontSize = element.fontSize + 'px';
            div.style.fontFamily = element.fontFamily;
            div.style.color = element.color;
        } else if (element.type === 'image') {
            div.classList.add('image-element');
            const img = document.createElement('img');
            img.src = element.imageData;
            img.style.width = element.width + 'px';
            img.style.height = element.height + 'px';
            div.appendChild(img);
        }

        // 선택된 요소 표시
        if (element.id === this.elementManager.selectedElementId) {
            div.classList.add('selected');
        }

        return div;
    }

    handleElementClick(e) {
        const elementDiv = e.target.closest('.pdf-element');
        if (elementDiv) {
            const id = elementDiv.dataset.id;
            this.selectElement(id);
            e.stopPropagation();
        }
    }

    handleElementDoubleClick(e) {
        const elementDiv = e.target.closest('.pdf-element');
        if (elementDiv) {
            const id = elementDiv.dataset.id;
            const element = this.elementManager.getElement(id);

            if (element && element.type === 'text') {
                this.makeTextEditable(elementDiv, element);
                e.stopPropagation();
            }
        }
    }

    makeTextEditable(elementDiv, element) {
        // 이미 편집 중이면 무시
        if (elementDiv.querySelector('textarea')) return;

        // 기존 텍스트 저장
        const originalText = element.content;

        // textarea 요소 생성 (여러 줄 입력 지원)
        const textarea = document.createElement('textarea');
        textarea.value = originalText;
        textarea.placeholder = '텍스트를 입력하세요';
        textarea.style.width = '300px';
        textarea.style.minWidth = '300px';
        textarea.style.minHeight = '80px';
        textarea.style.fontSize = element.fontSize + 'px';
        textarea.style.fontFamily = element.fontFamily;
        textarea.style.color = element.color;
        textarea.style.border = '2px solid #007bff';
        textarea.style.background = 'white';
        textarea.style.padding = '8px';
        textarea.style.outline = 'none';
        textarea.style.boxSizing = 'border-box';
        textarea.style.resize = 'both';
        textarea.style.lineHeight = '1.4';

        // 기존 텍스트 숨기기
        elementDiv.textContent = '';
        elementDiv.appendChild(textarea);

        // 드래그 비활성화
        elementDiv.style.cursor = 'text';

        // 자동 포커스 및 전체 선택
        textarea.focus();
        textarea.select();

        // Ctrl+Enter 또는 Esc로 완료
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.finishTextEdit(elementDiv, element, textarea.value);
                e.preventDefault();
            } else if (e.key === 'Escape') {
                this.finishTextEdit(elementDiv, element, originalText);
            }
        });

        // 포커스 잃으면 완료
        textarea.addEventListener('blur', () => {
            this.finishTextEdit(elementDiv, element, textarea.value);
        });
    }

    finishTextEdit(elementDiv, element, newText) {
        // textarea가 이미 제거되었으면 무시
        if (!elementDiv.querySelector('textarea')) return;

        // 텍스트 업데이트
        if (newText.trim() !== '') {
            this.elementManager.updateElement(element.id, { content: newText });

            // 요소 다시 렌더링
            this.renderElements();

            // 요소 다시 선택
            this.selectElement(element.id);
        } else {
            // 빈 텍스트면 요소 삭제
            this.elementManager.deleteElement(element.id);
            this.renderElements();
        }
    }

    selectElement(id) {
        // 이전 선택 해제
        this.deselectAllElements();

        // 새로운 요소 선택
        const element = this.elementManager.selectElement(id);
        if (element) {
            const elementDiv = document.querySelector(`.pdf-element[data-id="${id}"]`);
            if (elementDiv) {
                elementDiv.classList.add('selected');
            }

            this.toolbar.enableDeleteButton();
        }
    }

    deselectAllElements() {
        this.elementManager.deselectElement();
        document.querySelectorAll('.pdf-element').forEach(el => {
            el.classList.remove('selected');
        });
        this.toolbar.disableDeleteButton();
    }

    async nextPage() {
        const success = await this.pdfRenderer.nextPage();
        if (success) {
            this.toolbar.updatePageIndicator(
                this.pdfRenderer.getCurrentPage(),
                this.pdfRenderer.getTotalPages()
            );

            // 오버레이 크기 조정
            const dimensions = this.pdfRenderer.getPageDimensions();
            this.overlay.style.width = dimensions.width + 'px';
            this.overlay.style.height = dimensions.height + 'px';

            // 요소 초기화 (현재 버전에서는 페이지별 요소를 지원하지 않음)
            this.elementManager.clearElements();
            this.renderElements();
        }
    }

    async previousPage() {
        const success = await this.pdfRenderer.previousPage();
        if (success) {
            this.toolbar.updatePageIndicator(
                this.pdfRenderer.getCurrentPage(),
                this.pdfRenderer.getTotalPages()
            );

            // 오버레이 크기 조정
            const dimensions = this.pdfRenderer.getPageDimensions();
            this.overlay.style.width = dimensions.width + 'px';
            this.overlay.style.height = dimensions.height + 'px';

            // 요소 초기화
            this.elementManager.clearElements();
            this.renderElements();
        }
    }
}

// DOM이 로드되면 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.pdfApp = new PDFEditorApp();
    console.log('PDF Browser Editor 시작');
});
