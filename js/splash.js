// 시작 화면: 시스템 시작 화면과 같은 아이콘 화면 → 사진이 떠오름 → 홈으로.
// 누르면 바로 넘어간다.
(function () {
  var el = document.getElementById('splash');
  if (!el) return;
  var ICON_MS = 250;   // 시스템 화면에서 넘어온 직후 아이콘을 잠깐 유지
  var PHOTO_MS = 1500; // 사진을 보여주는 시간
  var MAX_MS = 4500;   // 사진이 늦게 와도 이 시간이 지나면 넘어감
  var start = Date.now();
  var done = false;

  function hide() {
    if (done) return;
    done = true;
    el.classList.add('splash-hide');
    setTimeout(function () { el.remove(); }, 550);
  }

  function showPhoto() {
    var wait = Math.max(0, ICON_MS - (Date.now() - start));
    setTimeout(function () {
      if (done) return;
      el.classList.add('splash-show-photo');
      setTimeout(hide, PHOTO_MS);
    }, wait);
  }

  var photo = el.querySelector('.splash-photo');
  if (photo.complete && photo.naturalWidth) showPhoto();
  else {
    photo.addEventListener('load', showPhoto);
    photo.addEventListener('error', hide);
  }
  setTimeout(hide, MAX_MS);
  el.addEventListener('click', hide);
})();
