# PDF Editor 개발 규칙

## ⚠️ Claude를 위한 필수 준수 사항

### 1. 커밋 규칙
**중요**: 작업 완료 후 **반드시** 커밋해야 합니다!

```bash
# 모든 변경사항 추가
git add .

# 커밋 메시지 형식
git commit -m "$(cat <<'EOF'
feat/fix/refactor: 간단한 제목

주요 변경사항:
1. 첫 번째 변경
2. 두 번째 변경
3. 세 번째 변경

파일 변경:
- 파일명: 변경 이유
- 파일명: 변경 이유

기술적 세부사항:
- 구체적인 구현 내용

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### 2. 파워포인트 스타일 구현 원칙

#### 2.1 크기 조절 (Resize)
- **원본 유지**: 크기 조절 중 원본 요소는 그대로
- **미리보기 박스**: 반투명 점선 박스로 크기 표시
- **마우스 업 시 적용**: 드래그를 떼는 순간 실제 크기 변경
- **내용 높이 맞춤**: 텍스트 내용보다 작으면 자동으로 높이 확장

```javascript
// js/resize-handler.js 핵심 패턴
onMouseDown() {
    // 미리보기 박스 생성
    this.previewBox = document.createElement('div');
}

onMouseMove() {
    // 미리보기 박스만 업데이트 (원본은 그대로)
    this.previewBox.style.width = newWidth + 'px';
}

onMouseUp() {
    // 미리보기 박스 크기로 원본 업데이트
    this.elementManager.updateElement(id, { width, height, x, y });
    this.previewBox.remove();
}
```

#### 2.2 텍스트 박스 생성
- **클릭**: 기본 크기(200x60) 생성
- **드래그**: 원하는 크기로 생성
- **임계값**: 20px 이상 움직여야 드래그로 인식

```javascript
// js/app.js - setupTextBoxCreation()
const onMouseMove = (e) => {
    const dist = Math.abs(e.clientX - rect.left - startX) +
                 Math.abs(e.clientY - rect.top - startY);

    if (!isDragging && dist > 20) {
        isDragging = true;
        // 드래그 시작
    }
};
```

### 3. 페이지별 요소 관리

#### 3.1 데이터 구조
```javascript
// js/element-manager.js
this.elementsByPage = {
    1: [element1, element2],
    2: [element3, element4],
    3: [element5]
}
```

#### 3.2 페이지 전환
```javascript
// js/app.js - nextPage(), previousPage()
async nextPage() {
    const success = await this.pdfRenderer.nextPage();
    if (success) {
        // 1. 현재 페이지 설정 (가장 중요!)
        this.elementManager.setCurrentPage(this.pdfRenderer.getCurrentPage());

        // 2. UI 업데이트
        this.toolbar.updatePageIndicator(...);

        // 3. 오버레이 크기 조정
        const dimensions = this.pdfRenderer.getPageDimensions();
        this.overlay.style.width = dimensions.width + 'px';
        this.overlay.style.height = dimensions.height + 'px';

        // 4. 페이지별 요소 렌더링
        this.renderElements();
    }
}
```

#### 3.3 PDF 다운로드
```javascript
// js/app.js - downloadPDF()
const allElements = this.elementManager.elementsByPage; // 모든 페이지 요소
const pdfBytes = await this.pdfEditor.exportPDF(
    this.pdfFile,
    allElements, // 페이지별 객체 전달
    canvasDimensions
);

// js/pdf-editor.js - exportPDF()
for (const [pageNum, elements] of Object.entries(elementsByPage)) {
    const pageIndex = parseInt(pageNum) - 1;
    const page = pages[pageIndex];

    // 각 페이지에 해당 요소만 추가
    for (const element of elements) {
        if (element.type === 'text') {
            await this.addTextElement(pdfDoc, page, element, ...);
        }
    }
}
```

### 4. 주요 클래스 역할

#### ElementManager
- 페이지별 요소 저장 및 관리
- `elementsByPage` 객체 사용
- `currentPage` 추적
- `setCurrentPage()` 메서드로 페이지 전환

#### ResizeHandler
- 파워포인트 스타일 크기 조절
- 미리보기 박스 패턴 사용
- 8방향 리사이즈 핸들 (nw, n, ne, e, se, s, sw, w)
- 텍스트 내용 높이 자동 조정

#### DragHandler
- 요소 드래그 이동
- 편집 모드와 리사이즈 핸들은 무시

#### PDFEditor
- 다중 페이지 PDF 내보내기
- 텍스트를 이미지로 변환 (한글 지원)
- 페이지별 요소 처리

### 5. 이벤트 처리 패턴

#### mousedown → mousemove → mouseup
```javascript
// 텍스트 박스 생성, 드래그, 리사이즈 모두 이 패턴 사용
let isMouseDown = false;
let isDragging = false;

const onMouseDown = (e) => {
    isMouseDown = true;
    // 시작 좌표 저장
};

const onMouseMove = (e) => {
    if (!isMouseDown) return;

    // 임계값 체크
    if (!isDragging && distance > threshold) {
        isDragging = true;
    }

    if (isDragging) {
        // 드래그 처리
    }
};

const onMouseUp = (e) => {
    if (!isMouseDown) return;

    if (isDragging) {
        // 드래그 완료 처리
    } else {
        // 클릭 처리
    }

    isMouseDown = false;
    isDragging = false;
};
```

### 6. 빈 텍스트 처리
- 빈 텍스트는 자동 삭제
```javascript
// js/app.js - finishTextEdit()
if (newText.trim() === '') {
    this.elementManager.deleteElement(element.id);
}
```

### 7. 높이 자동 조정
```javascript
// 편집 중: textarea 높이 자동 조정
const autoResize = () => {
    textarea.style.height = 'auto';
    const newHeight = Math.max(30, textarea.scrollHeight);
    textarea.style.height = newHeight + 'px';
    elementDiv.style.height = (newHeight + 16) + 'px'; // padding 포함
};

// 리사이즈 후: 내용 높이 계산
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

height = Math.max(height, contentHeight); // 내용보다 작으면 확장
```

## 주요 파일 구조

```
pdf-browser-demo/
├── index.html              # 메인 HTML
├── styles/
│   └── canvas.css          # 스타일 (리사이즈 핸들 포함)
└── js/
    ├── utils.js            # 유틸리티 함수
    ├── element-manager.js  # 요소 관리 (페이지별)
    ├── pdf-renderer.js     # PDF 렌더링
    ├── pdf-editor.js       # PDF 내보내기 (다중 페이지)
    ├── drag-handler.js     # 드래그 처리
    ├── resize-handler.js   # 리사이즈 처리 (파워포인트 스타일)
    ├── text-controls.js    # 텍스트 컨트롤
    ├── image-handler.js    # 이미지 처리
    ├── toolbar.js          # 툴바
    └── app.js              # 메인 앱 로직
```

## 체크리스트

작업 완료 시 확인사항:
- [ ] 커밋 메시지 작성했는가?
- [ ] 파워포인트 스타일 패턴 유지했는가?
- [ ] 페이지별 요소가 제대로 저장/로드되는가?
- [ ] 빈 텍스트 박스는 삭제되는가?
- [ ] 높이 자동 조정이 작동하는가?
- [ ] PDF 다운로드 시 모든 페이지 포함되는가?
