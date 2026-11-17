/**
 * 宏信号 · 数据文件 / Macro Signals · data file
 *
 * 全站只读这个文件。改完保存、推送到 main，刷新即可。
 * The whole site renders from this file only. Edit, push to main, refresh.
 *
 * ────────────────────────────────────────────────────────────
 * 怎么加一篇访谈 / How to add one interview
 * ────────────────────────────────────────────────────────────
 * 1. 嘉宾：GUESTS 里没有这个人就新增一条，记下 id。
 *    Guest: reuse or append one GUESTS item and keep its id.
 * 2. 访谈：INTERVIEWS 新增一条，guestId 指向嘉宾，记下访谈 id。
 *    Interview: append INTERVIEWS, set guestId, keep the interview id.
 * 3. 信号：把值得以后核对的说法拆进 SIGNALS。date 用访谈发布日期。
 *    guestId、interviewId 指向上面两条。再把信号 id 写进该访谈的 signalIds。
 *    Signals: one SIGNALS item per claim worth checking later.
 *    date = the interview's publish date. Point guestId and interviewId
 *    at the records above, and list those signal ids on the interview.
 * 4. 主线：若这些信号共同指向一件大事，写进某个 THEMES.signalIds
 *    （或新建一条主线）。信号本身不要再写 themeId。
 *    Theme: add the signal ids to a THEMES item (or create one).
 *    Signals do not store a themeId.
 * 5. 机会：若它们支撑一个可跟踪的推演，写进 OPPORTUNITIES，
 *    填 themeId、signalIds、成功率、盈亏比、触发、证伪。
 *    Opportunity: append OPPORTUNITIES with themeId, signalIds,
 *    successRate, riskReward, trigger, invalidation.
 * 6. 把这篇访谈的 id 补进嘉宾的 interviewIds。
 *    Append the interview id to the guest's interviewIds.
 * 7. 把 SITE.updated 改成现在的北京时间，格式见下方。
 *    Set SITE.updated to the current Beijing time.
 *
 * 只写一边也能显示，但两边都写更不容易漏：
 * 访谈 ↔ 信号（interviewId 与 signalIds）、嘉宾 ↔ 访谈（guestId 与 interviewIds）。
 * 主线和机会不会自动吸收信号，必须亲自把 id 放进 signalIds。
 * Back-references are merged for interviews/signals and guests/interviews.
 * Themes and opportunities only show the signal ids you list.
 *
 * ────────────────────────────────────────────────────────────
 * 约定 / Conventions
 * ────────────────────────────────────────────────────────────
 * - 六个名字（SITE、THEMES、OPPORTUNITIES、SIGNALS、INTERVIEWS、GUESTS）
 *   都要保留。数组可以是空的，页面会显示「暂无内容，等待第一篇访谈」。
 *   Keep all six globals. Empty arrays show the empty state.
 * - id 在各自数组里唯一，用短的英文或拼音，如 guest-wang、iv-20260318。
 *   ids are unique inside each array. Prefer short ascii, e.g. guest-wang.
 * - 日期写 YYYY-MM-DD。同一篇访谈拆出的信号，date 用同一个发布日。
 *   Dates are YYYY-MM-DD. Signals from one interview share its publish date.
 * - 中文句子用单引号包住。句子里若有单引号，这一条改用双引号。
 *   Wrap text in single quotes. If the text itself has one, use double quotes.
 * - 最后一项后面的逗号可留可删。
 *   A trailing comma is optional.
 * - 枚举必须用下面列出的中文原词，筛选和颜色才对得上。
 *   Enum fields must use the exact Chinese words below.
 * - 数组顺序：THEMES、OPPORTUNITIES、GUESTS 靠前的先显示。
 *   首页主线、机会各最多 5 条。SIGNALS、INTERVIEWS 按日期从新到旧，
 *   首页信号取最新 5 条。机会详情里的「线索」按日期从早到晚。
 *   Array order is priority for themes, opportunities, and guests.
 *   Home shows at most 5 themes and 5 opportunities.
 *   Signals and interviews sort by date, newest first; home shows 5 signals.
 *   An opportunity's "线索" view sorts linked signals oldest first.
 * - 不要在这个文件里写示例数据后忘记删掉。空数组就是正确的起始状态。
 *   Do not leave sample entries in the arrays. Empty is the shipped state.
 *
 * ────────────────────────────────────────────────────────────
 * 字段 / Fields
 * ────────────────────────────────────────────────────────────
 * SITE 站点
 *   updated     字符串。最近一次改数据的北京时间，如 '2026-03-18 21:30 (北京时间)'。
 *               Beijing timestamp of the last edit, e.g. '2026-03-18 21:30 (北京时间)'.
 *   disclaimer  字符串。首页和内页底部的说明，默认已填好，一般不用改。
 *               Disclaimer shown on the home page and page footers.
 *
 * THEMES 主线 / 大背景。很多条小信号合在一起指向的事。
 *   id          字符串，唯一。
 *   title       字符串。主线名称。
 *   summary     字符串。一两段说明，为什么这些信号是同一件事。
 *   direction   '强化' | '减弱' | '待观察'
 *               强化 = 信号在变强；减弱 = 在失效；待观察 = 还没法下结论。
 *               Strengthening / fading / still watching.
 *   updated     字符串。YYYY-MM-DD，这条主线最后整理的日期。
 *   signalIds   字符串数组。属于这条主线的信号 id，时间线可按主线筛选。
 *
 * OPPORTUNITIES 机会。主线之下可以单独跟踪的推演。
 *   id, title   字符串。
 *   assets      数组。每一项 { name, code, market }
 *               name 名称，如 '黄金'；code 代码，如 'XAU'；market 市场，如 '现货'。
 *               name / ticker or code / market. Any of the three may be blank.
 *   thesis      字符串。判断本身：你认为会发生什么。
 *   successRate '低' | '中' | '高'，或百分比字符串如 '35%'。主观成功率，不是模型输出。
 *               Low / medium / high, or a percent string such as '35%'.
 *   riskReward  字符串。风险:收益，如 '1:3' 表示亏 1 博 3。
 *               Risk:reward. '1:3' means risk 1 to make 3.
 *   horizon     字符串。看多久，如 '六到十二个月'。
 *   trigger     字符串。什么情况下才动手。
 *   invalidation 字符串。什么情况下这条判断算错。
 *   status      '观察' | '验证中' | '兑现' | '失效'
 *               观察 = 还没条件；验证中 = 已按触发开始跟踪；兑现 = 判断实现；失效 = 被证伪或放弃。
 *   themeId     字符串。对应 THEMES 的 id，可空。
 *   signalIds   字符串数组。串起这条机会的信号，详情页按时间从早到晚展示。
 *   updated     字符串。YYYY-MM-DD。
 *
 * SIGNALS 时间节点 / 暗示。访谈里拆出来、以后能核对的一句话。
 *   id          字符串，唯一。
 *   date        字符串 YYYY-MM-DD。这条说法所在访谈的发布日期，不是你写入的日期。
 *               Publish date of the source interview, not the day you typed it.
 *   guestId     字符串。GUESTS 的 id。
 *   interviewId 字符串。INTERVIEWS 的 id。
 *   text        字符串。说法本身，尽量接近原意，不写成买卖指令。
 *   type        '观点' | '暗示' | '数据'
 *               观点 = 嘉宾的判断；暗示 = 没直说但话里有方向；数据 = 可核对的数字或事实。
 *   forwardLooking 布尔。true = 对未来的说法；false = 已发生的事。
 *               true = about the future; false = already happened.
 *   winners     字符串。若这话成立，谁占便宜。可空。
 *   losers      字符串。若这话成立，谁吃亏。可空。
 *   verifyBy    字符串。打算何时回头核对，如 '2026-09' 或 '下一份非农'。可空。
 *   outcome     '待验证' | '应验' | '落空'
 *
 * INTERVIEWS 访谈
 *   id, date    日期为发布日 YYYY-MM-DD。
 *   channel     字符串。出处，如 'Kitco'。
 *   guestId     字符串。
 *   title       字符串。
 *   url         字符串。原文链接，需以 http:// 或 https:// 开头，否则不显示。
 *               Link is shown only when it starts with http:// or https://.
 *   oneLine     字符串。一句话摘要。
 *   conclusion  字符串数组。你听完后留下的结论，一条一个元素。
 *   capitalLogic 字符串。谁占便宜、谁吃亏，华尔街与欧洲资本的真实考量。
 *               Who actually benefits, including Wall Street and European capital.
 *   facts       数组。每一项 { claim, check, verdict }
 *               claim 嘉宾或报道声称的事实；check 你打算怎么核对；verdict 核对结果，自由文字。
 *   signalIds   字符串数组。本篇拆出的信号 id。
 *
 * GUESTS 嘉宾
 *   id, name    字符串。
 *   role        字符串。身份，如 '贵金属分析师'。
 *   stance      字符串。立场与利益关系：他替谁说话、仓位或雇主可能在哪一边。
 *               Allegiance and incentives: who they speak for.
 *   style       字符串。表达方式与思维逻辑：先讲什么、用什么框架。
 *               How they talk and how they reason.
 *   biases      字符串，或字符串数组。容易偏在哪、反复出现的盲点。
 *               Recurring blind spots. A string or an array of strings.
 *   trackRecord { hit, miss, pending }
 *               三项都可以是数字（次数），或字符串数组（具体哪次说对、说错、还没到期）。
 *               Each of hit / miss / pending is a count, or an array of notes.
 *   notes       字符串数组。只给自己看的备注。可空数组。
 *   interviewIds 字符串数组。该嘉宾的访谈 id。
 *
 * 最小例子（说明形状用，不要取消注释后留在数组里）/
 * Minimal shape (do not uncomment into the arrays):
 *
 *   {
 *     id: 'theme-example',
 *     title: '例子主线',
 *     summary: '多条信号指向同一件事。',
 *     direction: '待观察',
 *     updated: '2026-01-01',
 *     signalIds: []
 *   }
 */
window.SITE = {
  updated: 'YYYY-MM-DD HH:mm (北京时间)',
  disclaimer: '嘉宾观点≠事实；本站推演仅供参考，不构成买卖建议；未接入实时行情。',
};

window.THEMES = [];

window.OPPORTUNITIES = [];

window.SIGNALS = [];

window.INTERVIEWS = [];

window.GUESTS = [];
