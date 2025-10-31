// Header and Footer Dynamic Loader
class HeaderFooterLoader {
    constructor() {
        this.headerLoaded = false;
        this.footerLoaded = false;
    }
    
    // Extract content from header.html
    async loadHeader() {
        if (this.headerLoaded) return;

        try {
            // 현재 경로에 따라 상대 경로 결정
            const isRootIndex = window.location.pathname.endsWith('/index.html') ||
                               window.location.pathname === '/' ||
                               window.location.pathname === '';
            const headerPath = isRootIndex
                ? './common/header.html'
                : './common/header.html';
            const response = await fetch(headerPath);
            const html = await response.text();

            // Parse the HTML and extract all header elements and mobile menu
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const headerElements = doc.querySelectorAll('header');
            const mobileMenuElement = doc.querySelector('.mobile-menu');
            const styleElements = doc.querySelectorAll('head style');
            const linkElements = doc.querySelectorAll('head link[rel="stylesheet"]');

            if (headerElements.length > 0) {
                // Create header container at the top of body
                const headerContainer = document.createElement('div');
                headerContainer.id = 'header-container';
                headerContainer.style.position = 'fixed';
                headerContainer.style.top = '0';
                headerContainer.style.left = '0';
                headerContainer.style.right = '0';
                headerContainer.style.zIndex = '1000';
                headerContainer.style.visibility = 'hidden'; // CSS 로드 전까지 숨김

                // Add all header elements
                headerElements.forEach(header => {
                    headerContainer.innerHTML += header.outerHTML;
                });

                // Add mobile menu
                if (mobileMenuElement) {
                    headerContainer.innerHTML += mobileMenuElement.outerHTML;
                }

                // Insert header at the beginning of body
                document.body.insertBefore(headerContainer, document.body.firstChild);

                // Adjust header links based on current location
                this.adjustHeaderLinks();

                // Add styles to head
                styleElements.forEach(style => {
                    const newStyle = document.createElement('style');
                    newStyle.textContent = style.textContent;
                    document.head.appendChild(newStyle);
                });

                // Add CSS links to head
                let loadedCount = 0;
                const totalLinks = linkElements.length;
                linkElements.forEach(link => {
                    const newLink = document.createElement('link');
                    newLink.rel = 'stylesheet';
                    // GitHub Pages 지원: config.js의 경로 헬퍼 사용
                    const href = link.getAttribute('href');
                    newLink.href = window.APP_CONFIG ? window.APP_CONFIG.getResourcePath(href) : href;
                    newLink.onload = () => {
                        loadedCount++;
                        if (loadedCount === totalLinks) {
                            // 모든 CSS 로드 완료 후 헤더 표시
                            headerContainer.style.visibility = 'visible';
                        }
                    };
                    document.head.appendChild(newLink);
                });

                // Load header.js manually AFTER DOM insertion (only once)
                if (!window.headerJsLoaded) {
                    window.headerJsLoaded = true;
                    const headerScript = document.createElement('script');
                    // GitHub Pages 지원: config.js의 경로 헬퍼 사용
                    headerScript.src = window.APP_CONFIG
                        ? window.APP_CONFIG.getResourcePath('js/common/header.js')
                        : './js/common/header.js';
                    headerScript.onload = () => {
                        // Setup event listeners after header.js loads
                        this.setupHeaderEventListeners();
                        // Load mobile menu script after header is ready
                        this.loadMobileMenuScript();
                        // Header 매핑을 event listener 설정 후에 실행
                        this.applyHeaderFooterMapping();
                    };
                    document.body.appendChild(headerScript);
                }
                
                // Dynamically calculate and adjust body padding to account for fixed header
                this.adjustBodyPadding();
                
                this.headerLoaded = true;
            }
        } catch (error) {
        }
    }
    
