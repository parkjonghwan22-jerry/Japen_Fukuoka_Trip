// 앱을 켤 때 메인 사진을 전체화면으로 잠깐 보여준다. 누르면 바로 넘어간다.
(function () {
  var el = document.getElementById('splash');
  if (!el) return;
  var MIN_MS = 1400;  // 최소 노출 시간
  var MAX_MS = 3500;  // 사진이 늦게 와도 이 시간이 지나면 넘어감
  var start = Date.now();
  var done = false;

  function hide() {
    if (done) return;
    done = true;
    el.classList.add('splash-hide');
    setTimeout(function () { el.remove(); }, 500);
  }

  function hideAfterMin() {
    setTimeout(hide, Math.max(0, MIN_MS - (Date.now() - start)));
  }

  var img = el.querySelector('img');
  if (img.complete) hideAfterMin();
  else {
    img.addEventListener('load', hideAfterMin);
    img.addEventListener('error', hide);
  }
  setTimeout(hide, MAX_MS);
  el.addEventListener('click', hide);
})();
