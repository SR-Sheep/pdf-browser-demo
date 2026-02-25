// 리사이즈 핸들러 클래스 (파워포인트 스타일 크기 조절)
class ResizeHandler {
    constructor(container, elementManager, app) {
        this.container = container;
        this.elementManager = elementManager;
        this.app = app;
        this.isResizing = false;
        this.currentElement = null;
        this.resizePosition = null;
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.startLeft = 0;
        this.startTop = 0;
        this.previewBox = null; // 크기 조절 미리보기 박스

        this.init();
    }

    init() {
        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    onMouseDown(e) {
        const handle = e.target.closest('.resize-handle');
        if (!handle) return;

        this.isResizing = true;
        this.currentElement = handle.closest('.pdf-element');
        this.resizePosition = handle.dataset.position;

        const rect = this.currentElement.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = rect.width;
        this.startHeight = rect.height;
        this.startLeft = parseFloat(this.currentElement.style.left);
        this.startTop = parseFloat(this.currentElement.style.top);

        // 미리보기 박스 생성 (파워포인트 스타일)
        this.previewBox = document.createElement('div');
        this.previewBox.style.cssText = `
            position: absolute;
            left: ${this.startLeft}px;
            top: ${this.startTop}px;
            width: ${this.startWidth}px;
            height: ${this.startHeight}px;
            border: 2px dashed #007bff;
            background: rgba(0, 123, 255, 0.1);
            pointer-events: none;
            z-index: 999;
            box-sizing: border-box;
        `;
        this.container.appendChild(this.previewBox);

        e.preventDefault();
        e.stopPropagation();
    }

    onMouseMove(e) {
        if (!this.isResizing || !this.previewBox) return;

        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;

        let newWidth = this.startWidth;
        let newHeight = this.startHeight;
        let newLeft = this.startLeft;
        let newTop = this.startTop;

        // 방향별 크기 조절 로직
        const pos = this.resizePosition;

        if (pos.includes('e')) {
            newWidth = this.startWidth + deltaX;
        }
        if (pos.includes('w')) {
            newWidth = this.startWidth - deltaX;
            newLeft = this.startLeft + deltaX;
        }
        if (pos.includes('s')) {
            newHeight = this.startHeight + deltaY;
        }
        if (pos.includes('n')) {
            newHeight = this.startHeight - deltaY;
            newTop = this.startTop + deltaY;
        }

        // 최소 크기 제한
        const minWidth = 50;
        const minHeight = 30;

        if (newWidth < minWidth) {
            if (pos.includes('w')) {
                newLeft = this.startLeft + (this.startWidth - minWidth);
            }
            newWidth = minWidth;
        }

        if (newHeight < minHeight) {
            if (pos.includes('n')) {
                newTop = this.startTop + (this.startHeight - minHeight);
            }
            newHeight = minHeight;
        }

        // 미리보기 박스만 업데이트 (원본은 그대로 유지)
        this.previewBox.style.width = newWidth + 'px';
        this.previewBox.style.height = newHeight + 'px';
        this.previewBox.style.left = newLeft + 'px';
        this.previewBox.style.top = newTop + 'px';

        e.preventDefault();
    }

    onMouseUp(e) {
        if (!this.isResizing || !this.previewBox) return;

        // 미리보기 박스의 최종 크기와 위치 가져오기
        const width = parseFloat(this.previewBox.style.width);
        let height = parseFloat(this.previewBox.style.height);
        const x = parseFloat(this.previewBox.style.left);
        const y = parseFloat(this.previewBox.style.top);

        // 미리보기 박스 제거
        this.previewBox.remove();
        this.previewBox = null;

        // 데이터 모델 업데이트
        const id = this.currentElement.dataset.id;
        const element = this.elementManager.getElement(id);

        // 텍스트 요소인 경우 내용에 맞게 높이 재조정
        if (element && element.type === 'text' && element.content) {
            // 임시로 높이 계산
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `
                position: absolute;
                visibility: hidden;
                width: ${width - 16}px;
                font-size: ${element.fontSize}px;
                font-family: ${element.fontFamily};
                line-height: 1.4;
                white-space: pre-wrap;
                word-break: break-word;
                padding: 8px;
                box-sizing: border-box;
            `;
            tempDiv.textContent = element.content;
            document.body.appendChild(tempDiv);

            const contentHeight = tempDiv.scrollHeight;
            document.body.removeChild(tempDiv);

            // 내용 높이가 지정한 높이보다 크면 내용에 맞춤
            height = Math.max(height, contentHeight);
        }

        // 원본 요소 크기 업데이트
        this.elementManager.updateElement(id, {
            width,
            height,
            x,
            y
        });

        // 요소 다시 렌더링
        this.app.renderElements();
        this.app.selectElement(id);

        this.isResizing = false;
        this.currentElement = null;

        e.preventDefault();
    }
}
