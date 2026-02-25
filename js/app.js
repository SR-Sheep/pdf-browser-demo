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
        this.resizeHandler = new ResizeHandler(document.getElementById('elements-overlay'), this.elementManager, this);

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
        this.setupTextBoxCreation();
        console.log('PDF Editor 초기화 완료');
    }

    setupEventListeners() {
        // 오버레이 클릭 (요소 선택)
        this.overlay.addEventListener('click', (e) => {
            if (this.isAddingText) {
                // 텍스트 추가 모드는 mousedown/mouseup으로 처리
                return;
            } else {
                // 요소를 클릭한 경우에만 선택
                const elementDiv = e.target.closest('.pdf-element');
                if (elementDiv) {
                    this.handleElementClick(e);
                } else {
                    // 빈 공간 클릭 시 선택 해제
                    this.deselectAllElements();
                }
            }
        });

        // 캔버스 클릭 (선택 해제)
        this.canvas.addEventListener('click', (e) => {
            if (this.isAddingText) {
                // 텍스트 추가 모드는 mousedown/mouseup으로 처리
                return;
            } else {
                // 캔버스 빈 공간 클릭 시 선택 해제
                this.deselectAllElements();
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

        // mousedown으로 처리하지 않고 click 이벤트만 처리하지 않도록 수정
        e.preventDefault();
        e.stopPropagation();
    }

    setupTextBoxCreation() {
        let isMouseDown = false;
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        let dragRect = null;
        let rect = null;

        const onMouseDown = (e) => {
            if (!this.isAddingText) return;
            if (e.target.closest('.pdf-element')) return;

            isMouseDown = true;
            isDragging = false;

            if (e.target.id === 'pdf-canvas') {
                rect = this.canvas.getBoundingClientRect();
            } else if (e.target.id === 'elements-overlay' || e.target.closest('#elements-overlay')) {
                rect = this.overlay.getBoundingClientRect();
            } else {
                return;
            }

            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;

            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!isMouseDown || !this.isAddingText) return;

            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            // 20px 이상 움직이면 드래그로 간주
            const dist = Math.abs(e.clientX - rect.left - startX) +
                         Math.abs(e.clientY - rect.top - startY);

            if (!isDragging && dist > 20) {
                isDragging = true;
                // 드래그 사각형 표시
                dragRect = document.createElement('div');
                dragRect.style.cssText = `
                    position: absolute;
                    border: 2px dashed #007bff;
                    background: rgba(0, 123, 255, 0.1);
                    pointer-events: none;
                    z-index: 1000;
                `;
                this.overlay.appendChild(dragRect);
            }

            if (isDragging && dragRect) {
                const left = Math.min(startX, currentX);
                const top = Math.min(startY, currentY);
                const width = Math.abs(currentX - startX);
                const height = Math.abs(currentY - startY);

                dragRect.style.left = left + 'px';
                dragRect.style.top = top + 'px';
                dragRect.style.width = width + 'px';
                dragRect.style.height = height + 'px';
            }

            e.preventDefault();
        };

        const onMouseUp = (e) => {
            if (!isMouseDown || !this.isAddingText) return;

            isMouseDown = false;

            if (isDragging && dragRect) {
                // 드래그한 크기로 텍스트 박스 생성
                const width = Math.max(50, parseFloat(dragRect.style.width));
                const height = Math.max(30, parseFloat(dragRect.style.height));
                const x = parseFloat(dragRect.style.left);
                const y = parseFloat(dragRect.style.top);

                dragRect.remove();
                dragRect = null;

                const element = this.elementManager.addTextElement(
                    x, y, '',
                    { fontSize: 16, fontFamily: 'Helvetica', color: '#000000', width, height }
                );

                this.cancelAddTextMode();
                this.renderElements();
                this.selectElement(element.id);

                setTimeout(() => {
                    const elementDiv = document.querySelector(`.pdf-element[data-id="${element.id}"]`);
                    if (elementDiv) this.makeTextEditable(elementDiv, element);
                }, 0);
            } else if (!isDragging) {
                // 클릭만 한 경우 기본 크기로 생성
                const element = this.elementManager.addTextElement(
                    startX, startY, '',
                    { fontSize: 16, fontFamily: 'Helvetica', color: '#000000' }
                );

                this.cancelAddTextMode();
                this.renderElements();
                this.selectElement(element.id);

                setTimeout(() => {
                    const elementDiv = document.querySelector(`.pdf-element[data-id="${element.id}"]`);
                    if (elementDiv) this.makeTextEditable(elementDiv, element);
                }, 0);
            }

            isDragging = false;
            e.preventDefault();
        };

        this.overlay.addEventListener('mousedown', onMouseDown);
        this.canvas.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
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

        // 모든 페이지의 요소 가져오기
        const allElements = this.elementManager.elementsByPage;
        const hasAnyElements = Object.values(allElements).some(pageElements => pageElements.length > 0);

        if (!hasAnyElements) {
            alert('추가된 요소가 없습니다. 텍스트나 이미지를 추가해주세요.');
            return;
        }

        try {
            const canvasDimensions = this.pdfRenderer.getPageDimensions();
            const pdfBytes = await this.pdfEditor.exportPDF(
                this.pdfFile,
                allElements, // 페이지별 요소 전달
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

            // width와 height 적용
            if (element.width) {
                div.style.width = element.width + 'px';
            }
            if (element.height) {
                div.style.height = element.height + 'px';
            }

            // 8개 리사이즈 핸들 생성
            const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
            handles.forEach(pos => {
                const handle = document.createElement('div');
                handle.className = `resize-handle resize-${pos}`;
                handle.dataset.position = pos;
                div.appendChild(handle);
            });
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

        // 텍스트 박스의 실제 크기 사용
        textarea.style.width = (element.width - 16) + 'px';  // padding 제외
        textarea.style.height = (element.height - 16) + 'px';
        textarea.style.fontSize = element.fontSize + 'px';
        textarea.style.fontFamily = element.fontFamily;
        textarea.style.color = element.color;
        textarea.style.border = 'none';
        textarea.style.background = 'transparent';
        textarea.style.padding = '0';
        textarea.style.outline = 'none';
        textarea.style.boxSizing = 'border-box';
        textarea.style.resize = 'none';  // 리사이즈 비활성화 (핸들로만 조절)
        textarea.style.lineHeight = '1.4';
        textarea.style.overflow = 'hidden';

        elementDiv.textContent = '';
        elementDiv.appendChild(textarea);
        elementDiv.classList.add('editing');

        // 자동 높이 조절 함수
        const autoResize = () => {
            textarea.style.height = 'auto';
            const newHeight = Math.max(30, textarea.scrollHeight);
            textarea.style.height = newHeight + 'px';

            // 요소의 실제 높이도 업데이트 (padding 포함)
            elementDiv.style.height = (newHeight + 16) + 'px';
        };

        // 초기 높이 설정
        autoResize();

        // 입력할 때마다 높이 조절
        textarea.addEventListener('input', autoResize);

        textarea.focus();
        textarea.select();

        // Ctrl+Enter로 완료, Esc로 취소, Tab으로 완료
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.finishTextEdit(elementDiv, element, textarea.value);
                e.preventDefault();
            } else if (e.key === 'Escape') {
                this.finishTextEdit(elementDiv, element, originalText);
            } else if (e.key === 'Tab') {
                this.finishTextEdit(elementDiv, element, textarea.value);
                e.preventDefault();
            }
        });

        textarea.addEventListener('blur', () => {
            this.finishTextEdit(elementDiv, element, textarea.value);
        });
    }

    finishTextEdit(elementDiv, element, newText) {
        // textarea가 이미 제거되었으면 무시
        if (!elementDiv.querySelector('textarea')) return;

        elementDiv.classList.remove('editing');

        // 빈 텍스트면 요소 삭제
        if (newText.trim() === '') {
            this.elementManager.deleteElement(element.id);
            this.renderElements();
        } else {
            // 현재 요소의 높이 가져오기 (자동 조절된 높이)
            const currentHeight = parseFloat(elementDiv.style.height);

            // 텍스트와 높이 업데이트
            this.elementManager.updateElement(element.id, {
                content: newText,
                height: currentHeight || element.height
            });
            this.renderElements();
            this.selectElement(element.id);
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
            // 현재 페이지 설정
            this.elementManager.setCurrentPage(this.pdfRenderer.getCurrentPage());

            this.toolbar.updatePageIndicator(
                this.pdfRenderer.getCurrentPage(),
                this.pdfRenderer.getTotalPages()
            );

            // 오버레이 크기 조정
            const dimensions = this.pdfRenderer.getPageDimensions();
            this.overlay.style.width = dimensions.width + 'px';
            this.overlay.style.height = dimensions.height + 'px';

            // 페이지별 요소 렌더링
            this.renderElements();
        }
    }

    async previousPage() {
        const success = await this.pdfRenderer.previousPage();
        if (success) {
            // 현재 페이지 설정
            this.elementManager.setCurrentPage(this.pdfRenderer.getCurrentPage());

            this.toolbar.updatePageIndicator(
                this.pdfRenderer.getCurrentPage(),
                this.pdfRenderer.getTotalPages()
            );

            // 오버레이 크기 조정
            const dimensions = this.pdfRenderer.getPageDimensions();
            this.overlay.style.width = dimensions.width + 'px';
            this.overlay.style.height = dimensions.height + 'px';

            // 페이지별 요소 렌더링
            this.renderElements();
        }
    }
}

// DOM이 로드되면 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.pdfApp = new PDFEditorApp();
    console.log('PDF Browser Editor 시작');
});
