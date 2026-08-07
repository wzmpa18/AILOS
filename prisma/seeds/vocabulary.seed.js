/**
 * prisma/seeds/vocabulary.seed.js
 * 词库种子数据：日语 / 英语 × 初级 / 中级 / 高级
 * 幂等：以 (language, word) 唯一键 upsert，可重复执行
 *
 * 执行： node prisma/seeds/vocabulary.seed.js
 */

const JA = {
  beginner: [
    ['水', 'みず', '水', '水を飲みます。', '喝水'],
    ['本', 'ほん', '书', '本を読みます。', '读书'],
    ['学校', 'がっこう', '学校', '学校へ行きます。', '去学校'],
    ['先生', 'せんせい', '老师', '先生に聞きます。', '问老师'],
    ['友達', 'ともだち', '朋友', '友達と遊びます。', '和朋友玩'],
    ['家', 'いえ', '家', '家に帰ります。', '回家'],
    ['車', 'くるま', '汽车', '車を運転します。', '开车'],
    ['駅', 'えき', '车站', '駅で待ちます。', '在车站等'],
    ['朝', 'あさ', '早上', '朝ご飯を食べます。', '吃早饭'],
    ['夜', 'よる', '夜晚', '夜は静かです。', '夜晚很安静'],
    ['食べる', 'たべる', '吃', 'りんごを食べる。', '吃苹果'],
    ['飲む', 'のむ', '喝', 'お茶を飲む。', '喝茶'],
    ['見る', 'みる', '看', '映画を見る。', '看电影'],
    ['聞く', 'きく', '听；问', '音楽を聞く。', '听音乐'],
    ['行く', 'いく', '去', '東京へ行く。', '去东京'],
    ['来る', 'くる', '来', '友達が来る。', '朋友来'],
    ['書く', 'かく', '写', '手紙を書く。', '写信'],
    ['読む', 'よむ', '读', '新聞を読む。', '读报纸'],
    ['大きい', 'おおきい', '大的', '大きい家です。', '大房子'],
    ['小さい', 'ちいさい', '小的', '小さい犬です。', '小狗'],
    ['高い', 'たかい', '高的；贵的', 'この本は高い。', '这本书很贵'],
    ['安い', 'やすい', '便宜的', '安い店です。', '便宜的店'],
    ['新しい', 'あたらしい', '新的', '新しい服を買う。', '买新衣服'],
    ['古い', 'ふるい', '旧的', '古い写真です。', '旧照片'],
    ['楽しい', 'たのしい', '快乐的', '毎日楽しい。', '每天很快乐'],
    ['忙しい', 'いそがしい', '忙碌的', '今日は忙しい。', '今天很忙'],
    ['時間', 'じかん', '时间', '時間がありません。', '没有时间'],
    ['天気', 'てんき', '天气', '天気がいいです。', '天气很好'],
    ['名前', 'なまえ', '名字', '名前を書きます。', '写名字'],
    ['電話', 'でんわ', '电话', '電話をかけます。', '打电话'],
    ['お金', 'おかね', '钱', 'お金が必要です。', '需要钱'],
    ['仕事', 'しごと', '工作', '仕事を始めます。', '开始工作'],
    ['今日', 'きょう', '今天', '今日は休みです。', '今天休息'],
    ['明日', 'あした', '明天', '明日会いましょう。', '明天见'],
    ['料理', 'りょうり', '菜；烹饪', '料理を作ります。', '做菜'],
    ['花', 'はな', '花', '花が咲きます。', '花开了'],
    ['雨', 'あめ', '雨', '雨が降ります。', '下雨'],
    ['山', 'やま', '山', '山に登ります。', '爬山'],
    ['海', 'うみ', '海', '海で泳ぎます。', '在海里游泳'],
    ['犬', 'いぬ', '狗', '犬を飼います。', '养狗'],
  ],
  intermediate: [
    ['経験', 'けいけん', '经验', '経験を積む。', '积累经验'],
    ['状況', 'じょうきょう', '状况', '状況を説明する。', '说明情况'],
    ['影響', 'えいきょう', '影响', '影響を受ける。', '受到影响'],
    ['準備', 'じゅんび', '准备', '準備が必要だ。', '需要准备'],
    ['関係', 'かんけい', '关系', '深い関係がある。', '有很深的关系'],
    ['理由', 'りゆう', '理由', '理由を聞く。', '询问理由'],
    ['方法', 'ほうほう', '方法', '新しい方法を試す。', '尝试新方法'],
    ['問題', 'もんだい', '问题', '問題を解決する。', '解决问题'],
    ['結果', 'けっか', '结果', '結果を発表する。', '公布结果'],
    ['意見', 'いけん', '意见', '意見を述べる。', '陈述意见'],
    ['社会', 'しゃかい', '社会', '社会に出る。', '步入社会'],
    ['文化', 'ぶんか', '文化', '文化を学ぶ。', '学习文化'],
    ['技術', 'ぎじゅつ', '技术', '技術が進む。', '技术进步'],
    ['環境', 'かんきょう', '环境', '環境を守る。', '保护环境'],
    ['増える', 'ふえる', '增加', '人口が増える。', '人口增加'],
    ['減る', 'へる', '减少', '体重が減る。', '体重减少'],
    ['続ける', 'つづける', '继续', '勉強を続ける。', '继续学习'],
    ['変わる', 'かわる', '改变', '考え方が変わる。', '想法改变'],
    ['決める', 'きめる', '决定', '日程を決める。', '决定日程'],
    ['伝える', 'つたえる', '传达', '気持ちを伝える。', '传达心意'],
    ['調べる', 'しらべる', '调查', '意味を調べる。', '查意思'],
    ['比べる', 'くらべる', '比较', '価格を比べる。', '比较价格'],
    ['複雑', 'ふくざつ', '复杂', '複雑な問題だ。', '复杂的问题'],
    ['簡単', 'かんたん', '简单', '簡単に説明する。', '简单说明'],
    ['重要', 'じゅうよう', '重要', '重要な会議だ。', '重要的会议'],
    ['必要', 'ひつよう', '必要', '必要な書類。', '必要的文件'],
    ['可能', 'かのう', '可能', '実現は可能だ。', '实现是可能的'],
    ['実際', 'じっさい', '实际', '実際に見る。', '实际去看'],
    ['最近', 'さいきん', '最近', '最近忙しい。', '最近很忙'],
    ['将来', 'しょうらい', '将来', '将来の夢。', '将来的梦想'],
    ['自由', 'じゆう', '自由', '自由に選ぶ。', '自由选择'],
    ['努力', 'どりょく', '努力', '努力を続ける。', '持续努力'],
    ['成長', 'せいちょう', '成长', '会社が成長する。', '公司成长'],
    ['提案', 'ていあん', '提案', '新案を提案する。', '提出新方案'],
    ['責任', 'せきにん', '责任', '責任を取る。', '承担责任'],
    ['計画', 'けいかく', '计划', '計画を立てる。', '制定计划'],
    ['能力', 'のうりょく', '能力', '能力を高める。', '提高能力'],
    ['目標', 'もくひょう', '目标', '目標を達成する。', '达成目标'],
  ],
  advanced: [
    ['抽象的', 'ちゅうしょうてき', '抽象的', '抽象的な概念。', '抽象的概念'],
    ['概念', 'がいねん', '概念', '概念を整理する。', '整理概念'],
    ['前提', 'ぜんてい', '前提', '前提が違う。', '前提不同'],
    ['矛盾', 'むじゅん', '矛盾', '論理が矛盾する。', '逻辑矛盾'],
    ['妥協', 'だきょう', '妥协', '妥協を許さない。', '不容妥协'],
    ['把握', 'はあく', '把握、掌握', '現状を把握する。', '掌握现状'],
    ['促進', 'そくしん', '促进', '成長を促進する。', '促进成长'],
    ['是正', 'ぜせい', '纠正', '格差を是正する。', '纠正差距'],
    ['懸念', 'けねん', '担忧', '影響を懸念する。', '担忧影响'],
    ['顕著', 'けんちょ', '显著', '顕著な効果。', '显著的效果'],
    ['網羅', 'もうら', '网罗、囊括', '全分野を網羅する。', '囊括所有领域'],
    ['遂行', 'すいこう', '执行、完成', '任務を遂行する。', '执行任务'],
    ['慎重', 'しんちょう', '慎重', '慎重に判断する。', '慎重判断'],
    ['曖昧', 'あいまい', '暧昧、含糊', '曖昧な返事。', '含糊的答复'],
    ['潜在', 'せんざい', '潜在', '潜在的な需要。', '潜在需求'],
    ['一貫', 'いっかん', '一贯', '一貫した方針。', '一贯的方针'],
    ['画期的', 'かっきてき', '划时代的', '画期的な発明。', '划时代的发明'],
    ['著しい', 'いちじるしい', '显著的', '著しい進歩。', '显著的进步'],
    ['乏しい', 'とぼしい', '匮乏的', '経験に乏しい。', '缺乏经验'],
    ['促す', 'うながす', '促使', '注意を促す。', '提醒注意'],
    ['試みる', 'こころみる', '尝试', '新方式を試みる。', '尝试新方式'],
    ['委ねる', 'ゆだねる', '委托', '判断を委ねる。', '委托判断'],
    ['免れる', 'まぬかれる', '免于', '責任を免れる。', '免除责任'],
    ['取り組む', 'とりくむ', '着手处理', '課題に取り組む。', '着手处理课题'],
    ['見直す', 'みなおす', '重新审视', '計画を見直す。', '重新审视计划'],
    ['踏まえる', 'ふまえる', '基于', '結果を踏まえる。', '基于结果'],
    ['伴う', 'ともなう', '伴随', 'リスクを伴う。', '伴随风险'],
    ['費やす', 'ついやす', '花费', '時間を費やす。', '花费时间'],
    ['擁護', 'ようご', '拥护', '権利を擁護する。', '拥护权利'],
    ['循環', 'じゅんかん', '循环', '経済の循環。', '经济循环'],
    ['普及', 'ふきゅう', '普及', '技術が普及する。', '技术普及'],
    ['抑制', 'よくせい', '抑制', '感情を抑制する。', '抑制情绪'],
    ['調和', 'ちょうわ', '调和', '色彩の調和。', '色彩的调和'],
    ['是非', 'ぜひ', '是非；务必', '是非を問う。', '追问是非'],
  ],
};

