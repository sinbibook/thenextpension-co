/**
 * 환경별 설정
 * GitHub Pages와 로컬 개발 환경을 모두 지원
 */

// GitHub Pages 배포 여부 자동 감지
const isGitHubPages = window.location.hostname.includes('github.io');

// 저장소 이름 자동 감지
// GitHub Pages URL 패턴: https://username.github.io/repo-name/
const repoName = isGitHubPages
    ? window.location.pathname.split('/').filter(p => p)[0] || ''
    : '';

// Base Path 설정
const BASE_PATH = isGitHubPages && repoName ? `/${repoName}` : '';

// 리소스 경로 헬퍼 함수
function getResourcePath(relativePath) {
    // 이미 절대 경로거나 외부 URL이면 그대로 반환
    if (relativePath.startsWith('http') || relativePath.startsWith('//')) {
        return relativePath;
    }

    // ../ 제거하고 정리
    let cleanPath = relativePath.replace(/^(\.\.\/)+/, '');

    // / 로 시작하지 않으면 추가
    if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
    }

    return `${BASE_PATH}${cleanPath}`;
}

// @font-face 동적 생성 (CDN 사용)
function createFontFace() {
    const style = document.createElement('style');
    style.textContent = `
        @font-face {
            font-family: 'GowoonDodum';
            src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/GowunDodum-Regular.woff') format('woff');
            font-weight: normal;
            font-display: swap;
        }
    `;
    document.head.insertBefore(style, document.head.firstChild);
}

// 즉시 실행
createFontFace();

// Export for use in other scripts
window.APP_CONFIG = {
    BASE_PATH,
    isGitHubPages,
    repoName,
    getResourcePath,
    // iframe 환경 감지 헬퍼 함수
    isInIframe: () => window.parent !== window
};
