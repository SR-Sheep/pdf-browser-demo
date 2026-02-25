// 텍스트 컨트롤 UI 클래스
class TextControls {
    constructor(elementManager) {
        this.elementManager = elementManager;
        this.panel = document.getElementById('text-controls');
        this.textContentInput = document.getElementById('text-content');
        this.fontFamilySelect = document.getElementById('font-family');
        this.fontSizeInput = document.getElementById('font-size');
        this.textColorInput = document.getElementById('text-color');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // 텍스트 내용 변경
        this.textContentInput.addEventListener('input', (e) => {
            const element = this.elementManager.getSelectedElement();
            if (element && element.type === 'text') {
                this.elementManager.updateElement(element.id, { content: e.target.value });
                this.updateElementDisplay(element.id);
            }
        });

        // 폰트 패밀리 변경
        this.fontFamilySelect.addEventListener('change', (e) => {
            const element = this.elementManager.getSelectedElement();
            if (element && element.type === 'text') {
                this.elementManager.updateElement(element.id, { fontFamily: e.target.value });
                this.updateElementDisplay(element.id);
            }
        });

        // 폰트 크기 변경
        this.fontSizeInput.addEventListener('input', (e) => {
            const element = this.elementManager.getSelectedElement();
            if (element && element.type === 'text') {
                const size = parseInt(e.target.value) || 16;
                this.elementManager.updateElement(element.id, { fontSize: size });
                this.updateElementDisplay(element.id);
            }
        });

        // 텍스트 색상 변경
        this.textColorInput.addEventListener('input', (e) => {
            const element = this.elementManager.getSelectedElement();
            if (element && element.type === 'text') {
                this.elementManager.updateElement(element.id, { color: e.target.value });
                this.updateElementDisplay(element.id);
            }
        });
    }

    showControls(element) {
        if (element.type !== 'text') {
            this.hideControls();
            return;
        }

        this.textContentInput.value = element.content;
        this.fontFamilySelect.value = element.fontFamily;
        this.fontSizeInput.value = element.fontSize;
        this.textColorInput.value = element.color;

        this.panel.style.display = 'block';
    }

    hideControls() {
        this.panel.style.display = 'none';
    }

    updateElementDisplay(elementId) {
        const elementDiv = document.querySelector(`.pdf-element[data-id="${elementId}"]`);
        if (!elementDiv) return;

        const element = this.elementManager.getElement(elementId);
        if (!element || element.type !== 'text') return;

        elementDiv.textContent = element.content;
        elementDiv.style.fontSize = element.fontSize + 'px';
        elementDiv.style.fontFamily = element.fontFamily;
        elementDiv.style.color = element.color;
    }
}
