-- ============================================================================
-- 政治 + 英语一 大批知识点种子数据
-- 政治 5 个 topic（马原 / 毛中特 / 近代史 / 思修法基 / 形势与政策）
-- 英语一 5 个 topic（阅读 / 完形 / 翻译 / 写作 / 核心词汇）
-- 节点 ~210，学科内边 ~60，跨学科 CROSS_SUBJECT 边 ~5
-- 边采用 SELECT id FROM knowledge_nodes WHERE title='X' 形式，避免硬编码 id
-- ============================================================================


-- === Topic 1 马克思主义基本原理 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('哲学的基本问题', '思维与存在何者第一性、思维能否正确认识存在是哲学的两大基本问题。前者划分唯物主义与唯心主义，后者划分可知论与不可知论。考查重点是判断各派哲学家的归属，以及辩证唯物主义对该问题的回答：物质第一性、意识第二性、世界可知。', 'EASY', 1, '{"weight": 4, "examFreq": "高"}'),
('物质范畴及其理论意义', '列宁对物质的定义：物质是标志客观实在的哲学范畴，它不依赖于人的意识而存在，并能为人的意识所反映。它坚持了唯物主义一元论，反驳了唯心主义和不可知论，体现了唯物论与辩证法、唯物主义自然观与历史观的统一。常以原理意义类材料题出现。', 'MEDIUM', 1, '{"weight": 5, "examFreq": "高"}'),
('物质与意识的辩证关系', '物质决定意识，意识反作用于物质。意识是高度发展的物质即人脑的机能和属性，是物质世界的主观映象。考点：尊重客观规律与发挥主观能动性的统一，常结合时事考察实事求是。', 'MEDIUM', 1, '{"weight": 5, "examFreq": "高"}'),
('运动观与时空观', '运动是物质的根本属性和存在方式，物质和运动不可分割。静止是运动的特殊状态。时间和空间是物质运动的存在形式，时间一维不可逆，空间三维可入。常考唯物主义与唯心主义、形而上学与辩证法在运动观上的对立。', 'MEDIUM', 1, '{"weight": 3, "examFreq": "中"}'),
('唯物论与辩证法', '唯物论解决世界本原问题，辩证法回答世界存在状态。马克思主义把唯物论与辩证法相结合，形成辩证唯物主义。考查重点是承认物质性又承认运动联系发展，以及形而上学唯物主义与辩证唯物主义的对比。', 'MEDIUM', 1, '{"weight": 5, "examFreq": "高"}'),
('对立统一规律', '对立统一规律即矛盾规律，是唯物辩证法的实质和核心。矛盾具有同一性和斗争性，二者相互联结、相互转化。考点：内因与外因、矛盾普遍性与特殊性、主要矛盾与次要矛盾、矛盾的主次方面。', 'HARD', 1, '{"weight": 5, "examFreq": "高"}'),
('矛盾的普遍性与特殊性', '矛盾普遍性即共性、绝对性，存在于一切事物及发展过程中；特殊性即个性、相对性，表现为不同事物矛盾各异。共性寓于个性中，二者辩证统一。这是马克思主义普遍真理与中国具体实际相结合的哲学依据。', 'HARD', 1, '{"weight": 5, "examFreq": "高"}'),
('量变质变规律', '量变是事物数量的增减和场所的变更，质变是事物根本性质的变化。量变是质变的必要准备，质变是量变的必然结果。常以重视积累、把握适度原则等材料题出现。', 'MEDIUM', 1, '{"weight": 4, "examFreq": "高"}'),
('否定之否定规律', '事物发展通过肯定—否定—否定之否定的螺旋上升完成。辩证否定是自我否定，是发展和联系的环节，本质是扬弃。考点：发展的前进性与曲折性的统一，反对循环论与直线论。', 'HARD', 1, '{"weight": 4, "examFreq": "高"}'),
('五对基本范畴', '原因与结果、必然与偶然、可能与现实、内容与形式、现象与本质。这五对范畴属于辩证法的基本范畴，常考它们的相互关系及方法论意义。', 'MEDIUM', 1, '{"weight": 3, "examFreq": "中"}'),
('实践与认识', '实践是认识的来源、动力、目的和检验真理的唯一标准。认识从感性到理性，再回到实践，呈两次飞跃。考查重点：实践标准的绝对性与相对性、真理的客观性与具体性。', 'MEDIUM', 1, '{"weight": 5, "examFreq": "高"}'),
('真理与价值', '真理是主观对客观的正确反映，具有客观性、绝对性和相对性。价值反映客体满足主体需要的关系。真理与价值在实践中具体的、历史的统一，常考求真务实与以人民为中心的结合。', 'HARD', 1, '{"weight": 4, "examFreq": "高"}'),
('社会存在与社会意识', '社会存在指物质生活条件，决定社会意识；社会意识具有相对独立性并反作用于社会存在。这是历史唯物主义的根本观点，是分析社会现象的核心原理。', 'MEDIUM', 1, '{"weight": 5, "examFreq": "高"}'),
('生产力与生产关系', '生产力决定生产关系，生产关系反作用于生产力，且必须与生产力发展水平相适应。这一规律是社会发展的根本规律，也是改革开放的理论依据。', 'MEDIUM', 1, '{"weight": 5, "examFreq": "高"}'),
('经济基础与上层建筑', '经济基础决定上层建筑，上层建筑反作用于经济基础。当上层建筑适合经济基础时推动发展，反之阻碍。常用于分析政治体制改革的必要性。', 'MEDIUM', 1, '{"weight": 5, "examFreq": "高"}'),
('社会基本矛盾与社会形态更替', '生产力与生产关系矛盾、经济基础与上层建筑矛盾构成社会基本矛盾，推动社会形态由低级向高级更替。常考五种社会形态理论与中国特色社会主义的关系。', 'HARD', 1, '{"weight": 4, "examFreq": "高"}'),
('人民群众是历史的创造者', '人民群众是社会物质财富、精神财富的创造者，是社会变革的决定力量。考点：群众观点与群众路线，是党的根本工作路线。', 'EASY', 1, '{"weight": 5, "examFreq": "高"}'),
('商品的二因素与劳动二重性', '商品具有使用价值和价值二因素，由生产商品的具体劳动和抽象劳动决定。劳动二重性是马克思政治经济学的枢纽，是理解剩余价值理论的钥匙。', 'HARD', 1, '{"weight": 5, "examFreq": "高"}'),
('价值规律', '商品价值由社会必要劳动时间决定，价格围绕价值上下波动。价值规律调节资源配置、刺激技术进步、引起两极分化。是商品经济的基本规律。', 'MEDIUM', 1, '{"weight": 4, "examFreq": "高"}'),
('剩余价值理论', '剩余价值是雇佣工人劳动创造、被资本家无偿占有的超过劳动力价值以上的价值。包括绝对剩余价值与相对剩余价值。是马克思政治经济学的核心，揭示资本主义剥削本质。', 'HARD', 1, '{"weight": 5, "examFreq": "高"}'),
('资本主义基本矛盾与经济危机', '资本主义基本矛盾是生产社会化和资本主义私人占有之间的矛盾。它决定了周期性经济危机的不可避免，呈现出生产相对过剩特征。', 'HARD', 1, '{"weight": 4, "examFreq": "高"}'),
('科学社会主义的诞生', '《共产党宣言》1848年发表，标志科学社会主义诞生。马克思恩格斯通过唯物史观和剩余价值学说，使社会主义从空想变为科学。', 'EASY', 1, '{"weight": 4, "examFreq": "中"}'),
('共产主义远大理想', '共产主义是物质极大丰富、精神境界极大提高、每个人自由全面发展的社会。它是历史必然，但需经过漫长的现实运动，要把远大理想与共同理想结合起来。', 'MEDIUM', 1, '{"weight": 4, "examFreq": "中"}');

