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
     * Hero 섹션 매핑 (배경 이미지, 제목) - customFields 활용
     */
    mapHeroSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        // directions 페이지 전용 hero 섹션 데이터 가져오기
        const directionsHeroData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0.hero');

        // Hero 제목 매핑 (customFields에서 우선, 없으면 기본값)
        const heroTitleElement = this.safeSelect('[data-directions-hero-title]');
        if (heroTitleElement) {
            if (directionsHeroData?.title) {
                heroTitleElement.textContent = directionsHeroData.title;
            } else if (this.data.property?.name) {
                // fallback: 펜션명 + 오시는길
                heroTitleElement.textContent = `${this.data.property.name} 오시는길`;
            }
        }

        // Hero 배경 이미지 매핑 (JSON에서 동적으로)
        this.mapHeroImage();
    }

    /**
     * Hero 이미지 동적 매핑 (directions 전용 customFields 활용)
     */
    mapHeroImage() {
        if (!this.isDataLoaded) return;

        // directions 페이지 전용 hero 섹션 데이터 가져오기
        const directionsHeroData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0.hero');

        const heroImageElement = this.safeSelect('[data-directions-hero-image]');

        if (!heroImageElement) return;

        const images = directionsHeroData?.images;

        // 이미지가 없으면 빈 이미지 표시
        if (!images || images.length === 0) {
            ImageHelpers.applyPlaceholder(heroImageElement);
            return;
        }

        // sortOrder로 정렬해서 첫 번째 이미지 사용
        const sortedImages = images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        const firstImage = sortedImages[0];

        if (firstImage?.url) {
            heroImageElement.src = firstImage.url;
            heroImageElement.alt = firstImage.description || `${this.data.property?.name} 오시는길`;
            heroImageElement.loading = 'eager';
            heroImageElement.classList.remove('empty-image-placeholder');
        } else {
            ImageHelpers.applyPlaceholder(heroImageElement);
        }
    }

    /**
     * 주소 정보 섹션 매핑
     */
    mapAddressSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        // 섹션 제목 매핑
        const sectionTitleElement = this.safeSelect('[data-directions-section-title]');
        if (sectionTitleElement && property.name) {
            sectionTitleElement.textContent = `${property.name} 오시는길`;
        }

        // 도로명 주소 매핑
        const roadAddressElement = this.safeSelect('[data-directions-road-address]');
        if (roadAddressElement && property.address) {
            roadAddressElement.textContent = property.address;
        }

        // 지번 주소 매핑 - 향후 요구사항 변경 시 활성화 예정
        // const lotAddressElement = this.safeSelect('[data-directions-lot-address]');
        // if (lotAddressElement && property.address) {
        //     lotAddressElement.textContent = property.address;
        // }

        // 안내사항 매핑
        const noticeElement = this.safeSelect('[data-directions-notice]');
        if (noticeElement && property.name) {
            noticeElement.textContent = `네비게이션 검색 시 '${property.name}' 또는 주소를 이용해 주세요.`;
        }
    }

    /**
     * Notice 섹션 매핑 (customFields 기반)
     */
    mapNoticeSection() {
        if (!this.isDataLoaded) return;

        // directions 페이지 전용 섹션 데이터 가져오기
        const directionsData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0');
        const noticeSection = this.safeSelect('[data-directions-notice-section]');
        const notice = directionsData?.notice;

        // notice 데이터가 없거나 title/description이 모두 비어있으면 섹션 숨김
        const hasTitle = notice?.title && notice.title.trim() !== '';
        const hasDescription = notice?.description && notice.description.trim() !== '';

        if (!notice || (!hasTitle && !hasDescription)) {
            if (noticeSection) noticeSection.style.display = 'none';
            return;
        }

        // notice 데이터가 있으면 섹션 표시
        if (noticeSection) noticeSection.style.display = '';

        // Notice 제목 매핑
        const noticeTitle = this.safeSelect('[data-directions-notice-title]');
        if (noticeTitle) {
            noticeTitle.textContent = hasTitle ? notice.title : '';
        }

        // Notice 설명 매핑
        const noticeDescription = this.safeSelect('[data-directions-notice-description]');
        if (noticeDescription) {
            noticeDescription.innerHTML = ''; // 기존 콘텐츠 초기화 및 XSS 방지
            if (hasDescription) {
                // \n을 <br>로 변환하여 안전하게 줄바꿈 처리
                const lines = notice.description.split('\n');
                lines.forEach((line, index) => {
                    noticeDescription.appendChild(document.createTextNode(line));
                    if (index < lines.length - 1) {
                        noticeDescription.appendChild(document.createElement('br'));
                    }
                });
            }
        }
    }

    /**
     * 지도 섹션 매핑 (지도 제목)
     */
    mapMapSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        // 지도 제목 매핑
        const mapTitleElement = this.safeSelect('[data-directions-map-title]');
        if (mapTitleElement) {
            mapTitleElement.textContent = '위치 안내';
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
                // 검색 쿼리 및 URL 생성 (한 번만)
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

                // 인포윈도우 콘텐츠 DOM 생성 및 이벤트 핸들러 연결
                const infowindowContent = document.createElement('div');
                infowindowContent.style.cssText = 'padding:5px; font-size:14px; cursor:pointer;';
                infowindowContent.innerHTML = `${property.name}<br/><small style="color:#666;">클릭하면 카카오맵으로 이동</small>`;
                infowindowContent.addEventListener('click', openKakaoMap);

                const infowindow = new kakao.maps.InfoWindow({
                    content: infowindowContent
                });
                infowindow.open(map, marker);
            } catch (error) {
                console.error('Failed to create Kakao Map:', error);
            }
        };

        // SDK 로드 확인 및 지도 생성
        const checkSdkAndLoad = (retryCount = 0) => {
            const MAX_RETRIES = 20; // 20 * 100ms = 2초
            if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
                // kakao.maps.load() 공식 API 사용
                window.kakao.maps.load(createMap);
            } else if (retryCount < MAX_RETRIES) {
                // SDK가 아직 로드되지 않았으면 대기
                setTimeout(() => checkSdkAndLoad(retryCount + 1), DirectionsMapper.SDK_WAIT_INTERVAL);
            } else {
                console.error('Failed to load Kakao Map SDK after multiple retries.');
            }
        };

        checkSdkAndLoad();
    }

    /**
     * 레거시 CSS 선택자 기반 매핑 (기존 mapDirectionsPage 호환성)
     */
    mapLegacySelectors() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        // 기존 CSS 선택자 기반 매핑들 (data 속성이 없는 요소들을 위해)

        // 도로명 주소 매핑 (첫 번째 주소 항목)
        const roadAddressElement = this.safeSelect('.address-item:first-of-type .address-details p:last-child');
        if (roadAddressElement && property.address) {
            roadAddressElement.textContent = property.address;
        }

        // 지번 주소 매핑 - 향후 요구사항 변경 시 활성화 예정
        // const lotAddressElement = this.safeSelect('.address-item:last-of-type .address-details p:last-child');
        // if (lotAddressElement && property.address) {
        //     lotAddressElement.textContent = property.address;
        // }

        // 지도 콘텐츠 영역 주소 매핑
        const mapAddressElement = this.safeSelect('.map-content .address');
        if (mapAddressElement && property.address) {
            mapAddressElement.textContent = property.address;
        }

        // 지도 콘텐츠 영역 펜션명 매핑
        const mapPropertyNameElement = this.safeSelect('.map-content h4');
        if (mapPropertyNameElement && property.name) {
            mapPropertyNameElement.textContent = property.name;
        }

        // 섹션 제목 매핑 (CSS 선택자 기반)
        const legacySectionTitleElement = this.safeSelect('.section-title');
        if (legacySectionTitleElement && property.name) {
            legacySectionTitleElement.textContent = `${property.name} 오시는길`;
        }

        // 안내 문구 매핑 (CSS 선택자 기반)
        const legacyNoticeElement = this.safeSelect('.info-notice p');
        if (legacyNoticeElement && property.name) {
            const originalText = legacyNoticeElement.textContent;
            const updatedText = originalText.replace('제주 포레스트', property.name);
            legacyNoticeElement.textContent = updatedText;
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
        this.mapHeroSection();
        this.mapAddressSection();
        this.mapNoticeSection(); // Notice 섹션 매핑 추가
        this.mapMapSection();
        this.initKakaoMap(); // 카카오맵 초기화 및 표시
        this.mapLegacySelectors();

        // 메타 태그 업데이트 (페이지별 SEO 적용)
        const property = this.data.property;
        const directionsData = this.safeGet(this.data, 'homepage.customFields.pages.directions.sections.0.hero');
        const pageSEO = {
            title: property?.name ? `오시는길 - ${property.name}` : 'SEO 타이틀',
            description: directionsData?.description || property?.description || 'SEO 설명'
        };
        this.updateMetaTags(pageSEO);

        // OG 이미지 업데이트 (hero 이미지 사용)
        this.updateOGImage(directionsData);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();
    }

    /**
     * OG 이미지 업데이트 (directions hero 이미지 사용, 없으면 로고)
     * @param {Object} directionsData - directions hero 섹션 데이터
     */
    updateOGImage(directionsData) {
        if (!this.isDataLoaded) return;

        const ogImage = this.safeSelect('meta[property="og:image"]');
        if (!ogImage) return;

        // 우선순위: hero 이미지 > 로고 이미지
        if (directionsData?.images && directionsData.images.length > 0 && directionsData.images[0]?.url) {
            ogImage.setAttribute('content', directionsData.images[0].url);
        } else {
            const defaultImage = this.getDefaultOGImage();
            if (defaultImage) {
                ogImage.setAttribute('content', defaultImage);
            }
        }
    }

    /**
     * Directions 페이지 텍스트만 업데이트
     */
    mapDirectionsText() {
        if (!this.isDataLoaded) return;

        // 텍스트 관련 섹션들만 업데이트
        this.mapHeroSection();
        this.mapLocationInfo();
        this.mapDirectionsInfo();
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectionsMapper;
} else {
    window.DirectionsMapper = DirectionsMapper;
}