/* Select by device type, so rotating a phone does not switch to the tablet image. */
(function () {
  function updateBackgroundDevice() {
    const ua = navigator.userAgent || '';
    const touch = navigator.maxTouchPoints || 0;
    const isIPad = /iPad/i.test(ua) || (/Macintosh|MacIntel/i.test(ua + ' ' + (navigator.platform || '')) && touch > 1);
    const isAndroid = /Android/i.test(ua);
    const isTablet = isIPad || /Tablet|Kindle|Silk|PlayBook/i.test(ua) || (isAndroid && !/Mobile/i.test(ua));
    const knownPhone = /iPhone|iPod|Windows Phone|IEMobile|BlackBerry|BB10|Opera Mini/i.test(ua) || (isAndroid && /Mobile/i.test(ua));
    const shortSide = Math.min(screen.width || innerWidth, screen.height || innerHeight);
    const compactTouchDevice = touch > 0 && matchMedia('(pointer: coarse)').matches && shortSide < 600;
    const isPhone = !isTablet && (knownPhone || navigator.userAgentData?.mobile === true || compactTouchDevice);
    document.documentElement.dataset.backgroundDevice = isPhone ? 'phone' : 'desktop-tablet';
  }
  updateBackgroundDevice();
  window.addEventListener('orientationchange', updateBackgroundDevice);
  window.addEventListener('pageshow', updateBackgroundDevice);
})();