    // Extract content from footer.html
    async loadFooter() {
        if (this.footerLoaded) return;

        try {
            // 현재 경로에 따라 상대 경로 결정
            const isRootIndex = window.location.pathname.endsWith('/index.html') ||
                               window.location.pathname === '/' ||
                               window.location.pathname === '';
            const footerPath = isRootIndex
                ? './common/footer.html'
                : './common/footer.html';
            const response = await fetch(footerPath);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Parse the HTML and extract the footer element
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const parsedFooterElement = doc.querySelector('footer');
            const scrollToTopButton = doc.querySelector('.scroll-to-top');
            const styleElements = doc.querySelectorAll('head style');
            const linkElements = doc.querySelectorAll('head link[rel="stylesheet"]');

            if (parsedFooterElement) {
                // Create footer container at the bottom of body
                const footerContainer = document.createElement('div');
                footerContainer.id = 'footer-container';
                footerContainer.innerHTML = parsedFooterElement.outerHTML;

                // Add scroll to top button if it exists
                if (scrollToTopButton) {
                    document.body.appendChild(scrollToTopButton.cloneNode(true));
                }
                
                // Force immediate style application BEFORE appending
                footerContainer.style.display = 'block';
                footerContainer.style.width = '100%';
                footerContainer.style.position = 'relative';
                footerContainer.style.zIndex = '100';
                footerContainer.style.clear = 'both';
                
                // Ensure footer appears at the very end of body
                document.body.appendChild(footerContainer);
                
                // Add styles to head
                styleElements.forEach(style => {
                    const newStyle = document.createElement('style');
                    newStyle.id = 'footer-styles';
                    newStyle.textContent = style.textContent;
                    document.head.appendChild(newStyle);
                });

                // Add CSS links to head
                linkElements.forEach(link => {
                    const newLink = document.createElement('link');
                    newLink.rel = 'stylesheet';
                    // GitHub Pages 지원: config.js의 경로 헬퍼 사용
                    const href = link.getAttribute('href');
                    newLink.href = window.APP_CONFIG ? window.APP_CONFIG.getResourcePath(href) : href;
                    document.head.appendChild(newLink);
                });
                
                // Ensure proper footer positioning
                this.ensureFooterPositioning();

                // Load footer.js for scroll to top functionality
                if (!window.footerJsLoaded) {
                    window.footerJsLoaded = true;
                    const footerScript = document.createElement('script');
                    // GitHub Pages 지원: config.js의 경로 헬퍼 사용
                    footerScript.src = window.APP_CONFIG
                        ? window.APP_CONFIG.getResourcePath('js/common/footer.js')
                        : './js/common/footer.js';
                    footerScript.onload = () => {
                        // Initialize scroll to top if function exists
                        if (typeof initScrollToTop === 'function') {
                            initScrollToTop();
                        }
                        // Footer 매핑도 실행
                        this.applyHeaderFooterMapping();
                    };
                    document.body.appendChild(footerScript);
                }

                this.footerLoaded = true;
            }
        } catch (error) {
        }
    }
    
