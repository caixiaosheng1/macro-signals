/* 宏信号的页面逻辑。不要在这里写访谈内容，只改 data.js。 */
(function () {
  'use strict';

  var HOME_LIMIT = 5;
  var EMPTY = '暂无内容，等待第一篇访谈';
  var DEFAULT_DISCLAIMER = '嘉宾观点≠事实；本站推演仅供参考，不构成买卖建议；未接入实时行情。';
  var STATUSES = ['观察', '验证中', '兑现', '失效'];
  var composing = false;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function site() {
    return window.SITE && typeof window.SITE === 'object' ? window.SITE : {};
  }

  function themes() { return asArray(window.THEMES); }
  function opportunities() { return asArray(window.OPPORTUNITIES); }
  function signals() { return asArray(window.SIGNALS); }
  function interviews() { return asArray(window.INTERVIEWS); }
  function guests() { return asArray(window.GUESTS); }

  function dataReady() {
    return !!(window.SITE && typeof window.SITE === 'object'
      && Array.isArray(window.THEMES)
      && Array.isArray(window.OPPORTUNITIES)
      && Array.isArray(window.SIGNALS)
      && Array.isArray(window.INTERVIEWS)
      && Array.isArray(window.GUESTS));
  }

  function disclaimer() {
    var text = site().disclaimer;
    if (text && String(text).trim()) return String(text);
    return DEFAULT_DISCLAIMER;
  }

  function find(list, id) {
    if (id == null || id === '') return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }

  function decodePart(value) {
    try {
      return decodeURIComponent(value);
    } catch (err) {
      return value;
    }
  }

  function parseRoute() {
    var raw = location.hash || '#/';
    if (raw === '#') raw = '#/';
    raw = raw.replace(/^#/, '');
    if (raw.charAt(0) !== '/') raw = '/' + raw;
    var qIndex = raw.indexOf('?');
    var path = qIndex === -1 ? raw : raw.slice(0, qIndex);
    var query = qIndex === -1 ? '' : raw.slice(qIndex + 1);
    var parts = path.split('/').filter(Boolean).map(decodePart);
    return {
      parts: parts,
      params: new URLSearchParams(query),
      path: '/' + parts.join('/'),
    };
  }

  function hashTo(parts) {
    return '#/' + parts.map(function (part) {
      return encodeURIComponent(part);
    }).join('/');
  }

  function dateKey(item) {
    return String((item && item.date) || '');
  }

  function cmpDateDesc(a, b) {
    var da = dateKey(a);
    var db = dateKey(b);
    if (da < db) return 1;
    if (da > db) return -1;
    var ia = String((a && a.id) || '');
    var ib = String((b && b.id) || '');
    if (ia < ib) return 1;
    if (ia > ib) return -1;
    return 0;
  }

  function cmpDateAsc(a, b) {
    return cmpDateDesc(b, a);
  }

  function monthLabel(date) {
    var match = /^(\d{4})-(\d{2})/.exec(String(date || ''));
    if (!match) return '日期未填';
    return match[1] + '年' + Number(match[2]) + '月';
  }

  function groupByMonth(list) {
    var groups = [];
    var map = {};
    list.forEach(function (item) {
      var key = monthLabel(item && item.date);
      if (!map[key]) {
        map[key] = { label: key, items: [] };
        groups.push(map[key]);
      }
      map[key].items.push(item);
    });
    return groups;
  }

  function uniqueById(list) {
    var seen = {};
    var out = [];
    list.forEach(function (item) {
      if (!item) return;
      var key = item.id != null && item.id !== '' ? String(item.id) : null;
      if (key && seen[key]) return;
      if (key) seen[key] = true;
      out.push(item);
    });
    return out;
  }

  function resolveInterview(signal) {
    if (!signal) return null;
    var direct = find(interviews(), signal.interviewId);
    if (direct) return direct;
    var all = interviews();
    for (var i = 0; i < all.length; i++) {
      if (all[i] && asArray(all[i].signalIds).indexOf(signal.id) !== -1) return all[i];
    }
    return null;
  }

  function signalsForInterview(interview) {
    if (!interview) return [];
    var ids = {};
    asArray(interview.signalIds).forEach(function (id) { ids[id] = true; });
    var matched = signals().filter(function (signal) {
      return signal && (signal.interviewId === interview.id || ids[signal.id]);
    });
    return uniqueById(matched).sort(cmpDateDesc);
  }

  function interviewsForGuest(guest) {
    if (!guest) return [];
    var ids = {};
    asArray(guest.interviewIds).forEach(function (id) { ids[id] = true; });
    var matched = interviews().filter(function (interview) {
      return interview && (interview.guestId === guest.id || ids[interview.id]);
    });
    return uniqueById(matched).sort(cmpDateDesc);
  }

  function signalsForGuest(guest) {
    if (!guest) return [];
    var interviewIds = {};
    interviewsForGuest(guest).forEach(function (interview) {
      interviewIds[interview.id] = true;
    });
    var matched = signals().filter(function (signal) {
      if (!signal) return false;
      if (signal.guestId === guest.id) return true;
      return !!(signal.interviewId && interviewIds[signal.interviewId]);
    });
    return uniqueById(matched).sort(cmpDateDesc);
  }

  function opportunitySignals(opportunity) {
    var byId = {};
    signals().forEach(function (signal) {
      if (signal && signal.id != null) byId[signal.id] = signal;
    });
    var out = [];
    var seen = {};
    asArray(opportunity && opportunity.signalIds).forEach(function (id) {
      if (seen[id]) return;
      seen[id] = true;
      if (byId[id]) out.push(byId[id]);
    });
    return out.sort(cmpDateAsc);
  }

  function textOrList(value) {
    if (Array.isArray(value)) {
      return value.filter(function (item) {
        return item != null && String(item).trim();
      }).join('\n');
    }
    return value == null ? '' : String(value);
  }

  function countOf(value) {
    if (Array.isArray(value)) return String(value.length);
    if (typeof value === 'number' && isFinite(value)) return String(value);
    if (typeof value === 'string' && value.trim()) return value.trim();
    return '—';
  }

  function kindOf(value, map, fallback) {
    return map[value] || fallback || 'neutral';
  }

  function badge(text, kind) {
    if (text == null || text === '') return '';
    return '<span class="badge badge-' + (kind || 'neutral') + '">' + esc(text) + '</span>';
  }

  function directionKind(value) {
    return kindOf(value, { '强化': 'up', '减弱': 'down', '待观察': 'wait' });
  }

  function outcomeKind(value) {
    return kindOf(value, { '应验': 'up', '落空': 'down', '待验证': 'wait' });
  }

  function statusKind(value) {
    return kindOf(value, { '兑现': 'up', '失效': 'down', '验证中': 'info', '观察': 'wait' });
  }

  function typeKind(value) {
    return kindOf(value, { '数据': 'info', '暗示': 'wait', '观点': 'neutral' });
  }

  function safeUrl(url) {
    var value = String(url || '').trim();
    if (/^https:\/\//i.test(value) || /^http:\/\//i.test(value)) return value;
    return '';
  }

  function emptyHtml(message) {
    return '<div class="empty"><p>' + esc(message || EMPTY) + '</p></div>';
  }

  function moreLink(href, label) {
    return '<a class="more" href="' + href + '">' + esc(label) + '</a>';
  }

  function proseBlock(title, text, emptyMessage) {
    var body = text && String(text).trim()
      ? '<p class="preserve">' + esc(text) + '</p>'
      : '<p class="muted">' + esc(emptyMessage) + '</p>';
    return '<section class="block"><h2>' + esc(title) + '</h2>' + body + '</section>';
  }

  function impactHtml(signal) {
    var parts = [];
    if (signal.winners) parts.push('<span>受益 ' + esc(signal.winners) + '</span>');
    if (signal.losers) parts.push('<span>承压 ' + esc(signal.losers) + '</span>');
    if (!parts.length) return '';
    return '<p class="impact">' + parts.join('<span class="sep">·</span>') + '</p>';
  }

  function signalNodeHtml(signal, options) {
    options = options || {};
    var guest = find(guests(), signal.guestId);
    var interview = resolveInterview(signal);
    var bits = [];
    if (signal.date) bits.push('<time datetime="' + esc(signal.date) + '">' + esc(signal.date) + '</time>');
    if (signal.type) bits.push(badge(signal.type, typeKind(signal.type)));
    if (signal.forwardLooking) bits.push(badge('前瞻', 'info'));
    if (signal.outcome) bits.push(badge(signal.outcome, outcomeKind(signal.outcome)));

    var who = [];
    if (options.showGuest !== false) {
      if (guest) who.push('<a href="' + hashTo(['guests', guest.id]) + '">' + esc(guest.name || '未命名嘉宾') + '</a>');
      else who.push('<span>未知嘉宾</span>');
    }
    if (options.showInterview !== false && interview) {
      who.push('<a href="' + hashTo(['interviews', interview.id]) + '">' + esc(interview.title || '访谈') + '</a>');
    }

    var verify = signal.verifyBy ? '<p class="verify">核对时点：' + esc(signal.verifyBy) + '</p>' : '';
    var handoff = options.handoff ? '<p class="handoff">另一位嘉宾接上</p>' : '';
    return '<article class="node">'
      + '<div class="node-rail" aria-hidden="true"><span class="dot dot-' + outcomeKind(signal.outcome) + '"></span></div>'
      + '<div class="node-body">'
      + handoff
      + '<div class="meta">' + bits.join('') + '</div>'
      + '<p class="signal-text preserve">' + esc(signal.text || '（这条信号没有正文）') + '</p>'
      + (who.length ? '<p class="who">' + who.join('<span class="sep">·</span>') + '</p>' : '')
      + impactHtml(signal)
      + verify
      + '</div></article>';
  }

  function dotsHtml(list) {
    if (!list.length) return '<p class="muted">还没有串起来的信号。</p>';
    var prev = null;
    return '<div class="nodes">' + list.map(function (signal) {
      var handoff = !!(prev && signal.guestId && prev !== signal.guestId);
      if (signal.guestId) prev = signal.guestId;
      return signalNodeHtml(signal, { handoff: handoff });
    }).join('') + '</div>';
  }

  function homeSignalHtml(signal) {
    var interview = resolveInterview(signal);
    var guest = find(guests(), signal.guestId);
    var bits = [];
    if (signal.date) bits.push('<time>' + esc(signal.date) + '</time>');
    if (signal.type) bits.push(badge(signal.type, typeKind(signal.type)));
    if (signal.outcome) bits.push(badge(signal.outcome, outcomeKind(signal.outcome)));
    var inner = '<div class="meta">' + bits.join('') + '</div>'
      + '<p class="signal-text preserve">' + esc(signal.text || '（这条信号没有正文）') + '</p>'
      + '<p class="who">' + esc((guest && guest.name) || '未知嘉宾') + '</p>';
    if (interview) {
      return '<a class="card home-signal" href="' + hashTo(['interviews', interview.id]) + '">' + inner + '</a>';
    }
    return '<article class="card home-signal">' + inner + '</article>';
  }

  function themeCardHtml(theme) {
    var count = asArray(theme.signalIds).length;
    return '<a class="card theme-card" href="#/timeline?theme=' + encodeURIComponent(theme.id) + '">'
      + '<div class="meta">' + badge(theme.direction || '待观察', directionKind(theme.direction))
      + (theme.updated ? '<time>' + esc(theme.updated) + '</time>' : '') + '</div>'
      + '<h3>' + esc(theme.title || '未命名主线') + '</h3>'
      + (theme.summary ? '<p class="clamp preserve">' + esc(theme.summary) + '</p>' : '')
      + '<p class="meta foot">' + count + ' 条信号</p></a>';
  }

  function opportunityCardHtml(opportunity) {
    var names = asArray(opportunity.assets).map(function (asset) {
      return asset && asset.name;
    }).filter(Boolean);
    var metrics = [
      badge(opportunity.status, statusKind(opportunity.status)),
      opportunity.successRate ? '<span>成功率 ' + esc(opportunity.successRate) + '</span>' : '',
      opportunity.riskReward ? '<span>盈亏比 ' + esc(opportunity.riskReward) + '</span>' : '',
    ].filter(Boolean);
    return '<a class="card opp-card" href="' + hashTo(['opportunities', opportunity.id]) + '">'
      + '<div class="meta metrics">' + metrics.join('') + '</div>'
      + '<h3>' + esc(opportunity.title || '未命名机会') + '</h3>'
      + (names.length ? '<p class="assets-line">' + esc(names.join('、')) + '</p>' : '')
      + '</a>';
  }

  function interviewCardHtml(interview) {
    var guest = find(guests(), interview.guestId);
    return '<a class="card" href="' + hashTo(['interviews', interview.id]) + '">'
      + '<div class="meta">'
      + (interview.date ? '<time>' + esc(interview.date) + '</time>' : '')
      + (interview.channel ? '<span>' + esc(interview.channel) + '</span>' : '')
      + '</div>'
      + '<h3>' + esc(interview.title || '未命名访谈') + '</h3>'
      + '<p class="who">' + esc((guest && guest.name) || '未知嘉宾') + '</p>'
      + (interview.oneLine ? '<p class="clamp">' + esc(interview.oneLine) + '</p>' : '')
      + '</a>';
  }

  function guestCardHtml(guest) {
    var record = guest.trackRecord || {};
    return '<a class="card" href="' + hashTo(['guests', guest.id]) + '">'
      + '<h3>' + esc(guest.name || '未命名嘉宾') + '</h3>'
      + (guest.role ? '<p class="role">' + esc(guest.role) + '</p>' : '')
      + (guest.stance ? '<p class="clamp">' + esc(textOrList(guest.stance)) + '</p>' : '')
      + '<p class="meta foot">应验 ' + esc(countOf(record.hit))
      + ' · 落空 ' + esc(countOf(record.miss))
      + ' · 待验证 ' + esc(countOf(record.pending)) + '</p></a>';
  }

  function selectOptions(items, current, allLabel, labelOf) {
    var html = '<option value="">' + esc(allLabel) + '</option>';
    items.forEach(function (item) {
      if (!item || item.id == null || item.id === '') return;
      var selected = item.id === current ? ' selected' : '';
      html += '<option value="' + esc(item.id) + '"' + selected + '>' + esc(labelOf(item)) + '</option>';
    });
    return html;
  }

  function statusChips(current) {
    var html = '<a class="chip' + (current ? '' : ' is-on') + '" href="#/opportunities">全部</a>';
    STATUSES.forEach(function (status) {
      var on = current === status ? ' is-on' : '';
      html += '<a class="chip' + on + '" href="#/opportunities?status=' + encodeURIComponent(status) + '">' + esc(status) + '</a>';
    });
    return '<div class="chips">' + html + '</div>';
  }

  function factsHtml(facts) {
    var list = asArray(facts).filter(Boolean);
    if (!list.length) return '<p class="muted">这篇没有单列事实核对。</p>';
    return list.map(function (fact) {
      return '<article class="fact">'
        + '<p class="k">说法</p><p class="preserve">' + esc(fact.claim || '未填写') + '</p>'
        + '<p class="k">如何核对</p><p class="preserve">' + esc(fact.check || '未填写') + '</p>'
        + '<p class="k">结果</p><p class="preserve">' + esc(fact.verdict || '未填写') + '</p>'
        + '</article>';
    }).join('');
  }

  function conclusionHtml(items) {
    var list = asArray(items).filter(function (item) {
      return item != null && String(item).trim();
    });
    if (!list.length) return '<section class="block"><h2>结论</h2><p class="muted">这篇没有写结论。</p></section>';
    return '<section class="block"><h2>结论</h2><ul class="points">'
      + list.map(function (item) { return '<li class="preserve">' + esc(item) + '</li>'; }).join('')
      + '</ul></section>';
  }

  function assetsHtml(assets) {
    var list = asArray(assets).filter(function (asset) {
      return asset && (asset.name || asset.code || asset.market);
    });
    if (!list.length) return '';
    return '<section class="block"><h2>涉及资产</h2><ul class="asset-list">'
      + list.map(function (asset) {
        var extra = [asset.code, asset.market].filter(Boolean).map(esc).join(' · ');
        return '<li><span class="asset-name">' + esc(asset.name || '未命名') + '</span>'
          + (extra ? '<span class="asset-code">' + extra + '</span>' : '') + '</li>';
      }).join('')
      + '</ul></section>';
  }

  function recordHtml(trackRecord) {
    var record = trackRecord && typeof trackRecord === 'object' ? trackRecord : {};
    var rows = [
      ['应验', record.hit, 'up'],
      ['落空', record.miss, 'down'],
      ['待验证', record.pending, 'wait'],
    ];
    var stats = rows.map(function (row) {
      return '<div><strong class="num-' + row[2] + '">' + esc(countOf(row[1])) + '</strong><span>' + row[0] + '</span></div>';
    }).join('');
    var lists = rows.map(function (row) {
      if (!Array.isArray(row[1]) || !row[1].length) return '';
      return '<h3>' + row[0] + '</h3><ul class="points">'
        + row[1].map(function (item) { return '<li class="preserve">' + esc(item) + '</li>'; }).join('')
        + '</ul>';
    }).join('');
    return '<div class="record">' + stats + '</div>' + lists;
  }

  function notesHtml(notes) {
    var list = asArray(notes).filter(function (note) {
      return note != null && String(note).trim();
    });
    if (!list.length) return '';
    return '<section class="block"><h2>备注</h2><ul class="points">'
      + list.map(function (note) { return '<li class="preserve">' + esc(note) + '</li>'; }).join('')
      + '</ul></section>';
  }

  function externalLink(url, label) {
    var safe = safeUrl(url);
    if (!safe) return '';
    return '<p class="source"><a href="' + esc(safe) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a></p>';
  }

  function setTitle(text) {
    document.title = text ? text + ' · 宏信号' : '宏信号';
  }

  function colophon() {
    var updated = site().updated ? '<p class="colo-meta">更新于 ' + esc(site().updated) + '</p>' : '';
    return '<footer class="colophon">' + updated + '<p>' + esc(disclaimer()) + '</p></footer>';
  }

  function shell(html, options) {
    var warn = dataReady() ? '' : '<p class="data-error">数据没有载入。请检查 data.js 的引号、逗号，以及 SITE、THEMES、OPPORTUNITIES、SIGNALS、INTERVIEWS、GUESTS 是否都在。</p>';
    var foot = options && options.footer === false ? '' : colophon();
    return '<div class="wrap" id="content">' + warn + html + foot + '</div>';
  }

  function viewHome() {
    setTitle('');
    var themeList = themes();
    var opportunityList = opportunities();
    var signalList = signals().slice().sort(cmpDateDesc);
    var shownThemes = themeList.slice(0, HOME_LIMIT);
    var shownOpps = opportunityList.slice(0, HOME_LIMIT);
    var shownSignals = signalList.slice(0, HOME_LIMIT);
    var updated = site().updated ? '<p class="updated">更新于 ' + esc(site().updated) + '</p>' : '';
    return shell(
      '<header class="hero">'
      + '<p class="kicker">宏观判断笔记</p>'
      + '<h1>宏信号</h1>'
      + '<p class="lede">把访谈拆成可以核对的信号，再串成主线和机会。记的是判断，不是行情。</p>'
      + updated
      + '<p class="disclaimer">' + esc(disclaimer()) + '</p>'
      + '</header>'
      + '<section class="section"><div class="section-head"><h2>主线</h2>'
      + (themeList.length > shownThemes.length ? moreLink('#/timeline', '在时间线里筛选') : '')
      + '</div><p class="section-note">许多条小信号合在一起，指向的大背景。</p>'
      + (themeList.length ? '<div class="stack">' + shownThemes.map(themeCardHtml).join('') + '</div>' : emptyHtml())
      + '</section>'
      + '<section class="section"><div class="section-head"><h2>机会</h2>'
      + (opportunityList.length > shownOpps.length ? moreLink('#/opportunities', '全部机会') : '')
      + '</div><p class="section-note">可以单独跟踪的推演：成功率、盈亏比和当前状态。</p>'
      + (opportunityList.length ? '<div class="stack">' + shownOpps.map(opportunityCardHtml).join('') + '</div>' : emptyHtml())
      + '</section>'
      + '<section class="section"><div class="section-head"><h2>最新信号</h2>'
      + (signalList.length > shownSignals.length ? moreLink('#/timeline', '更早的信号') : '')
      + '</div><p class="section-note">从访谈里拆出来、还能回头核对的说法。</p>'
      + (signalList.length ? '<div class="stack">' + shownSignals.map(homeSignalHtml).join('') + '</div>' : emptyHtml())
      + '</section>',
      { footer: false }
    );
  }

  function viewTimeline(route) {
    setTitle('时间线');
    var guestId = route.params.get('guest') || '';
    var themeId = route.params.get('theme') || '';
    var all = signals();
    var intro = '<h1 class="page-title">时间线</h1>'
      + '<p class="page-note">按访谈发布日期从新到旧。可按嘉宾或主线筛选。</p>';
    if (!all.length) return shell(intro + emptyHtml());

    var list = all.slice();
    if (guestId) {
      var guest = find(guests(), guestId);
      var allowed = {};
      (guest ? signalsForGuest(guest) : []).forEach(function (signal) {
        if (signal.id != null) allowed[signal.id] = true;
      });
      list = list.filter(function (signal) { return signal && allowed[signal.id]; });
    }
    if (themeId) {
      var theme = find(themes(), themeId);
      var ids = {};
      asArray(theme && theme.signalIds).forEach(function (id) { ids[id] = true; });
      list = list.filter(function (signal) { return signal && ids[signal.id]; });
    }
    list.sort(cmpDateDesc);
    var body = list.length
      ? groupByMonth(list).map(function (group) {
        return '<section class="month"><h2 class="month-label">' + esc(group.label) + '</h2><div class="nodes">'
          + group.items.map(function (signal) { return signalNodeHtml(signal); }).join('')
          + '</div></section>';
      }).join('')
      : emptyHtml('没有符合条件的信号');
    return shell(
      intro
      + '<div class="filters">'
      + '<label>嘉宾<select id="filter-guest">' + selectOptions(guests(), guestId, '全部嘉宾', function (item) { return item.name || item.id; }) + '</select></label>'
      + '<label>主线<select id="filter-theme">' + selectOptions(themes(), themeId, '全部主线', function (item) { return item.title || item.id; }) + '</select></label>'
      + '</div>'
      + '<p class="count">共 ' + list.length + ' 条</p>'
      + body
    );
  }

  function viewOpportunities(route) {
    setTitle('机会');
    var status = route.params.get('status') || '';
    var known = STATUSES.indexOf(status) !== -1;
    var all = opportunities();
    var intro = '<h1 class="page-title">机会</h1>'
      + '<p class="page-note">单独跟踪的推演。点进去看不同嘉宾的说法如何接上。</p>';
    if (!all.length) return shell(intro + emptyHtml());
    var list = known ? all.filter(function (item) { return item && item.status === status; }) : all.slice();
    var body = list.length
      ? '<div class="stack">' + list.map(opportunityCardHtml).join('') + '</div>'
      : emptyHtml('没有这个状态的机会');
    return shell(intro + statusChips(known ? status : '') + '<p class="count">共 ' + list.length + ' 条</p>' + body);
  }

  function viewOpportunity(id) {
    var opportunity = find(opportunities(), id);
    if (!opportunity) {
      setTitle('未找到');
      return shell('<p class="back"><a href="#/opportunities">返回机会</a></p><h1 class="page-title">未找到这条内容</h1><p class="page-note">请检查 data.js 里的编号。</p>');
    }
    setTitle(opportunity.title || '机会');
    var linked = opportunitySignals(opportunity);
    var theme = find(themes(), opportunity.themeId);
    var metrics = [
      badge(opportunity.status, statusKind(opportunity.status)),
      opportunity.successRate ? '<span>成功率 ' + esc(opportunity.successRate) + '</span>' : '',
      opportunity.riskReward ? '<span>盈亏比 ' + esc(opportunity.riskReward) + '</span>' : '',
      opportunity.horizon ? '<span>期限 ' + esc(opportunity.horizon) + '</span>' : '',
    ].filter(Boolean).join('');
    var themeBlock = '<section class="block"><h2>主线</h2>'
      + (theme
        ? '<p><a href="#/timeline?theme=' + encodeURIComponent(theme.id) + '">' + esc(theme.title || theme.id) + '</a></p>'
        : '<p class="muted">未关联主线。</p>')
      + '</section>';
    return shell(
      '<p class="back"><a href="#/opportunities">返回机会</a></p>'
      + '<div class="meta metrics">' + metrics + '</div>'
      + '<h1 class="page-title">' + esc(opportunity.title || '未命名机会') + '</h1>'
      + (opportunity.updated ? '<p class="updated">更新于 ' + esc(opportunity.updated) + '</p>' : '')
      + assetsHtml(opportunity.assets)
      + proseBlock('判断', opportunity.thesis, '还没有写下判断。')
      + proseBlock('何时动手', opportunity.trigger, '还没有写触发条件。')
      + proseBlock('什么情况下算错', opportunity.invalidation, '还没有写证伪条件。')
      + themeBlock
      + '<section class="block"><h2>线索</h2>'
      + '<p class="section-note">按时间从早到晚，把不同嘉宾的说法接在一起。</p>'
      + dotsHtml(linked)
      + '</section>'
    );
  }

  function viewInterviews() {
    setTitle('访谈');
    var list = interviews().slice().sort(cmpDateDesc);
    var intro = '<h1 class="page-title">访谈</h1>'
      + '<p class="page-note">每篇留下结论、资本逻辑，以及可以回头核对的事实。</p>';
    if (!list.length) return shell(intro + emptyHtml());
    return shell(intro + '<p class="count">共 ' + list.length + ' 篇</p><div class="stack">' + list.map(interviewCardHtml).join('') + '</div>');
  }

  function viewInterview(id) {
    var interview = find(interviews(), id);
    if (!interview) {
      setTitle('未找到');
      return shell('<p class="back"><a href="#/interviews">返回访谈</a></p><h1 class="page-title">未找到这条内容</h1><p class="page-note">请检查 data.js 里的编号。</p>');
    }
    setTitle(interview.title || '访谈');
    var guest = find(guests(), interview.guestId);
    var who = guest
      ? '<a href="' + hashTo(['guests', guest.id]) + '">' + esc(guest.name || '嘉宾') + '</a>'
        + (guest.role ? '<span class="muted"> · ' + esc(guest.role) + '</span>' : '')
      : '<span>未知嘉宾</span>';
    var linked = signalsForInterview(interview);
    var signalBlock = linked.length
      ? '<div class="nodes">' + linked.map(function (signal) {
        return signalNodeHtml(signal, { showInterview: false });
      }).join('') + '</div>'
      : '<p class="muted">这篇还没有拆出信号。</p>';
    return shell(
      '<p class="back"><a href="#/interviews">返回访谈</a></p>'
      + '<div class="meta">'
      + (interview.date ? '<time>' + esc(interview.date) + '</time>' : '')
      + (interview.channel ? '<span>' + esc(interview.channel) + '</span>' : '')
      + '</div>'
      + '<h1 class="page-title">' + esc(interview.title || '未命名访谈') + '</h1>'
      + '<p class="who">' + who + '</p>'
      + (interview.oneLine ? '<p class="deck preserve">' + esc(interview.oneLine) + '</p>' : '')
      + externalLink(interview.url, '打开原文')
      + conclusionHtml(interview.conclusion)
      + proseBlock('资本逻辑', interview.capitalLogic, '这篇没有写资本逻辑。')
      + '<section class="block"><h2>事实核对</h2>' + factsHtml(interview.facts) + '</section>'
      + '<section class="block"><h2>本篇信号</h2>' + signalBlock + '</section>'
    );
  }

  function viewGuests() {
    setTitle('嘉宾');
    var list = guests();
    var intro = '<h1 class="page-title">嘉宾</h1>'
      + '<p class="page-note">看立场、思路和过往对错，用来给说法打折。</p>';
    if (!list.length) return shell(intro + emptyHtml());
    return shell(intro + '<p class="count">共 ' + list.length + ' 位</p><div class="stack">' + list.map(guestCardHtml).join('') + '</div>');
  }

  function viewGuest(id) {
    var guest = find(guests(), id);
    if (!guest) {
      setTitle('未找到');
      return shell('<p class="back"><a href="#/guests">返回嘉宾</a></p><h1 class="page-title">未找到这条内容</h1><p class="page-note">请检查 data.js 里的编号。</p>');
    }
    setTitle(guest.name || '嘉宾');
    var guestInterviews = interviewsForGuest(guest);
    var guestSignals = signalsForGuest(guest);
    var interviewBlock = guestInterviews.length
      ? '<div class="stack">' + guestInterviews.map(interviewCardHtml).join('') + '</div>'
      : '<p class="muted">还没有访谈。</p>';
    var signalBlock = guestSignals.length
      ? '<div class="nodes">' + guestSignals.map(function (signal) {
        return signalNodeHtml(signal, { showGuest: false });
      }).join('') + '</div>'
      : '<p class="muted">还没有信号。</p>';
    return shell(
      '<p class="back"><a href="#/guests">返回嘉宾</a></p>'
      + '<h1 class="page-title">' + esc(guest.name || '未命名嘉宾') + '</h1>'
      + (guest.role ? '<p class="role">' + esc(guest.role) + '</p>' : '')
      + proseBlock('立场', textOrList(guest.stance), '未填写')
      + proseBlock('表达与思路', textOrList(guest.style), '未填写')
      + proseBlock('容易偏在哪', textOrList(guest.biases), '未填写')
      + '<section class="block"><h2>记录</h2>' + recordHtml(guest.trackRecord) + '</section>'
      + '<section class="block"><h2>访谈</h2>' + interviewBlock + '</section>'
      + '<section class="block"><h2>信号</h2>' + signalBlock + '</section>'
      + notesHtml(guest.notes)
    );
  }

  function fold(value) {
    return String(value == null ? '' : value).toLowerCase();
  }

  function haystack(parts) {
    var flat = [];
    parts.forEach(function (part) {
      if (Array.isArray(part)) flat = flat.concat(part);
      else flat.push(part);
    });
    return fold(flat.filter(function (item) {
      return item != null && item !== '';
    }).join('\n'));
  }

  function signalSearchText(signal) {
    var guest = find(guests(), signal.guestId);
    var interview = resolveInterview(signal);
    return haystack([
      signal.text, signal.winners, signal.losers, signal.type, signal.outcome, signal.date,
      guest && guest.name, interview && interview.title, interview && interview.channel,
    ]);
  }

  function interviewSearchText(interview) {
    var guest = find(guests(), interview.guestId);
    var facts = [];
    asArray(interview.facts).forEach(function (fact) {
      if (!fact) return;
      facts.push(fact.claim, fact.check, fact.verdict);
    });
    return haystack([
      interview.title, interview.oneLine, interview.channel, interview.date, interview.capitalLogic,
      asArray(interview.conclusion), facts, guest && guest.name,
    ]);
  }

  function viewSearch(route) {
    var query = (route.params.get('q') || '').trim();
    if (!query) {
      setTitle('搜索');
      return shell('<h1 class="page-title">搜索</h1><p class="page-note">输入关键词，查找信号和访谈。</p>');
    }
    setTitle('搜索');
    var needle = fold(query);
    var matchedSignals = signals().filter(function (signal) {
      return signal && signalSearchText(signal).indexOf(needle) !== -1;
    }).sort(cmpDateDesc);
    var matchedInterviews = interviews().filter(function (interview) {
      return interview && interviewSearchText(interview).indexOf(needle) !== -1;
    }).sort(cmpDateDesc);
    var heading = '<h1 class="page-title">搜索「' + esc(query) + '」</h1>';
    if (!matchedSignals.length && !matchedInterviews.length) {
      return shell(heading + emptyHtml('没有匹配的信号或访谈'));
    }
    var html = heading;
    if (matchedSignals.length) {
      html += '<section class="section"><h2>信号</h2><div class="stack">'
        + matchedSignals.map(homeSignalHtml).join('') + '</div></section>';
    }
    if (matchedInterviews.length) {
      html += '<section class="section"><h2>访谈</h2><div class="stack">'
        + matchedInterviews.map(interviewCardHtml).join('') + '</div></section>';
    }
    return shell(html);
  }

  function viewMissing() {
    setTitle('未找到');
    return shell('<h1 class="page-title">没有这一页</h1><p class="page-note">链接可能写错了。</p><p class="source"><a href="#/">回首页</a></p>');
  }

  function view(route) {
    var head = route.parts[0] || 'home';
    if (!route.parts.length) return viewHome();
    if (head === 'timeline') return viewTimeline(route);
    if (head === 'opportunities') {
      return route.parts[1] ? viewOpportunity(route.parts[1]) : viewOpportunities(route);
    }
    if (head === 'interviews') {
      return route.parts[1] ? viewInterview(route.parts[1]) : viewInterviews();
    }
    if (head === 'guests') {
      return route.parts[1] ? viewGuest(route.parts[1]) : viewGuests();
    }
    if (head === 'search') return viewSearch(route);
    return viewMissing();
  }

  function navKey(route) {
    var head = route.parts[0];
    if (!head) return 'home';
    if (head === 'timeline' || head === 'opportunities' || head === 'interviews' || head === 'guests') return head;
    return '';
  }

  function setNav(key) {
    var links = document.querySelectorAll('[data-route]');
    for (var i = 0; i < links.length; i++) {
      if (key && links[i].getAttribute('data-route') === key) links[i].setAttribute('aria-current', 'page');
      else links[i].removeAttribute('aria-current');
    }
  }

  function syncSearchBox(route) {
    var input = document.getElementById('q');
    if (!input || document.activeElement === input) return;
    var next = route.parts[0] === 'search' ? (route.params.get('q') || '') : '';
    if (input.value !== next) input.value = next;
  }

  function onSearch() {
    var input = document.getElementById('q');
    if (!input) return;
    var query = input.value.trim();
    var route = parseRoute();
    var current = route.parts[0] === 'search' ? (route.params.get('q') || '') : '';
    if (query === current) return;
    if (!query) {
      if (route.parts[0] === 'search') location.hash = '#/';
      return;
    }
    location.hash = '#/search?q=' + encodeURIComponent(query);
  }

  function onTimelineFilter() {
    var guestEl = document.getElementById('filter-guest');
    var themeEl = document.getElementById('filter-theme');
    if (!guestEl || !themeEl) return;
    var guest = guestEl.value;
    var theme = themeEl.value;
    var route = parseRoute();
    if (route.parts[0] === 'timeline'
      && (route.params.get('guest') || '') === guest
      && (route.params.get('theme') || '') === theme) return;
    var params = new URLSearchParams();
    if (guest) params.set('guest', guest);
    if (theme) params.set('theme', theme);
    var query = params.toString();
    location.hash = '#/timeline' + (query ? '?' + query : '');
  }

  function bindInPage() {
    var guestEl = document.getElementById('filter-guest');
    var themeEl = document.getElementById('filter-theme');
    if (guestEl) guestEl.addEventListener('change', onTimelineFilter);
    if (themeEl) themeEl.addEventListener('change', onTimelineFilter);
  }

  function render() {
    var app = document.getElementById('app');
    if (!app) return;
    var route = parseRoute();
    var html;
    try {
      html = view(route);
    } catch (err) {
      console.error(err);
      setTitle('出错');
      html = shell('<h1 class="page-title">页面渲染出错</h1><p class="page-note">请检查 data.js 是否为合法脚本，数组是否写好了逗号。</p>');
    }
    var keepScroll = document.activeElement && document.activeElement.id === 'q';
    app.innerHTML = html;
    setNav(navKey(route));
    syncSearchBox(route);
    bindInPage();
    if (!keepScroll) window.scrollTo(0, 0);
  }

  function init() {
    var form = document.getElementById('search-form');
    var input = document.getElementById('q');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        onSearch();
      });
    }
    if (input) {
      input.addEventListener('compositionstart', function () { composing = true; });
      input.addEventListener('compositionend', function () {
        composing = false;
        onSearch();
      });
      input.addEventListener('input', function () {
        if (!composing) onSearch();
      });
      input.addEventListener('focus', function () {
        document.body.classList.add('searching');
      });
      input.addEventListener('blur', function () {
        document.body.classList.remove('searching');
      });
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          input.value = '';
          onSearch();
          input.blur();
        }
      });
    }
    window.addEventListener('hashchange', render);
    render();
  }

  window.MacroSignals = { render: render, parseRoute: parseRoute };
  init();
})();