const EN = {
  beginner: [
    ['water', '/ˈwɔːtər/', '水', 'I drink water every morning.', '我每天早上喝水'],
    ['book', '/bʊk/', '书', 'She is reading a book.', '她在读书'],
    ['school', '/skuːl/', '学校', 'The school opens at eight.', '学校八点开门'],
    ['teacher', '/ˈtiːtʃər/', '老师', 'My teacher is very kind.', '我的老师很和蔼'],
    ['friend', '/frend/', '朋友', 'He is my best friend.', '他是我最好的朋友'],
    ['house', '/haʊs/', '房子', 'They live in a big house.', '他们住在大房子里'],
    ['car', '/kɑːr/', '汽车', 'The car is new.', '这辆车是新的'],
    ['station', '/ˈsteɪʃn/', '车站', 'Meet me at the station.', '在车站见'],
    ['morning', '/ˈmɔːrnɪŋ/', '早晨', 'Good morning!', '早上好'],
    ['night', '/naɪt/', '夜晚', 'The night is quiet.', '夜晚很安静'],
    ['eat', '/iːt/', '吃', 'We eat lunch at noon.', '我们中午吃午饭'],
    ['drink', '/drɪŋk/', '喝', 'Do you drink tea?', '你喝茶吗'],
    ['watch', '/wɑːtʃ/', '观看', 'I watch a movie.', '我看电影'],
    ['listen', '/ˈlɪsn/', '听', 'Listen to music.', '听音乐'],
    ['go', '/ɡoʊ/', '去', 'I go to work by bus.', '我坐公交去上班'],
    ['come', '/kʌm/', '来', 'Please come here.', '请过来'],
    ['write', '/raɪt/', '写', 'Write your name.', '写下你的名字'],
    ['read', '/riːd/', '读', 'He reads the news.', '他读新闻'],
    ['big', '/bɪɡ/', '大的', 'It is a big room.', '这是个大房间'],
    ['small', '/smɔːl/', '小的', 'A small dog ran by.', '一只小狗跑过'],
    ['expensive', '/ɪkˈspensɪv/', '昂贵的', 'This phone is expensive.', '这部手机很贵'],
    ['cheap', '/tʃiːp/', '便宜的', 'The shop is cheap.', '这家店很便宜'],
    ['new', '/nuː/', '新的', 'I bought new shoes.', '我买了新鞋'],
    ['old', '/oʊld/', '旧的；老的', 'This is an old photo.', '这是张旧照片'],
    ['happy', '/ˈhæpi/', '开心的', 'She looks happy.', '她看起来很开心'],
    ['busy', '/ˈbɪzi/', '忙的', 'I am busy today.', '我今天很忙'],
    ['time', '/taɪm/', '时间', 'We have no time.', '我们没有时间'],
    ['weather', '/ˈweðər/', '天气', 'The weather is nice.', '天气很好'],
    ['name', '/neɪm/', '名字', 'What is your name?', '你叫什么名字'],
    ['phone', '/foʊn/', '电话', 'Answer the phone.', '接电话'],
    ['money', '/ˈmʌni/', '钱', 'I need some money.', '我需要一些钱'],
    ['work', '/wɜːrk/', '工作', 'I start work at nine.', '我九点开始工作'],
    ['today', '/təˈdeɪ/', '今天', 'Today is Monday.', '今天是星期一'],
    ['tomorrow', '/təˈmɑːroʊ/', '明天', 'See you tomorrow.', '明天见'],
    ['food', '/fuːd/', '食物', 'The food is delicious.', '食物很好吃'],
  ],
  intermediate: [
    ['experience', '/ɪkˈspɪriəns/', '经验；经历', 'She has rich experience.', '她经验丰富'],
    ['situation', '/ˌsɪtʃuˈeɪʃn/', '情况', 'Explain the situation.', '说明情况'],
    ['influence', '/ˈɪnfluəns/', '影响', 'It influenced my choice.', '它影响了我的选择'],
    ['prepare', '/prɪˈper/', '准备', 'Prepare for the exam.', '为考试做准备'],
    ['relationship', '/rɪˈleɪʃnʃɪp/', '关系', 'They have a close relationship.', '他们关系密切'],
    ['reason', '/ˈriːzn/', '理由', 'Give me a reason.', '给我一个理由'],
    ['method', '/ˈmeθəd/', '方法', 'Try a new method.', '尝试新方法'],
    ['problem', '/ˈprɑːbləm/', '问题', 'Solve the problem.', '解决问题'],
    ['result', '/rɪˈzʌlt/', '结果', 'Announce the result.', '公布结果'],
    ['opinion', '/əˈpɪnjən/', '意见', 'In my opinion, it works.', '我认为这可行'],
    ['society', '/səˈsaɪəti/', '社会', 'Modern society changes fast.', '现代社会变化很快'],
    ['culture', '/ˈkʌltʃər/', '文化', 'Learn about the culture.', '了解文化'],
    ['technology', '/tekˈnɑːlədʒi/', '技术', 'Technology keeps improving.', '技术不断进步'],
    ['environment', '/ɪnˈvaɪrənmənt/', '环境', 'Protect the environment.', '保护环境'],
    ['increase', '/ɪnˈkriːs/', '增加', 'Sales increased last year.', '去年销售额增加了'],
    ['decrease', '/dɪˈkriːs/', '减少', 'Costs decreased sharply.', '成本大幅下降'],
    ['continue', '/kənˈtɪnjuː/', '继续', 'Continue your study.', '继续你的学习'],
    ['change', '/tʃeɪndʒ/', '改变', 'Plans may change.', '计划可能改变'],
    ['decide', '/dɪˈsaɪd/', '决定', 'We decided to leave.', '我们决定离开'],
    ['express', '/ɪkˈspres/', '表达', 'Express your feelings.', '表达你的感受'],
    ['research', '/rɪˈsɜːrtʃ/', '研究；调查', 'They research the topic.', '他们研究这个主题'],
    ['compare', '/kəmˈper/', '比较', 'Compare the two prices.', '比较两个价格'],
    ['complex', '/ˈkɑːmpleks/', '复杂的', 'It is a complex issue.', '这是个复杂的问题'],
    ['simple', '/ˈsɪmpl/', '简单的', 'Keep it simple.', '保持简单'],
    ['important', '/ɪmˈpɔːrtnt/', '重要的', 'An important meeting.', '一个重要的会议'],
    ['necessary', '/ˈnesəseri/', '必要的', 'It is necessary to go.', '有必要去'],
    ['possible', '/ˈpɑːsəbl/', '可能的', 'Is it possible?', '这可能吗'],
    ['actually', '/ˈæktʃuəli/', '实际上', 'Actually, I agree.', '实际上我同意'],
    ['recently', '/ˈriːsntli/', '最近', 'Recently he moved.', '最近他搬家了'],
    ['future', '/ˈfjuːtʃər/', '将来', 'Plan for the future.', '为将来做计划'],
    ['freedom', '/ˈfriːdəm/', '自由', 'Freedom of choice.', '选择的自由'],
    ['effort', '/ˈefərt/', '努力', 'Make an effort.', '努力一把'],
    ['growth', '/ɡroʊθ/', '成长', 'Steady growth this year.', '今年稳定增长'],
    ['develop', '/dɪˈveləp/', '发展；开发', 'Develop new skills.', '培养新技能'],
    ['improve', '/ɪmˈpruːv/', '改善', 'Improve your writing.', '提升你的写作'],
  ],
  advanced: [
    ['abstract', '/ˈæbstrækt/', '抽象的', 'An abstract concept.', '一个抽象的概念'],
    ['concept', '/ˈkɑːnsept/', '概念', 'Clarify the concept.', '澄清概念'],
    ['premise', '/ˈpremɪs/', '前提', 'The premise is flawed.', '这个前提有缺陷'],
    ['contradiction', '/ˌkɑːntrəˈdɪkʃn/', '矛盾', 'A logical contradiction.', '逻辑矛盾'],
    ['compromise', '/ˈkɑːmprəmaɪz/', '妥协', 'Reach a compromise.', '达成妥协'],
    ['comprehend', '/ˌkɑːmprɪˈhend/', '理解', 'Hard to comprehend.', '难以理解'],
    ['facilitate', '/fəˈsɪlɪteɪt/', '促进', 'Facilitate communication.', '促进沟通'],
    ['rectify', '/ˈrektɪfaɪ/', '纠正', 'Rectify the error.', '纠正错误'],
    ['concern', '/kənˈsɜːrn/', '担忧；关切', 'Raise a concern.', '提出关切'],
    ['remarkable', '/rɪˈmɑːrkəbl/', '显著的', 'Remarkable progress.', '显著的进步'],
    ['comprehensive', '/ˌkɑːmprɪˈhensɪv/', '全面的', 'A comprehensive review.', '一次全面审查'],
    ['execute', '/ˈeksɪkjuːt/', '执行', 'Execute the plan.', '执行计划'],
    ['prudent', '/ˈpruːdnt/', '审慎的', 'A prudent decision.', '审慎的决定'],
    ['ambiguous', '/æmˈbɪɡjuəs/', '含糊的', 'An ambiguous answer.', '含糊的回答'],
    ['potential', '/pəˈtenʃl/', '潜在的', 'Potential demand.', '潜在需求'],
    ['consistent', '/kənˈsɪstənt/', '一致的', 'Consistent policy.', '一贯的政策'],
    ['groundbreaking', '/ˈɡraʊndbreɪkɪŋ/', '开创性的', 'A groundbreaking study.', '开创性的研究'],
    ['significant', '/sɪɡˈnɪfɪkənt/', '重大的', 'Significant impact.', '重大影响'],
    ['scarce', '/skers/', '稀缺的', 'Resources are scarce.', '资源稀缺'],
    ['inevitable', '/ɪnˈevɪtəbl/', '不可避免的', 'Change is inevitable.', '变化不可避免'],
    ['urge', '/ɜːrdʒ/', '敦促', 'They urge caution.', '他们敦促谨慎'],
    ['attempt', '/əˈtempt/', '尝试', 'Attempt a new approach.', '尝试新方法'],
    ['delegate', '/ˈdelɪɡeɪt/', '委派', 'Delegate the task.', '委派任务'],
    ['exempt', '/ɪɡˈzempt/', '免除', 'Exempt from tax.', '免税'],
    ['tackle', '/ˈtækl/', '着手解决', 'Tackle the issue.', '着手解决问题'],
    ['revise', '/rɪˈvaɪz/', '修订', 'Revise the plan.', '修订计划'],
    ['entail', '/ɪnˈteɪl/', '牵涉；需要', 'It entails risk.', '这需要承担风险'],
    ['accompany', '/əˈkʌmpəni/', '伴随', 'Risks accompany growth.', '增长伴随风险'],
    ['allocate', '/ˈæləkeɪt/', '分配', 'Allocate resources.', '分配资源'],
    ['advocate', '/ˈædvəkeɪt/', '倡导', 'Advocate for reform.', '倡导改革'],
    ['circulation', '/ˌsɜːrkjəˈleɪʃn/', '循环；流通', 'Money circulation.', '货币流通'],
    ['prevalent', '/ˈprevələnt/', '普遍的', 'A prevalent view.', '普遍的看法'],
    ['restrain', '/rɪˈstreɪn/', '抑制', 'Restrain spending.', '抑制开支'],
    ['harmony', '/ˈhɑːrməni/', '和谐', 'Live in harmony.', '和谐相处'],
    ['coherent', '/koʊˈhɪrənt/', '连贯的', 'A coherent argument.', '连贯的论证'],
  ],
};

