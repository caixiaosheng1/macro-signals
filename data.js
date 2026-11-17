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
  updated: '2026-11-17 16:50 (北京时间)',
  disclaimer: '嘉宾观点≠事实；本站推演仅供参考，不构成买卖建议；未接入实时行情。',
};

window.THEMES = [
  {
    id: 't-refining',
    title: '关键矿产卡在“精炼+电力”',
    summary: '资源不缺，缺的是精炼产能和便宜电力。谁拿到政府兜底（拨款、价格底线、电价补贴），谁就是这轮供应链重建的赢家。',
    direction: '强化',
    updated: '2026-11-17',
    signalIds: ['s-mcg-1', 's-mcg-2', 's-mcg-3', 's-mcg-4', 's-mid-4'],
  },
  {
    id: 't-fiscal',
    title: '美国财政透支→硬资产',
    summary: '战争与赤字靠借钱维持，嘉宾认为账单迟早到期，利好黄金白银。观点带立场，需看美债数据验证。',
    direction: '待观察',
    updated: '2026-11-17',
    signalIds: ['s-mcg-5', 's-mid-1'],
  },
  {
    id: 't-commodity-bull',
    title: '商品代际牛市早期：先龙头，后小矿',
    summary: '金银回调接近尾声，龙头先突破；巨头抢早期铜项目；若2027年和平红利压低油价，矿企利润率扩张。短期变量是美元强弱。',
    direction: '强化',
    updated: '2026-11-17',
    signalIds: ['s-mid-1', 's-mid-2', 's-mid-3', 's-mid-4', 's-mid-5'],
  },
];

window.OPPORTUNITIES = [
  {
    id: 'o-west-refining',
    title: '西方稀土/关键金属精炼（有政府兜底的）',
    assets: [
      { name: 'MP Materials', code: 'MP', market: '美股' },
      { name: 'Lynas Rare Earths', code: 'LYC', market: '澳股' },
      { name: 'Energy Fuels', code: 'UUUU', market: '美股' },
    ],
    thesis: '美国把关键矿产当国防问题，真正的缺口是精炼。获得国防部入股、价格底线或包销的精炼商最先受益；没有政府合同的概念股风险大。',
    successRate: '中',
    riskReward: '约1:2',
    horizon: '2–4年',
    trigger: '国会通过精炼专项拨款、更多价格底线协议、配套电价补贴',
    invalidation: '中国大幅放开稀土出口导致价格暴跌，或美国补贴缩水/搁置',
    status: '观察',
    themeId: 't-refining',
    signalIds: ['s-mcg-1', 's-mcg-2', 's-mcg-4'],
    updated: '2026-11-17',
  },
  {
    id: 'o-scrap-copper',
    title: '美国本土再生铜/废铜精炼',
    assets: [
      { name: 'Sims Limited', code: 'SGM', market: '澳股' },
      { name: 'Freeport-McMoRan（铜价敞口）', code: 'FCX', market: '美股' },
    ],
    thesis: '若美国限制废铜外流并推动本土回收精炼，再生铜环节会从“出口原料”变成“本土战略资产”。目前只是嘉宾提示，标的需进一步筛选。',
    successRate: '中低',
    riskReward: '约1:2',
    horizon: '1–3年',
    trigger: '废铜出口限制或回收激励政策落地',
    invalidation: '政策无下文，铜价大幅回落',
    status: '观察',
    themeId: 't-refining',
    signalIds: ['s-mcg-3'],
    updated: '2026-11-17',
  },
  {
    id: 'o-gold-majors',
    title: '大型金矿与特许权公司（回调后的龙头）',
    assets: [
      { name: 'Newmont', code: 'NEM', market: '美股' },
      { name: 'Agnico Eagle', code: 'AEM', market: '美股' },
      { name: 'Royal Gold', code: 'RGLD', market: '美股' },
    ],
    thesis: '金价回调约30%后龙头先行突破，自由现金流强；若美元见顶、油价下行，利润率双重改善。嘉宾自己也在先买龙头。',
    successRate: '中高',
    riskReward: '约1:2.5',
    horizon: '3–12个月',
    trigger: '金价站稳4000美元上方，美元指数见顶回落',
    invalidation: '金价有效跌破本轮低点（约3800美元），或收益率继续上行',
    status: '观察',
    themeId: 't-commodity-bull',
    signalIds: ['s-mid-1', 's-mid-3', 's-mid-5', 's-mcg-5'],
    updated: '2026-11-17',
  },
  {
    id: 'o-silver',
    title: '白银与银矿股（高弹性）',
    assets: [
      { name: '白银ETF', code: 'SLV', market: '美股' },
      { name: 'Pan American Silver', code: 'PAAS', market: '美股' },
    ],
    thesis: '白银跌幅（50–60%）远大于黄金，反弹弹性大；嘉宾看数月回100美元，但目标偏激进、波动极大，适合小仓位。',
    successRate: '中低',
    riskReward: '约1:3',
    horizon: '3–9个月',
    trigger: '金价确认见底后银价放量站稳',
    invalidation: '金价破底，或工业需求转弱',
    status: '观察',
    themeId: 't-commodity-bull',
    signalIds: ['s-mid-2', 's-mid-1'],
    updated: '2026-11-17',
  },
  {
    id: 'o-copper-dev',
    title: '被巨头入股的铜开发项目',
    assets: [
      { name: 'Freeport-McMoRan', code: 'FCX', market: '美股' },
      { name: 'Barrick Mining', code: 'B', market: '美股' },
    ],
    thesis: '巨头提早锁定铜项目，叠加美国把铜/精炼当战略问题（McGregor），优质铜开发项目会被重估。具体小矿标的需另行筛选。',
    successRate: '中',
    riskReward: '约1:2',
    horizon: '1–3年',
    trigger: '更多巨头入股或溢价并购铜项目',
    invalidation: '铜价大幅回落、并购降温',
    status: '观察',
    themeId: 't-commodity-bull',
    signalIds: ['s-mid-4', 's-mcg-3', 's-mcg-1'],
    updated: '2026-11-17',
  },
];

