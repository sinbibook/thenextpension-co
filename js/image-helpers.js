/**
 * Image Helper Utilities
 * 모든 페이지 mapper에서 공통으로 사용하는 이미지 관련 헬퍼 함수
 */
const ImageHelpers = {
    // 단순 회색 배경 (아이콘 없음 - 기본)
    EMPTY_IMAGE_SVG: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect fill="%23d1d5db" width="800" height="600"/%3E%3C/svg%3E',

    // 아이콘 포함된 버전 (필요시 사용)
    EMPTY_IMAGE_WITH_ICON: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect fill="%23d1d5db" width="800" height="600"/%3E%3Cg transform="translate(400, 300)"%3E%3Crect x="-48" y="-48" width="96" height="96" rx="8" ry="8" fill="none" stroke="%23374151" stroke-width="3"/%3E%3Ccircle cx="-20" cy="-20" r="6" fill="%23374151"/%3E%3Cpolyline points="48,-12 20,-40 -48,28" fill="none" stroke="%23374151" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/g%3E%3C/svg%3E',

    /**
     * 공통 이미지 처리 헬퍼 함수 (에러 처리 포함)
     */
    applyImageOrPlaceholder(imageElement, imagesData, overlayElement = null) {
        if (!imageElement) {
            console.warn('⚠️ ImageHelpers: imageElement is null or undefined');
            return;
        }

        if (!imagesData || imagesData.length === 0) {
            this.applyPlaceholder(imageElement, overlayElement);
            return;
        }

        try {
            const selectedImages = imagesData
                .filter(img => img.isSelected)
                .sort((a, b) => a.sortOrder - b.sortOrder);

            if (selectedImages.length > 0 && selectedImages[0].url) {
                const firstImage = selectedImages[0];

                // 이미지 로드 에러 처리
                imageElement.onerror = () => {
                    console.warn('⚠️ 이미지 로드 실패, placeholder 적용:', firstImage.url);
                    this.applyPlaceholder(imageElement, overlayElement);
                };

                imageElement.src = firstImage.url;
                imageElement.alt = firstImage.description || '';
                imageElement.classList.remove('empty-image-placeholder');
                imageElement.style.opacity = '1';
                if (overlayElement) overlayElement.style.display = '';
            } else {
                this.applyPlaceholder(imageElement, overlayElement);
            }
        } catch (error) {
            console.error('❌ ImageHelpers 에러:', error);
            this.applyPlaceholder(imageElement, overlayElement);
        }
    },

    /**
     * 플레이스홀더 적용
     */
    applyPlaceholder(imageElement, overlayElement = null) {
        if (!imageElement) return;
        imageElement.src = this.EMPTY_IMAGE_SVG;
        imageElement.alt = '이미지 없음';
        imageElement.classList.add('empty-image-placeholder');
        imageElement.style.opacity = '1';
        if (overlayElement) overlayElement.style.display = 'none';
    },

    /**
     * 로고 URL 추출 헬퍼 (header-footer-mapper에서 이동)
     */
    extractLogoUrl(data) {
        if (!data) return null;

        const imagesArray = data.homepage?.images;
        if (!imagesArray || !Array.isArray(imagesArray)) return null;

        for (const imageItem of imagesArray) {
            if (imageItem.logo && Array.isArray(imageItem.logo) && imageItem.logo.length > 0) {
                const sortedLogos = imageItem.logo.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                return sortedLogos[0].url;
            }
        }
        return null;
    },

    /**
     * isSelected가 true인 이미지만 필터링하고 sortOrder로 정렬
     * @param {Array} images - 이미지 배열
     * @returns {Array} 필터링되고 정렬된 이미지 배열
     */
    filterSelectedImages(images) {
        if (!images || !Array.isArray(images)) return [];

        return images
            .filter(img => img && img.isSelected === true)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    },

    /**
     * 선택된 이미지 중 첫 번째 이미지 가져오기
     * @param {Array} images - 이미지 배열
     * @returns {Object|null} 첫 번째 선택된 이미지 또는 null
     */
    getFirstSelectedImage(images) {
        const selected = this.filterSelectedImages(images);
        return selected.length > 0 ? selected[0] : null;
    },

    /**
     * 선택된 이미지들 중 특정 인덱스의 이미지 가져오기
     * @param {Array} images - 이미지 배열
     * @param {number} index - 원하는 인덱스
     * @returns {Object|null} 해당 인덱스의 선택된 이미지 또는 null
     */
    getSelectedImageByIndex(images, index = 0) {
        const selected = this.filterSelectedImages(images);
        return selected[index] || null;
    }
};

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageHelpers;
} else {
    window.ImageHelpers = ImageHelpers;
}