function buildRows() {
  const rows = [];
  const push = (language, level, arr) => {
    arr.forEach(([word, phonetic, meaning, example, exampleMeaning]) => {
      if (!word || !meaning) return;
      rows.push({
        language,
        level,
        word: String(word),
        phonetic: phonetic || null,
        meaning: String(meaning),
        example: example || null,
        exampleMeaning: exampleMeaning || null,
        isActive: true,
      });
    });
  };
  push('ja', 'beginner', JA.beginner);
  push('ja', 'intermediate', JA.intermediate);
  push('ja', 'advanced', JA.advanced);
  push('en', 'beginner', EN.beginner);
  push('en', 'intermediate', EN.intermediate);
  push('en', 'advanced', EN.advanced);
  // 去重（同语言同词只留第一条）
  const seen = new Set();
  return rows.filter((r) => {
    const k = r.language + '|' + r.word;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const VOCAB_ROWS = buildRows();

async function seedVocabulary(prisma) {
  let created = 0;
  let updated = 0;
  for (const row of VOCAB_ROWS) {
    const existing = await prisma.vocabularyWord.findUnique({
      where: { language_word: { language: row.language, word: row.word } },
    });
    if (existing) {
      await prisma.vocabularyWord.update({
        where: { id: existing.id },
        data: { level: row.level, phonetic: row.phonetic, meaning: row.meaning, example: row.example, exampleMeaning: row.exampleMeaning, isActive: true },
      });
      updated++;
    } else {
      await prisma.vocabularyWord.create({ data: row });
      created++;
    }
  }
  return { total: VOCAB_ROWS.length, created, updated };
}

module.exports = { seedVocabulary, VOCAB_ROWS };

if (require.main === module) {
  (async () => {
    const prisma = require('../../src/config/database');
    try {
      const r = await seedVocabulary(prisma);
      console.log(`[VOCAB SEED] total=${r.total} created=${r.created} updated=${r.updated}`);
      process.exit(0);
    } catch (e) {
      console.error('[VOCAB SEED] FAILED:', e.message);
      process.exit(1);
    }
  })();
}