window.SIGNALS = [
  {
    id: 's-mcg-1',
    date: '2026-11-17',
    guestId: 'mcgregor',
    interviewId: '2026-11-17-mcgregor',
    text: '美国关键矿产的瓶颈在精炼，不在资源；必须建精炼厂并拨款',
    type: '观点',
    forwardLooking: true,
    winners: '获政府支持的西方稀土/金属精炼商',
    losers: '无精炼能力的纯勘探矿企',
    verifyBy: '2027年：国会是否通过精炼专项拨款或扩大国防部采购',
    outcome: '待验证',
  },
  {
    id: 's-mcg-2',
    date: '2026-11-17',
    guestId: 'mcgregor',
    interviewId: '2026-11-17-mcgregor',
    text: '建精炼厂要同时补贴电价，电力是文明命脉，便宜能源和便宜信贷绑在一起',
    type: '暗示',
    forwardLooking: true,
    winners: '发电、电网、核电与燃气电厂相关',
    losers: '高电价地区的冶炼项目',
    verifyBy: '看关键矿产政策是否附带电价/能源补贴条款',
    outcome: '待验证',
  },
  {
    id: 's-mcg-3',
    date: '2026-11-17',
    guestId: 'mcgregor',
    interviewId: '2026-11-17-mcgregor',
    text: '废铜回收是被忽视的铜来源，没人在研究废铜精炼厂选址',
    type: '暗示',
    forwardLooking: true,
    winners: '美国本土再生铜/废金属回收与精炼企业',
    losers: '依赖向中国出口废铜的贸易商',
    verifyBy: '美国是否出台废铜回收激励或限制出口措施',
    outcome: '待验证',
  },
  {
    id: 's-mcg-4',
    date: '2026-11-17',
    guestId: 'mcgregor',
    interviewId: '2026-11-17-mcgregor',
    text: '需要政府与私人资本合作建精炼厂，并锁定价格，投资者才敢进；目前国防部投入只是零头，建议先观望',
    type: '观点',
    forwardLooking: true,
    winners: '拿到价格底线/包销协议的企业',
    losers: '只讲概念、没有政府合同的公司',
    verifyBy: '更多类似“国防部入股+价格底线”的交易出现',
    outcome: '待验证',
  },
  {
    id: 's-mcg-5',
    date: '2026-11-17',
    guestId: 'mcgregor',
    interviewId: '2026-11-17-mcgregor',
    text: '美国财政接近“货币深渊”，战争开支靠借钱，账单迟早到期',
    type: '观点',
    forwardLooking: true,
    winners: '黄金、白银等硬资产',
    losers: '长期美债持有人',
    verifyBy: '美债长端收益率与拍卖认购情况；黄金走势',
    outcome: '待验证',
  },
  {
    id: 's-mid-1',
    date: '2026-11-17',
    guestId: 'middelkoop',
    interviewId: '2026-11-17-middelkoop',
    text: '金价在4000美元附近筑底，龙头矿企向前高突破是“底部已现”的信号',
    type: '观点',
    forwardLooking: true,
    winners: '大型金矿生产商、黄金特许权公司',
    losers: '在年底税损抛售中割肉者',
    verifyBy: '2027年一季度：金价是否稳回4000美元上方、NEM/AEM 是否创新高',
    outcome: '待验证',
  },
  {
    id: 's-mid-2',
    date: '2026-11-17',
    guestId: 'middelkoop',
    interviewId: '2026-11-17-middelkoop',
    text: '白银将在数月内重回100美元',
    type: '观点',
    forwardLooking: true,
    winners: '白银与银矿股',
    losers: '白银空头',
    verifyBy: '2027年年中前银价是否接近100美元',
    outcome: '待验证',
  },
  {
    id: 's-mid-3',
    date: '2026-11-17',
    guestId: 'middelkoop',
    interviewId: '2026-11-17-middelkoop',
    text: '未来几周美以可能再有军事行动，但2027年大概率出现俄乌协议与和平红利，油价下行',
    type: '暗示',
    forwardLooking: true,
    winners: '金铜矿企（能源成本占20–30%，利润率扩张）、能源消费国',
    losers: '油气生产商、被排除在谈判外的欧洲',
    verifyBy: '2027年内是否签署俄乌协议；油价趋势',
    outcome: '待验证',
  },
  {
    id: 's-mid-4',
    date: '2026-11-17',
    guestId: 'middelkoop',
    interviewId: '2026-11-17-middelkoop',
    text: '巨头提早入股开发阶段铜项目（Freeport、巴里克），竞争推高项目估值，商品处于代际牛市早期，2027年会是强年',
    type: '暗示',
    forwardLooking: true,
    winners: '被巨头入股/有优质铜项目的勘探开发公司',
    losers: '等待低价并购的买方',
    verifyBy: '2027年铜项目并购数量与溢价；商品指数全年表现',
    outcome: '待验证',
  },
  {
    id: 's-mid-5',
    date: '2026-11-17',
    guestId: 'middelkoop',
    interviewId: '2026-11-17-middelkoop',
    text: '近期金价压力主要来自美元走强与收益率上升，避险资金先流向美元',
    type: '数据',
    forwardLooking: false,
    winners: '美元',
    losers: '短期金价',
    verifyBy: '美元指数是否见顶回落',
    outcome: '待验证',
  },
];

