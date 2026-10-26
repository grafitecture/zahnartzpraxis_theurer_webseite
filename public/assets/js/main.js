/*
 * Zahnarztpraxis Theurer – kleine Helfer, kein Framework.
 * 1. Mobile Navigation  2. Kopfzeile beim Scrollen  3. Sprechzeiten-Status
 *
 * Sprechzeiten, Feiertage und Praxisurlaub werden hier gepflegt.
 * Die Tabelle im HTML (#sprechzeiten) bitte bei Änderungen ebenfalls anpassen.
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
  // Beispiel: { from: '2026-12-24', to: '2027-01-01', label: 'Praxisurlaub' }
  var CLOSURES = [];

  var DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

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
    toggle.lastChild.textContent = open ? ' Schließen' : ' Menü';
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
   * 2. Kopfzeile: feine Linie und kompaktere Höhe nach dem Scrollen,
   *    aktiver Navigationspunkt je Abschnitt
   * ------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');
  if (header && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.className = 'scroll-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);

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
    var e = easterSunday(year), list = {};
    function rel(n, name) { var t = addDays(year, e.m, e.d, n); list[dateKey(t.y, t.m, t.d)] = name; }
    list[year + '-01-01'] = 'Neujahr';
    rel(-2, 'Karfreitag');
    rel(1, 'Ostermontag');
    list[year + '-05-01'] = 'Tag der Arbeit';
    rel(39, 'Christi Himmelfahrt');
    rel(50, 'Pfingstmontag');
    list[year + '-10-03'] = 'Tag der Deutschen Einheit';
    list[year + '-10-31'] = 'Reformationstag';
    list[year + '-12-25'] = '1. Weihnachtstag';
    list[year + '-12-26'] = '2. Weihnachtstag';
    holidayCache[year] = list;
    return list;
  }

  function closedReason(y, m, d) {
    var key = dateKey(y, m, d);
    var h = holidays(y)[key];
    if (h) return h;
    for (var i = 0; i < CLOSURES.length; i++) {
      if (key >= CLOSURES[i].from && key <= CLOSURES[i].to) return CLOSURES[i].label || 'Praxis geschlossen';
    }
    return null;
  }

  function toMinutes(hhmm) { var p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function formatTime(hhmm) { var p = hhmm.split(':'); return (+p[0]) + ':' + p[1]; }
  function formatRanges(ranges) {
    return ranges.map(function (r) { return formatTime(r[0]) + '–' + formatTime(r[1]); }).join(' und ') + ' Uhr';
  }

  function nextOpening(now, today) {
    for (var n = 1; n <= 21; n++) {
      var t = addDays(now.y, now.m, now.d, n);
      var ranges = HOURS[t.dow];
      if (!Array.isArray(ranges) || !ranges.length || closedReason(t.y, t.m, t.d)) continue;
      var when = n === 1 ? 'morgen' : 'am ' + DAY_NAMES[t.dow];
      return when + ' ab ' + formatTime(ranges[0][0]) + ' Uhr wieder geöffnet';
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
      result.hours = 'Geschlossen (' + reason + ')';
      result.text = 'Heute geschlossen (' + reason + ')' + nextText;
      return result;
    }
    if (typeof ranges === 'string') {
      result.hours = ranges.charAt(0).toUpperCase() + ranges.slice(1);
      result.state = 'soon';
      result.text = 'Heute Termine ' + ranges + '. Rufen Sie uns gern an.';
      return result;
    }
    if (!ranges.length) {
      result.hours = 'Geschlossen';
      result.text = 'Heute geschlossen' + nextText;
      return result;
    }

    result.hours = formatRanges(ranges);
    for (var i = 0; i < ranges.length; i++) {
      var from = toMinutes(ranges[i][0]), to = toMinutes(ranges[i][1]);
      if (now.minutes < from) {
        result.state = 'soon';
        result.text = i === 0
          ? 'Öffnet heute um ' + formatTime(ranges[i][0]) + ' Uhr'
          : 'Mittagspause, ab ' + formatTime(ranges[i][0]) + ' Uhr wieder geöffnet';
        return result;
      }
      if (now.minutes < to) {
        result.state = 'open';
        result.text = 'Jetzt geöffnet, bis ' + formatTime(ranges[i][1]) + ' Uhr';
        return result;
      }
    }
    result.text = 'Für heute geschlossen' + nextText;
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
      label.textContent = 'Heute, ' + s.day;
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
})();
