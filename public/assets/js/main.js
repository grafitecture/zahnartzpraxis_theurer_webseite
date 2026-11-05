/*
 * Zahnarztpraxis Theurer – kleine Helfer, kein Framework.
 * 1. Mobile Navigation  2. Kopfzeile beim Scrollen (2b. Zahn-Grafik)
 * 3. Sprechzeiten-Status  4. Sprachumschalter
 *
 * Sprechzeiten, Feiertage und Praxisurlaub werden hier gepflegt.
 * Die Tabellen im HTML (#sprechzeiten in index.html, #hours in en/index.html)
 * bitte bei Änderungen ebenfalls anpassen.
 * Alle Texte stehen zweisprachig in TEXT; die Sprache kommt aus <html lang>.
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
   * Pflege: Sprechzeiten und Schließtage
   * ------------------------------------------------------------------ */
  var HOURS = {
    1: [['08:00', '12:00'], ['13:00', '17:00']], // Montag
    2: [['07:15', '13:00']],                       // Dienstag
    3: [['07:15', '12:00'], ['13:00', '17:30']], // Mittwoch
    4: [['07:15', '13:00']],                       // Donnerstag
    5: 'nach Vereinbarung',                        // Freitag
    6: [],                                         // Samstag
    0: []                                          // Sonntag
  };

  // Praxisurlaub und Brückentage, jeweils von–bis (inklusive), Format JJJJ-MM-TT.
  // label erscheint auf den deutschen Seiten, labelEn auf den englischen.
  // Beispiel: { from: '2026-12-24', to: '2027-01-01', label: 'Praxisurlaub', labelEn: 'Practice holiday' }
  var CLOSURES = [];

  /* ---------------------------------------------------------------------
   * Texte (Deutsch / Englisch)
   * ------------------------------------------------------------------ */
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'de';
  var TEXT = {
    de: {
      days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
      menu: 'Menü', close: 'Schließen',
      byAppointment: 'nach Vereinbarung',
      and: ' und ', clock: ' Uhr',
      tomorrow: 'morgen', onDay: 'am ',
      reopens: function (when, time) { return when + ' ab ' + time + ' Uhr wieder geöffnet'; },
      closed: 'Geschlossen', closedToday: 'Heute geschlossen', closedForToday: 'Für heute geschlossen',
      practiceClosed: 'Praxis geschlossen',
      todayByAppointment: function (t) { return 'Heute Termine ' + t + '. Rufen Sie uns gern an.'; },
      opensAt: function (time) { return 'Öffnet heute um ' + time + ' Uhr'; },
      lunch: function (time) { return 'Mittagspause, ab ' + time + ' Uhr wieder geöffnet'; },
      openUntil: function (time) { return 'Jetzt geöffnet, bis ' + time + ' Uhr'; },
      today: 'Heute, ',
      holidays: {
        newYear: 'Neujahr', goodFriday: 'Karfreitag', easterMonday: 'Ostermontag', labour: 'Tag der Arbeit',
        ascension: 'Christi Himmelfahrt', whitMonday: 'Pfingstmontag', unity: 'Tag der Deutschen Einheit',
        reformation: 'Reformationstag', xmas1: '1. Weihnachtstag', xmas2: '2. Weihnachtstag'
      }
    },
    en: {
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      menu: 'Menu', close: 'Close',
      byAppointment: 'by appointment',
      and: ' and ', clock: '',
      tomorrow: 'tomorrow', onDay: 'on ',
      reopens: function (when, time) { return 'open again ' + when + ' from ' + time; },
      closed: 'Closed', closedToday: 'Closed today', closedForToday: 'Closed for today',
      practiceClosed: 'practice closed',
      todayByAppointment: function () { return 'Today by appointment only. Feel free to call us.'; },
      opensAt: function (time) { return 'Opens today at ' + time; },
      lunch: function (time) { return 'Lunch break, open again from ' + time; },
      openUntil: function (time) { return 'Open now, until ' + time; },
      today: 'Today, ',
      holidays: {
        newYear: 'New Year’s Day', goodFriday: 'Good Friday', easterMonday: 'Easter Monday', labour: 'Labour Day',
        ascension: 'Ascension Day', whitMonday: 'Whit Monday', unity: 'Day of German Unity',
        reformation: 'Reformation Day', xmas1: 'Christmas Day', xmas2: 'Boxing Day'
      }
    }
  }[LANG];

  var DAY_NAMES = TEXT.days;

  /* ---------------------------------------------------------------------
   * 1. Mobile Navigation (ohne JavaScript führt „Menü“ zur Seitennavigation im Fuß)
   * ------------------------------------------------------------------ */
  var nav = document.querySelector('.nav');
  var toggle = nav && nav.querySelector('.nav__toggle');
  var menu = nav && nav.querySelector('.nav__menu');

  function setMenu(open) {
    if (!nav) return;
    if (open) nav.setAttribute('data-open', '');
    else nav.removeAttribute('data-open');
    toggle.setAttribute('aria-expanded', String(open));
    // Sichtbar ist nur das Symbol; die Bezeichnung hören Screenreader
    var label = toggle.querySelector('.nav__toggle-label');
    if (label) label.textContent = open ? TEXT.close : TEXT.menu;
  }

  if (toggle && menu) {
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      setMenu(!nav.hasAttribute('data-open'));
    });
    toggle.addEventListener('keydown', function (event) {
      if (event.key === ' ') {
        event.preventDefault();
        setMenu(!nav.hasAttribute('data-open'));
      }
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.hasAttribute('data-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (nav.hasAttribute('data-open') && !nav.contains(event.target)) setMenu(false);
    });
    window.matchMedia('(min-width: 64em)').addEventListener('change', function () { setMenu(false); });
  }

  /* ---------------------------------------------------------------------
   * 2. Kopfzeile: oben transparent über dem Verlauf, beim Scrollen immer
   *    oben angeheftet (mit heller Fläche) – das Logo bleibt immer gleich
   *    groß. Dazu der aktive Navigationspunkt je Abschnitt.
   * ------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');
  if (header) {
    var ticking = false;

    var updateHeader = function () {
      header.classList.toggle('is-top', window.scrollY < 8);
      ticking = false;
    };

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateHeader);
      }
    }, { passive: true });
    updateHeader();
  }

  /* ---------------------------------------------------------------------
   * 2a. Telefonnummer nur einmal im Bild: Solange der Dreierblock im Hero
   *     (Telefon, WhatsApp, Anfahrt) sichtbar ist, blenden das Telefon in der
   *     Kopfzeile (Desktop) und die Schnellkontakt-Leiste (mobil) aus.
   *     Ohne JavaScript bleiben beide sichtbar.
   * ------------------------------------------------------------------ */
  var reach = document.querySelector('[data-reach]');
  if (reach && 'IntersectionObserver' in window) {
    var root = document.documentElement;
    var bar = document.querySelector('.action-bar');
    var reachObserver = null;
    var resizeTimer = 0;

    var watchReach = function () {
      if (reachObserver) reachObserver.disconnect();
      // „Im Bild“ heißt: nicht unter der angehefteten Kopfzeile und nicht hinter der Leiste
      var top = header ? header.offsetHeight : 0;
      var bottom = bar && window.getComputedStyle(bar).display !== 'none' ? bar.offsetHeight : 0;
      var rect = reach.getBoundingClientRect();
      root.classList.toggle('reach-in-view', rect.bottom > top && rect.top < window.innerHeight - bottom);

      reachObserver = new IntersectionObserver(function (entries) {
        root.classList.toggle('reach-in-view', entries[entries.length - 1].isIntersecting);
      }, { rootMargin: (-top) + 'px 0px ' + (-bottom) + 'px 0px' });
      reachObserver.observe(reach);
    };

    watchReach();
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(watchReach, 200);
    });
  }

  /* ---------------------------------------------------------------------
   * 2b. Zahn-Grafik der Startseite: wandert beim Scrollen mit (fest im
   *     Fenster) und blendet bis zum Seitenende immer mehr aus.
   *     Deckkraft = (1 - Fortschritt) hoch TOOTH_FADE. Mit 1,5 halten alle
   *     Texte an jeder Scrollposition WCAG AA (gemessen bei 390–1440 px);
   *     bei kleineren Werten fallen blaue Überschriften auf Hellblau unter 3:1.
   *     Ohne JavaScript und bei „Bewegung reduzieren“ bleibt sie oben im Hero.
   * ------------------------------------------------------------------ */
  var TOOTH_FADE = 1.5;
  var tooth = document.querySelector('[data-tooth]');
  if (tooth && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    var toothTicking = false;

    var updateTooth = function () {
      var range = document.documentElement.scrollHeight - window.innerHeight;
      var progress = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
      tooth.style.opacity = Math.pow(1 - progress, TOOTH_FADE).toFixed(3);
      toothTicking = false;
    };
    var requestTooth = function () {
      if (!toothTicking) {
        toothTicking = true;
        window.requestAnimationFrame(updateTooth);
      }
    };

    tooth.classList.add('is-floating');
    window.addEventListener('scroll', requestTooth, { passive: true });
    window.addEventListener('resize', requestTooth);
    updateTooth();
  }

  if (header && 'IntersectionObserver' in window) {
    var links = menu ? Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]')) : [];
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
    if (sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) {
            if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* ---------------------------------------------------------------------
   * 3. Sprechzeiten-Status (immer in deutscher Ortszeit)
   * ------------------------------------------------------------------ */
  function berlinNow() {
    var parts = {};
    new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var y = +parts.year, m = +parts.month, d = +parts.day;
    return { y: y, m: m, d: d, minutes: (+parts.hour) * 60 + (+parts.minute) };
  }

  function dateKey(y, m, d) {
    return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  function addDays(y, m, d, n) {
    var t = new Date(Date.UTC(y, m - 1, d + n));
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: t.getUTCDay() };
  }

  // Gesetzliche Feiertage in Niedersachsen
  function easterSunday(year) {
    var a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7, mm = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * mm + 114) / 31), day = ((h + l - 7 * mm + 114) % 31) + 1;
    return { m: month, d: day };
  }

  var holidayCache = {};
  function holidays(year) {
    if (holidayCache[year]) return holidayCache[year];
    var e = easterSunday(year), list = {}, h = TEXT.holidays;
    function rel(n, name) { var t = addDays(year, e.m, e.d, n); list[dateKey(t.y, t.m, t.d)] = name; }
    list[year + '-01-01'] = h.newYear;
    rel(-2, h.goodFriday);
    rel(1, h.easterMonday);
    list[year + '-05-01'] = h.labour;
    rel(39, h.ascension);
    rel(50, h.whitMonday);
    list[year + '-10-03'] = h.unity;
    list[year + '-10-31'] = h.reformation;
    list[year + '-12-25'] = h.xmas1;
    list[year + '-12-26'] = h.xmas2;
    holidayCache[year] = list;
    return list;
  }

  function closedReason(y, m, d) {
    var key = dateKey(y, m, d);
    var h = holidays(y)[key];
    if (h) return h;
    for (var i = 0; i < CLOSURES.length; i++) {
      if (key >= CLOSURES[i].from && key <= CLOSURES[i].to) {
        return (LANG === 'en' ? CLOSURES[i].labelEn : CLOSURES[i].label) || TEXT.practiceClosed;
      }
    }
    return null;
  }

  function toMinutes(hhmm) { var p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function formatTime(hhmm) { var p = hhmm.split(':'); return (+p[0]) + ':' + p[1]; }
  function formatRanges(ranges) {
    return ranges.map(function (r) { return formatTime(r[0]) + '–' + formatTime(r[1]); }).join(TEXT.and) + TEXT.clock;
  }

  function nextOpening(now, today) {
    for (var n = 1; n <= 21; n++) {
      var t = addDays(now.y, now.m, now.d, n);
      var ranges = HOURS[t.dow];
      if (!Array.isArray(ranges) || !ranges.length || closedReason(t.y, t.m, t.d)) continue;
      var when = n === 1 ? TEXT.tomorrow : TEXT.onDay + DAY_NAMES[t.dow];
      return TEXT.reopens(when, formatTime(ranges[0][0]));
    }
    return null;
  }

  function computeStatus() {
    var now = berlinNow();
    var today = addDays(now.y, now.m, now.d, 0);
    var dow = today.dow;
    var reason = closedReason(now.y, now.m, now.d);
    var ranges = HOURS[dow];
    var next = nextOpening(now, today);
    var nextText = next ? ', ' + next : '';

    var result = { day: DAY_NAMES[dow], dow: dow, hours: '', state: 'closed', text: '' };

    if (reason) {
      result.hours = TEXT.closed + ' (' + reason + ')';
      result.text = TEXT.closedToday + ' (' + reason + ')' + nextText;
      return result;
    }
    if (typeof ranges === 'string') {
      // Freitag: „nach Vereinbarung“ (in HOURS deutsch gepflegt, Anzeige je Sprache)
      var byApp = TEXT.byAppointment;
      result.hours = byApp.charAt(0).toUpperCase() + byApp.slice(1);
      result.state = 'soon';
      result.text = TEXT.todayByAppointment(byApp);
      return result;
    }
    if (!ranges.length) {
      result.hours = TEXT.closed;
      result.text = TEXT.closedToday + nextText;
      return result;
    }

    result.hours = formatRanges(ranges);
    for (var i = 0; i < ranges.length; i++) {
      var from = toMinutes(ranges[i][0]), to = toMinutes(ranges[i][1]);
      if (now.minutes < from) {
        result.state = 'soon';
        result.text = i === 0
          ? TEXT.opensAt(formatTime(ranges[i][0]))
          : TEXT.lunch(formatTime(ranges[i][0]));
        return result;
      }
      if (now.minutes < to) {
        result.state = 'open';
        result.text = TEXT.openUntil(formatTime(ranges[i][1]));
        return result;
      }
    }
    result.text = TEXT.closedForToday + nextText;
    return result;
  }

  function renderStatus() {
    var s;
    try { s = computeStatus(); } catch (err) { return; }

    Array.prototype.forEach.call(document.querySelectorAll('[data-status]'), function (el) {
      el.setAttribute('data-state', s.state);
      el.querySelector('[data-status-text]').textContent = s.text;
      el.hidden = false;
    });

    var label = document.querySelector('[data-today-label]');
    var hours = document.querySelector('[data-today-hours]');
    if (label && hours) {
      label.textContent = TEXT.today + s.day;
      hours.textContent = s.hours;
    }

    Array.prototype.forEach.call(document.querySelectorAll('.hours tr[data-day]'), function (row) {
      row.classList.toggle('is-today', Number(row.getAttribute('data-day')) === s.dow);
    });
  }

  renderStatus();
  setInterval(renderStatus, 60 * 1000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') renderStatus();
  });

  /* ---------------------------------------------------------------------
   * 4. Sprachumschalter: Wer auf der Startseite mitten in einem Abschnitt
   *    die Sprache wechselt, landet im selben Abschnitt der anderen Sprache
   *    (z. B. /#anfahrt → /en/#directions). Ohne JavaScript führt der Link
   *    einfach auf den Seitenanfang. Nichts wird gespeichert (keine Cookies).
   * ------------------------------------------------------------------ */
  var ANCHORS = {
    zahnaerztin: 'dentist', leistungen: 'services', team: 'team', karriere: 'careers',
    praxis: 'practice', anfahrt: 'directions', kontakt: 'contact', sprechzeiten: 'hours'
  };
  var anchorMap = ANCHORS;
  if (LANG === 'en') {
    anchorMap = {};
    Object.keys(ANCHORS).forEach(function (k) { anchorMap[ANCHORS[k]] = k; });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-lang-switch]'), function (link) {
    link.addEventListener('click', function () {
      var limit = (header ? header.offsetHeight : 0) + 32;
      var best = null, bestTop = -Infinity;
      Object.keys(anchorMap).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var top = el.getBoundingClientRect().top;
        if (top <= limit && top > bestTop) { best = id; bestTop = top; }
      });
      link.hash = best ? '#' + anchorMap[best] : '';
    });
  });
})();