window.INTERVIEWS = [
  {
    id: '2026-11-17-mcgregor',
    date: '2026-11-17',
    channel: 'Kitco Mining（德国黄金展现场）',
    guestId: 'mcgregor',
    title: '美国关键矿产的真瓶颈：不是矿，是精炼和电',
    url: '',
    oneLine: '美国缺的不是稀土和铜矿，而是精炼厂和便宜电力；政府投入远远不够，投资者先观望，等真金白银的政策落地。',
    conclusion: [
      '稀土/铜/锂对美国是“精炼问题”而非资源问题，约九成稀土要送中国精炼',
      '建精炼厂必须同时补贴电价，否则拼不过中国的电力与人工成本',
      '废铜回收是被忽视的铜来源，几乎没人研究在哪建废铜精炼厂',
      '需要政府与私人资本合作，并锁定价格（价格稳定）才有人敢投',
      '金银在军工电子、导弹制导中不可替代',
      '投资建议：欢迎这一趋势，但“先把火药留着”，等更实质的政策证据',
    ],
    capitalLogic: '谁占便宜：拿到国防部/政府长约、价格底线和电价补贴的西方精炼商；中国在被替代前继续靠精炼垄断赚加工费并握有筹码；加拿大、墨西哥、南美这些资源国议价力上升。谁吃亏：纯靠“关键矿产概念”炒作、没有精炼和政府背书的小矿企；美国纳税人（补贴成本）；地方环保阵营（最终被收入和政治交换收买）。华尔街的考量：只做有政府兜底（价格底线、包销、贷款担保）的项目，把风险转嫁给财政；欧洲资本同样缺精炼产能，更可能跟进联合投资而非单干。长周期看：资源民族主义+供应链安全，让“精炼与电力”成为新的战略资产，财政赤字则继续支撑硬资产。',
    facts: [
      {
        claim: '约92%的稀土要送中国精炼',
        check: '国际能源署等口径：中国约占全球稀土精炼/分离产能的九成左右',
        verdict: '基本属实',
      },
      {
        claim: '中国发电能力3.1太瓦，美国1.1太瓦',
        check: '公开数据：中国装机容量约3.3太瓦以上，美国约1.3太瓦；量级与差距方向正确',
        verdict: '大致属实（数字偏旧）',
      },
      {
        claim: '2001–2022年美国战争花费约8万亿美元，全部靠借钱',
        check: '布朗大学“战争成本”项目估算约8万亿美元；“全部借钱”属嘉宾说法',
        verdict: '金额属实，后半句是观点',
      },
      {
        claim: '特朗普禁止向中国出口废铜',
        check: '未找到确认，需核实',
        verdict: '待核实',
      },
      {
        claim: '没人再买美债，大家在抛售',
        check: '海外持有占比下降，但美债拍卖仍有需求',
        verdict: '夸大',
      },
    ],
    signalIds: ['s-mcg-1', 's-mcg-2', 's-mcg-3', 's-mcg-4', 's-mcg-5'],
  },
  {
    id: '2026-11-17-middelkoop',
    date: '2026-11-17',
    channel: 'Kitco Mining（德国黄金展现场）',
    guestId: 'middelkoop',
    title: '金价在4000美元附近筑底，2027或迎和平红利与商品强年',
    url: '',
    oneLine: '金银深度回调接近尾声，龙头矿企已率先突破；2027年可能出现俄乌/伊朗和平红利，油价下跌抬升矿企利润，巨头抢早期铜项目说明商品大牛市才刚开始。',
    conclusion: [
      '金价自1–2月高点回调约30%，白银跌50–60%，矿业股跌30–50%；他判断金价在4000美元附近接近底部',
      '近期压制主要来自美元走强和收益率上升，属阶段性噪音',
      '龙头（Newmont、Agnico Eagle、Royal Gold）已向前高突破，他视为“底部已现”的信号',
      '操作：先买大型生产商，再逐步加仓优质勘探小矿；现金仍高，确认牛市后才降到低位',
      '白银预计数月内重回100美元',
      '未来几周美以可能再有军事行动；但特朗普在找台阶，2027年或有某种俄乌协议和“和平红利”',
      '油价下跌利好金铜矿企（能源占成本20–30%）',
      'Freeport、巴里克提早入股开发阶段铜项目，竞争推高项目估值，他认为是早期“代际商品牛市”',
      '欧洲在美俄谈判中被边缘化，拉加德提前离任更多出于法国政治而非货币因素',
    ],
    capitalLogic: '谁占便宜：现金充足、能在低位接货的长线资金和龙头矿企（巨头早期锁定铜资源，压低未来并购成本）；持有被巨头入股项目的小矿会被重估。谁吃亏：年底税损抛售中割肉的散户；被排除在美俄协议之外的欧洲，承担能源和产业外流成本（如奔驰暂停新建工厂）。华尔街的考量：避险时先买流动性最好的美元，金价短期被压；一旦和平红利压低油价、美元见顶，资金会从美元轮回金银和矿业。欧洲顶级资本：欧洲本土产业疲弱，更可能把资金配置到海外资源与美元资产，而非本土制造。长周期：中西方争夺资源+各国财政透支，商品处在长牛早期，但短期受美元强弱主导。',
    facts: [
      {
        claim: '世界黄金协会：今年实物金需求（美元计）不含四季度已创新高',
        check: '来自嘉宾引用，本站未核实具体数据',
        verdict: '待核实',
      },
      {
        claim: '金价回调约30%、白银回调50%以上',
        check: '按嘉宾与主持人所述，未接入实时行情核对',
        verdict: '待核实',
      },
      {
        claim: 'Freeport 向不列颠哥伦比亚省铜项目投资1.1亿美元；巴里克加码入股爱达荷州 Hercules Metals',
        check: '访谈中主持人所述的本周新闻，未单独核实',
        verdict: '待核实',
      },
      {
        claim: '拉加德宣布提前卸任欧洲央行行长',
        check: '访谈中主持人所述，未单独核实',
        verdict: '待核实',
      },
      {
        claim: 'Newmont 每月自由现金流接近10亿美元',
        check: '嘉宾说法，需对照季报',
        verdict: '待核实',
      },
    ],
    signalIds: ['s-mid-1', 's-mid-2', 's-mid-3', 's-mid-4', 's-mid-5'],
  },
];