    // Dynamically calculate header height and adjust body padding
    adjustBodyPadding() {
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            // Remove existing padding style if it exists
            const existingStyle = document.getElementById('header-padding-style');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            // Wait for DOM to be fully rendered before calculating height
            setTimeout(() => {
                // Apply padding using CSS with ID for easy removal/replacement
                const style = document.createElement('style');
                style.id = 'header-padding-style';
                style.textContent = `
                    body {
                        box-sizing: border-box !important;
                        transition: padding-top 0.3s ease-out !important;
                    }
                    
                    /* Ensure scroll indicator stays visible */
                    .scroll-indicator {
                        bottom: 2rem !important;
                    }
                `;
                document.head.appendChild(style);
            }, 150);
        }
    }
    
    // Adjust header links based on current page location
    adjustHeaderLinks() {
        const links = document.querySelectorAll('#header-container a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;

            // 외부 링크는 그대로
            if (href.startsWith('http') || href.startsWith('//') || href.startsWith('javascript:')) {
                return;
            }

            // ../ 제거하고 파일명만 추출
            let filename = href.replace(/^(\.\.\/)+/, '');

            // GitHub Pages 지원: config.js의 경로 헬퍼 사용
            if (window.APP_CONFIG) {
                link.setAttribute('href', window.APP_CONFIG.getResourcePath(filename));
            } else {
                // 로컬 환경: 상대 경로 유지
                link.setAttribute('href', filename);
            }
        });
    }

    // Ensure footer stays at bottom and requires scroll
    ensureFooterPositioning() {
        // Get the footer container
        const footerContainer = document.getElementById('footer-container');
        if (!footerContainer) return;

        // Apply minimal styling to ensure footer appears
        footerContainer.style.display = 'block';
        footerContainer.style.width = '100%';
        footerContainer.style.clear = 'both';
    }
    
    // Load both header and footer
    async loadAll() {
        await Promise.all([
            this.loadHeader(),
            this.loadFooter()
        ]);
    }
    
    // Initialize with proper timing
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadAll();
                this.setupResizeHandler();
            });
        } else {
            this.loadAll();
            this.setupResizeHandler();
        }
    }
    
    // Setup header event listeners after dynamic loading
    setupHeaderEventListeners() {
        // Ensure menu functions are properly attached
        const navContainer = document.querySelector('.nav-container');
        if (navContainer) {
            // Remove existing event listeners and re-attach
            navContainer.onmouseenter = null;
            navContainer.onmouseleave = null;
            
            navContainer.addEventListener('mouseenter', function() {
                if (window.showSubMenus) {
                    window.showSubMenus();
                }
            });
            
            navContainer.addEventListener('mouseleave', function() {
                if (window.hideSubMenus) {
                    window.hideSubMenus();
                }
            });
        }
        
        // Mobile toggle event listeners are already handled by header.js
        // No need to add them again here
        
        // Ensure logo navigation is working
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.onclick = null; // Remove inline handler
            logoContainer.addEventListener('click', function() {
                if (window.navigateTo) {
                    window.navigateTo('home');
                }
            });
        }
        
        // Ensure all menu item clicks work
        const menuItems = document.querySelectorAll('.menu-item, .sub-menu-item, .mobile-sub-item');
        menuItems.forEach(item => {
            const onclickAttr = item.getAttribute('onclick');
            if (onclickAttr) {
                item.onclick = null; // Remove inline handler

                // navigateTo 함수 호출이 아닌 경우 건너뛰기
                if (!onclickAttr.includes('navigateTo(')) {
                    return;
                }

                const match = onclickAttr.match(/navigateTo\(['"]([^'"]+)['"]\)/);
                if (match && match[1]) {
                    const page = match[1];
                    item.addEventListener('click', function() {
                        if (window.navigateTo) {
                            window.navigateTo(page);
                        }
                    });
                }
            }
        });
        
        // Add click support for main menu items to show submenus
        const mainMenuItems = document.querySelectorAll('.menu-item');
        mainMenuItems.forEach(item => {
            // Add click handler for submenu toggle (in addition to navigation)
            item.addEventListener('click', function(e) {
                // If submenus are not visible, show them and prevent navigation
                const subMenus = document.getElementById('sub-menus');
                if (subMenus && !subMenus.classList.contains('show')) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.showSubMenus) {
                        window.showSubMenus();
                    }
                    return false;
                }
            });
        });
        
        // HeaderFooterMapper는 header 로드 후에 실행됨
    }

    // Apply HeaderFooterMapper for dynamic content mapping
    async applyHeaderFooterMapping() {
        // HeaderFooterMapper가 로드되어 있는지 확인
        if (typeof HeaderFooterMapper === 'undefined') {
            return;
        }

        // iframe 환경(어드민 미리보기)에서는 PreviewHandler가 매핑 담당
        if (window.APP_CONFIG.isInIframe()) {
            return;
        }

        try {
            // HeaderFooterMapper 인스턴스 생성 및 초기화
            const headerFooterMapper = new HeaderFooterMapper();
            await headerFooterMapper.initialize();

            // Header와 Footer 매핑 실행
            await headerFooterMapper.mapHeaderFooter();
        } catch (error) {
        }
    }

    // Load mobile menu script after header is ready
    loadMobileMenuScript() {
        if (!window.mobileMenuJsLoaded) {
            window.mobileMenuJsLoaded = true;
            const mobileMenuScript = document.createElement('script');
            // GitHub Pages 지원: config.js의 경로 헬퍼 사용
            const scriptPath = window.APP_CONFIG
                ? window.APP_CONFIG.getResourcePath('js/common/mobile-menu.js')
                : './js/common/mobile-menu.js';
            mobileMenuScript.src = scriptPath + '?v=' + Date.now();
            mobileMenuScript.onload = () => {
                if (typeof initMobileMenu === 'function') {
                    initMobileMenu();
                }
            };
            document.body.appendChild(mobileMenuScript);
        }
    }

    // Setup resize handler to recalculate header padding
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.headerLoaded) {
                    this.adjustBodyPadding();
                }
            }, 250); // Debounce resize events
        });
    }
}

// Global instance
window.headerFooterLoader = new HeaderFooterLoader();

// Auto-initialize if not manually controlled
if (!window.MANUAL_HEADER_FOOTER_INIT) {
    window.headerFooterLoader.init();
}

// Provide manual control functions
window.loadHeaderFooter = () => window.headerFooterLoader.loadAll();
window.loadHeader = () => window.headerFooterLoader.loadHeader();
window.loadFooter = () => window.headerFooterLoader.loadFooter();