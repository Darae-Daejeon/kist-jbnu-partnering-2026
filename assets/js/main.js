(function () {
  "use strict";

  var SITE = window.SITE || {};
  var TECHS = (window.TECHS || []).slice();
  var CAT = { carbon: "탄소복합소재", battery: "이차전지" };
  var $ = function (id) { return document.getElementById(id); };

  if (SITE.confirmedFirst) {
    TECHS = TECHS.map(function (t, i) { return { t: t, i: i }; })
      .sort(function (a, b) { return (b.t.confirmed ? 1 : 0) - (a.t.confirmed ? 1 : 0) || a.i - b.i; })
      .map(function (x) { return x.t; });
  }

  document.querySelectorAll("[data-notice]").forEach(function (el) { el.textContent = SITE.notice || ""; });
  $("privacyText").textContent = SITE.privacy || "";

  /* =======================================================
     카드 목록
     ======================================================= */
  var grid = $("techGrid");
  function pillsHtml(t) {
    return (t.confirmed ? '<span class="pill pill--confirmed">상담 확정</span>' : "") +
      '<span class="pill">' + esc(CAT[t.category] || "") + "</span>" +
      (t.org ? '<span class="pill">' + esc(t.org) + "</span>" : "");
  }
  grid.innerHTML = TECHS.map(function (t, idx) {
    return '<li data-category="' + esc(t.category) + '">' +
      '<button class="card" type="button" data-index="' + idx + '" aria-label="' + esc(t.title) + ' 소개자료 보기">' +
        '<img class="card__img" src="' + esc(t.image) + '" alt="" decoding="async">' +
        '<span class="card__pills">' + pillsHtml(t) + "</span>" +
        '<span class="card__band"><span class="card__title">' + esc(t.title) + "</span></span>" +
      "</button></li>";
  }).join("");

  var counts = { all: TECHS.length, carbon: 0, battery: 0 };
  TECHS.forEach(function (t) { if (counts[t.category] != null) counts[t.category]++; });
  document.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = counts[el.dataset.count] || 0; });

  /* 보이는 개수에 맞춰 한 화면 배치(열·행) 계산 */
  var MIN_CARD_W = 150;   /* 카드가 이보다 좁아지면 줄 수를 늘림 (분야·기관 타원이 한 줄에 들어가는 최소 폭) */
  function layoutGrid() {
    var n = grid.querySelectorAll("li:not([hidden])").length || 1;
    var rows = n <= 4 ? 1 : n <= 12 ? 2 : 3;
    var cols = Math.ceil(n / rows);
    var gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    var w = grid.clientWidth;
    while (rows < 5 && (w - gap * (cols - 1)) / cols < MIN_CARD_W) { rows++; cols = Math.ceil(n / rows); }
    grid.style.setProperty("--rows", rows);
    grid.style.setProperty("--cols", cols);
  }
  layoutGrid();
  var layoutTimer;
  window.addEventListener("resize", function () { clearTimeout(layoutTimer); layoutTimer = setTimeout(layoutGrid, 120); });

  var filterBtns = document.querySelectorAll(".filter__btn");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.dataset.filter;
      filterBtns.forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      applyFilter(f);
    });
  });

  /* 필터 애니메이션
     1) 빠지는 카드는 살짝 작아지며 사라짐
     2) 남는 카드는 원래 자리에서 새 자리로 미끄러지듯 이동·크기 변경
     3) 새로 나타나는 카드는 아래에서 살짝 떠오르며 차례로 등장 */
  var ANIM = { out: 160, move: 420, enter: 360, stagger: 30, ease: "cubic-bezier(.2,.7,.2,1)" };
  var filterRun = 0;

  function applyFilter(f) {
    var run = ++filterRun;
    var items = [].slice.call(grid.querySelectorAll("li"));
    var show = function (li) { return f === "all" || li.dataset.category === f; };
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    items.forEach(function (li) { if (li.getAnimations) li.getAnimations().forEach(function (a) { a.cancel(); }); });

    if (reduce || !grid.animate) {   /* 움직임 줄이기 설정 또는 구형 브라우저: 바로 바꿈 */
      items.forEach(function (li) { li.hidden = !show(li); });
      layoutGrid();
      return;
    }

    var first = new Map();
    items.forEach(function (li) { if (!li.hidden) first.set(li, li.getBoundingClientRect()); });

    var leaving = items.filter(function (li) { return !li.hidden && !show(li); });
    var outs = leaving.map(function (li) {
      return li.animate(
        [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.94)" }],
        { duration: ANIM.out, easing: "ease-in", fill: "forwards" }
      ).finished.catch(function () {});
    });

    Promise.all(outs).then(function () {
      if (run !== filterRun) return;   /* 그 사이 다른 필터를 누른 경우 */
      leaving.forEach(function (li) { li.getAnimations().forEach(function (a) { a.cancel(); }); });
      items.forEach(function (li) { li.hidden = !show(li); });
      layoutGrid();

      var n = 0;
      items.forEach(function (li) {
        if (li.hidden) return;
        var last = li.getBoundingClientRect();
        var old = first.get(li);
        if (old && last.width && last.height) {
          var dx = old.left - last.left, dy = old.top - last.top;
          var sx = old.width / last.width, sy = old.height / last.height;
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;
          li.animate(
            [{ transformOrigin: "0 0", transform: "translate(" + dx + "px," + dy + "px) scale(" + sx + "," + sy + ")" },
             { transformOrigin: "0 0", transform: "none" }],
            { duration: ANIM.move, easing: ANIM.ease }
          );
        } else {
          li.animate(
            [{ opacity: 0, transform: "translateY(14px) scale(.96)" }, { opacity: 1, transform: "none" }],
            { duration: ANIM.enter, delay: Math.min(n++, 12) * ANIM.stagger, easing: ANIM.ease, fill: "backwards" }
          );
        }
      });
    });
  }

  /* =======================================================
     기술 레이어 (모달)
     ======================================================= */
  var modal = $("techModal");
  var current = null;
  var lastFocus = null;

  function setView(name) {
    modal.querySelectorAll(".view").forEach(function (v) { v.hidden = v.dataset.view !== name; });
    $("btnBack").hidden = name !== "form";
    if (name === "viewer") $("modalTitle").textContent = current.title;
  }

  function openModal(t) {
    current = t;
    lastFocus = document.activeElement;
    $("modalPills").innerHTML = pillsHtml(t);
    $("modalTitle").textContent = t.title;
    resetForm();
    setView("viewer");
    document.body.classList.add("is-locked");
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    if (!history.state || !history.state.layer) history.pushState({ layer: 1 }, "");
    loadDoc(t);
  }

  function closeModal() {   /* 버튼·Esc·바깥 클릭 → 뒤로가기와 같은 흐름 */
    if (history.state && history.state.layer) history.back(); else reallyClose();
  }
  function reallyClose() {
    if (!modal.open && !modal.hasAttribute("open")) return;
    if (typeof modal.close === "function") modal.close(); else modal.removeAttribute("open");
  }
  window.addEventListener("popstate", function () { reallyClose(); });

  modal.addEventListener("close", function () {
    document.body.classList.remove("is-locked");
    destroyViewer();
    if (lastFocus) lastFocus.focus();
  });
  modal.addEventListener("cancel", function (e) { e.preventDefault(); closeModal(); });
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  $("btnClose").addEventListener("click", closeModal);
  $("btnDone").addEventListener("click", closeModal);
  $("btnBack").addEventListener("click", function () { setView("viewer"); });
  $("btnApply").addEventListener("click", function () {
    if (isClosed()) { openClosed(); return; }
    setView("form");
    $("fTech").value = current.title;
    setTimeout(function () { $("fOrg").focus(); }, 50);
  });

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".card");
    if (btn) openModal(TECHS[+btn.dataset.index]);
  });

  /* =======================================================
     소개자료 보기 + 확대·축소 (Panzoom 라이브러리)
     ======================================================= */
  var stage = $("stage");
  var zoomBar = $("zoomBar");
  var zoomVal = $("zoomVal");
  var tip = $("viewerTip");
  var pz = null, content = null, fitScale = 1, tall = false, tipTimer = null;

  var isPdf = function (f) { return /\.pdf($|[?#])/i.test(f); };
  var isTouch = window.matchMedia("(pointer: coarse)").matches;

  function destroyViewer() {
    if (pz) { pz.destroy(); pz = null; }
    stage.innerHTML = "";
    stage.className = "viewer__stage";
    zoomBar.hidden = true;
    tip.textContent = "";
    clearTimeout(tipTimer);
    content = null;
  }

  function loadDoc(t) {
    destroyViewer();
    var docs = Array.isArray(t.doc) ? t.doc.filter(Boolean) : (t.doc ? [t.doc] : []);
    $("docOpen").hidden = !docs.length;
    if (docs.length) $("docOpen").href = docs[0];

    if (!docs.length) {
      stage.innerHTML = '<div class="viewer__msg"><strong>소개자료를 준비하고 있습니다</strong>' +
        "<span>상담을 신청하시면 자료가 준비되는 대로 안내해 드립니다.</span></div>";
      return;
    }
    if (isPdf(docs[0])) {
      stage.classList.add("is-pdf");
      if (isTouch && window.innerWidth < 900) {
        stage.innerHTML = '<div class="viewer__msg"><strong>소개자료(PDF)</strong>' +
          "<span>휴대폰에서는 새 창에서 열어야 확대해서 볼 수 있습니다.</span>" +
          '<a class="btn" href="' + esc(docs[0]) + '" target="_blank" rel="noopener">소개자료 열기</a></div>';
      } else {
        stage.innerHTML = '<iframe src="' + esc(docs[0]) + '#view=FitH" title="' + esc(t.title) + ' 소개자료"></iframe>';
      }
      return;
    }

    content = document.createElement("div");
    content.className = "viewer__content";
    stage.innerHTML = '<div class="viewer__msg"><span>소개자료를 불러오는 중…</span></div>';
    var left = docs.length;
    docs.forEach(function (src, i) {
      var img = new Image();
      img.alt = t.title + " 소개자료" + (docs.length > 1 ? " " + (i + 1) + "쪽" : "");
      img.draggable = false;
      img.onload = img.onerror = function () { if (--left === 0) setupZoom(); };
      img.src = src;
      content.appendChild(img);
    });
  }

  function setupZoom() {
    if (!content || !modal.open) return;
    stage.innerHTML = "";
    stage.appendChild(content);

    if (typeof window.Panzoom !== "function") {   /* 라이브러리를 못 불러온 경우: 스크롤로 보기 */
      stage.classList.add("is-scroll");
      return;
    }
    pz = window.Panzoom(content, {
      maxScale: 6,
      minScale: 0.2,
      step: 0.3,
      canvas: true,
      cursor: "grab",
    });
    content.addEventListener("panzoomchange", updateZoomLabel);
    zoomBar.hidden = false;
    setTimeout(function () { fit(false); showTip(); }, 30);   /* Panzoom 초기 위치 설정이 끝난 뒤 맞춤 */
  }

  function showTip() {
    tip.classList.remove("is-hide");
    tip.textContent = isTouch ? "두 손가락으로 벌려 확대 · 두 번 톡 치면 확대/원래대로"
      : (tall ? "드래그·휠로 이동 · Ctrl+휠로 확대 · 더블클릭 확대" : "휠로 확대·축소 · 드래그로 이동 · 더블클릭 확대");
    tipTimer = setTimeout(function () { tip.classList.add("is-hide"); }, 3500);
  }

  /* 화면에 꼭 맞게: 한 장이면 전체가 보이게, 여러 장이면 가로에 맞춤 */
  function fit(animate) {
    if (!pz) return;
    var sw = stage.clientWidth, sh = stage.clientHeight;
    var cw = content.offsetWidth, ch = content.offsetHeight;
    var multi = content.children.length > 1;
    fitScale = multi ? 1 : Math.min(1, sh / ch);
    tall = ch * fitScale > sh + 1;
    pz.setOptions({ minScale: fitScale * 0.5 });
    pz.zoom(fitScale, { animate: animate, force: true });
    /* 기준점이 요소 가운데(50% 50%)라서 가운데 정렬 / 긴 자료는 위쪽 맞춤 */
    var x = (sw - cw) / 2 / fitScale;
    var y = tall ? (ch / 2 - ch / (2 * fitScale)) : (sh - ch) / 2 / fitScale;
    pz.pan(x, y, { animate: animate, force: true });
    updateZoomLabel();
  }

  function zoomAt(scale, clientX, clientY) {
    var r = stage.getBoundingClientRect();
    pz.zoomToPoint(scale, {
      clientX: clientX == null ? r.left + r.width / 2 : clientX,
      clientY: clientY == null ? r.top + r.height / 2 : clientY,
    }, { animate: true });
  }

  function onWheel(e) {
    if (!pz) return;
    e.preventDefault();
    if (tall && !e.ctrlKey && !e.metaKey) {      /* 긴 자료: 휠은 이동 */
      var s = pz.getScale();
      pz.pan(-e.deltaX / s, -e.deltaY / s, { relative: true });
    } else {
      pz.zoomWithWheel(e);
    }
  }

  function toggleZoom(clientX, clientY) {
    if (pz.getScale() > fitScale * 1.1) fit(true);
    else zoomAt(fitScale * 2.5, clientX, clientY);
  }
  function onDouble(e) { if (pz) toggleZoom(e.clientX, e.clientY); }

  var lastTap = 0;
  function onTapEnd(e) {   /* 모바일 두 번 톡 */
    if (e.pointerType !== "touch" || !pz) return;
    var now = Date.now();
    if (now - lastTap < 300) { toggleZoom(e.clientX, e.clientY); lastTap = 0; }
    else lastTap = now;
  }

  stage.addEventListener("wheel", onWheel, { passive: false });
  stage.addEventListener("dblclick", onDouble);
  stage.addEventListener("pointerup", onTapEnd);

  zoomBar.addEventListener("click", function (e) {
    var b = e.target.closest("[data-zoom]");
    if (!b || !pz) return;
    var k = b.dataset.zoom;
    if (k === "fit") fit(true);
    else zoomAt(pz.getScale() * (k === "in" ? 1.4 : 1 / 1.4));
  });

  function updateZoomLabel() {
    if (pz) zoomVal.textContent = Math.round(pz.getScale() / fitScale * 100) + "%";
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (pz && modal.open) fit(false); }, 150);
  });

  /* =======================================================
     상담 신청
     ======================================================= */
  var form = $("applyForm");
  var phone = $("fPhone");
  var email = $("fEmail");
  var phoneMask = null;

  /* 숫자만 입력해도 자동으로 하이픈 (IMask 라이브러리) */
  if (window.IMask) {
    phoneMask = window.IMask(phone, {
      mask: [{ mask: "000-000-0000" }, { mask: "000-0000-0000" }],
    });
  } else {
    phone.addEventListener("input", function () {
      var d = phone.value.replace(/\D/g, "").slice(0, 11);
      phone.value = d.length < 4 ? d : d.length < 8 ? d.slice(0, 3) + "-" + d.slice(3)
        : d.length < 11 ? d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6)
        : d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
    });
  }

  function phoneValue() { return phoneMask ? phoneMask.value : phone.value; }
  function isEmail(v) {
    if (window.validator && window.validator.isEmail) return window.validator.isEmail(v);
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  var rules = {
    org:   function () { return $("fOrg").value.trim() ? "" : "소속을 입력해 주세요."; },
    name:  function () { return $("fName").value.trim() ? "" : "이름을 입력해 주세요."; },
    position: function () { return $("fPos").value.trim() ? "" : "직책 또는 직급을 입력해 주세요."; },
    phone: function () {
      var d = phoneValue().replace(/\D/g, "");
      if (!d) return "휴대폰 번호를 입력해 주세요.";
      return /^01[016789]\d{7,8}$/.test(d) ? "" : "휴대폰 번호를 다시 확인해 주세요. (예: 010-1234-5678)";
    },
    email: function () {
      var v = email.value.trim();
      if (!v) return "이메일을 입력해 주세요.";
      return isEmail(v) ? "" : "이메일 형식이 맞지 않습니다. (예: name@company.com)";
    },
    agree: function () { return $("fAgree").checked ? "" : "개인정보 수집·이용에 동의해 주세요."; },
  };
  var inputs = { org: $("fOrg"), name: $("fName"), position: $("fPos"), phone: phone, email: email, agree: $("fAgree") };

  function check(key) {
    var msg = rules[key]();
    form.querySelector('[data-err="' + key + '"]').textContent = msg;
    if (inputs[key].type !== "checkbox") inputs[key].classList.toggle("is-invalid", !!msg);
    return !msg;
  }
  Object.keys(inputs).forEach(function (k) {
    var el = inputs[k];
    el.addEventListener("blur", function () { if (el.value || el.classList.contains("is-invalid")) check(k); });
    el.addEventListener("input", function () { if (el.classList.contains("is-invalid")) check(k); });
    el.addEventListener("change", function () { if (k === "agree") check(k); });
  });

  function resetForm() {
    form.reset();
    if (phoneMask) phoneMask.value = "";
    form.querySelectorAll(".field__err").forEach(function (e) { e.textContent = ""; });
    form.querySelectorAll(".is-invalid").forEach(function (e) { e.classList.remove("is-invalid"); });
    $("btnSubmit").disabled = false;
    $("btnSubmit").textContent = "상담 신청하기";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    $("formErr").textContent = "";
    if (isClosed()) { openClosed(); return; }
    var firstBad = null;
    Object.keys(rules).forEach(function (k) { if (!check(k) && !firstBad) firstBad = inputs[k]; });
    if (firstBad) { firstBad.focus(); return; }
    if (form.website.value) return;   /* 스팸 봇 */

    var data = {
      techId: current.id || "",
      techTitle: current.title,
      techCategory: CAT[current.category] || "",
      techOrg: current.org || "",
      org: $("fOrg").value.trim(),
      name: $("fName").value.trim(),
      position: $("fPos").value.trim(),
      phone: phoneValue(),
      email: email.value.trim(),
      agree: "동의",
      page: location.href.split("#")[0],
    };

    var btn = $("btnSubmit");
    btn.disabled = true;
    btn.textContent = "신청하는 중…";

    send(data).then(function (res) {
      showDone(data, res);
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = "상담 신청하기";
      if (err && err.message === "closed") { openClosed(); return; }
      $("formErr").textContent = "일시적인 오류로 신청이 접수되지 않았습니다. 잠시 후 다시 시도해 주세요." +
        (err && err.message ? " (오류: " + err.message + ")" : "");
      console.error("[상담 신청 오류]", err);
    });
  });

  /* 구글 Apps Script로 전송 (구글 시트 저장 + 안내 메일) */
  function send(data) {
    if (!SITE.applyEndpoint) {
      console.info("[시험 모드] applyEndpoint가 비어 있어 저장하지 않았습니다.", data);
      return new Promise(function (r) { setTimeout(function () { r({ ok: true, demo: true }); }, 500); });
    }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    return fetch(SITE.applyEndpoint, {
      method: "POST",
      body: JSON.stringify(data),        /* text/plain 전송 → 별도 사전요청 없이 Apps Script로 바로 전달 */
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function (r) {
        return r.text().then(function (t) {
          try { return JSON.parse(t); }
          catch (e) { throw new Error(/<html|<!doctype/i.test(t) ? "응답이 웹페이지임(웹 앱 액세스 권한 확인)" : "응답 형식 오류 " + r.status); }
        });
      })
      .then(function (res) {
        clearTimeout(timer);
        if (!res || !res.ok) throw new Error(res && res.error);
        return res;
      }, function (err) { clearTimeout(timer); throw err; });
  }

  /* =======================================================
     사전 신청 마감
     ======================================================= */
  var closedModal = $("closedModal");
  var deadline = Date.parse(SITE.deadline || "");
  var forceClosed = /[?&]closed\b/.test(location.search);   /* ?closed 로 마감 화면 미리보기 */
  function isClosed() { return forceClosed || (!isNaN(deadline) && Date.now() >= deadline); }

  $("closedDeadline").textContent = SITE.deadlineLabel || "";
  $("closedPhone").textContent = SITE.contactPhone || "";
  $("closedCall").href = "tel:" + String(SITE.contactPhone || "").replace(/[^0-9+]/g, "");

  function openClosed() {
    if (typeof closedModal.showModal === "function") closedModal.showModal(); else closedModal.setAttribute("open", "");
    setView("viewer");
  }
  $("btnClosedOk").addEventListener("click", function () { closedModal.close(); });
  closedModal.addEventListener("click", function (e) { if (e.target === closedModal) closedModal.close(); });

  function showDone(data, res) {
    $("doneTech").textContent = data.techTitle;
    $("doneMail").textContent = res.demo ? "※ 시험 모드: 신청 내용이 저장되지 않았습니다."
      : res.mail ? "입력하신 이메일(" + data.email + ")로 접수 안내 메일을 보내드렸습니다." : "";
    $("modalTitle").textContent = "상담 신청 완료";
    setView("done");
    $("btnDone").focus();
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