window.GUESTS = [
  {
    id: 'mcgregor',
    name: 'Douglas Macgregor（道格拉斯·麦格雷戈）',
    role: '美国陆军退役上校、前五角大楼顾问、军事评论员',
    stance: '坚定反干预主义；看空美国财政与军力；认为两党都被战争游说集团绑架',
    style: '军人式直白断言，大量类比和反问，宏观叙事强、投资细节弱，常把议题拉回反战与美国霸权衰落',
    biases: '强烈反战/反以色列游说立场，常用夸张说法（如“没人再买美债”）；地缘判断带明显立场色彩，数据需逐条核实',
    trackRecord: { hit: 0, miss: 0, pending: 3 },
    notes: [
      '第一次收录：法兰克福德国黄金展 Kitco Mining 现场访谈',
      '有用的是产业链判断（精炼、电力、废铜），政治攻击部分不收录',
    ],
    interviewIds: ['2026-11-17-mcgregor'],
  },
  {
    id: 'middelkoop',
    name: 'Willem Middelkoop（威廉·米德尔库普）',
    role: 'Commodity Discovery Fund 创始人兼CEO（荷兰）',
    stance: '长期做多贵金属与矿业的基金经理，言论与持仓一致（说自己的书）',
    style: '周期+仓位思维：先看龙头股是否突破确认底部，再加仓小矿；常引用世界黄金协会数据和“内部朋友”消息',
    biases: '长期看多金银，目标价偏激进（如白银数月回100美元）；地缘消息来源不可核实',
    trackRecord: { hit: 0, miss: 0, pending: 4 },
    notes: [
      '第一次收录：法兰克福德国黄金展 Kitco Mining 访谈',
      '基金现金30–40百万美元，正在逢低买入，先龙头后小矿',
    ],
    interviewIds: ['2026-11-17-middelkoop'],
  },
];