-- === Topic 2 毛泽东思想和中国特色社会主义理论体系 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('马克思主义中国化的提出', '1938年毛泽东在六届六中全会作《论新阶段》报告首次提出马克思主义中国化命题。此后形成毛泽东思想、中国特色社会主义理论体系。考点：两次飞跃及其理论成果。', 'EASY', 2, '{"weight": 5, "examFreq": "高"}'),
('新民主主义革命理论', '新民主主义革命是无产阶级领导的、人民大众的、反对帝国主义封建主义官僚资本主义的资产阶级民主主义革命，前途是社会主义。是毛泽东思想的核心内容。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('新民主主义革命三大法宝', '统一战线、武装斗争、党的建设是中国革命的三大法宝。统一战线是基本策略，武装斗争是主要形式，党的建设是核心环节。常考三者关系。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('农村包围城市武装夺取政权', '在半殖民地半封建中国，必须走农村包围城市、武装夺取政权的道路。这是毛泽东对马克思主义关于无产阶级革命学说的独创性贡献。', 'MEDIUM', 2, '{"weight": 4, "examFreq": "高"}'),
('社会主义改造理论', '1953—1956年党对农业、手工业、资本主义工商业进行社会主义改造，确立社会主义基本制度。考点：和平赎买政策、过渡时期总路线"一化三改"。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('毛泽东思想活的灵魂', '实事求是、群众路线、独立自主是毛泽东思想活的灵魂。实事求是是精髓，群众路线是根本工作路线，独立自主是立足点。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('邓小平理论的形成与主题', '邓小平理论回答了"什么是社会主义、怎样建设社会主义"的根本问题，形成于改革开放伟大实践。社会主义本质论：解放发展生产力，消灭剥削消除两极分化，最终达到共同富裕。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('社会主义初级阶段理论', '我国处于并将长期处于社会主义初级阶段。基本路线：一个中心、两个基本点。这是党制定路线方针政策的总依据。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('"三个代表"重要思想', '中国共产党要始终代表中国先进生产力的发展要求、中国先进文化的前进方向、中国最广大人民的根本利益。回答了"建设什么样的党、怎样建设党"的问题。', 'MEDIUM', 2, '{"weight": 4, "examFreq": "中"}'),
('科学发展观', '第一要义是发展，核心立场是以人为本，基本要求是全面协调可持续，根本方法是统筹兼顾。回答了"实现什么样的发展、怎样发展"的问题。', 'MEDIUM', 2, '{"weight": 4, "examFreq": "中"}'),
('习近平新时代中国特色社会主义思想', '党的十九大确立其历史地位，是马克思主义中国化新的飞跃。回答了新时代坚持和发展什么样的中国特色社会主义、怎样坚持和发展的重大时代课题。"十个明确""十四个坚持""十三个方面成就"是核心要点。', 'HARD', 2, '{"weight": 5, "examFreq": "高"}'),
('"五位一体"总体布局', '统筹推进经济建设、政治建设、文化建设、社会建设、生态文明建设。是中国特色社会主义事业总体布局，每个方面都有相应的重大战略。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('"四个全面"战略布局', '全面建设社会主义现代化国家、全面深化改革、全面依法治国、全面从严治党。一战略目标、三战略举措，构成新时代党治国理政的战略框架。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('"两个一百年"奋斗目标', '到中国共产党成立一百年时全面建成小康社会（已实现），到新中国成立一百年时建成富强民主文明和谐美丽的社会主义现代化强国。', 'EASY', 2, '{"weight": 5, "examFreq": "高"}'),
('新发展理念', '创新、协调、绿色、开放、共享五大新发展理念。是关系我国发展全局的一场深刻变革，是构建新发展格局的指导。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('共同富裕', '共同富裕是社会主义本质要求，是中国式现代化的重要特征。要在高质量发展中促进共同富裕，正确处理效率与公平的关系，扩大中等收入群体。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('中国式现代化', '中国式现代化是中国共产党领导的社会主义现代化，具有人口规模巨大、全体人民共同富裕、物质文明与精神文明相协调、人与自然和谐共生、走和平发展道路五大特征。', 'HARD', 2, '{"weight": 5, "examFreq": "高"}'),
('全过程人民民主', '全过程人民民主把选举民主与协商民主结合起来，是最广泛、最真实、最管用的民主，构成中国式民主的鲜明特色。', 'MEDIUM', 2, '{"weight": 4, "examFreq": "高"}'),
('全面深化改革', '改革进入深水区与攻坚期，全面深化改革总目标是完善和发展中国特色社会主义制度、推进国家治理体系和治理能力现代化。坚持问题导向与系统观念。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('全面依法治国', '坚持中国特色社会主义法治道路，建设社会主义法治国家。十六字方针：科学立法、严格执法、公正司法、全民守法。坚持党的领导、人民当家作主、依法治国有机统一。', 'MEDIUM', 2, '{"weight": 5, "examFreq": "高"}'),
('全面从严治党', '坚定不移全面从严治党，深入推进新时代党的建设新的伟大工程。把政治建设摆在首位，以伟大自我革命引领伟大社会革命。', 'MEDIUM', 2, '{"weight": 4, "examFreq": "高"}'),
('人类命运共同体', '推动构建人类命运共同体，倡导和平、发展、公平、正义、民主、自由的全人类共同价值。共建"一带一路"是重要实践平台。', 'MEDIUM', 2, '{"weight": 4, "examFreq": "高"}');

-- === Topic 3 中国近现代史纲要 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('鸦片战争与中国半殖民地半封建社会的开端', '1840年鸦片战争爆发，《南京条约》签订，中国开始沦为半殖民地半封建社会。这是近代中国民族危机和社会矛盾激化的起点。', 'EASY', 3, '{"weight": 5, "examFreq": "高"}'),
('太平天国运动', '1851—1864年的农民革命运动。颁布《天朝田亩制度》和《资政新篇》。失败说明农民阶级无法领导民主革命取得胜利。', 'EASY', 3, '{"weight": 3, "examFreq": "中"}'),
('洋务运动', '19世纪60—90年代地主阶级洋务派开展自强求富运动，创办军用民用工业、新式学堂、北洋水师。甲午战败标志洋务运动失败，证明仅学技术不能救中国。', 'EASY', 3, '{"weight": 4, "examFreq": "高"}'),
('戊戌变法', '1898年康有为、梁启超等资产阶级维新派推动光绪帝实行变法，103天后被慈禧扼杀。证明改良道路在中国走不通。', 'EASY', 3, '{"weight": 4, "examFreq": "中"}'),
('辛亥革命', '1911年武昌起义，1912年建立中华民国，推翻两千多年封建帝制。三民主义为指导思想。但反帝反封建任务未完成，资产阶级共和国方案破产。', 'MEDIUM', 3, '{"weight": 5, "examFreq": "高"}'),
('新文化运动', '1915年陈独秀创办《青年杂志》掀起新文化运动，高举"民主"与"科学"大旗。后期传播马克思主义，为五四运动准备了思想条件。', 'MEDIUM', 3, '{"weight": 4, "examFreq": "高"}'),
('五四运动', '1919年5月4日爆发，反对巴黎和会损害中国主权。是彻底反帝反封建的爱国运动，是中国新民主主义革命的开端。工人阶级登上历史舞台。', 'MEDIUM', 3, '{"weight": 5, "examFreq": "高"}'),
('中国共产党的成立', '1921年7月中共一大召开，宣告中国共产党成立。这是开天辟地的大事变，使中国革命面貌焕然一新。', 'EASY', 3, '{"weight": 5, "examFreq": "高"}'),
('国共第一次合作与大革命', '1924—1927年第一次国共合作，开展北伐战争。1927年蒋介石、汪精卫先后叛变，大革命失败。教训：必须坚持党对革命的领导权和武装力量。', 'MEDIUM', 3, '{"weight": 4, "examFreq": "中"}'),
('土地革命与井冈山道路', '1927年八七会议确定土地革命和武装反抗国民党反动派总方针。秋收起义后毛泽东开辟井冈山革命根据地，开创农村包围城市的革命新道路。', 'MEDIUM', 3, '{"weight": 5, "examFreq": "高"}'),
('遵义会议', '1935年1月遵义会议在长征途中召开，事实上确立了毛泽东在党和红军中的领导地位，是党历史上生死攸关的转折点。', 'MEDIUM', 3, '{"weight": 5, "examFreq": "高"}'),
('抗日战争', '1937年七七事变全面抗战爆发。中国共产党倡导建立抗日民族统一战线，提出持久战战略。1945年取得抗战胜利，是近代以来反抗外敌入侵的第一次完全胜利。', 'MEDIUM', 3, '{"weight": 5, "examFreq": "高"}'),
('抗日民族统一战线', '在民族危机面前，中共积极倡导并维护抗日民族统一战线，坚持独立自主原则，处理好统一战线中的领导权问题，是抗战胜利的根本保证。', 'MEDIUM', 3, '{"weight": 4, "examFreq": "高"}'),
('解放战争', '1946—1949年人民解放战争，先经历战略防御，后经辽沈、淮海、平津三大战役战略决战，渡江战役解放南京。1949年10月1日新中国成立。', 'MEDIUM', 3, '{"weight": 5, "examFreq": "高"}'),
('新中国成立的伟大意义', '中华人民共和国成立结束了帝国主义、封建主义、官僚资本主义在中国的统治，开辟了中国历史新纪元，为社会主义建设奠定根本前提。', 'EASY', 3, '{"weight": 5, "examFreq": "高"}'),
('过渡时期总路线', '1953年提出，要在相当长的时期内逐步实现国家的社会主义工业化和对农业、手工业、资本主义工商业的社会主义改造。一化三改的关系是主体与两翼。', 'MEDIUM', 3, '{"weight": 4, "examFreq": "中"}'),
('社会主义建设道路初步探索', '《论十大关系》《关于正确处理人民内部矛盾的问题》是早期探索代表作。八大正确分析国内主要矛盾，但随后发生了大跃进、人民公社化运动以及十年"文化大革命"等曲折。', 'HARD', 3, '{"weight": 4, "examFreq": "高"}'),
('改革开放和社会主义现代化建设新时期', '1978年党的十一届三中全会重新确立解放思想、实事求是的思想路线，作出改革开放重大决策。中国从此走上改革开放和社会主义现代化建设新道路。', 'MEDIUM', 3, '{"weight": 5, "examFreq": "高"}'),
('家庭联产承包责任制', '改革开放从农村起步，安徽小岗村大包干率先突破。家庭联产承包责任制极大解放农村生产力。', 'EASY', 3, '{"weight": 3, "examFreq": "中"}'),
('社会主义市场经济体制', '1992年党的十四大确立建立社会主义市场经济体制改革目标，实现重大理论突破。', 'MEDIUM', 3, '{"weight": 4, "examFreq": "中"}'),
('港澳回归与一国两制', '"一国两制"是邓小平为解决祖国统一问题创造性提出的科学构想。1997年香港、1999年澳门相继回归祖国。', 'EASY', 3, '{"weight": 3, "examFreq": "中"}'),
('中国特色社会主义进入新时代', '党的十八大以来，党和国家事业取得历史性成就、发生历史性变革。十九大宣告中国特色社会主义进入新时代，社会主要矛盾已转化为人民日益增长的美好生活需要和不平衡不充分发展之间的矛盾。', 'MEDIUM', 3, '{"weight": 5, "examFreq": "高"}'),
('中国共产党百年奋斗的历史经验', '十个坚持：坚持党的领导、坚持人民至上、坚持理论创新、坚持独立自主、坚持中国道路、坚持胸怀天下、坚持开拓创新、坚持敢于斗争、坚持统一战线、坚持自我革命。', 'HARD', 3, '{"weight": 4, "examFreq": "高"}');

-- === Topic 4 思想道德修养与法律基础 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('人生观与价值观', '人生观回答"为什么活、怎样活"。人的本质是一切社会关系的总和。坚持服务人民、奉献社会的高尚人生追求，反对拜金、享乐、极端个人主义。', 'EASY', 4, '{"weight": 4, "examFreq": "高"}'),
('理想信念', '理想信念是人的精神之"钙"。崇高的理想信念是共产党人的政治灵魂。要把个人理想融入国家民族事业之中。', 'MEDIUM', 4, '{"weight": 5, "examFreq": "高"}'),
('中国精神', '以爱国主义为核心的民族精神和以改革创新为核心的时代精神构成中国精神，是兴国强国之魂。', 'MEDIUM', 4, '{"weight": 4, "examFreq": "高"}'),
('爱国主义新时代要求', '爱国主义具有鲜明的时代特征。新时代爱国主义的本质是坚持爱国与爱党、爱社会主义高度统一。要维护祖国统一、反对民族分裂。', 'MEDIUM', 4, '{"weight": 5, "examFreq": "高"}'),
('改革创新精神', '改革创新是新时代时代精神的核心，要勇做改革创新的实干家、积极投身创新创业实践。', 'EASY', 4, '{"weight": 3, "examFreq": "中"}'),
('社会主义核心价值观', '富强、民主、文明、和谐（国家层面）；自由、平等、公正、法治（社会层面）；爱国、敬业、诚信、友善（个人层面）。是当代中国精神的集中体现。', 'EASY', 4, '{"weight": 5, "examFreq": "高"}'),
('道德的本质与功能', '道德是社会经济关系的反映，受经济关系决定又反作用于经济关系。具有认识、规范、调节、激励等功能。', 'MEDIUM', 4, '{"weight": 3, "examFreq": "中"}'),
('社会主义道德建设', '以为人民服务为核心、以集体主义为原则。集体主义强调集体利益与个人利益辩证统一，反对小团体主义和极端个人主义。', 'MEDIUM', 4, '{"weight": 5, "examFreq": "高"}'),
('中华传统美德', '自强不息、勤劳勇敢、扶危济困、诚实守信、谦敬礼让等。要在继承中实现创造性转化和创新性发展。', 'EASY', 4, '{"weight": 4, "examFreq": "中"}'),
('革命道德', '在长期革命斗争中形成的优良传统：井冈山精神、长征精神、延安精神、西柏坡精神等。是社会主义道德的源头活水。', 'EASY', 4, '{"weight": 3, "examFreq": "中"}'),
('社会公德、职业道德、家庭美德、个人品德', '四种道德建设是社会主义道德建设的着力点。社会公德重点在公共场所；职业道德核心是爱岗敬业；家庭美德倡导尊老爱幼；个人品德强调修身养性。', 'EASY', 4, '{"weight": 4, "examFreq": "高"}'),
('法的本质与特征', '法是由国家制定或认可、以国家强制力保证实施的社会行为规范。具有规范性、国家意志性、强制性、普遍性、程序性等特征。', 'MEDIUM', 4, '{"weight": 4, "examFreq": "高"}'),
('我国宪法基本原则', '党的领导原则、人民主权原则、尊重和保障人权原则、社会主义法治原则、民主集中制原则。宪法是国家根本法、治国安邦总章程。', 'MEDIUM', 4, '{"weight": 5, "examFreq": "高"}'),
('我国国家制度', '人民代表大会制度是根本政治制度；中国共产党领导的多党合作和政治协商制度、民族区域自治制度、基层群众自治制度是基本政治制度。', 'MEDIUM', 4, '{"weight": 5, "examFreq": "高"}'),
('我国法律体系', '以宪法为统帅，宪法相关法、民商法、行政法、经济法、社会法、刑法、诉讼与非诉讼程序法等多个部门构成中国特色社会主义法律体系。', 'MEDIUM', 4, '{"weight": 4, "examFreq": "高"}'),
('民法典', '《中华人民共和国民法典》2021年施行，包括总则、物权、合同、人格权、婚姻家庭、继承、侵权责任七编，是新中国第一部以"法典"命名的法律。', 'MEDIUM', 4, '{"weight": 4, "examFreq": "高"}'),
('社会主义法治理念', '坚持依法治国、执法为民、公平正义、服务大局、党的领导。这是建设社会主义法治国家的指导思想。', 'EASY', 4, '{"weight": 4, "examFreq": "高"}'),
('权利与义务', '公民基本权利：政治权利、人身权利、社会经济权利、文化教育权利等。公民基本义务：维护国家统一、遵守宪法和法律、保守国家秘密、依法纳税等。权利与义务相统一。', 'MEDIUM', 4, '{"weight": 4, "examFreq": "高"}'),
('依法行使权利与履行义务', '依法行使权利要遵循正当程序、不得滥用、保护他人正当权利。要正确认识权利义务一致性，自觉履行公民义务。', 'MEDIUM', 4, '{"weight": 3, "examFreq": "中"}'),
('法治思维', '法治思维包含法律至上、权力制约、公平正义、人权保障、正当程序等核心内容。要树立尊法学法守法用法的意识。', 'MEDIUM', 4, '{"weight": 4, "examFreq": "高"}'),
('道德与法律的关系', '道德为法律提供伦理基础，法律为道德提供制度保障。坚持依法治国与以德治国相结合。', 'MEDIUM', 4, '{"weight": 4, "examFreq": "高"}');

-- === Topic 5 形势与政策 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('全过程人民民主的理论与实践', '全过程人民民主把过程民主与成果民主、程序民主与实质民主、直接民主与间接民主相结合，是社会主义民主政治的本质属性，是最广泛、最真实、最管用的民主。', 'MEDIUM', 5, '{"weight": 5, "examFreq": "高"}'),
('中国式现代化的中国特色', '中国式现代化是人口规模巨大的现代化、全体人民共同富裕的现代化、物质文明和精神文明相协调的现代化、人与自然和谐共生的现代化、走和平发展道路的现代化。', 'MEDIUM', 5, '{"weight": 5, "examFreq": "高"}'),
('高质量发展', '高质量发展是全面建设社会主义现代化国家的首要任务。要构建新发展格局、加快现代化产业体系建设、推动经济实现质的有效提升和量的合理增长。', 'MEDIUM', 5, '{"weight": 5, "examFreq": "高"}'),
('新质生产力', '新质生产力以科技创新为核心要素，是符合新发展理念的先进生产力质态。摆脱传统经济增长方式，体现高科技、高效能、高质量特征。', 'HARD', 5, '{"weight": 5, "examFreq": "高"}'),
('科技自立自强', '加快实现高水平科技自立自强，强化国家战略科技力量，集中力量打好关键核心技术攻坚战，把科技命脉牢牢掌握在自己手中。', 'MEDIUM', 5, '{"weight": 4, "examFreq": "高"}'),
('数字中国建设', '数字中国是数字时代推进中国式现代化的重要引擎，包括数字基础设施、数据资源体系、数字经济、数字社会、数字政府、数字文化、数字生态等。', 'MEDIUM', 5, '{"weight": 4, "examFreq": "中"}'),
('乡村振兴战略', '坚持农业农村优先发展，按照产业兴旺、生态宜居、乡风文明、治理有效、生活富裕总要求，实施乡村振兴战略，建设农业强国。', 'MEDIUM', 5, '{"weight": 4, "examFreq": "高"}'),
('共同富裕示范区', '在浙江高质量发展建设共同富裕示范区，为全国推动共同富裕提供省域范例。促进城乡区域协调发展、缩小三大差距。', 'MEDIUM', 5, '{"weight": 3, "examFreq": "中"}'),
('碳达峰碳中和', '中国承诺2030年前实现碳达峰、2060年前实现碳中和。这是党中央统筹两个大局作出的重大战略决策，要立足以煤为主基本国情，先立后破有序推进。', 'HARD', 5, '{"weight": 5, "examFreq": "高"}'),
('绿水青山就是金山银山', '"两山论"揭示了经济发展与生态保护的辩证关系，是新时代生态文明建设的重要理念。', 'EASY', 5, '{"weight": 4, "examFreq": "高"}'),
('全过程人民民主与协商民主', '协商民主是中国民主的特色和优势，是党的群众路线在政治领域的重要体现。包括政党协商、人大协商、政府协商、政协协商、人民团体协商、基层协商和社会组织协商。', 'MEDIUM', 5, '{"weight": 3, "examFreq": "中"}'),
('全面深化改革新部署', '党的二十届三中全会聚焦构建高水平社会主义市场经济体制，进一步全面深化改革，部署300多项重大改革举措。', 'MEDIUM', 5, '{"weight": 5, "examFreq": "高"}'),
('全过程从严治党', '深入推进新时代党的建设新的伟大工程，推动反腐败斗争向纵深发展，确保党永远不变质、不变色、不变味。', 'MEDIUM', 5, '{"weight": 4, "examFreq": "高"}'),
('人类命运共同体的实践', '推动构建人类命运共同体落地生根。三大全球倡议：全球发展倡议、全球安全倡议、全球文明倡议。', 'MEDIUM', 5, '{"weight": 5, "examFreq": "高"}'),
('一带一路高质量发展', '"一带一路"倡议提出十周年，从大写意进入工笔画阶段。坚持共商共建共享，推动小而美、惠民生的标志性项目。', 'MEDIUM', 5, '{"weight": 4, "examFreq": "高"}'),
('中美关系', '中美关系是世界上最重要的双边关系之一。坚持相互尊重、和平共处、合作共赢三原则，妥善管控分歧，推动中美关系稳定健康发展。', 'MEDIUM', 5, '{"weight": 4, "examFreq": "高"}'),
('两岸关系与祖国统一', '坚持一个中国原则和"九二共识"，坚决反对"台独"分裂行径和外部势力干涉。促进两岸融合发展，推进祖国和平统一进程。', 'MEDIUM', 5, '{"weight": 5, "examFreq": "高"}'),
('总体国家安全观', '坚持以人民安全为宗旨，以政治安全为根本，以经济安全为基础，以军事、科技、文化、社会安全为保障，以促进国际安全为依托。统筹发展和安全。', 'MEDIUM', 5, '{"weight": 4, "examFreq": "高"}'),
('粮食安全与能源安全', '把饭碗牢牢端在自己手中。坚守18亿亩耕地红线，端牢中国饭碗。加快建设新型能源体系，确保能源供应安全。', 'EASY', 5, '{"weight": 3, "examFreq": "中"}'),
('民营经济高质量发展', '促进民营经济发展壮大，破除影响民营经济发展的体制机制障碍。"两个毫不动摇"是基本经济制度的重要内容。', 'MEDIUM', 5, '{"weight": 3, "examFreq": "中"}'),
('文化自信与中华优秀传统文化', '坚定文化自信，推动中华优秀传统文化创造性转化、创新性发展，建设中华民族现代文明。"两个结合"是党的创新理论根基。', 'MEDIUM', 5, '{"weight": 5, "examFreq": "高"}');


-- === Topic 6 阅读理解 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('阅读理解题型分类', '英语一阅读Part A 共四篇文章二十题，包含六大题型：细节题、推断题、主旨题、词义题、态度题、写作目的题。各题型考查角度不同，需有针对性策略。', 'EASY', 6, '{"weight": 5, "examFreq": "高"}'),
('细节题解题策略', '细节题考查对原文具体信息的把握。解题三步：题干关键词定位→回到原文找出处→比对四个选项。注意同义替换与偷换概念。', 'EASY', 6, '{"weight": 5, "examFreq": "高"}'),
('阅读理解推断题解题策略', '推断题须在原文基础上合理引申，不能脱离原文凭主观臆断。判断标准：选项所表达内容必须能由原文充分推出，不能"过度推断"或"无中生有"。', 'HARD', 6, '{"weight": 5, "examFreq": "高"}'),
('主旨大意题', '主旨题考查文章中心思想或某段中心。常见做法：关注首末段、各段首句、转折处、作者直接表态句。警惕以偏概全或过度概括的干扰项。', 'MEDIUM', 6, '{"weight": 5, "examFreq": "高"}'),
('词义猜测题', '词义题不考查单词本身含义，而考查在特定语境中的具体意义。可借助同位语、定语从句、并列关系、转折关系、上下文逻辑等推测。', 'MEDIUM', 6, '{"weight": 4, "examFreq": "高"}'),
('态度题与作者观点', '态度题考查作者对话题或现象的态度，常见选项有positive/negative/objective/critical/optimistic/skeptical等。注意区分作者态度与他人观点。', 'MEDIUM', 6, '{"weight": 4, "examFreq": "高"}'),
('写作目的题', '考查作者写作意图或某段功能。常见选项：to argue, to illustrate, to analyze, to criticize。需把握全文逻辑结构与基调。', 'MEDIUM', 6, '{"weight": 3, "examFreq": "中"}'),
('阅读定位策略', '题干中的人名、地名、年份、数字、专有名词、大写词等是高效定位标志。乱序题目按题号顺序对应原文段落顺序。', 'EASY', 6, '{"weight": 5, "examFreq": "高"}'),
('转折信号词', 'but/however/yet/nevertheless/whereas/while/although等转折词后往往是命题点。正负转折后的内容常对应正确答案。', 'MEDIUM', 6, '{"weight": 5, "examFreq": "高"}'),
('因果关系信号词', 'because/since/as/for/owing to/due to/thanks to/result in/lead to/cause/hence/thus/therefore等显示因果，常考因果倒置干扰项。', 'MEDIUM', 6, '{"weight": 4, "examFreq": "高"}'),
('让步关系信号词', 'although/though/even though/even if/while/despite/in spite of等表让步。考查时需把握"让步—主张"结构，主张才是作者真正观点。', 'MEDIUM', 6, '{"weight": 4, "examFreq": "高"}'),
('选项常见干扰类型', '常见干扰项：偷换概念、张冠李戴、以偏概全、过度推断、范围扩大、范围缩小、无中生有、绝对化表述、相反方向。', 'HARD', 6, '{"weight": 5, "examFreq": "高"}'),
('绝对化与相对化', '含always/never/all/none/only/must/the most等绝对化词的选项往往是错的，含可能、有时、部分等相对化表述的选项更可能是正确答案。', 'EASY', 6, '{"weight": 4, "examFreq": "高"}'),
('阅读Part B 七选五', 'Part B 一题共10分，主要考查篇章结构理解。常见做法：先梳理主线、识别衔接代词与关键词复现、把握段落首末句逻辑。', 'HARD', 6, '{"weight": 5, "examFreq": "高"}'),
('阅读Part B 标题搭配', '标题搭配题考查段落主旨与小标题的对应。注意小标题中的关键词与段落核心名词的呼应。', 'MEDIUM', 6, '{"weight": 3, "examFreq": "中"}'),
('阅读时间分配', 'Part A 约70分钟（每篇17—18分钟），Part B 约20分钟，建议先做Part A 后做Part B。每篇文章先读题再读文，定位—精读—对比。', 'EASY', 6, '{"weight": 4, "examFreq": "高"}'),
('社科类文章阅读', '近十年阅读以社会科学类为主：教育、就业、媒体、环境、健康等。注意作者立场往往中立或微批判，警惕极端观点。', 'EASY', 6, '{"weight": 3, "examFreq": "中"}'),
('科技类文章阅读', '科技类文章逻辑较强、术语较多。重点把握"现象—原因—影响—对策"框架，无需深究专业细节。', 'MEDIUM', 6, '{"weight": 3, "examFreq": "中"}'),
('经济商业类文章阅读', '关注经济现象描述、原因分析与政策建议。注意正负因素并存表述及条件状语后的限定。', 'MEDIUM', 6, '{"weight": 3, "examFreq": "中"}'),
('议论文文章结构', '议论文常见结构：引出话题—提出观点—举例论证—对立观点—驳论—结论。把握论点与论据是阅读核心。', 'MEDIUM', 6, '{"weight": 4, "examFreq": "高"}'),
('阅读复习方法', '精读真题为主，限时模考；重点研究错题选项设置规律；积累高频词汇与同义替换；形成自己的解题节奏与技巧体系。', 'EASY', 6, '{"weight": 4, "examFreq": "高"}'),
('近十年阅读高频话题', '高频话题：科技与人类、教育与就业、环境保护、消费心理、媒体公信力、企业管理。把握话题词汇有助于快速理解。', 'EASY', 6, '{"weight": 3, "examFreq": "中"}');

-- === Topic 7 完形填空 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('完形填空考查目标', '完形填空一题10分，20空，每空0.5分。考查综合能力：词汇辨析、固定搭配、上下文逻辑、语法结构。难点在干扰项形近义近。', 'EASY', 7, '{"weight": 5, "examFreq": "高"}'),
('完形填空解题流程', '三步法：通读首段把握主旨→逐空精做并标记不确定空→回读检查整体逻辑。先做有把握题再返回处理难题。', 'EASY', 7, '{"weight": 4, "examFreq": "高"}'),
('完形填空逻辑词', '抓住转折(but/however/yet)、因果(because/so/therefore)、让步(although/though)、并列(and/also/moreover)、对比(while/whereas)等连接词。', 'MEDIUM', 7, '{"weight": 5, "examFreq": "高"}'),
('词汇辨析—近义动词', '常考近义动词：raise/rise/arise、affect/effect、ensure/insure/assure、adopt/adapt、accept/receive。需把握各自的搭配与具体含义。', 'HARD', 7, '{"weight": 5, "examFreq": "高"}'),
('词汇辨析—近义名词', '常考近义名词：result/effect/consequence/outcome、cause/reason/source、purpose/aim/goal/target、idea/thought/opinion。', 'MEDIUM', 7, '{"weight": 4, "examFreq": "高"}'),
('词汇辨析—近义形容词', '常考近义形容词：significant/considerable/substantial、distinct/different/various、reliable/trustworthy。', 'MEDIUM', 7, '{"weight": 4, "examFreq": "高"}'),
('动词时态考点', '完形主要考一般现在时、一般过去时、现在完成时及被动语态。需结合时间状语和上下文推断时态。', 'MEDIUM', 7, '{"weight": 3, "examFreq": "中"}'),
('固定搭配与短语动词', 'play a role in、make a difference、take account of、in light of、on the contrary、by no means、in terms of等固定搭配是高频考点。', 'MEDIUM', 7, '{"weight": 5, "examFreq": "高"}'),
('介词搭配', '动词、形容词、名词与介词的搭配：be aware of、associated with、resort to、depend on、refer to、in favor of。', 'MEDIUM', 7, '{"weight": 4, "examFreq": "高"}'),
('连接副词', 'however、moreover、furthermore、likewise、similarly、conversely、accordingly、consequently、nonetheless、indeed等。把握其逻辑功能。', 'MEDIUM', 7, '{"weight": 5, "examFreq": "高"}'),
('代词指代', 'it、they、this、that、these、those等代词的指代对象需结合上下文确定。考查代词时要回读上句寻找先行词。', 'EASY', 7, '{"weight": 3, "examFreq": "中"}'),
('完形上下文复现', '同义复现、反义复现、关系复现、概括复现是命题点。某空答案常在前文或后文出现同义/反义信息。', 'MEDIUM', 7, '{"weight": 5, "examFreq": "高"}'),
('完形首段重要性', '首段不设空但提供主旨信息。研究透首段可把握全文基调与文章逻辑走向。', 'EASY', 7, '{"weight": 4, "examFreq": "高"}'),
('完形末段重要性', '末段往往总结全文或给出结论，常含与首段呼应的关键词。把握末段有助于反向验证选项。', 'EASY', 7, '{"weight": 3, "examFreq": "中"}'),
('完形话题背景', '完形话题以人文社科为主：教育、心理、行为、健康、科技伦理。提前了解相关词汇有助于流畅阅读。', 'EASY', 7, '{"weight": 3, "examFreq": "中"}'),
('完形排除法', '当无法确定答案时，从词性不符、搭配不通、逻辑矛盾、绝对化表述等角度逐一排除。', 'MEDIUM', 7, '{"weight": 4, "examFreq": "高"}'),
('完形抽象动词', 'demonstrate、imply、indicate、suggest、reveal、suppose、assume、hypothesize等抽象动词常作为选项考查。', 'HARD', 7, '{"weight": 4, "examFreq": "高"}'),
('完形否定与双重否定', 'no、not、none、never、hardly、scarcely、rarely、seldom等否定词及双重否定结构会颠覆句意，需特别注意。', 'MEDIUM', 7, '{"weight": 3, "examFreq": "中"}'),
('完形语篇衔接', '完形重视语篇衔接：词汇衔接、逻辑衔接、结构衔接。把握篇章逻辑有助于做出准确判断。', 'HARD', 7, '{"weight": 4, "examFreq": "高"}'),
('完形复习方法', '研究近10年真题，整理高频词与高频搭配，反复回读语篇逻辑。每日练习一篇并精校错题原因。', 'EASY', 7, '{"weight": 4, "examFreq": "高"}'),
('完形蒙题策略', '完形随机正确率约25%，掌握"长选项偏向正确"、"形近词同时出现常考其一"等规律可提高蒙题命中率。', 'EASY', 7, '{"weight": 2, "examFreq": "低"}'),
('完形高频副词', 'currently、apparently、subsequently、initially、ultimately、virtually、merely、simply、largely等副词出现频率较高。', 'MEDIUM', 7, '{"weight": 3, "examFreq": "中"}');

-- === Topic 8 翻译 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('英译汉总体策略', '英语一翻译为五句长难句翻译，每题2分共10分。首先理解原文逻辑结构，再按汉语表达习惯重组语序，确保信达雅。', 'MEDIUM', 8, '{"weight": 5, "examFreq": "高"}'),
('长难句拆解—名词性从句', '主语从句、宾语从句、表语从句、同位语从句。识别引导词that/whether/what/how等，先判断从句成分再翻译。', 'HARD', 8, '{"weight": 5, "examFreq": "高"}'),
('长难句拆解—定语从句', '定语从句的处理：限制性短从句前置译成"的"；非限制性或较长从句后置成独立分句；who/which/that/where/when等关系词的灵活处理。', 'HARD', 8, '{"weight": 5, "examFreq": "高"}'),
('长难句拆解—状语从句', '状语从句包含时间、原因、让步、条件、目的、结果等。汉语习惯将原因/让步状语前置，结果/目的状语后置。', 'MEDIUM', 8, '{"weight": 5, "examFreq": "高"}'),
('长难句拆解—非谓语动词', '不定式、动名词、现在分词、过去分词作定语、状语、补语时的翻译方法。常需译成独立分句。', 'HARD', 8, '{"weight": 4, "examFreq": "高"}'),
('被动语态翻译', '英语被动多于汉语。翻译策略：保留被动；译成主动；译成无主句；译成"是…的"判断句。具体看行文需要。', 'MEDIUM', 8, '{"weight": 4, "examFreq": "高"}'),
('抽象名词具体化', '英语抽象名词偏多，汉语偏好具体动词。翻译时常将抽象名词转化为动词或动宾结构，使译文更符合汉语表达。', 'HARD', 8, '{"weight": 4, "examFreq": "高"}'),
('词义引申与选择', '一词多义、词义引申是翻译难点。需根据上下文选择最贴合的汉语对应词，避免直译生硬。', 'MEDIUM', 8, '{"weight": 4, "examFreq": "高"}'),
('增词法与减词法', '增词法：补充汉语必须而英语省略的内容(如范畴词)；减词法：省略冠词、人称代词、连词等汉语不必要成分。', 'MEDIUM', 8, '{"weight": 3, "examFreq": "中"}'),
('转换法', '词类转换：英语名词→汉语动词；英语介词→汉语动词；英语形容词→汉语副词等。使译文流畅自然。', 'MEDIUM', 8, '{"weight": 3, "examFreq": "中"}'),
('正反译法', '英语正面表达可译成汉语反面表达，反之亦然。如fail to→未能、free from→不受…影响。', 'MEDIUM', 8, '{"weight": 3, "examFreq": "中"}'),
('语序调整', '英汉语序差异：英语先短后长、先主后次；汉语习惯按时间逻辑顺序展开。翻译时常需调整状语、定语位置。', 'HARD', 8, '{"weight": 5, "examFreq": "高"}'),
('插入语处理', '插入语in fact、to be sure、of course、in addition等可前置、保留或后置。复杂插入语建议拆为独立短句。', 'MEDIUM', 8, '{"weight": 3, "examFreq": "中"}'),
('代词回指翻译', '代词it、they、this、that等翻译时往往需还原指代对象，使译文清晰。', 'MEDIUM', 8, '{"weight": 3, "examFreq": "中"}'),
('比较结构翻译', 'as…as、more…than、no more…than、not so much…as、rather than等比较结构需准确把握含义。', 'HARD', 8, '{"weight": 4, "examFreq": "高"}'),
('强调句与倒装句', 'It is/was…that…强调句翻译为"正是…才…"；倒装句须还原成正常语序再翻译。', 'MEDIUM', 8, '{"weight": 3, "examFreq": "中"}'),
('翻译评分标准', '采点给分：每句0.5分小步评分。即使整句不流畅，只要采分点准确仍可得分。建议译完通读检查关键词。', 'EASY', 8, '{"weight": 5, "examFreq": "高"}'),
('翻译时间分配', '翻译建议20—25分钟。先快速通读全段把握主题，再逐句翻译，最后留3分钟检查并润色。', 'EASY', 8, '{"weight": 3, "examFreq": "中"}'),
('翻译常见失分点', '常见失分：漏译、错译、语序混乱、术语不准、表达不通顺。注意避免"翻译腔"，多读多练。', 'MEDIUM', 8, '{"weight": 4, "examFreq": "高"}'),
('翻译复习方法', '研究真题翻译解析，对比官方译文与自己版本差异；积累人文社科主题词汇；定期限时模考。', 'EASY', 8, '{"weight": 4, "examFreq": "高"}'),
('英译汉术语处理', '专有名词、机构名、人名等首次出现可保留英文并附中文译名；通用术语遵循约定俗成译法。', 'EASY', 8, '{"weight": 2, "examFreq": "低"}');

-- === Topic 9 写作 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('写作总体要求', '英语一写作分小作文(10分)和大作文(20分)。评分关注内容完整、语言准确、表达流畅、衔接自然、卷面整洁。', 'EASY', 9, '{"weight": 5, "examFreq": "高"}'),
('小作文—书信类', '常见书信：建议信、咨询信、申请信、邀请信、感谢信、道歉信、推荐信、投诉信。三段结构：写信目的—具体内容—礼貌结尾。', 'EASY', 9, '{"weight": 5, "examFreq": "高"}'),
('小作文—通知告示', '通知告示用于发布信息或邀请。结构：标题—正文(时间地点内容)—署名日期。语言客观简洁，使用被动语态较多。', 'EASY', 9, '{"weight": 3, "examFreq": "中"}'),
('小作文—摘要', '摘要要求概括短文主要内容，不可加入个人观点。注意压缩长度、保留主旨、使用同义替换避免抄袭原文。', 'MEDIUM', 9, '{"weight": 3, "examFreq": "中"}'),
('小作文模板—建议信', '开头：I am writing to offer some suggestions on…。主体：First… Second… Last but not least…。结尾：I would appreciate it if you could take my suggestions into consideration.', 'EASY', 9, '{"weight": 4, "examFreq": "高"}'),
('大作文—图表类开头段模板', 'As is vividly depicted in the chart above, …。开头段30—40词：描述图表 + 概括趋势 + 引出主题。把握客观描述，不掺杂主观评价。', 'MEDIUM', 9, '{"weight": 5, "examFreq": "高"}'),
('大作文图表类开头段模板', '示例：As is symbolically illustrated in the bar chart, the number of … has increased dramatically from … to … over the period from … to ….结合具体数据使开头段生动具体。', 'MEDIUM', 9, '{"weight": 5, "examFreq": "高"}'),
('大作文图表类主体段', '主体段100—120词：分析原因+影响。三段式逻辑：现象本质→主要原因(1—2点)→影响或意义。使用举例、对比、因果等论证。', 'MEDIUM', 9, '{"weight": 5, "examFreq": "高"}'),
('大作文图表类结尾段', '结尾段30—40词：总结观点+提出建议或展望。常用句式：In view of what has been discussed above, it is high time that we…。', 'MEDIUM', 9, '{"weight": 4, "examFreq": "高"}'),
('大作文—图画类', '图画类作文需先描述图画(含寓意)，再分析其反映的社会现象，最后提出建议或表达观点。三段式结构清晰。', 'MEDIUM', 9, '{"weight": 5, "examFreq": "高"}'),
('大作文图画类描述段', '描述段需客观呈现：人物、动作、表情、背景及标题文字含义。常用句式：In the picture, we can see…/The painting symbolically illustrates that…。', 'MEDIUM', 9, '{"weight": 5, "examFreq": "高"}'),
('大作文亮点句式', 'It is universally acknowledged that…/There is no denying that…/On no account can we ignore that…/What strikes us most is that…等可作为亮点句式。', 'MEDIUM', 9, '{"weight": 4, "examFreq": "高"}'),
('大作文常见衔接词', 'Firstly/Moreover/Additionally/On the contrary/As a result/Consequently/In conclusion/All in all/To sum up等。', 'EASY', 9, '{"weight": 5, "examFreq": "高"}'),
('大作文常考主题—文化', '文化类常考：传统文化保护、文化自信、文化交流、跨文化沟通、文化融合等。需提前积累相关词汇与论据。', 'MEDIUM', 9, '{"weight": 4, "examFreq": "高"}'),
('大作文常考主题—青年', '青年类常考：青年责任、奋斗精神、就业观念、价值取向、终身学习等。可从个人成长与社会贡献两个角度展开。', 'MEDIUM', 9, '{"weight": 4, "examFreq": "高"}'),
('大作文常考主题—环境与科技', '环境类：低碳生活、垃圾分类、生态文明；科技类：人工智能、社交媒体、信息时代弊端。注意辩证看待。', 'MEDIUM', 9, '{"weight": 4, "examFreq": "高"}'),
('写作避免低级错误', '避免主谓不一致、时态混乱、单复数错误、拼写错误、标点错误。这些错误会显著影响印象分。', 'EASY', 9, '{"weight": 5, "examFreq": "高"}'),
('写作字数与篇幅', '小作文100词左右，大作文160—200词。过短或过长均扣分。注意分段清晰，每段3—5句。', 'EASY', 9, '{"weight": 4, "examFreq": "高"}'),
('写作时间分配', '小作文15—20分钟，大作文35—40分钟。先打草稿再誊写，避免大量涂改影响卷面。', 'EASY', 9, '{"weight": 3, "examFreq": "中"}'),
('写作复习方法', '背诵5—10个主题模板与高分句式；每周写2—3篇并请人或AI批改；总结自己的写作错误清单并反复修订。', 'EASY', 9, '{"weight": 5, "examFreq": "高"}'),
('卷面与书写', '卷面整洁、字迹清晰、字母大小适中、行距均匀。建议使用印刷体或半连笔体，避免过度连笔影响辨识。', 'EASY', 9, '{"weight": 3, "examFreq": "中"}');

-- === Topic 10 核心词汇 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('核心词汇总体策略', '考研英语大纲5500词，其中核心词汇约2000—2500词。需循环背诵3—5轮，结合阅读真题语境记忆，反复巩固。', 'EASY', 10, '{"weight": 5, "examFreq": "高"}'),
('词根词缀记忆法', '通过前缀(un-/dis-/pre-/re-/inter-)、词根(spect/dict/ject)、后缀(-tion/-able/-ize)拆分单词，提高记忆效率与猜词能力。', 'MEDIUM', 10, '{"weight": 5, "examFreq": "高"}'),
('高频动词组—考查与表明', 'demonstrate, illustrate, indicate, manifest, reveal, imply, suggest, signify, denote 等动词常用于学术论述与作者观点表达。', 'MEDIUM', 10, '{"weight": 5, "examFreq": "高"}'),
('高频动词组—影响与改变', 'affect, impact, influence, transform, alter, modify, undermine, reinforce, accelerate, hinder 等是阅读高频动词。', 'MEDIUM', 10, '{"weight": 5, "examFreq": "高"}'),
('高频动词组—增加与减少', 'soar, surge, escalate, plunge, plummet, decline, dwindle, shrink, expand, diminish 等用于图表描述与趋势分析。', 'MEDIUM', 10, '{"weight": 4, "examFreq": "高"}'),
('形近词辨析', 'adapt/adopt/adept、affect/effect、principal/principle、council/counsel、quiet/quite 等形近词需精确辨别词形与词义。', 'HARD', 10, '{"weight": 5, "examFreq": "高"}'),
('一词多义—policy/issue/practice', 'policy 政策/方针；issue 问题/发行/争议；practice 实践/惯例/练习/诊所。一词多义需结合上下文选义。', 'MEDIUM', 10, '{"weight": 5, "examFreq": "高"}'),
('副词后缀-ly', '-ly 副词包含方式副词与评论副词。virtually, practically, essentially, fundamentally, supposedly, allegedly, presumably 等是阅读高频。', 'MEDIUM', 10, '{"weight": 4, "examFreq": "高"}'),
('政治经济类常用词', 'democracy, parliament, congress, legislation, regulation, deregulation, monopoly, fiscal, monetary, recession, inflation, stagnation 等。', 'MEDIUM', 10, '{"weight": 4, "examFreq": "高"}'),
('教育类常用词', 'curriculum, tuition, scholarship, faculty, undergraduate, graduate, dissertation, peer, mentor, literacy 等。', 'EASY', 10, '{"weight": 4, "examFreq": "高"}'),
('科技类常用词', 'algorithm, breakthrough, innovation, paradigm, prototype, simulation, interface, automation, biometrics, surveillance 等。', 'MEDIUM', 10, '{"weight": 4, "examFreq": "高"}'),
('环境类常用词', 'sustainability, carbon emission, biodiversity, ecosystem, climate change, conservation, deforestation, renewable, pollution 等。', 'MEDIUM', 10, '{"weight": 4, "examFreq": "高"}'),
('心理类常用词', 'cognition, perception, motivation, anxiety, depression, mindset, prejudice, stereotype, empathy, resilience 等。', 'MEDIUM', 10, '{"weight": 3, "examFreq": "中"}'),
('媒体类常用词', 'journalism, broadcast, propaganda, censorship, scoop, tabloid, columnist, anchor, headline, coverage 等。', 'EASY', 10, '{"weight": 3, "examFreq": "中"}'),
('健康类常用词', 'epidemic, pandemic, vaccine, immunity, obesity, nutrition, therapy, prescription, diagnosis, syndrome 等。', 'MEDIUM', 10, '{"weight": 3, "examFreq": "中"}'),
('就业类常用词', 'recruitment, vacancy, qualification, internship, freelance, layoff, redundancy, promotion, salary, retirement 等。', 'EASY', 10, '{"weight": 4, "examFreq": "高"}'),
('抽象名词记忆', 'phenomenon, paradox, dilemma, crux, hierarchy, premise, criterion, consensus, equilibrium, integrity 等抽象名词在阅读中频繁出现。', 'HARD', 10, '{"weight": 5, "examFreq": "高"}'),
('情感态度词', 'optimistic, pessimistic, skeptical, indifferent, cautious, ambivalent, supportive, critical, neutral, objective 等是态度题选项核心。', 'MEDIUM', 10, '{"weight": 5, "examFreq": "高"}'),
('学术词汇—论证', 'argue, contend, claim, assert, refute, rebut, qualify, hypothesize, postulate, substantiate 等学术写作高频词。', 'HARD', 10, '{"weight": 4, "examFreq": "高"}'),
('短语动词高频', 'account for, attribute to, attend to, draw on, lead to, result from, give rise to, work out, look into, take on 等短语动词。', 'MEDIUM', 10, '{"weight": 5, "examFreq": "高"}'),
('熟词僻义', 'address(应对，演讲)、appreciate(意识到，感激)、claim(声称，夺去生命)、hold(持有，认为)、issue(问题，发行)等熟词在考研中常考僻义。', 'HARD', 10, '{"weight": 5, "examFreq": "高"}'),
('词汇背诵周期', '艾宾浩斯遗忘曲线下，单词在初次记忆后第1、3、7、15天复习效果最佳。每天保持50—80词新单词与200词复习。', 'EASY', 10, '{"weight": 4, "examFreq": "高"}');


-- ============================================================================
-- 政治学科内部关系（PREREQUISITE / RELATED / EXTENDS）
-- ============================================================================
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 马原内部
((SELECT id FROM knowledge_nodes WHERE title='哲学的基本问题'), (SELECT id FROM knowledge_nodes WHERE title='物质范畴及其理论意义'), 'PREREQUISITE', 1.0, '基本问题→物质观'),
((SELECT id FROM knowledge_nodes WHERE title='物质范畴及其理论意义'), (SELECT id FROM knowledge_nodes WHERE title='物质与意识的辩证关系'), 'PREREQUISITE', 1.0, '物质范畴→物质意识关系'),
((SELECT id FROM knowledge_nodes WHERE title='物质范畴及其理论意义'), (SELECT id FROM knowledge_nodes WHERE title='运动观与时空观'), 'EXTENDS', 0.9, '物质→运动'),
((SELECT id FROM knowledge_nodes WHERE title='物质与意识的辩证关系'), (SELECT id FROM knowledge_nodes WHERE title='唯物论与辩证法'), 'PREREQUISITE', 1.0, '唯物论基础→辩证法'),
((SELECT id FROM knowledge_nodes WHERE title='唯物论与辩证法'), (SELECT id FROM knowledge_nodes WHERE title='对立统一规律'), 'PREREQUISITE', 1.0, '辩证法核心'),
((SELECT id FROM knowledge_nodes WHERE title='对立统一规律'), (SELECT id FROM knowledge_nodes WHERE title='矛盾的普遍性与特殊性'), 'EXTENDS', 1.0, '对立统一→共性个性'),
((SELECT id FROM knowledge_nodes WHERE title='对立统一规律'), (SELECT id FROM knowledge_nodes WHERE title='量变质变规律'), 'RELATED', 0.8, '辩证法三大规律之一'),
((SELECT id FROM knowledge_nodes WHERE title='对立统一规律'), (SELECT id FROM knowledge_nodes WHERE title='否定之否定规律'), 'RELATED', 0.8, '辩证法三大规律之一'),
((SELECT id FROM knowledge_nodes WHERE title='唯物论与辩证法'), (SELECT id FROM knowledge_nodes WHERE title='五对基本范畴'), 'EXTENDS', 0.7, '辩证法范畴'),
((SELECT id FROM knowledge_nodes WHERE title='唯物论与辩证法'), (SELECT id FROM knowledge_nodes WHERE title='实践与认识'), 'PREREQUISITE', 1.0, '辩证法→认识论'),
((SELECT id FROM knowledge_nodes WHERE title='实践与认识'), (SELECT id FROM knowledge_nodes WHERE title='真理与价值'), 'PREREQUISITE', 1.0, '认识论→真理观'),
((SELECT id FROM knowledge_nodes WHERE title='唯物论与辩证法'), (SELECT id FROM knowledge_nodes WHERE title='社会存在与社会意识'), 'EXTENDS', 0.9, '辩证唯物→历史唯物'),
((SELECT id FROM knowledge_nodes WHERE title='社会存在与社会意识'), (SELECT id FROM knowledge_nodes WHERE title='生产力与生产关系'), 'PREREQUISITE', 1.0, '历史唯物核心规律'),
((SELECT id FROM knowledge_nodes WHERE title='生产力与生产关系'), (SELECT id FROM knowledge_nodes WHERE title='经济基础与上层建筑'), 'PREREQUISITE', 1.0, '基础→上层建筑'),
((SELECT id FROM knowledge_nodes WHERE title='经济基础与上层建筑'), (SELECT id FROM knowledge_nodes WHERE title='社会基本矛盾与社会形态更替'), 'PREREQUISITE', 1.0, '社会基本矛盾'),
((SELECT id FROM knowledge_nodes WHERE title='社会基本矛盾与社会形态更替'), (SELECT id FROM knowledge_nodes WHERE title='人民群众是历史的创造者'), 'RELATED', 0.8, '历史主体'),
((SELECT id FROM knowledge_nodes WHERE title='商品的二因素与劳动二重性'), (SELECT id FROM knowledge_nodes WHERE title='价值规律'), 'PREREQUISITE', 1.0, '商品→价值规律'),
((SELECT id FROM knowledge_nodes WHERE title='商品的二因素与劳动二重性'), (SELECT id FROM knowledge_nodes WHERE title='剩余价值理论'), 'PREREQUISITE', 1.0, '劳动二重性→剩余价值'),
((SELECT id FROM knowledge_nodes WHERE title='剩余价值理论'), (SELECT id FROM knowledge_nodes WHERE title='资本主义基本矛盾与经济危机'), 'PREREQUISITE', 1.0, '剩余价值→基本矛盾'),
((SELECT id FROM knowledge_nodes WHERE title='资本主义基本矛盾与经济危机'), (SELECT id FROM knowledge_nodes WHERE title='科学社会主义的诞生'), 'PREREQUISITE', 0.9, '资本主义矛盾→科学社会主义'),
((SELECT id FROM knowledge_nodes WHERE title='科学社会主义的诞生'), (SELECT id FROM knowledge_nodes WHERE title='共产主义远大理想'), 'EXTENDS', 0.9, '科学社会主义→共产主义');

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 毛中特内部
((SELECT id FROM knowledge_nodes WHERE title='马克思主义中国化的提出'), (SELECT id FROM knowledge_nodes WHERE title='新民主主义革命理论'), 'PREREQUISITE', 1.0, '中国化首次成果'),
((SELECT id FROM knowledge_nodes WHERE title='新民主主义革命理论'), (SELECT id FROM knowledge_nodes WHERE title='新民主主义革命三大法宝'), 'EXTENDS', 1.0, '理论→法宝'),
((SELECT id FROM knowledge_nodes WHERE title='新民主主义革命理论'), (SELECT id FROM knowledge_nodes WHERE title='农村包围城市武装夺取政权'), 'EXTENDS', 1.0, '革命道路'),
((SELECT id FROM knowledge_nodes WHERE title='新民主主义革命理论'), (SELECT id FROM knowledge_nodes WHERE title='社会主义改造理论'), 'PREREQUISITE', 1.0, '革命→改造'),
((SELECT id FROM knowledge_nodes WHERE title='社会主义改造理论'), (SELECT id FROM knowledge_nodes WHERE title='毛泽东思想活的灵魂'), 'RELATED', 0.7, '毛泽东思想体系'),
((SELECT id FROM knowledge_nodes WHERE title='毛泽东思想活的灵魂'), (SELECT id FROM knowledge_nodes WHERE title='邓小平理论的形成与主题'), 'PREREQUISITE', 1.0, '毛思想→邓理论'),
((SELECT id FROM knowledge_nodes WHERE title='邓小平理论的形成与主题'), (SELECT id FROM knowledge_nodes WHERE title='社会主义初级阶段理论'), 'PREREQUISITE', 1.0, '邓理论核心'),
((SELECT id FROM knowledge_nodes WHERE title='邓小平理论的形成与主题'), (SELECT id FROM knowledge_nodes WHERE title='"三个代表"重要思想'), 'EXTENDS', 0.9, '理论体系递进'),
((SELECT id FROM knowledge_nodes WHERE title='"三个代表"重要思想'), (SELECT id FROM knowledge_nodes WHERE title='科学发展观'), 'EXTENDS', 0.9, '理论体系递进'),
((SELECT id FROM knowledge_nodes WHERE title='科学发展观'), (SELECT id FROM knowledge_nodes WHERE title='习近平新时代中国特色社会主义思想'), 'EXTENDS', 1.0, '理论新飞跃'),
((SELECT id FROM knowledge_nodes WHERE title='习近平新时代中国特色社会主义思想'), (SELECT id FROM knowledge_nodes WHERE title='"五位一体"总体布局'), 'EXTENDS', 1.0, '总体布局'),
((SELECT id FROM knowledge_nodes WHERE title='习近平新时代中国特色社会主义思想'), (SELECT id FROM knowledge_nodes WHERE title='"四个全面"战略布局'), 'EXTENDS', 1.0, '战略布局'),
((SELECT id FROM knowledge_nodes WHERE title='习近平新时代中国特色社会主义思想'), (SELECT id FROM knowledge_nodes WHERE title='"两个一百年"奋斗目标'), 'RELATED', 0.9, '奋斗目标'),
((SELECT id FROM knowledge_nodes WHERE title='习近平新时代中国特色社会主义思想'), (SELECT id FROM knowledge_nodes WHERE title='新发展理念'), 'EXTENDS', 1.0, '发展理念'),
((SELECT id FROM knowledge_nodes WHERE title='新发展理念'), (SELECT id FROM knowledge_nodes WHERE title='共同富裕'), 'PREREQUISITE', 0.9, '共享理念→共富'),
((SELECT id FROM knowledge_nodes WHERE title='共同富裕'), (SELECT id FROM knowledge_nodes WHERE title='中国式现代化'), 'EXTENDS', 1.0, '共富→中国式现代化'),
((SELECT id FROM knowledge_nodes WHERE title='"四个全面"战略布局'), (SELECT id FROM knowledge_nodes WHERE title='全面深化改革'), 'EXTENDS', 1.0, '战略举措'),
((SELECT id FROM knowledge_nodes WHERE title='"四个全面"战略布局'), (SELECT id FROM knowledge_nodes WHERE title='全面依法治国'), 'EXTENDS', 1.0, '战略举措'),
((SELECT id FROM knowledge_nodes WHERE title='"四个全面"战略布局'), (SELECT id FROM knowledge_nodes WHERE title='全面从严治党'), 'EXTENDS', 1.0, '战略举措'),
((SELECT id FROM knowledge_nodes WHERE title='中国式现代化'), (SELECT id FROM knowledge_nodes WHERE title='全过程人民民主'), 'RELATED', 0.8, '现代化政治维度'),
((SELECT id FROM knowledge_nodes WHERE title='中国式现代化'), (SELECT id FROM knowledge_nodes WHERE title='人类命运共同体'), 'RELATED', 0.8, '中国对外贡献');

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 近代史内部
((SELECT id FROM knowledge_nodes WHERE title='鸦片战争与中国半殖民地半封建社会的开端'), (SELECT id FROM knowledge_nodes WHERE title='太平天国运动'), 'PREREQUISITE', 0.9, '近代史开端'),
((SELECT id FROM knowledge_nodes WHERE title='鸦片战争与中国半殖民地半封建社会的开端'), (SELECT id FROM knowledge_nodes WHERE title='洋务运动'), 'PREREQUISITE', 1.0, '危机→自救'),
((SELECT id FROM knowledge_nodes WHERE title='洋务运动'), (SELECT id FROM knowledge_nodes WHERE title='戊戌变法'), 'PREREQUISITE', 0.9, '自强→改良'),
((SELECT id FROM knowledge_nodes WHERE title='戊戌变法'), (SELECT id FROM knowledge_nodes WHERE title='辛亥革命'), 'PREREQUISITE', 1.0, '改良→革命'),
((SELECT id FROM knowledge_nodes WHERE title='辛亥革命'), (SELECT id FROM knowledge_nodes WHERE title='新文化运动'), 'PREREQUISITE', 1.0, '政治革命→思想革命'),
((SELECT id FROM knowledge_nodes WHERE title='新文化运动'), (SELECT id FROM knowledge_nodes WHERE title='五四运动'), 'PREREQUISITE', 1.0, '思想准备→政治运动'),
((SELECT id FROM knowledge_nodes WHERE title='五四运动'), (SELECT id FROM knowledge_nodes WHERE title='中国共产党的成立'), 'PREREQUISITE', 1.0, '运动→建党'),
((SELECT id FROM knowledge_nodes WHERE title='中国共产党的成立'), (SELECT id FROM knowledge_nodes WHERE title='国共第一次合作与大革命'), 'PREREQUISITE', 1.0, '建党→大革命'),
((SELECT id FROM knowledge_nodes WHERE title='国共第一次合作与大革命'), (SELECT id FROM knowledge_nodes WHERE title='土地革命与井冈山道路'), 'PREREQUISITE', 1.0, '失败→新路'),
((SELECT id FROM knowledge_nodes WHERE title='土地革命与井冈山道路'), (SELECT id FROM knowledge_nodes WHERE title='遵义会议'), 'PREREQUISITE', 1.0, '革命→转折'),
((SELECT id FROM knowledge_nodes WHERE title='遵义会议'), (SELECT id FROM knowledge_nodes WHERE title='抗日战争'), 'PREREQUISITE', 1.0, '转折→抗战'),
((SELECT id FROM knowledge_nodes WHERE title='抗日战争'), (SELECT id FROM knowledge_nodes WHERE title='抗日民族统一战线'), 'EXTENDS', 1.0, '抗战策略'),
((SELECT id FROM knowledge_nodes WHERE title='抗日战争'), (SELECT id FROM knowledge_nodes WHERE title='解放战争'), 'PREREQUISITE', 1.0, '抗战→解放'),
((SELECT id FROM knowledge_nodes WHERE title='解放战争'), (SELECT id FROM knowledge_nodes WHERE title='新中国成立的伟大意义'), 'PREREQUISITE', 1.0, '战争→建国'),
((SELECT id FROM knowledge_nodes WHERE title='新中国成立的伟大意义'), (SELECT id FROM knowledge_nodes WHERE title='过渡时期总路线'), 'PREREQUISITE', 1.0, '建国→过渡'),
((SELECT id FROM knowledge_nodes WHERE title='过渡时期总路线'), (SELECT id FROM knowledge_nodes WHERE title='社会主义建设道路初步探索'), 'PREREQUISITE', 1.0, '过渡→建设'),
((SELECT id FROM knowledge_nodes WHERE title='社会主义建设道路初步探索'), (SELECT id FROM knowledge_nodes WHERE title='改革开放和社会主义现代化建设新时期'), 'PREREQUISITE', 1.0, '探索→开放'),
((SELECT id FROM knowledge_nodes WHERE title='改革开放和社会主义现代化建设新时期'), (SELECT id FROM knowledge_nodes WHERE title='家庭联产承包责任制'), 'EXTENDS', 0.8, '改革具体举措'),
((SELECT id FROM knowledge_nodes WHERE title='改革开放和社会主义现代化建设新时期'), (SELECT id FROM knowledge_nodes WHERE title='社会主义市场经济体制'), 'EXTENDS', 0.9, '改革深化'),
((SELECT id FROM knowledge_nodes WHERE title='改革开放和社会主义现代化建设新时期'), (SELECT id FROM knowledge_nodes WHERE title='港澳回归与一国两制'), 'RELATED', 0.7, '统一进程'),
((SELECT id FROM knowledge_nodes WHERE title='改革开放和社会主义现代化建设新时期'), (SELECT id FROM knowledge_nodes WHERE title='中国特色社会主义进入新时代'), 'PREREQUISITE', 1.0, '改革→新时代'),
((SELECT id FROM knowledge_nodes WHERE title='中国特色社会主义进入新时代'), (SELECT id FROM knowledge_nodes WHERE title='中国共产党百年奋斗的历史经验'), 'EXTENDS', 1.0, '历史总结');

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 思修内部
((SELECT id FROM knowledge_nodes WHERE title='人生观与价值观'), (SELECT id FROM knowledge_nodes WHERE title='理想信念'), 'PREREQUISITE', 1.0, '人生观→理想'),
((SELECT id FROM knowledge_nodes WHERE title='理想信念'), (SELECT id FROM knowledge_nodes WHERE title='中国精神'), 'PREREQUISITE', 1.0, '理想→精神'),
((SELECT id FROM knowledge_nodes WHERE title='中国精神'), (SELECT id FROM knowledge_nodes WHERE title='爱国主义新时代要求'), 'EXTENDS', 1.0, '精神核心'),
((SELECT id FROM knowledge_nodes WHERE title='中国精神'), (SELECT id FROM knowledge_nodes WHERE title='改革创新精神'), 'EXTENDS', 0.9, '时代精神核心'),
((SELECT id FROM knowledge_nodes WHERE title='中国精神'), (SELECT id FROM knowledge_nodes WHERE title='社会主义核心价值观'), 'PREREQUISITE', 1.0, '精神→价值观'),
((SELECT id FROM knowledge_nodes WHERE title='社会主义核心价值观'), (SELECT id FROM knowledge_nodes WHERE title='道德的本质与功能'), 'PREREQUISITE', 1.0, '价值观→道德'),
((SELECT id FROM knowledge_nodes WHERE title='道德的本质与功能'), (SELECT id FROM knowledge_nodes WHERE title='社会主义道德建设'), 'PREREQUISITE', 1.0, '道德论→道德建设'),
((SELECT id FROM knowledge_nodes WHERE title='社会主义道德建设'), (SELECT id FROM knowledge_nodes WHERE title='中华传统美德'), 'RELATED', 0.8, '道德资源'),
((SELECT id FROM knowledge_nodes WHERE title='社会主义道德建设'), (SELECT id FROM knowledge_nodes WHERE title='革命道德'), 'RELATED', 0.8, '道德资源'),
((SELECT id FROM knowledge_nodes WHERE title='社会主义道德建设'), (SELECT id FROM knowledge_nodes WHERE title='社会公德、职业道德、家庭美德、个人品德'), 'EXTENDS', 1.0, '道德建设领域'),
((SELECT id FROM knowledge_nodes WHERE title='法的本质与特征'), (SELECT id FROM knowledge_nodes WHERE title='我国宪法基本原则'), 'PREREQUISITE', 1.0, '法学基础→宪法'),
((SELECT id FROM knowledge_nodes WHERE title='我国宪法基本原则'), (SELECT id FROM knowledge_nodes WHERE title='我国国家制度'), 'EXTENDS', 1.0, '宪法→制度'),
((SELECT id FROM knowledge_nodes WHERE title='我国宪法基本原则'), (SELECT id FROM knowledge_nodes WHERE title='我国法律体系'), 'EXTENDS', 1.0, '宪法→法律体系'),
((SELECT id FROM knowledge_nodes WHERE title='我国法律体系'), (SELECT id FROM knowledge_nodes WHERE title='民法典'), 'EXTENDS', 0.9, '法律体系核心'),
((SELECT id FROM knowledge_nodes WHERE title='我国法律体系'), (SELECT id FROM knowledge_nodes WHERE title='社会主义法治理念'), 'RELATED', 0.9, '法律体系→法治理念'),
((SELECT id FROM knowledge_nodes WHERE title='社会主义法治理念'), (SELECT id FROM knowledge_nodes WHERE title='权利与义务'), 'PREREQUISITE', 1.0, '法治→权利义务'),
((SELECT id FROM knowledge_nodes WHERE title='权利与义务'), (SELECT id FROM knowledge_nodes WHERE title='依法行使权利与履行义务'), 'EXTENDS', 1.0, '权利义务→实践'),
((SELECT id FROM knowledge_nodes WHERE title='社会主义法治理念'), (SELECT id FROM knowledge_nodes WHERE title='法治思维'), 'EXTENDS', 1.0, '法治理念→法治思维'),
((SELECT id FROM knowledge_nodes WHERE title='社会主义道德建设'), (SELECT id FROM knowledge_nodes WHERE title='道德与法律的关系'), 'RELATED', 0.9, '德法关系'),
((SELECT id FROM knowledge_nodes WHERE title='法治思维'), (SELECT id FROM knowledge_nodes WHERE title='道德与法律的关系'), 'RELATED', 0.8, '德法关系');

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 形势与政策内部
((SELECT id FROM knowledge_nodes WHERE title='中国式现代化的中国特色'), (SELECT id FROM knowledge_nodes WHERE title='高质量发展'), 'PREREQUISITE', 1.0, '现代化→高质量'),
((SELECT id FROM knowledge_nodes WHERE title='高质量发展'), (SELECT id FROM knowledge_nodes WHERE title='新质生产力'), 'EXTENDS', 1.0, '高质量→新质生产力'),
((SELECT id FROM knowledge_nodes WHERE title='新质生产力'), (SELECT id FROM knowledge_nodes WHERE title='科技自立自强'), 'PREREQUISITE', 1.0, '新质生产力→科技'),
((SELECT id FROM knowledge_nodes WHERE title='科技自立自强'), (SELECT id FROM knowledge_nodes WHERE title='数字中国建设'), 'EXTENDS', 0.9, '科技→数字中国'),
((SELECT id FROM knowledge_nodes WHERE title='中国式现代化的中国特色'), (SELECT id FROM knowledge_nodes WHERE title='乡村振兴战略'), 'EXTENDS', 0.8, '现代化→乡村'),
((SELECT id FROM knowledge_nodes WHERE title='乡村振兴战略'), (SELECT id FROM knowledge_nodes WHERE title='共同富裕示范区'), 'RELATED', 0.8, '城乡协调'),
((SELECT id FROM knowledge_nodes WHERE title='中国式现代化的中国特色'), (SELECT id FROM knowledge_nodes WHERE title='碳达峰碳中和'), 'EXTENDS', 0.9, '现代化→双碳'),
((SELECT id FROM knowledge_nodes WHERE title='碳达峰碳中和'), (SELECT id FROM knowledge_nodes WHERE title='绿水青山就是金山银山'), 'PREREQUISITE', 1.0, '生态理念'),
((SELECT id FROM knowledge_nodes WHERE title='全过程人民民主的理论与实践'), (SELECT id FROM knowledge_nodes WHERE title='全过程人民民主与协商民主'), 'EXTENDS', 0.9, '民主形态'),
((SELECT id FROM knowledge_nodes WHERE title='全面深化改革新部署'), (SELECT id FROM knowledge_nodes WHERE title='高质量发展'), 'PREREQUISITE', 0.9, '改革→发展'),
((SELECT id FROM knowledge_nodes WHERE title='全面深化改革新部署'), (SELECT id FROM knowledge_nodes WHERE title='全过程从严治党'), 'RELATED', 0.8, '改革+从严'),
((SELECT id FROM knowledge_nodes WHERE title='人类命运共同体的实践'), (SELECT id FROM knowledge_nodes WHERE title='一带一路高质量发展'), 'EXTENDS', 1.0, '命运共同体平台'),
((SELECT id FROM knowledge_nodes WHERE title='人类命运共同体的实践'), (SELECT id FROM knowledge_nodes WHERE title='中美关系'), 'RELATED', 0.8, '大国关系'),
((SELECT id FROM knowledge_nodes WHERE title='总体国家安全观'), (SELECT id FROM knowledge_nodes WHERE title='粮食安全与能源安全'), 'EXTENDS', 0.9, '安全分领域'),
((SELECT id FROM knowledge_nodes WHERE title='总体国家安全观'), (SELECT id FROM knowledge_nodes WHERE title='两岸关系与祖国统一'), 'RELATED', 0.7, '政治安全'),
((SELECT id FROM knowledge_nodes WHERE title='高质量发展'), (SELECT id FROM knowledge_nodes WHERE title='民营经济高质量发展'), 'EXTENDS', 0.8, '高质量→民营经济'),
((SELECT id FROM knowledge_nodes WHERE title='中国式现代化的中国特色'), (SELECT id FROM knowledge_nodes WHERE title='文化自信与中华优秀传统文化'), 'EXTENDS', 0.9, '现代化→文化');

-- 政治跨 topic 关联
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='矛盾的普遍性与特殊性'), (SELECT id FROM knowledge_nodes WHERE title='马克思主义中国化的提出'), 'RELATED', 1.0, '哲学依据'),
((SELECT id FROM knowledge_nodes WHERE title='生产力与生产关系'), (SELECT id FROM knowledge_nodes WHERE title='改革开放和社会主义现代化建设新时期'), 'RELATED', 1.0, '改革哲学依据'),
((SELECT id FROM knowledge_nodes WHERE title='人民群众是历史的创造者'), (SELECT id FROM knowledge_nodes WHERE title='全过程人民民主'), 'RELATED', 1.0, '群众史观→民主'),
((SELECT id FROM knowledge_nodes WHERE title='中国特色社会主义进入新时代'), (SELECT id FROM knowledge_nodes WHERE title='中国式现代化的中国特色'), 'RELATED', 1.0, '新时代→现代化'),
((SELECT id FROM knowledge_nodes WHERE title='社会主义核心价值观'), (SELECT id FROM knowledge_nodes WHERE title='文化自信与中华优秀传统文化'), 'RELATED', 0.9, '价值观→文化');


-- ============================================================================
-- 英语一学科内部关系
-- ============================================================================
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 阅读内部
((SELECT id FROM knowledge_nodes WHERE title='阅读理解题型分类'), (SELECT id FROM knowledge_nodes WHERE title='细节题解题策略'), 'EXTENDS', 1.0, '题型→细节'),
((SELECT id FROM knowledge_nodes WHERE title='阅读理解题型分类'), (SELECT id FROM knowledge_nodes WHERE title='阅读理解推断题解题策略'), 'EXTENDS', 1.0, '题型→推断'),
((SELECT id FROM knowledge_nodes WHERE title='阅读理解题型分类'), (SELECT id FROM knowledge_nodes WHERE title='主旨大意题'), 'EXTENDS', 1.0, '题型→主旨'),
((SELECT id FROM knowledge_nodes WHERE title='阅读理解题型分类'), (SELECT id FROM knowledge_nodes WHERE title='词义猜测题'), 'EXTENDS', 1.0, '题型→词义'),
((SELECT id FROM knowledge_nodes WHERE title='阅读理解题型分类'), (SELECT id FROM knowledge_nodes WHERE title='态度题与作者观点'), 'EXTENDS', 1.0, '题型→态度'),
((SELECT id FROM knowledge_nodes WHERE title='阅读理解题型分类'), (SELECT id FROM knowledge_nodes WHERE title='写作目的题'), 'EXTENDS', 1.0, '题型→目的'),
((SELECT id FROM knowledge_nodes WHERE title='阅读定位策略'), (SELECT id FROM knowledge_nodes WHERE title='细节题解题策略'), 'PREREQUISITE', 1.0, '定位是细节题前提'),
((SELECT id FROM knowledge_nodes WHERE title='转折信号词'), (SELECT id FROM knowledge_nodes WHERE title='阅读理解推断题解题策略'), 'RELATED', 0.9, '转折→命题点'),
((SELECT id FROM knowledge_nodes WHERE title='因果关系信号词'), (SELECT id FROM knowledge_nodes WHERE title='阅读理解推断题解题策略'), 'RELATED', 0.8, '因果→推断'),
((SELECT id FROM knowledge_nodes WHERE title='让步关系信号词'), (SELECT id FROM knowledge_nodes WHERE title='态度题与作者观点'), 'RELATED', 0.8, '让步→态度'),
((SELECT id FROM knowledge_nodes WHERE title='选项常见干扰类型'), (SELECT id FROM knowledge_nodes WHERE title='绝对化与相对化'), 'EXTENDS', 0.9, '干扰类型→绝对化'),
((SELECT id FROM knowledge_nodes WHERE title='阅读理解题型分类'), (SELECT id FROM knowledge_nodes WHERE title='阅读Part B 七选五'), 'RELATED', 0.7, '题型扩展'),
((SELECT id FROM knowledge_nodes WHERE title='阅读Part B 七选五'), (SELECT id FROM knowledge_nodes WHERE title='阅读Part B 标题搭配'), 'RELATED', 0.7, 'Part B 题型'),
((SELECT id FROM knowledge_nodes WHERE title='议论文文章结构'), (SELECT id FROM knowledge_nodes WHERE title='主旨大意题'), 'PREREQUISITE', 0.8, '结构→主旨'),
((SELECT id FROM knowledge_nodes WHERE title='阅读理解题型分类'), (SELECT id FROM knowledge_nodes WHERE title='阅读时间分配'), 'RELATED', 0.6, '题型→时间'),
((SELECT id FROM knowledge_nodes WHERE title='阅读复习方法'), (SELECT id FROM knowledge_nodes WHERE title='近十年阅读高频话题'), 'RELATED', 0.6, '复习+话题');

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 完形内部
((SELECT id FROM knowledge_nodes WHERE title='完形填空考查目标'), (SELECT id FROM knowledge_nodes WHERE title='完形填空解题流程'), 'PREREQUISITE', 1.0, '考点→流程'),
((SELECT id FROM knowledge_nodes WHERE title='完形填空解题流程'), (SELECT id FROM knowledge_nodes WHERE title='完形填空逻辑词'), 'EXTENDS', 1.0, '流程→逻辑词'),
((SELECT id FROM knowledge_nodes WHERE title='完形填空逻辑词'), (SELECT id FROM knowledge_nodes WHERE title='连接副词'), 'EXTENDS', 0.9, '逻辑→连接副词'),
((SELECT id FROM knowledge_nodes WHERE title='完形填空考查目标'), (SELECT id FROM knowledge_nodes WHERE title='词汇辨析—近义动词'), 'EXTENDS', 1.0, '词汇辨析'),
((SELECT id FROM knowledge_nodes WHERE title='词汇辨析—近义动词'), (SELECT id FROM knowledge_nodes WHERE title='词汇辨析—近义名词'), 'RELATED', 0.8, '近义辨析'),
((SELECT id FROM knowledge_nodes WHERE title='词汇辨析—近义名词'), (SELECT id FROM knowledge_nodes WHERE title='词汇辨析—近义形容词'), 'RELATED', 0.8, '近义辨析'),
((SELECT id FROM knowledge_nodes WHERE title='完形填空考查目标'), (SELECT id FROM knowledge_nodes WHERE title='固定搭配与短语动词'), 'EXTENDS', 1.0, '搭配考点'),
((SELECT id FROM knowledge_nodes WHERE title='固定搭配与短语动词'), (SELECT id FROM knowledge_nodes WHERE title='介词搭配'), 'RELATED', 0.8, '搭配类型'),
((SELECT id FROM knowledge_nodes WHERE title='完形上下文复现'), (SELECT id FROM knowledge_nodes WHERE title='完形语篇衔接'), 'RELATED', 0.9, '复现→衔接'),
((SELECT id FROM knowledge_nodes WHERE title='完形首段重要性'), (SELECT id FROM knowledge_nodes WHERE title='完形末段重要性'), 'RELATED', 0.7, '首末段呼应'),
((SELECT id FROM knowledge_nodes WHERE title='完形填空解题流程'), (SELECT id FROM knowledge_nodes WHERE title='完形排除法'), 'EXTENDS', 0.8, '解题→排除'),
((SELECT id FROM knowledge_nodes WHERE title='完形填空解题流程'), (SELECT id FROM knowledge_nodes WHERE title='完形复习方法'), 'RELATED', 0.6, '解题→复习');

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 翻译内部
((SELECT id FROM knowledge_nodes WHERE title='英译汉总体策略'), (SELECT id FROM knowledge_nodes WHERE title='长难句拆解—名词性从句'), 'EXTENDS', 1.0, '策略→从句'),
((SELECT id FROM knowledge_nodes WHERE title='英译汉总体策略'), (SELECT id FROM knowledge_nodes WHERE title='长难句拆解—定语从句'), 'EXTENDS', 1.0, '策略→定语从句'),
((SELECT id FROM knowledge_nodes WHERE title='英译汉总体策略'), (SELECT id FROM knowledge_nodes WHERE title='长难句拆解—状语从句'), 'EXTENDS', 1.0, '策略→状语从句'),
((SELECT id FROM knowledge_nodes WHERE title='英译汉总体策略'), (SELECT id FROM knowledge_nodes WHERE title='长难句拆解—非谓语动词'), 'EXTENDS', 1.0, '策略→非谓语'),
((SELECT id FROM knowledge_nodes WHERE title='长难句拆解—定语从句'), (SELECT id FROM knowledge_nodes WHERE title='语序调整'), 'PREREQUISITE', 0.9, '从句→语序'),
((SELECT id FROM knowledge_nodes WHERE title='被动语态翻译'), (SELECT id FROM knowledge_nodes WHERE title='转换法'), 'RELATED', 0.8, '被动→转换'),
((SELECT id FROM knowledge_nodes WHERE title='抽象名词具体化'), (SELECT id FROM knowledge_nodes WHERE title='转换法'), 'RELATED', 0.9, '抽象→转换'),
((SELECT id FROM knowledge_nodes WHERE title='词义引申与选择'), (SELECT id FROM knowledge_nodes WHERE title='增词法与减词法'), 'RELATED', 0.7, '词义+增减'),
((SELECT id FROM knowledge_nodes WHERE title='正反译法'), (SELECT id FROM knowledge_nodes WHERE title='词义引申与选择'), 'RELATED', 0.7, '词义处理'),
((SELECT id FROM knowledge_nodes WHERE title='插入语处理'), (SELECT id FROM knowledge_nodes WHERE title='语序调整'), 'RELATED', 0.7, '插入→语序'),
((SELECT id FROM knowledge_nodes WHERE title='代词回指翻译'), (SELECT id FROM knowledge_nodes WHERE title='增词法与减词法'), 'RELATED', 0.6, '代词→增词'),
((SELECT id FROM knowledge_nodes WHERE title='比较结构翻译'), (SELECT id FROM knowledge_nodes WHERE title='强调句与倒装句'), 'RELATED', 0.6, '特殊句式'),
((SELECT id FROM knowledge_nodes WHERE title='翻译评分标准'), (SELECT id FROM knowledge_nodes WHERE title='翻译常见失分点'), 'RELATED', 0.9, '评分→失分'),
((SELECT id FROM knowledge_nodes WHERE title='英译汉总体策略'), (SELECT id FROM knowledge_nodes WHERE title='翻译复习方法'), 'RELATED', 0.7, '策略→复习');

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 写作内部
((SELECT id FROM knowledge_nodes WHERE title='写作总体要求'), (SELECT id FROM knowledge_nodes WHERE title='小作文—书信类'), 'EXTENDS', 1.0, '总体→书信'),
((SELECT id FROM knowledge_nodes WHERE title='写作总体要求'), (SELECT id FROM knowledge_nodes WHERE title='小作文—通知告示'), 'EXTENDS', 0.8, '总体→通知'),
((SELECT id FROM knowledge_nodes WHERE title='写作总体要求'), (SELECT id FROM knowledge_nodes WHERE title='小作文—摘要'), 'EXTENDS', 0.7, '总体→摘要'),
((SELECT id FROM knowledge_nodes WHERE title='小作文—书信类'), (SELECT id FROM knowledge_nodes WHERE title='小作文模板—建议信'), 'EXTENDS', 1.0, '书信→建议信'),
((SELECT id FROM knowledge_nodes WHERE title='写作总体要求'), (SELECT id FROM knowledge_nodes WHERE title='大作文—图表类开头段模板'), 'EXTENDS', 1.0, '总体→图表'),
((SELECT id FROM knowledge_nodes WHERE title='大作文—图表类开头段模板'), (SELECT id FROM knowledge_nodes WHERE title='大作文图表类开头段模板'), 'RELATED', 0.9, '开头段细化'),
((SELECT id FROM knowledge_nodes WHERE title='大作文图表类开头段模板'), (SELECT id FROM knowledge_nodes WHERE title='大作文图表类主体段'), 'PREREQUISITE', 1.0, '开头→主体'),
((SELECT id FROM knowledge_nodes WHERE title='大作文图表类主体段'), (SELECT id FROM knowledge_nodes WHERE title='大作文图表类结尾段'), 'PREREQUISITE', 1.0, '主体→结尾'),
((SELECT id FROM knowledge_nodes WHERE title='写作总体要求'), (SELECT id FROM knowledge_nodes WHERE title='大作文—图画类'), 'EXTENDS', 1.0, '总体→图画'),
((SELECT id FROM knowledge_nodes WHERE title='大作文—图画类'), (SELECT id FROM knowledge_nodes WHERE title='大作文图画类描述段'), 'EXTENDS', 1.0, '图画→描述段'),
((SELECT id FROM knowledge_nodes WHERE title='大作文亮点句式'), (SELECT id FROM knowledge_nodes WHERE title='大作文常见衔接词'), 'RELATED', 0.9, '句式+衔接'),
((SELECT id FROM knowledge_nodes WHERE title='大作文图表类主体段'), (SELECT id FROM knowledge_nodes WHERE title='大作文常考主题—文化'), 'RELATED', 0.7, '主题积累'),
((SELECT id FROM knowledge_nodes WHERE title='大作文图表类主体段'), (SELECT id FROM knowledge_nodes WHERE title='大作文常考主题—青年'), 'RELATED', 0.7, '主题积累'),
((SELECT id FROM knowledge_nodes WHERE title='大作文图表类主体段'), (SELECT id FROM knowledge_nodes WHERE title='大作文常考主题—环境与科技'), 'RELATED', 0.7, '主题积累'),
((SELECT id FROM knowledge_nodes WHERE title='写作避免低级错误'), (SELECT id FROM knowledge_nodes WHERE title='卷面与书写'), 'RELATED', 0.8, '细节抓分'),
((SELECT id FROM knowledge_nodes WHERE title='写作字数与篇幅'), (SELECT id FROM knowledge_nodes WHERE title='写作时间分配'), 'RELATED', 0.7, '字数+时间'),
((SELECT id FROM knowledge_nodes WHERE title='写作总体要求'), (SELECT id FROM knowledge_nodes WHERE title='写作复习方法'), 'RELATED', 0.6, '总体→复习');

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 词汇内部
((SELECT id FROM knowledge_nodes WHERE title='核心词汇总体策略'), (SELECT id FROM knowledge_nodes WHERE title='词根词缀记忆法'), 'EXTENDS', 1.0, '策略→词根'),
((SELECT id FROM knowledge_nodes WHERE title='核心词汇总体策略'), (SELECT id FROM knowledge_nodes WHERE title='词汇背诵周期'), 'RELATED', 0.9, '策略→周期'),
((SELECT id FROM knowledge_nodes WHERE title='高频动词组—考查与表明'), (SELECT id FROM knowledge_nodes WHERE title='高频动词组—影响与改变'), 'RELATED', 0.8, '高频动词分组'),
((SELECT id FROM knowledge_nodes WHERE title='高频动词组—影响与改变'), (SELECT id FROM knowledge_nodes WHERE title='高频动词组—增加与减少'), 'RELATED', 0.8, '高频动词分组'),
((SELECT id FROM knowledge_nodes WHERE title='形近词辨析'), (SELECT id FROM knowledge_nodes WHERE title='一词多义—policy/issue/practice'), 'RELATED', 0.8, '辨析与多义'),
((SELECT id FROM knowledge_nodes WHERE title='副词后缀-ly'), (SELECT id FROM knowledge_nodes WHERE title='情感态度词'), 'RELATED', 0.7, '副词→态度'),
((SELECT id FROM knowledge_nodes WHERE title='政治经济类常用词'), (SELECT id FROM knowledge_nodes WHERE title='科技类常用词'), 'RELATED', 0.6, '主题词汇'),
((SELECT id FROM knowledge_nodes WHERE title='教育类常用词'), (SELECT id FROM knowledge_nodes WHERE title='就业类常用词'), 'RELATED', 0.7, '主题词汇'),
((SELECT id FROM knowledge_nodes WHERE title='环境类常用词'), (SELECT id FROM knowledge_nodes WHERE title='科技类常用词'), 'RELATED', 0.6, '主题词汇'),
((SELECT id FROM knowledge_nodes WHERE title='心理类常用词'), (SELECT id FROM knowledge_nodes WHERE title='媒体类常用词'), 'RELATED', 0.5, '主题词汇'),
((SELECT id FROM knowledge_nodes WHERE title='抽象名词记忆'), (SELECT id FROM knowledge_nodes WHERE title='学术词汇—论证'), 'RELATED', 0.8, '学术词汇'),
((SELECT id FROM knowledge_nodes WHERE title='短语动词高频'), (SELECT id FROM knowledge_nodes WHERE title='熟词僻义'), 'RELATED', 0.7, '词汇深化'),
((SELECT id FROM knowledge_nodes WHERE title='情感态度词'), (SELECT id FROM knowledge_nodes WHERE title='态度题与作者观点'), 'PREREQUISITE', 0.9, '词汇→阅读应用');

-- 英语跨 topic 关联
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='核心词汇总体策略'), (SELECT id FROM knowledge_nodes WHERE title='阅读理解题型分类'), 'PREREQUISITE', 1.0, '词汇→阅读基础'),
((SELECT id FROM knowledge_nodes WHERE title='核心词汇总体策略'), (SELECT id FROM knowledge_nodes WHERE title='完形填空考查目标'), 'PREREQUISITE', 1.0, '词汇→完形基础'),
((SELECT id FROM knowledge_nodes WHERE title='长难句拆解—定语从句'), (SELECT id FROM knowledge_nodes WHERE title='阅读理解题型分类'), 'PREREQUISITE', 0.9, '长难句→阅读'),
((SELECT id FROM knowledge_nodes WHERE title='大作文常见衔接词'), (SELECT id FROM knowledge_nodes WHERE title='完形填空逻辑词'), 'RELATED', 0.7, '衔接词共通'),
((SELECT id FROM knowledge_nodes WHERE title='抽象名词记忆'), (SELECT id FROM knowledge_nodes WHERE title='抽象名词具体化'), 'PREREQUISITE', 0.9, '词汇→翻译'),
((SELECT id FROM knowledge_nodes WHERE title='议论文文章结构'), (SELECT id FROM knowledge_nodes WHERE title='大作文图表类主体段'), 'RELATED', 0.8, '阅读结构→写作借鉴');


-- ============================================================================
-- 跨学科 CROSS_SUBJECT 关联（思维方法迁移、内容呼应）
-- ============================================================================
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='对立统一规律'), (SELECT id FROM knowledge_nodes WHERE title='长难句拆解—状语从句'), 'CROSS_SUBJECT', 0.6, '矛盾分析法迁移到长难句让步—主张结构'),
((SELECT id FROM knowledge_nodes WHERE title='矛盾的普遍性与特殊性'), (SELECT id FROM knowledge_nodes WHERE title='词汇辨析—近义动词'), 'CROSS_SUBJECT', 0.5, '共性个性思维迁移到近义辨析'),
((SELECT id FROM knowledge_nodes WHERE title='实践与认识'), (SELECT id FROM knowledge_nodes WHERE title='阅读复习方法'), 'CROSS_SUBJECT', 0.6, '实践—认识—再实践与刷题—总结—再练'),
((SELECT id FROM knowledge_nodes WHERE title='文化自信与中华优秀传统文化'), (SELECT id FROM knowledge_nodes WHERE title='大作文常考主题—文化'), 'CROSS_SUBJECT', 0.8, '政治热点为英语写作提供素材'),
((SELECT id FROM knowledge_nodes WHERE title='中国式现代化'), (SELECT id FROM knowledge_nodes WHERE title='大作文常考主题—青年'), 'CROSS_SUBJECT', 0.7, '现代化议题与青年责任写作'),
((SELECT id FROM knowledge_nodes WHERE title='碳达峰碳中和'), (SELECT id FROM knowledge_nodes WHERE title='大作文常考主题—环境与科技'), 'CROSS_SUBJECT', 0.8, '双碳议题为环境作文素材');
