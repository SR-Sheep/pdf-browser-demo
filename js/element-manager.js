// 요소 관리 클래스 (페이지별 관리)
class ElementManager {
    constructor() {
        this.elementsByPage = {}; // 페이지별 요소 저장
        this.currentPage = 1;
        this.selectedElementId = null;
    }

    // 현재 페이지 설정
    setCurrentPage(pageNum) {
        this.currentPage = pageNum;
        if (!this.elementsByPage[pageNum]) {
            this.elementsByPage[pageNum] = [];
        }
        this.selectedElementId = null; // 페이지 변경 시 선택 해제
    }

    // 현재 페이지 요소 배열 가져오기
    get elements() {
        if (!this.elementsByPage[this.currentPage]) {
            this.elementsByPage[this.currentPage] = [];
        }
        return this.elementsByPage[this.currentPage];
    }

    // 텍스트 요소 추가
    addTextElement(x, y, content, style = {}) {
        const element = {
            id: generateUniqueId(),
            type: 'text',
            page: this.currentPage,
            x: x,
            y: y,
            content: content || '',
            fontSize: style.fontSize || 16,
            fontFamily: style.fontFamily || 'Helvetica',
            color: style.color || '#000000',
            width: style.width || 200,  // 실제 픽셀 값
            height: style.height || 60  // 실제 픽셀 값
        };

        this.elements.push(element);
        return element;
    }

    // 이미지 요소 추가
    addImageElement(x, y, imageData, width, height) {
        const element = {
            id: generateUniqueId(),
            type: 'image',
            page: this.currentPage,
            x: x,
            y: y,
            imageData: imageData,
            width: width || 200,
            height: height || 200
        };

        this.elements.push(element);
        return element;
    }

    // 요소 업데이트
    updateElement(id, properties) {
        const element = this.elements.find(el => el.id === id);
        if (element) {
            Object.assign(element, properties);
            return element;
        }
        return null;
    }

    // 요소 삭제
    deleteElement(id) {
        const index = this.elements.findIndex(el => el.id === id);
        if (index !== -1) {
            this.elements.splice(index, 1);
            if (this.selectedElementId === id) {
                this.selectedElementId = null;
            }
            return true;
        }
        return false;
    }

    // 요소 선택
    selectElement(id) {
        const element = this.elements.find(el => el.id === id);
        if (element) {
            this.selectedElementId = id;
            return element;
        }
        return null;
    }

    // 선택 해제
    deselectElement() {
        this.selectedElementId = null;
    }

    // 선택된 요소 가져오기
    getSelectedElement() {
        if (!this.selectedElementId) {
            return null;
        }
        return this.elements.find(el => el.id === this.selectedElementId);
    }

    // ID로 요소 가져오기 (현재 페이지)
    getElement(id) {
        return this.elements.find(el => el.id === id);
    }

    // ID로 요소 가져오기 (모든 페이지)
    getElementById(id) {
        for (const pageNum in this.elementsByPage) {
            const element = this.elementsByPage[pageNum].find(el => el.id === id);
            if (element) {
                return element;
            }
        }
        return null;
    }

    // 모든 요소 가져오기
    getAllElements() {
        return [...this.elements];
    }

    // 특정 위치의 요소 가져오기
    getElementAt(x, y) {
        // 역순으로 검색 (위에 있는 요소부터)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const el = this.elements[i];
            // 간단한 경계 체크 (나중에 DOM 요소로 더 정확하게 체크)
            if (x >= el.x && y >= el.y) {
                return el;
            }
        }
        return null;
    }

    // 모든 요소 삭제 (모든 페이지)
    clearAllElements() {
        this.elementsByPage = {};
        this.currentPage = 1;
        this.selectedElementId = null;
    }

    // 현재 페이지 요소만 삭제
    clearCurrentPageElements() {
        this.elementsByPage[this.currentPage] = [];
        this.selectedElementId = null;
    }

    // 선택된 요소 삭제
    deleteSelectedElement() {
        if (this.selectedElementId) {
            return this.deleteElement(this.selectedElementId);
        }
        return false;
    }
}
