/**
 * Directions Page Data Mapper
 * directions.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 오시는길 페이지 전용 기능 제공
 */
class DirectionsMapper extends BaseDataMapper {
    // Kakao Map 설정 상수
    static KAKAO_MAP_ZOOM_LEVEL = 3;
    static SDK_WAIT_INTERVAL = 100; // ms

    constructor() {
        super();
    }

    // ============================================================================
    // 🗺️ DIRECTIONS PAGE MAPPINGS
    // ============================================================================

    /**
     * Property name 매핑
     */
    mapPropertyName() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        const nameEl = this.safeSelect('[data-property-name]');
        if (nameEl && property.name) {
            nameEl.textContent = property.name;
        }
    }

    /**
     * Property address 매핑
     */
    mapPropertyAddress() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        this.safeSelectAll('[data-property-address]').forEach((addressEl) => {
            if (addressEl && property.address) {
                addressEl.textContent = property.address;
            }
        });
    }

    /**
     * Hero 이미지 매핑 (directions hero images)
     */
    mapHeroImages() {
        const heroImages = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0.hero.images');
        const element = this.safeSelect('[data-homepage-customFields-pages-directions-sections-0-hero-images]');

        if (element) {
            let imageUrl = null;
            let hasImage = false;

            // Get first SELECTED hero image using ImageHelpers
            const firstSelectedImage = ImageHelpers.getFirstSelectedImage(heroImages);
            if (firstSelectedImage && firstSelectedImage.url) {
                imageUrl = firstSelectedImage.url;
                hasImage = true;
            }

            // Use empty placeholder if no image found
            if (!imageUrl) {
                imageUrl = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
                element.classList.add('empty-image-placeholder');
            } else {
                element.classList.remove('empty-image-placeholder');
            }

            let extra = element.dataset.bgExtra ? ` ${element.dataset.bgExtra}` : '';
            if (!extra && element.classList.contains('fBanner')) {
                extra = ' fixed';
            }

            const value = `url("${imageUrl}") center/cover no-repeat${extra}`.trim();
            element.style.background = value;

            // If it's a real image, add error handling
            if (hasImage) {
                const img = new Image();
                img.onerror = function() {
                    element.style.background = `url("${ImageHelpers.EMPTY_IMAGE_WITH_ICON}") center/cover no-repeat${extra}`.trim();
                    element.classList.add('empty-image-placeholder');
                };
                img.src = imageUrl;
            }
        }
    }


    /**
     * 카카오맵 초기화 및 표시
     */
    initKakaoMap() {
        if (!this.isDataLoaded || !this.data.property) {
            return;
        }

        const property = this.data.property;
        const mapContainer = document.getElementById('kakao-map');

        if (!mapContainer || !property.latitude || !property.longitude) {
            return;
        }

        // 지도 생성 함수
        const createMap = () => {
            try {
                // 검색 쿼리 및 URL 생성
                const searchQuery = property.address || property.name || '선택한 위치';
                const kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(searchQuery)}`;
                const openKakaoMap = () => window.open(kakaoMapUrl, '_blank');

                // 지도 중심 좌표
                const mapCenter = new kakao.maps.LatLng(property.latitude, property.longitude);

                // 지도 옵션
                const mapOptions = {
                    center: mapCenter,
                    level: DirectionsMapper.KAKAO_MAP_ZOOM_LEVEL,
                    draggable: false,
                    scrollwheel: false,
                    disableDoubleClick: true,
                    disableDoubleClickZoom: true
                };

                // 지도 생성
                const map = new kakao.maps.Map(mapContainer, mapOptions);
                map.setZoomable(false);

                // 마커 생성 및 클릭 이벤트
                const marker = new kakao.maps.Marker({
                    position: mapCenter,
                    map: map
                });
                kakao.maps.event.addListener(marker, 'click', openKakaoMap);

                // 인포윈도우 생성 및 표시
                const infowindowContent = `<div onclick="window.open('${kakaoMapUrl}', '_blank')" style="padding:5px;font-size:14px;cursor:pointer;">${property.name}<br/><small style="color:#666;">클릭하면 카카오맵으로 이동</small></div>`;
                const infowindow = new kakao.maps.InfoWindow({
                    content: infowindowContent
                });
                infowindow.open(map, marker);
            } catch (error) {
                console.error('Failed to create Kakao Map:', error);
            }
        };

        // SDK 로드 확인 및 지도 생성
        const checkSdkAndLoad = () => {
            if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
                // kakao.maps.load() 공식 API 사용
                window.kakao.maps.load(createMap);
            } else {
                // SDK가 아직 로드되지 않았으면 대기
                setTimeout(checkSdkAndLoad, DirectionsMapper.SDK_WAIT_INTERVAL);
            }
        };

        checkSdkAndLoad();
    }

    /**
     * Directions notice 매핑
     */
    mapDirectionsNotice() {
        if (!this.isDataLoaded) return;

        const noticeSection = this.safeSelect('[data-directions-notice-section]');
        if (!noticeSection) return;

        // 올바른 경로: homepage.customFields.pages.directions.sections[0].notice
        const noticeData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0.notice');
        const title = noticeData?.title;
        const description = noticeData?.description;

        const titleEl = this.safeSelect('[data-directions-notice-title]');
        const descriptionEl = this.safeSelect('[data-property-directions-notice-description]');

        if (titleEl) {
            titleEl.textContent = title || '';
        }
        if (descriptionEl) {
            descriptionEl.textContent = description || '';
        }

        if (title || description) {
            noticeSection.style.display = 'block';
        } else {
            noticeSection.style.display = 'none';
        }
    }


    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Directions 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapPropertyName();
        this.mapPropertyAddress();
        this.mapHeroImages();
        this.initKakaoMap();
        this.mapDirectionsNotice();

        // 메타 태그 업데이트
        this.updateMetaTags(this.data.property);

        // HTML title 매핑
        this.updatePageTitle();

        // Favicon 매핑
        this.mapFavicon();

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();
    }

    /**
     * 페이지 제목 업데이트
     */
    updatePageTitle() {
        const property = this.data.property;
        const htmlTitle = this.safeSelect('title');

        if (htmlTitle && property?.name) {
            htmlTitle.textContent = `오시는길 - ${property.name}`;
        }
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectionsMapper;
} else {
    window.DirectionsMapper = DirectionsMapper;
}