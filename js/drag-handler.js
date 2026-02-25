// 드래그 앤 드롭 핸들러 클래스
class DragHandler {
    constructor(container, elementManager) {
        this.container = container;
        this.elementManager = elementManager;
        this.isDragging = false;
        this.currentElement = null;
        this.offsetX = 0;
        this.offsetY = 0;

        this.init();
    }

    init() {
        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    onMouseDown(e) {
        const elementDiv = e.target.closest('.pdf-element');
        if (!elementDiv) return;

        // 리사이즈 핸들이면 무시
        if (e.target.classList.contains('resize-handle')) return;

        // 편집 모드면 드래그 불가
        if (elementDiv.classList.contains('editing') || elementDiv.querySelector('textarea')) return;

        this.isDragging = true;
        this.currentElement = elementDiv;

        const rect = elementDiv.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        elementDiv.classList.add('dragging');

        e.preventDefault();
        e.stopPropagation();
    }

    onMouseMove(e) {
        if (!this.isDragging || !this.currentElement) return;

        const containerRect = this.container.getBoundingClientRect();
        let newX = e.clientX - containerRect.left - this.offsetX;
        let newY = e.clientY - containerRect.top - this.offsetY;

        // 경계 체크
        newX = Math.max(0, Math.min(newX, containerRect.width - this.currentElement.offsetWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - this.currentElement.offsetHeight));

        this.currentElement.style.left = newX + 'px';
        this.currentElement.style.top = newY + 'px';

        e.preventDefault();
    }

    onMouseUp(e) {
        if (!this.isDragging || !this.currentElement) return;

        const id = this.currentElement.dataset.id;
        const left = parseInt(this.currentElement.style.left);
        const top = parseInt(this.currentElement.style.top);

        this.elementManager.updateElement(id, { x: left, y: top });

        this.currentElement.classList.remove('dragging');
        this.isDragging = false;
        this.currentElement = null;

        e.preventDefault();
    }

    enableDragging() {
        this.container.style.pointerEvents = 'auto';
    }

    disableDragging() {
        this.container.style.pointerEvents = 'none';
    }
}
