-- ============================================================================
-- V8: 数学一三大模块完整考点 + 408 四大模块补充
-- ----------------------------------------------------------------------------
-- 数学一:    高等数学(11) / 线性代数(12) / 概率统计(13) -- 全新种子
-- 408 补充:  数据结构(14) / 组成原理(15) / 操作系统(16) / 计算机网络(17)
--           -- 仅补 V2 未覆盖的真实大纲考点, 不与 V2 重复 title
-- 公式说明: 全部纯文本 + Unicode 数学符号, 不使用 LaTeX (前端无渲染器)
-- ============================================================================

-- === topic_11 高等数学 (数学一) ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('函数与极限', '函数 y=f(x) 描述变量映射关系。极限思想是高数核心: lim[x→x₀]f(x)=A 表示当 x 充分接近 x₀ 时 f(x) 任意接近 A。常用结论: lim[x→0]sinx/x=1, lim[x→∞](1+1/x)^x=e。掌握 ε-δ 定义、左右极限、极限存在的充要条件(左右极限相等且等于 A)。', 'EASY', 11, '{"weight": 5, "examFreq": "高"}'),
('无穷小与无穷大', '无穷小: lim f(x)=0; 无穷大: lim |f(x)|=+∞。两者倒数关系: 1/无穷小=无穷大。无穷小的比较: 高阶 o(·)、同阶、等价 ~。常用等价无穷小(x→0): sinx~x, tanx~x, 1-cosx~x²/2, eˣ-1~x, ln(1+x)~x, (1+x)^α-1~αx。', 'MEDIUM', 11, '{"weight": 5, "examFreq": "高"}'),
('函数连续性', '函数 f(x) 在 x₀ 连续: lim[x→x₀]f(x)=f(x₀)。间断点分类: 第一类(可去/跳跃, 左右极限存在), 第二类(无穷/振荡)。闭区间连续函数性质: 有界性、最值定理、零点定理、介值定理。', 'MEDIUM', 11, '{"weight": 4, "examFreq": "高"}'),
('导数定义', '导数定义 f''(x₀)=lim[Δx→0](f(x₀+Δx)-f(x₀))/Δx, 几何意义为切线斜率, 物理意义为瞬时变化率。可导必连续, 连续不一定可导。左右导数相等是可导的充要条件。', 'EASY', 11, '{"weight": 5, "examFreq": "高"}'),
('求导法则', '四则: (u±v)''=u''±v'', (uv)''=u''v+uv'', (u/v)''=(u''v-uv'')/v²。复合函数链式法则: dy/dx=(dy/du)·(du/dx)。反函数: dy/dx=1/(dx/dy)。隐函数求导对方程两边同时对 x 求导。参数方程 dy/dx=φ''(t)/ψ''(t)。', 'MEDIUM', 11, '{"weight": 5, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('高阶导数', '二阶导数 f''''(x)=(f''(x))''。莱布尼茨公式: (uv)^(n)=Σ C(n,k)·u^(n-k)·v^(k)。常用 n 阶导: (sinx)^(n)=sin(x+nπ/2), (eˣ)^(n)=eˣ, (x^a)^(n)=a(a-1)…(a-n+1)x^(a-n)。', 'MEDIUM', 11, '{"weight": 3, "examFreq": "中"}'),
('微分', '函数 f(x) 在 x₀ 处可微: Δy=A·Δx+o(Δx), dy=f''(x)dx。微分与导数等价。一阶微分形式不变性: 无论 x 是自变量还是中间变量, dy=f''(u)du 形式相同。', 'EASY', 11, '{"weight": 3, "examFreq": "中"}'),
('微分中值定理', '罗尔定理: f 在[a,b]连续, (a,b)可导, f(a)=f(b), 则存在 ξ∈(a,b) 使 f''(ξ)=0。拉格朗日中值定理: f(b)-f(a)=f''(ξ)(b-a)。柯西中值定理: 两函数比的形式。是证明不等式与等式的核心工具。', 'HARD', 11, '{"weight": 5, "examFreq": "高"}'),
('洛必达法则', '处理 0/0 或 ∞/∞ 型未定式: lim f(x)/g(x)=lim f''(x)/g''(x) (在条件成立时)。其他未定式 0·∞、∞-∞、0⁰、1^∞、∞⁰ 需先化为 0/0 或 ∞/∞ 形式。注意: 不能反复滥用, 不收敛不代表原极限不存在。', 'MEDIUM', 11, '{"weight": 5, "examFreq": "高"}'),
('泰勒公式', 'f(x)=Σ f^(k)(x₀)(x-x₀)^k/k! + Rₙ(x)。佩亚诺余项: Rₙ=o((x-x₀)ⁿ)。拉格朗日余项: Rₙ=f^(n+1)(ξ)(x-x₀)^(n+1)/(n+1)!。麦克劳林公式 x₀=0。常用展开: eˣ, sinx, cosx, ln(1+x), (1+x)^α。', 'HARD', 11, '{"weight": 5, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('单调性与极值', 'f''(x)>0 单增, f''(x)<0 单减。极值必要条件: 驻点 f''(x₀)=0 或不可导。第一充分条件: f'' 变号; 第二充分条件: f''''(x₀)<0 极大, >0 极小。', 'MEDIUM', 11, '{"weight": 4, "examFreq": "高"}'),
('凹凸性与拐点', 'f''''(x)>0 函数凹(下凸), f''''(x)<0 函数凸(上凸)。拐点: 凹凸性改变的点, f''''=0 或 f'''' 不存在。利用一阶/二阶导可作出函数图形。', 'MEDIUM', 11, '{"weight": 3, "examFreq": "中"}'),
('不定积分', '∫f(x)dx=F(x)+C, 其中 F''=f。基本积分公式 + 第一类换元(凑微分) + 第二类换元(三角代换) + 分部积分 ∫udv=uv-∫vdu。有理函数积分: 部分分式分解。', 'MEDIUM', 11, '{"weight": 5, "examFreq": "高"}'),
('定积分', '定积分定义 ∫[a→b]f(x)dx=lim Σf(ξᵢ)Δxᵢ。可积条件: 连续/有限间断/单调有界。性质: 线性性、区间可加性、保号性、估值定理、积分中值定理。牛顿-莱布尼茨公式联系定积分与原函数。', 'MEDIUM', 11, '{"weight": 5, "examFreq": "高"}'),
('变限积分', 'F(x)=∫[a→x]f(t)dt 是 f 的一个原函数, F''(x)=f(x)。一般形式 d/dx ∫[φ(x)→ψ(x)]f(t)dt = f(ψ(x))ψ''(x) - f(φ(x))φ''(x)。是高考必出考点。', 'HARD', 11, '{"weight": 4, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('反常积分', '无穷区间 ∫[a→+∞]f(x)dx 与无界函数 ∫[a→b]f(x)dx (瑕点) 的积分。比较判别法、p-积分: ∫[1→+∞]1/xᵖ dx 当 p>1 收敛。Γ 函数: Γ(s)=∫[0→+∞] x^(s-1)e^(-x)dx, Γ(n+1)=n!。', 'HARD', 11, '{"weight": 3, "examFreq": "中"}'),
('定积分应用', '几何应用: 平面图形面积 ∫|f-g|dx, 旋转体体积 V=π∫f²dx (绕x轴), 弧长 L=∫√(1+f''²)dx。物理应用: 变力做功、压力、引力、质心。', 'MEDIUM', 11, '{"weight": 4, "examFreq": "高"}'),
('多元函数极限与连续', 'f(x,y) 在点 P₀(x₀,y₀) 极限存在要求沿任意路径趋近极限相等。不连续点常通过两条不同路径趋近时极限不等来判断。多元函数中"可微"是更强的条件。', 'MEDIUM', 11, '{"weight": 3, "examFreq": "中"}'),
('偏导数', '∂f/∂x = lim[Δx→0](f(x+Δx,y)-f(x,y))/Δx。求 ∂f/∂x 时把 y 视为常数。高阶偏导: ∂²f/∂x∂y。当二阶混合偏导连续时, ∂²f/∂x∂y=∂²f/∂y∂x。', 'MEDIUM', 11, '{"weight": 5, "examFreq": "高"}'),
('全微分', 'dz=∂z/∂x·dx+∂z/∂y·dy。可微的充分条件: 偏导连续。可微 ⇒ 偏导存在 + 连续, 但偏导存在不一定可微。', 'MEDIUM', 11, '{"weight": 4, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('多元复合函数求导', '链式法则: z=f(u,v), u=u(x,y), v=v(x,y), 则 ∂z/∂x = ∂f/∂u·∂u/∂x + ∂f/∂v·∂v/∂x。一元中间变量与多元中间变量有不同写法。', 'HARD', 11, '{"weight": 5, "examFreq": "高"}'),
('多元函数极值', '必要条件: ∂f/∂x=∂f/∂y=0(驻点)。充分条件 AC-B²>0 且 A<0 极大, A>0 极小; AC-B²<0 不是极值; AC-B²=0 不能判定。条件极值用拉格朗日乘数法 L=f+λg。', 'HARD', 11, '{"weight": 5, "examFreq": "高"}'),
('二重积分', '∬f(x,y)dσ 表示曲顶柱体体积。直角坐标系化为累次积分: 先 y 后 x 或先 x 后 y。极坐标系: ∬f(rcosθ,rsinθ)·r·drdθ 适合圆形/扇形区域。', 'MEDIUM', 11, '{"weight": 5, "examFreq": "高"}'),
('三重积分', '∭f(x,y,z)dV 直角/柱面/球面三种坐标。柱面: dV=r·dr·dθ·dz; 球面: dV=ρ²sinφ·dρ·dφ·dθ。', 'HARD', 11, '{"weight": 4, "examFreq": "高"}'),
('第一类曲线积分', '∫[L]f(x,y)ds 对弧长积分。L 由参数方程 x=φ(t),y=ψ(t) 给出时, ds=√(φ''²+ψ''²)dt。具有对称性: 关于 y 轴对称且 f 是 x 的奇函数则积分为 0。', 'HARD', 11, '{"weight": 3, "examFreq": "中"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('第二类曲线积分', '∫[L]Pdx+Qdy 对坐标积分, 与方向有关。格林公式: ∮[L]Pdx+Qdy = ∬[D](∂Q/∂x-∂P/∂y)dxdy(L 为 D 的正向边界)。曲线积分与路径无关 ⇔ ∂P/∂y=∂Q/∂x。', 'HARD', 11, '{"weight": 5, "examFreq": "高"}'),
('第一类曲面积分', '∬[Σ]f(x,y,z)dS 对面积积分, 与方向无关。投影到 xOy 面: dS=√(1+z_x²+z_y²)dxdy。常用对称性化简。', 'HARD', 11, '{"weight": 3, "examFreq": "中"}'),
('第二类曲面积分', '∬[Σ]Pdydz+Qdzdx+Rdxdy 对坐标积分, 与曲面侧有关。高斯公式: ∯[Σ外]…dS=∭[Ω](∂P/∂x+∂Q/∂y+∂R/∂z)dV。斯托克斯公式联系曲面积分与曲线积分。', 'HARD', 11, '{"weight": 4, "examFreq": "高"}'),
('数项级数收敛性', 'Σuₙ 收敛 ⇔ 部分和数列 {Sₙ} 收敛。必要条件 lim uₙ=0(不充分)。正项级数: 比较判别法、比值判别法 lim uₙ₊₁/uₙ、根值判别法 lim ⁿ√uₙ。p-级数 Σ1/nᵖ 当 p>1 收敛。', 'MEDIUM', 11, '{"weight": 5, "examFreq": "高"}'),
('交错级数与绝对收敛', '莱布尼茨判别法: 单调递减且 lim uₙ=0, 则交错级数收敛。绝对收敛 Σ|uₙ| 收敛 ⇒ 原级数收敛。条件收敛: 收敛但不绝对收敛(如 Σ(-1)ⁿ/n)。', 'MEDIUM', 11, '{"weight": 4, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('幂级数', 'Σaₙxⁿ 收敛半径 R=1/lim|aₙ₊₁/aₙ| 或 1/lim ⁿ√|aₙ|。在 (-R,R) 内绝对收敛, 端点单独讨论。和函数性质: 在收敛区间内可逐项求导和积分。', 'HARD', 11, '{"weight": 5, "examFreq": "高"}'),
('Fourier 级数', '周期 2π 函数: f(x)~a₀/2+Σ(aₙcosnx+bₙsinnx), aₙ=(1/π)∫[-π,π]f(x)cosnx dx。狄利克雷收敛定理: f 满足条件时, 收敛于 (f(x⁻)+f(x⁺))/2。周期 2L 时类似公式。', 'HARD', 11, '{"weight": 4, "examFreq": "高"}'),
('一阶可分离微分方程', 'dy/dx=f(x)g(y), 分离变量后两边积分: ∫dy/g(y)=∫f(x)dx+C。是最基本的一阶 ODE 类型, 是其他类型的基础。', 'EASY', 11, '{"weight": 4, "examFreq": "高"}'),
('一阶线性微分方程', 'y''+P(x)y=Q(x), 通解公式 y=e^(-∫P dx)·[∫Q·e^(∫P dx)dx + C]。齐次时 Q=0, 解为 Ce^(-∫P dx)。', 'MEDIUM', 11, '{"weight": 5, "examFreq": "高"}'),
('伯努利方程', 'y''+P(x)y=Q(x)yⁿ (n≠0,1)。令 z=y^(1-n), 化为 z 的一阶线性方程。是一阶 ODE 高频考点。', 'HARD', 11, '{"weight": 4, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('二阶常系数齐次线性微分方程', 'y''''+py''+qy=0, 特征方程 λ²+pλ+q=0。两不等实根 r₁,r₂: y=C₁e^(r₁x)+C₂e^(r₂x); 重根 r: y=(C₁+C₂x)e^(rx); 共轭复根 α±βi: y=e^(αx)(C₁cosβx+C₂sinβx)。', 'MEDIUM', 11, '{"weight": 5, "examFreq": "高"}'),
('二阶常系数非齐次线性微分方程', 'y''''+py''+qy=f(x)。通解=齐次通解+特解 y*。当 f(x)=Pₘ(x)e^(λx) 时设 y*=xᵏRₘ(x)e^(λx); f=e^(αx)[Pcosβx+Qsinβx] 时设对应形式。k 由 λ 是否为特征根决定。', 'HARD', 11, '{"weight": 5, "examFreq": "高"}'),
('欧拉方程', 'x²y''''+pxy''+qy=f(x), 令 x=eᵗ 化为常系数线性方程。是数学一特有考点。', 'HARD', 11, '{"weight": 3, "examFreq": "中"}'),
('方向导数与梯度', '方向导数 ∂f/∂l|₀ = f_x cosα+f_y cosβ+f_z cosγ, 表示函数沿向量 l 方向的变化率。梯度 ∇f=(f_x,f_y,f_z), 是方向导数取最大值的方向, 模长为最大变化率。', 'HARD', 11, '{"weight": 4, "examFreq": "高"}');

-- === topic_12 线性代数 (数学一) ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('行列式定义', 'n 阶行列式 det(A)=Σ(-1)^τ a_{1j₁}a_{2j₂}…a_{nj_n}, τ 为列下标的逆序数。二阶/三阶可用对角线法则。性质: 转置不变、两行互换变号、某行(列)的公因子可提出。', 'EASY', 12, '{"weight": 4, "examFreq": "高"}'),
('行列式计算', '化为上(下)三角形, 主对角线元素之积即为行列式值。展开定理: D=Σaᵢⱼ Aᵢⱼ。范德蒙德行列式: ∏(xᵢ-xⱼ) (i>j)。', 'MEDIUM', 12, '{"weight": 5, "examFreq": "高"}'),
('克拉默法则', 'n 个未知量 n 个方程的线性方程组, 当系数行列式 D≠0 时唯一解 xⱼ=Dⱼ/D, Dⱼ 为将 D 的第 j 列换成常数列得到的行列式。齐次方程组 D≠0 仅零解; D=0 有非零解。', 'MEDIUM', 12, '{"weight": 3, "examFreq": "中"}'),
('矩阵运算', '加法/数乘逐元素进行。矩阵乘法 C=AB: cᵢⱼ=Σaᵢₖbₖⱼ, 不满足交换律, AB≠BA(一般)。转置 (AB)ᵀ=BᵀAᵀ。方幂 Aⁿ。', 'EASY', 12, '{"weight": 4, "examFreq": "高"}'),
('逆矩阵', 'A 可逆 ⇔ |A|≠0。求法: 伴随矩阵 A⁻¹=A*/|A|; 初等变换 [A|E]→[E|A⁻¹]。性质 (AB)⁻¹=B⁻¹A⁻¹, (Aᵀ)⁻¹=(A⁻¹)ᵀ。', 'MEDIUM', 12, '{"weight": 5, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('伴随矩阵', '伴随矩阵 A* 由代数余子式按转置位置排列。A·A*=A*·A=|A|·E。性质 |A*|=|A|^(n-1), (A*)*=|A|^(n-2)·A (n≥2)。', 'HARD', 12, '{"weight": 3, "examFreq": "中"}'),
('初等变换与初等矩阵', '三种初等行(列)变换: 互换、k 倍、k 倍加。初等矩阵 = 单位矩阵作一次初等变换得到。左乘 = 行变换, 右乘 = 列变换。任一可逆矩阵都是若干初等矩阵的乘积。', 'MEDIUM', 12, '{"weight": 4, "examFreq": "高"}'),
('矩阵的秩', 'r(A) = 非零子式的最高阶数 = 行阶梯形非零行数。性质: r(A)=r(Aᵀ)=r(AᵀA), r(A+B)≤r(A)+r(B), r(AB)≤min(r(A),r(B))。是判断方程组解、向量组相关性的核心工具。', 'HARD', 12, '{"weight": 5, "examFreq": "高"}'),
('分块矩阵', '将矩阵划分为子块进行运算。分块对角阵的行列式 = 各对角块行列式之积; 逆 = 各对角块逆构成的分块对角阵。', 'MEDIUM', 12, '{"weight": 3, "examFreq": "中"}'),
('向量组与线性表示', '向量 α 可由 α₁,…,αₘ 线性表示 ⇔ 方程 x₁α₁+…+xₘαₘ=α 有解 ⇔ r(α₁,…,αₘ)=r(α₁,…,αₘ,α)。', 'MEDIUM', 12, '{"weight": 4, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('向量组的线性相关性', '向量组 α₁,…,αₘ 线性相关 ⇔ 存在不全为零的 k₁,…,kₘ 使 Σkᵢαᵢ=0 ⇔ 矩阵秩 r<m。线性无关 ⇔ r=m。n+1 个 n 维向量必相关。', 'MEDIUM', 12, '{"weight": 5, "examFreq": "高"}'),
('极大线性无关组', '向量组的极大线性无关组所含向量个数即为向量组的秩。求法: 写成矩阵, 化为行阶梯形, 主元所在列对应的原向量。任意向量组都与其极大无关组等价。', 'HARD', 12, '{"weight": 4, "examFreq": "高"}'),
('向量空间', 'Rⁿ 是 n 维向量空间。子空间: 对加法和数乘封闭。基: 极大线性无关组。维数 = 基中向量个数。坐标: 唯一线性表示系数。过渡矩阵描述基变换。', 'HARD', 12, '{"weight": 3, "examFreq": "中"}'),
('施密特正交化', '将线性无关向量组 α₁,…,αₘ 化为正交向量组 β₁,…,βₘ: β₁=α₁, βₖ=αₖ-Σⱼ<ₖ ((αₖ,βⱼ)/(βⱼ,βⱼ))βⱼ。再单位化得到标准正交组。', 'HARD', 12, '{"weight": 4, "examFreq": "高"}'),
('齐次线性方程组', 'Ax=0, 解的判定: r(A)=n 仅零解; r(A)<n 有非零解。基础解系包含 n-r(A) 个解向量。通解 = 基础解系的线性组合。', 'MEDIUM', 12, '{"weight": 5, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('非齐次线性方程组', 'Ax=b 解的判定: r(A)=r(A|b)=n 唯一解; r(A)=r(A|b)<n 无穷多解; r(A)≠r(A|b) 无解。通解 = 一个特解 + 对应齐次方程组通解。', 'MEDIUM', 12, '{"weight": 5, "examFreq": "高"}'),
('特征值与特征向量', 'Aξ=λξ (ξ≠0)。求法: 由 |A-λE|=0 解出特征值 λ, 对每个 λ 求解 (A-λE)x=0 得到特征向量。性质: Σλᵢ=tr(A)(主对角线和), ∏λᵢ=|A|。', 'MEDIUM', 12, '{"weight": 5, "examFreq": "高"}'),
('相似矩阵', 'A~B ⇔ 存在可逆 P 使 P⁻¹AP=B。性质: 相似矩阵有相同特征多项式、特征值、行列式、迹、秩。', 'MEDIUM', 12, '{"weight": 4, "examFreq": "高"}'),
('矩阵对角化', 'A 可对角化 ⇔ A 有 n 个线性无关特征向量 ⇔ 每个 kᵢ 重特征值有 kᵢ 个线性无关特征向量。P=(ξ₁,…,ξₙ), P⁻¹AP=diag(λ₁,…,λₙ)。', 'HARD', 12, '{"weight": 5, "examFreq": "高"}'),
('实对称矩阵对角化', '实对称矩阵的特征值都是实数, 不同特征值的特征向量正交。一定可正交对角化: 存在正交矩阵 Q 使 QᵀAQ=Λ。', 'HARD', 12, '{"weight": 5, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('二次型', 'n 元二次齐次多项式 f(x₁,…,xₙ)=xᵀAx (A 实对称)。标准形: 只含平方项。规范形: 系数为 +1, -1, 0。通过正交变换 x=Qy 化二次型为标准形。', 'HARD', 12, '{"weight": 5, "examFreq": "高"}'),
('合同矩阵', 'A 与 B 合同 ⇔ 存在可逆 C 使 CᵀAC=B。合同保持对称性、秩、正(负)惯性指数。惯性定理: 标准形中正(负)项个数与变换无关。', 'HARD', 12, '{"weight": 4, "examFreq": "高"}'),
('正定二次型', '对任意 x≠0 有 xᵀAx>0。等价条件: 特征值全>0; 顺序主子式全>0; 正惯性指数 = n; 与单位阵合同。负定 / 半正定类似。', 'HARD', 12, '{"weight": 5, "examFreq": "高"}'),
('正交矩阵', 'AᵀA=AAᵀ=E ⇔ Aᵀ=A⁻¹ ⇔ 行(列)向量组是标准正交组。性质 |A|=±1, A 的特征值的模为 1。', 'MEDIUM', 12, '{"weight": 4, "examFreq": "高"}'),
('Jordan 标准形', '当 A 不能对角化时可化为 Jordan 块的分块对角阵。每个 Jordan 块对应一个特征值。考研一般不深入但理解概念有助于其他题目。', 'HARD', 12, '{"weight": 2, "examFreq": "低"}');

-- === topic_13 概率论与数理统计 (数学一) ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('随机事件与概率', '样本空间 Ω 包含所有可能结果, 事件是 Ω 的子集。概率公理: 非负性 P(A)≥0, 规范性 P(Ω)=1, 可列可加性。性质 P(A∪B)=P(A)+P(B)-P(AB), P(Ā)=1-P(A)。', 'EASY', 13, '{"weight": 4, "examFreq": "高"}'),
('古典概型与几何概型', '古典: 等可能有限, P(A)=A中样本点数/Ω中样本点数。几何概型: 样本空间为可度量区域, P(A)=μ(A)/μ(Ω)。', 'EASY', 13, '{"weight": 3, "examFreq": "中"}'),
('条件概率', 'P(B|A)=P(AB)/P(A) (P(A)>0)。乘法公式 P(AB)=P(A)P(B|A)。理解条件下的样本空间收缩。', 'MEDIUM', 13, '{"weight": 5, "examFreq": "高"}'),
('全概率与贝叶斯公式', '完备事件组 B₁,…,Bₙ 划分 Ω。全概率 P(A)=Σ P(Bᵢ)P(A|Bᵢ)。贝叶斯 P(Bⱼ|A)=P(Bⱼ)P(A|Bⱼ)/Σ P(Bᵢ)P(A|Bᵢ), 是已知结果反推原因的核心公式。', 'HARD', 13, '{"weight": 5, "examFreq": "高"}'),
('事件独立性', 'A,B 独立 ⇔ P(AB)=P(A)P(B) ⇔ P(A|B)=P(A)。三个事件相互独立要求两两独立 + P(ABC)=P(A)P(B)P(C)。独立与互斥不同。', 'MEDIUM', 13, '{"weight": 4, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('随机变量与分布函数', 'X 是从 Ω 到 R 的可测函数。分布函数 F(x)=P(X≤x), 性质: 单调不减、右连续、F(-∞)=0, F(+∞)=1。', 'MEDIUM', 13, '{"weight": 4, "examFreq": "高"}'),
('伯努利分布', 'X~B(1,p): P(X=1)=p, P(X=0)=1-p。E(X)=p, D(X)=p(1-p)。是最简单的离散分布, 二项分布的基础。', 'EASY', 13, '{"weight": 3, "examFreq": "中"}'),
('二项分布', 'X~B(n,p) 表示 n 重伯努利试验中成功次数。P(X=k)=C(n,k)p^k(1-p)^(n-k)。E(X)=np, D(X)=np(1-p)。', 'MEDIUM', 13, '{"weight": 5, "examFreq": "高"}'),
('几何分布与超几何分布', '几何 X~G(p): 首次成功所需试验次数, P(X=k)=(1-p)^(k-1)p, E=1/p, D=(1-p)/p²。超几何 H(N,M,n): 不放回抽样。', 'MEDIUM', 13, '{"weight": 3, "examFreq": "中"}'),
('泊松分布', 'X~P(λ) 表示单位时间(空间)内随机事件发生次数。P(X=k)=λ^k e^(-λ)/k!, E(X)=D(X)=λ。当 n 大 p 小时二项分布近似泊松, λ=np。', 'MEDIUM', 13, '{"weight": 4, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('均匀分布', 'X~U(a,b): 概率密度 f(x)=1/(b-a) (a≤x≤b)。E(X)=(a+b)/2, D(X)=(b-a)²/12。', 'EASY', 13, '{"weight": 3, "examFreq": "中"}'),
('指数分布', 'X~E(λ): f(x)=λe^(-λx) (x>0)。E(X)=1/λ, D(X)=1/λ²。无记忆性: P(X>s+t|X>s)=P(X>t)。常用于寿命/排队等待。', 'MEDIUM', 13, '{"weight": 4, "examFreq": "高"}'),
('正态分布', 'X~N(μ,σ²): f(x)=(1/(σ√(2π)))exp(-(x-μ)²/(2σ²))。E(X)=μ, D(X)=σ²。标准化 Z=(X-μ)/σ~N(0,1), 利用标准正态分布表查概率。', 'MEDIUM', 13, '{"weight": 5, "examFreq": "高"}'),
('一维随机变量函数的分布', 'Y=g(X), 已知 X 的分布求 Y 的分布。离散: 直接计算。连续: 分布函数法 F_Y(y)=P(g(X)≤y); 当 g 单调可微时密度变换公式 f_Y(y)=f_X(g⁻¹(y))|d/dy g⁻¹(y)|。', 'HARD', 13, '{"weight": 4, "examFreq": "高"}'),
('二维随机变量', '联合分布函数 F(x,y)=P(X≤x,Y≤y)。离散用联合分布律, 连续用联合密度 f(x,y)。性质 ∫∫f dxdy=1, P((X,Y)∈D)=∬_D f dxdy。', 'MEDIUM', 13, '{"weight": 5, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('边缘分布', '由联合分布求单个变量的分布。f_X(x)=∫f(x,y)dy, f_Y(y)=∫f(x,y)dx。离散时 P(X=xᵢ)=Σⱼ P(X=xᵢ,Y=yⱼ)。', 'MEDIUM', 13, '{"weight": 4, "examFreq": "高"}'),
('条件分布', 'f_{X|Y}(x|y)=f(x,y)/f_Y(y) (f_Y(y)>0)。条件期望 E(X|Y=y)=∫x·f_{X|Y}(x|y)dx。全期望公式 E(X)=E[E(X|Y)]。', 'HARD', 13, '{"weight": 4, "examFreq": "高"}'),
('随机变量独立性', 'X 与 Y 独立 ⇔ F(x,y)=F_X(x)F_Y(y) ⇔ f(x,y)=f_X(x)f_Y(y)。独立时联合分布完全由边缘分布决定。', 'MEDIUM', 13, '{"weight": 5, "examFreq": "高"}'),
('二维随机变量函数分布', 'Z=X+Y 时 f_Z(z)=∫f(x,z-x)dx (卷积公式), 独立时 f_Z(z)=∫f_X(x)f_Y(z-x)dx。其他常见函数: max{X,Y}, min{X,Y}, X/Y。', 'HARD', 13, '{"weight": 5, "examFreq": "高"}'),
('数学期望', 'E(X)=Σxᵢpᵢ (离散) 或 ∫xf(x)dx (连续)。性质: E(c)=c, E(aX+bY)=aE(X)+bE(Y), 独立时 E(XY)=E(X)E(Y)。E(g(X))=∫g(x)f(x)dx。', 'MEDIUM', 13, '{"weight": 5, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('方差', 'D(X)=E[(X-E(X))²]=E(X²)-[E(X)]²。性质 D(c)=0, D(aX+b)=a²D(X), D(X±Y)=D(X)+D(Y)±2Cov(X,Y)。独立时 D(X+Y)=D(X)+D(Y)。', 'MEDIUM', 13, '{"weight": 5, "examFreq": "高"}'),
('协方差与相关系数', 'Cov(X,Y)=E[(X-EX)(Y-EY)]=E(XY)-E(X)E(Y)。相关系数 ρ_{XY}=Cov(X,Y)/(σ_X σ_Y), |ρ|≤1。ρ=0 称不相关(独立 ⇒ 不相关, 反之不一定)。', 'HARD', 13, '{"weight": 5, "examFreq": "高"}'),
('切比雪夫不等式', 'P(|X-EX|≥ε)≤D(X)/ε²。给出概率的粗略估计, 不需要知道分布只要知道期望和方差。', 'MEDIUM', 13, '{"weight": 3, "examFreq": "中"}'),
('大数定律', '描述大量重复试验中频率稳定于概率的现象。切比雪夫大数定律、伯努利大数定律、辛钦大数定律。结论: 样本均值依概率收敛到期望。', 'HARD', 13, '{"weight": 4, "examFreq": "高"}'),
('中心极限定理', '独立同分布的随机变量序列 X₁,X₂,…, 当 n 充分大时 ΣXᵢ 的分布近似正态。即 (Σxᵢ-nμ)/(σ√n) ~ N(0,1)。是统计推断的理论基础。', 'HARD', 13, '{"weight": 5, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('总体与样本', '总体: 研究对象的全体; 样本: 总体中抽取的部分。简单随机样本要求独立同分布。统计量是样本的函数, 不含未知参数。', 'EASY', 13, '{"weight": 3, "examFreq": "中"}'),
('抽样分布', '正态总体 N(μ,σ²) 下: 样本均值 X̄~N(μ,σ²/n)。χ²(n) 分布: n 个独立标准正态平方和。t(n) 分布: N(0,1) 与 √(χ²(n)/n) 之比。F(n₁,n₂) 分布: 两独立 χ² 之比。', 'HARD', 13, '{"weight": 5, "examFreq": "高"}'),
('矩估计', '用样本矩估计总体矩。一阶矩 X̄ 估计 EX, 二阶中心矩 S²₀ 估计 DX。建立方程组解出参数估计量。', 'MEDIUM', 13, '{"weight": 4, "examFreq": "高"}'),
('最大似然估计', 'L(θ)=∏f(xᵢ;θ) (连续) 或 ∏P(xᵢ;θ) (离散)。求 θ 使 L 最大: 通常对 lnL 求导令为 0。MLE 在大样本下具有良好性质。', 'HARD', 13, '{"weight": 5, "examFreq": "高"}'),
('估计量评价', '无偏性 E(θ̂)=θ; 有效性 (无偏估计中方差更小); 一致性 (相合性) θ̂ 依概率收敛到 θ。区间估计: 置信水平 1-α 的置信区间。', 'MEDIUM', 13, '{"weight": 4, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('正态总体均值与方差的区间估计', 'σ²已知时 μ 的 1-α 置信区间 [X̄±z_{α/2}·σ/√n]。σ²未知时用 t 分布 [X̄±t_{α/2}(n-1)·S/√n]。σ² 的区间估计基于 χ² 分布。', 'HARD', 13, '{"weight": 4, "examFreq": "高"}'),
('假设检验', '原假设 H₀ vs 备择假设 H₁。两类错误: 弃真 α (第一类), 取伪 β (第二类)。基本步骤: 提出假设→构造检验统计量→给出拒绝域→由样本作出判断。', 'HARD', 13, '{"weight": 4, "examFreq": "高"}'),
('正态总体的假设检验', 'σ² 已知时 μ 的检验用 Z 检验; σ² 未知用 t 检验。σ² 检验用 χ² 检验。两正态总体均值差检验、方差比检验(F 检验)。', 'HARD', 13, '{"weight": 4, "examFreq": "高"}');

-- === topic_14 数据结构 补充 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('广义表', '广义表是线性表的推广, 元素可以是单个数据(原子), 也可以是子表。常用表示 LS=(a₁,a₂,…,aₙ)。基本操作: head(表头) 与 tail(表尾)。深度: 嵌套层次。', 'MEDIUM', 14, '{"weight": 2, "examFreq": "低"}'),
('栈的应用-表达式求值', '中缀表达式转后缀(逆波兰式)使用操作符栈, 比较优先级决定出栈/入栈。后缀表达式求值使用操作数栈, 遇操作符弹出两个操作数计算后压回。是栈最经典的应用。', 'MEDIUM', 14, '{"weight": 4, "examFreq": "高"}'),
('递归与栈', '系统通过函数调用栈实现递归: 保存返回地址、参数、局部变量。递归 → 非递归转换可手动维护栈。尾递归优化可避免栈溢出。', 'MEDIUM', 14, '{"weight": 3, "examFreq": "中"}'),
('树与森林', '树转二叉树: 每个节点的第一个孩子作为左子, 兄弟作为右子("孩子兄弟表示法")。森林转二叉树: 各树的根作为右兄弟链。是树/森林遍历的基础。', 'MEDIUM', 14, '{"weight": 3, "examFreq": "中"}'),
('哈夫曼编码应用', '基于哈夫曼树构造的前缀编码, 用于数据压缩。出现频率高的字符使用短编码, 频率低的使用长编码, 总编码长度最小。WPL 计算: Σ wᵢ·lᵢ。', 'MEDIUM', 14, '{"weight": 3, "examFreq": "中"}'),
('外部排序', '当数据无法全部放入内存时使用外部排序。多路归并: k 路归并使用败者树/胜者树减少比较次数。归并段生成: 置换-选择排序。最佳归并树用于减少 IO。', 'HARD', 14, '{"weight": 3, "examFreq": "中"}');

-- === topic_15 计算机组成原理 补充 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('乘法运算', '原码一位乘: 符号位单独计算, 数值位累加移位。补码一位乘(Booth 算法): 根据相邻两位 yᵢyᵢ₊₁ 决定加 0/+[X]补/-[X]补。补码乘扩展为高效硬件实现。', 'HARD', 15, '{"weight": 4, "examFreq": "高"}'),
('除法运算', '原码恢复余数法: 余数为负时恢复; 不恢复余数法(加减交替法)更高效。补码除法(对应 Booth)。除法器结构与乘法器对称, 是 ALU 设计核心之一。', 'HARD', 15, '{"weight": 3, "examFreq": "中"}'),
('控制器-硬布线', '硬布线控制器(组合逻辑控制器): 用门电路直接产生控制信号。速度快但不灵活, 修改困难, 适合 RISC。与微程序控制器对比是高频考点。', 'HARD', 15, '{"weight": 4, "examFreq": "高"}'),
('控制器-微程序', '微程序控制器: 微指令存储于控制存储器, 取微指令译码产生控制信号。优点灵活、易扩展; 缺点速度较慢, 适合 CISC。微指令格式: 水平型/垂直型。', 'HARD', 15, '{"weight": 4, "examFreq": "高"}'),
('主存与CPU连接', '存储器位扩展: 多片并联组成更宽数据线; 字扩展: 多片串联扩展容量。地址译码方式: 线选法/译码器译码法。CPU 通过地址、数据、控制总线访问主存。', 'MEDIUM', 15, '{"weight": 4, "examFreq": "高"}'),
('中断系统', '中断响应过程: 关中断→保存断点→识别中断源→保护现场→执行中断服务程序→恢复现场→中断返回。多重中断时根据优先级排队。中断屏蔽字控制嵌套。', 'HARD', 15, '{"weight": 5, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('程序中断与DMA', '程序中断: CPU 处理 I/O, 适合低速设备; DMA(直接存储器访问): 不经 CPU 直接在内存与外设之间传输, 适合高速大批量。DMA 三种工作方式: 停止 CPU 访存、周期挪用、交替访问。', 'MEDIUM', 15, '{"weight": 5, "examFreq": "高"}'),
('指令周期', '指令周期 = 取指周期 + 间址周期(若需) + 执行周期 + 中断周期(若有)。每个周期由若干 CPU 周期组成, CPU 周期由若干时钟周期组成。', 'MEDIUM', 15, '{"weight": 4, "examFreq": "高"}'),
('机器周期与时钟周期', '时钟周期: CPU 主频的倒数, 是最小时间单位。机器周期(CPU 周期): 完成一个基本操作所需时间。指令周期 ≥ 机器周期 ≥ 时钟周期。', 'MEDIUM', 15, '{"weight": 3, "examFreq": "中"}'),
('Cache映射方式', '直接映射: cache 行号 = (主存块号) mod (cache 行数), 简单但冲突多。全相联: 任意映射, 冲突最少但比较硬件复杂。组相联: 折中方案, 块在组内全相联, 组间直接映射。', 'HARD', 15, '{"weight": 5, "examFreq": "高"}'),
('Cache写策略', '写命中: 写直达(write-through, 立即写主存) vs 写回(write-back, 仅修改 cache 且置脏位, 替换时写回)。写不命中: 写分配 vs 非写分配。', 'MEDIUM', 15, '{"weight": 4, "examFreq": "高"}'),
('存储芯片RAM与ROM', 'RAM 易失性, 分 SRAM(静态, 速度快, Cache 用) 和 DRAM(动态, 容量大, 主存用, 需刷新)。ROM 非易失性: MROM/PROM/EPROM/EEPROM/Flash。', 'MEDIUM', 15, '{"weight": 4, "examFreq": "高"}');

-- === topic_16 操作系统 补充 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('线程模型', '内核级线程(KLT): 由内核管理调度, 切换开销大但能并行。用户级线程(ULT): 由用户库管理, 切换快但一个线程阻塞则整进程阻塞。多对一/一对一/多对多组合模型。', 'MEDIUM', 16, '{"weight": 4, "examFreq": "高"}'),
('用户态与内核态', '用户态(目态): 应用程序运行的低权限模式, 不能直接访问硬件。内核态(管态): 操作系统内核运行的高权限模式。模式切换通过中断/异常/系统调用进行。', 'MEDIUM', 16, '{"weight": 4, "examFreq": "高"}'),
('系统调用', '应用程序通过陷入指令(trap)请求内核服务。过程: 准备参数→执行 trap→进入内核态→执行系统调用处理程序→返回结果。常见系统调用: 文件、进程、IPC、设备管理。', 'MEDIUM', 16, '{"weight": 4, "examFreq": "高"}'),
('进程通信IPC', '共享存储: 共享内存区, 速度最快需自行同步。消息传递: send/receive 原语, 直接/间接通信。管道: pipe(匿名)/FIFO(命名), 单向字节流。信号: 异步事件通知。套接字: 跨主机通信。', 'HARD', 16, '{"weight": 4, "examFreq": "高"}'),
('管程', '管程是包含数据结构和过程的高级同步机制, 任一时刻只能有一个进程在管程内执行。条件变量配合 wait/signal 实现同步。Hoare 管程与 Mesa 管程的语义差异。', 'HARD', 16, '{"weight": 3, "examFreq": "中"}'),
('读者写者问题', '允许多个读者并发读, 写者独占。读者优先: 只要有读者就允许新读者进入(写者饥饿)。写者优先: 写请求来后阻止新读者。公平策略折中。用信号量 + 计数器实现。', 'HARD', 16, '{"weight": 4, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('哲学家进餐问题', '5 个哲学家围桌, 需要左右两根筷子才能就餐。简单实现易死锁。解决方案: 限制同时拿筷子人数 ≤ 4; 仅当两根筷子都空时才允许拿; 奇偶哲学家拿筷顺序不同。', 'HARD', 16, '{"weight": 4, "examFreq": "高"}'),
('地址变换机构', '逻辑地址 → 物理地址转换。分页系统: 页表寄存器找页表, 由页号查页框号, 拼接页内偏移得物理地址。两次访存(读页表 + 读数据), 引入 TLB 加速。', 'HARD', 16, '{"weight": 5, "examFreq": "高"}'),
('快表TLB', 'TLB(联想存储器)缓存最近访问的页表项。命中率 h 时平均访问时间 = h·(t_TLB+t_mem)+(1-h)·(t_TLB+2·t_mem)。是性能优化关键, 多级页表配合 TLB 减少访存次数。', 'HARD', 16, '{"weight": 5, "examFreq": "高"}'),
('页面置换-LRU实现', 'LRU 思想: 替换最近最久未使用的页面。实现方式: 计数器(每访问更新时间戳, 替换时找最小); 栈实现(每次访问移到栈顶); 硬件支持(寄存器/位向量)。栈算法不会有 Belady 异常。', 'HARD', 16, '{"weight": 4, "examFreq": "高"}'),
('Clock置换算法', '改进的 FIFO, 给每页设置使用位 R。指针指向最旧位置, 替换时若 R=0 则换出, R=1 则置 0 后指针前进。改进 Clock 增加修改位 M, 优先替换 R=0,M=0 的页。', 'MEDIUM', 16, '{"weight": 4, "examFreq": "高"}'),
('工作集与抖动', '工作集 W(t,Δ): 时间区间 [t-Δ,t] 内访问的页面集合。驻留集大小 ≥ 工作集可避免抖动(频繁缺页)。预防抖动: 局部置换、工作集模型、缺页频率法、负载控制。', 'HARD', 16, '{"weight": 3, "examFreq": "中"}');

-- === topic_17 计算机网络 补充 ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('协议数据单元PDU', '不同层的 PDU 名称: 物理层(比特)、数据链路层(帧 Frame)、网络层(分组/数据报 Packet)、传输层(段 Segment / 用户数据报 Datagram)、应用层(报文 Message)。封装与解封装。', 'EASY', 17, '{"weight": 3, "examFreq": "中"}'),
('传输层端口与套接字', '端口号 16 位 (0-65535): 周知端口 0-1023 (HTTP 80, HTTPS 443, SSH 22, FTP 21), 注册端口 1024-49151, 动态端口 49152-65535。套接字 = (IP 地址, 端口号), 唯一标识网络通信端点。', 'MEDIUM', 17, '{"weight": 4, "examFreq": "高"}'),
('NAT网络地址转换', 'NAT 将私网地址转换为公网地址。私有地址段: 10.0.0.0/8, 172.16-31.0.0/12, 192.168.0.0/16。NAPT(端口复用) 使多个内网设备共享一个公网 IP, 缓解 IPv4 短缺。', 'MEDIUM', 17, '{"weight": 4, "examFreq": "高"}'),
('DHCP协议', '动态主机配置协议自动分配 IP 地址。基于 UDP, 客户端 67 服务器 68(实际为反)。四步流程: DISCOVER→OFFER→REQUEST→ACK。同时下发掩码、网关、DNS 等参数。', 'MEDIUM', 17, '{"weight": 4, "examFreq": "高"}'),
('FTP / SMTP / POP3 / IMAP 应用', 'FTP 文件传输基于 TCP, 控制连接 21、数据连接 20, 两种模式 PORT(主动)/PASV(被动)。SMTP 邮件发送 25。POP3 邮件接收 110, IMAP 143 支持多设备同步。', 'MEDIUM', 17, '{"weight": 3, "examFreq": "中"}'),
('TCP报文段格式细节', 'TCP 头部至少 20 字节。字段: 源/目的端口(各 16)、序号(32)、确认号(32)、首部长度(4)、保留(6)、6 个标志位 URG/ACK/PSH/RST/SYN/FIN、窗口(16)、校验和、紧急指针、选项。', 'HARD', 17, '{"weight": 5, "examFreq": "高"}');

INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('IPv6简介', 'IPv6 地址 128 位, 用 8 组冒分十六进制表示, 双冒号 :: 表示连续 0。优点: 地址空间大、首部简化、内置安全(IPSec)、即插即用。过渡技术: 双协议栈、隧道、NAT64。', 'MEDIUM', 17, '{"weight": 3, "examFreq": "中"}'),
('无线WiFi 802.11', 'IEEE 802.11 规定无线局域网。CSMA/CA(碰撞避免): RTS/CTS 隐藏终端处理。基础设施模式(AP)与 Ad-hoc 模式。常用版本 b/g/n/ac/ax(WiFi6)。', 'MEDIUM', 17, '{"weight": 3, "examFreq": "中"}'),
('广域网技术', '广域网(WAN)覆盖大范围。技术: 帧中继、ATM、SONET/SDH 同步光网络、MPLS 多协议标签交换。WAN 与 LAN 区别: 距离、延迟、协议。', 'MEDIUM', 17, '{"weight": 2, "examFreq": "低"}'),
('网络性能指标', '带宽: 单位时间最多比特数。吞吐量: 实际传输速率 ≤ 带宽。时延 = 发送时延 + 传播时延 + 处理时延 + 排队时延。RTT 往返时延。利用率 = 实际/最大。时延带宽积 = 时延×带宽。', 'MEDIUM', 17, '{"weight": 4, "examFreq": "高"}'),
('网络层IP分组转发', '路由器收到 IP 分组后查找路由表(最长前缀匹配)决定下一跳。转发与路由的区别: 转发是数据平面动作, 路由是控制平面计算。默认路由 0.0.0.0/0。', 'MEDIUM', 17, '{"weight": 4, "examFreq": "高"}'),
('VPN虚拟专用网', 'VPN 通过隧道技术在公网上构建安全私网通道。常见实现: IPSec、SSL VPN、PPTP、L2TP。功能: 加密、认证、访问控制。企业远程办公场景常用。', 'MEDIUM', 17, '{"weight": 2, "examFreq": "低"}');

-- ============================================================================
-- 知识点关系(边)
-- ============================================================================

-- === 高数内部关系 ===
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='函数与极限'), (SELECT id FROM knowledge_nodes WHERE title='无穷小与无穷大'), 'PREREQUISITE', 1.0, '极限→无穷小'),
((SELECT id FROM knowledge_nodes WHERE title='函数与极限'), (SELECT id FROM knowledge_nodes WHERE title='函数连续性'), 'PREREQUISITE', 1.0, '极限→连续'),
((SELECT id FROM knowledge_nodes WHERE title='函数连续性'), (SELECT id FROM knowledge_nodes WHERE title='导数定义'), 'PREREQUISITE', 1.0, '连续→导数'),
((SELECT id FROM knowledge_nodes WHERE title='导数定义'), (SELECT id FROM knowledge_nodes WHERE title='求导法则'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='求导法则'), (SELECT id FROM knowledge_nodes WHERE title='高阶导数'), 'EXTENDS', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='导数定义'), (SELECT id FROM knowledge_nodes WHERE title='微分'), 'RELATED', 1.0, '可导↔可微'),
((SELECT id FROM knowledge_nodes WHERE title='求导法则'), (SELECT id FROM knowledge_nodes WHERE title='微分中值定理'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='微分中值定理'), (SELECT id FROM knowledge_nodes WHERE title='洛必达法则'), 'PREREQUISITE', 1.0, '柯西中值→洛必达'),
((SELECT id FROM knowledge_nodes WHERE title='微分中值定理'), (SELECT id FROM knowledge_nodes WHERE title='泰勒公式'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='求导法则'), (SELECT id FROM knowledge_nodes WHERE title='单调性与极值'), 'PREREQUISITE', 1.0, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='单调性与极值'), (SELECT id FROM knowledge_nodes WHERE title='凹凸性与拐点'), 'EXTENDS', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='求导法则'), (SELECT id FROM knowledge_nodes WHERE title='不定积分'), 'PREREQUISITE', 1.0, '微分逆运算'),
((SELECT id FROM knowledge_nodes WHERE title='不定积分'), (SELECT id FROM knowledge_nodes WHERE title='定积分'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='定积分'), (SELECT id FROM knowledge_nodes WHERE title='变限积分'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='定积分'), (SELECT id FROM knowledge_nodes WHERE title='反常积分'), 'EXTENDS', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='定积分'), (SELECT id FROM knowledge_nodes WHERE title='定积分应用'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='函数与极限'), (SELECT id FROM knowledge_nodes WHERE title='多元函数极限与连续'), 'EXTENDS', 0.9, '一元→多元'),
((SELECT id FROM knowledge_nodes WHERE title='多元函数极限与连续'), (SELECT id FROM knowledge_nodes WHERE title='偏导数'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='偏导数'), (SELECT id FROM knowledge_nodes WHERE title='全微分'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='偏导数'), (SELECT id FROM knowledge_nodes WHERE title='多元复合函数求导'), 'PREREQUISITE', 1.0, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='全微分'), (SELECT id FROM knowledge_nodes WHERE title='方向导数与梯度'), 'EXTENDS', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='偏导数'), (SELECT id FROM knowledge_nodes WHERE title='多元函数极值'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='定积分'), (SELECT id FROM knowledge_nodes WHERE title='二重积分'), 'EXTENDS', 1.0, '一维→二维'),
((SELECT id FROM knowledge_nodes WHERE title='二重积分'), (SELECT id FROM knowledge_nodes WHERE title='三重积分'), 'EXTENDS', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='二重积分'), (SELECT id FROM knowledge_nodes WHERE title='第一类曲线积分'), 'RELATED', 0.8, NULL),
((SELECT id FROM knowledge_nodes WHERE title='第一类曲线积分'), (SELECT id FROM knowledge_nodes WHERE title='第二类曲线积分'), 'RELATED', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='二重积分'), (SELECT id FROM knowledge_nodes WHERE title='第一类曲面积分'), 'RELATED', 0.8, NULL),
((SELECT id FROM knowledge_nodes WHERE title='第一类曲面积分'), (SELECT id FROM knowledge_nodes WHERE title='第二类曲面积分'), 'RELATED', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='函数与极限'), (SELECT id FROM knowledge_nodes WHERE title='数项级数收敛性'), 'PREREQUISITE', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='数项级数收敛性'), (SELECT id FROM knowledge_nodes WHERE title='交错级数与绝对收敛'), 'EXTENDS', 0.9, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='交错级数与绝对收敛'), (SELECT id FROM knowledge_nodes WHERE title='幂级数'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='幂级数'), (SELECT id FROM knowledge_nodes WHERE title='Fourier 级数'), 'EXTENDS', 0.7, NULL),
((SELECT id FROM knowledge_nodes WHERE title='泰勒公式'), (SELECT id FROM knowledge_nodes WHERE title='幂级数'), 'RELATED', 0.9, '幂级数展开'),
((SELECT id FROM knowledge_nodes WHERE title='不定积分'), (SELECT id FROM knowledge_nodes WHERE title='一阶可分离微分方程'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='一阶可分离微分方程'), (SELECT id FROM knowledge_nodes WHERE title='一阶线性微分方程'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='一阶线性微分方程'), (SELECT id FROM knowledge_nodes WHERE title='伯努利方程'), 'EXTENDS', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='一阶线性微分方程'), (SELECT id FROM knowledge_nodes WHERE title='二阶常系数齐次线性微分方程'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='二阶常系数齐次线性微分方程'), (SELECT id FROM knowledge_nodes WHERE title='二阶常系数非齐次线性微分方程'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='二阶常系数非齐次线性微分方程'), (SELECT id FROM knowledge_nodes WHERE title='欧拉方程'), 'EXTENDS', 0.7, NULL);

-- === 线代内部关系 ===
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='行列式定义'), (SELECT id FROM knowledge_nodes WHERE title='行列式计算'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='行列式计算'), (SELECT id FROM knowledge_nodes WHERE title='克拉默法则'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='矩阵运算'), (SELECT id FROM knowledge_nodes WHERE title='逆矩阵'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='逆矩阵'), (SELECT id FROM knowledge_nodes WHERE title='伴随矩阵'), 'RELATED', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='矩阵运算'), (SELECT id FROM knowledge_nodes WHERE title='初等变换与初等矩阵'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='初等变换与初等矩阵'), (SELECT id FROM knowledge_nodes WHERE title='矩阵的秩'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='矩阵运算'), (SELECT id FROM knowledge_nodes WHERE title='分块矩阵'), 'EXTENDS', 0.7, NULL),
((SELECT id FROM knowledge_nodes WHERE title='矩阵的秩'), (SELECT id FROM knowledge_nodes WHERE title='向量组与线性表示'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='向量组与线性表示'), (SELECT id FROM knowledge_nodes WHERE title='向量组的线性相关性'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='向量组的线性相关性'), (SELECT id FROM knowledge_nodes WHERE title='极大线性无关组'), 'PREREQUISITE', 1.0, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='极大线性无关组'), (SELECT id FROM knowledge_nodes WHERE title='向量空间'), 'EXTENDS', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='向量空间'), (SELECT id FROM knowledge_nodes WHERE title='施密特正交化'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='施密特正交化'), (SELECT id FROM knowledge_nodes WHERE title='正交矩阵'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='矩阵的秩'), (SELECT id FROM knowledge_nodes WHERE title='齐次线性方程组'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='齐次线性方程组'), (SELECT id FROM knowledge_nodes WHERE title='非齐次线性方程组'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='行列式计算'), (SELECT id FROM knowledge_nodes WHERE title='特征值与特征向量'), 'PREREQUISITE', 1.0, '|A-λE|=0'),
((SELECT id FROM knowledge_nodes WHERE title='特征值与特征向量'), (SELECT id FROM knowledge_nodes WHERE title='相似矩阵'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='相似矩阵'), (SELECT id FROM knowledge_nodes WHERE title='矩阵对角化'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='矩阵对角化'), (SELECT id FROM knowledge_nodes WHERE title='实对称矩阵对角化'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='实对称矩阵对角化'), (SELECT id FROM knowledge_nodes WHERE title='二次型'), 'PREREQUISITE', 1.0, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='二次型'), (SELECT id FROM knowledge_nodes WHERE title='合同矩阵'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='二次型'), (SELECT id FROM knowledge_nodes WHERE title='正定二次型'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='矩阵对角化'), (SELECT id FROM knowledge_nodes WHERE title='Jordan 标准形'), 'EXTENDS', 0.6, '不能对角化时'),
((SELECT id FROM knowledge_nodes WHERE title='正交矩阵'), (SELECT id FROM knowledge_nodes WHERE title='实对称矩阵对角化'), 'PREREQUISITE', 1.0, '正交对角化');

-- === 概率内部关系 ===
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='随机事件与概率'), (SELECT id FROM knowledge_nodes WHERE title='古典概型与几何概型'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='随机事件与概率'), (SELECT id FROM knowledge_nodes WHERE title='条件概率'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='条件概率'), (SELECT id FROM knowledge_nodes WHERE title='全概率与贝叶斯公式'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='条件概率'), (SELECT id FROM knowledge_nodes WHERE title='事件独立性'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='随机事件与概率'), (SELECT id FROM knowledge_nodes WHERE title='随机变量与分布函数'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='随机变量与分布函数'), (SELECT id FROM knowledge_nodes WHERE title='伯努利分布'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='伯努利分布'), (SELECT id FROM knowledge_nodes WHERE title='二项分布'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='二项分布'), (SELECT id FROM knowledge_nodes WHERE title='几何分布与超几何分布'), 'EXTENDS', 0.8, NULL),
((SELECT id FROM knowledge_nodes WHERE title='二项分布'), (SELECT id FROM knowledge_nodes WHERE title='泊松分布'), 'EXTENDS', 0.9, '泊松定理'),
((SELECT id FROM knowledge_nodes WHERE title='随机变量与分布函数'), (SELECT id FROM knowledge_nodes WHERE title='均匀分布'), 'PREREQUISITE', 1.0, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='均匀分布'), (SELECT id FROM knowledge_nodes WHERE title='指数分布'), 'EXTENDS', 0.8, NULL),
((SELECT id FROM knowledge_nodes WHERE title='均匀分布'), (SELECT id FROM knowledge_nodes WHERE title='正态分布'), 'EXTENDS', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='随机变量与分布函数'), (SELECT id FROM knowledge_nodes WHERE title='一维随机变量函数的分布'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='随机变量与分布函数'), (SELECT id FROM knowledge_nodes WHERE title='二维随机变量'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='二维随机变量'), (SELECT id FROM knowledge_nodes WHERE title='边缘分布'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='边缘分布'), (SELECT id FROM knowledge_nodes WHERE title='条件分布'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='二维随机变量'), (SELECT id FROM knowledge_nodes WHERE title='随机变量独立性'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='随机变量独立性'), (SELECT id FROM knowledge_nodes WHERE title='二维随机变量函数分布'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='随机变量与分布函数'), (SELECT id FROM knowledge_nodes WHERE title='数学期望'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='数学期望'), (SELECT id FROM knowledge_nodes WHERE title='方差'), 'PREREQUISITE', 1.0, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='方差'), (SELECT id FROM knowledge_nodes WHERE title='协方差与相关系数'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='方差'), (SELECT id FROM knowledge_nodes WHERE title='切比雪夫不等式'), 'EXTENDS', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='切比雪夫不等式'), (SELECT id FROM knowledge_nodes WHERE title='大数定律'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='大数定律'), (SELECT id FROM knowledge_nodes WHERE title='中心极限定理'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='中心极限定理'), (SELECT id FROM knowledge_nodes WHERE title='总体与样本'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='总体与样本'), (SELECT id FROM knowledge_nodes WHERE title='抽样分布'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='抽样分布'), (SELECT id FROM knowledge_nodes WHERE title='矩估计'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='矩估计'), (SELECT id FROM knowledge_nodes WHERE title='最大似然估计'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='最大似然估计'), (SELECT id FROM knowledge_nodes WHERE title='估计量评价'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='估计量评价'), (SELECT id FROM knowledge_nodes WHERE title='正态总体均值与方差的区间估计'), 'PREREQUISITE', 1.0, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='正态总体均值与方差的区间估计'), (SELECT id FROM knowledge_nodes WHERE title='假设检验'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='假设检验'), (SELECT id FROM knowledge_nodes WHERE title='正态总体的假设检验'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='抽样分布'), (SELECT id FROM knowledge_nodes WHERE title='正态分布'), 'RELATED', 0.9, '抽样分布基于正态');

-- === 408 数据结构补充关系 ===
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='线性表概述'), (SELECT id FROM knowledge_nodes WHERE title='广义表'), 'EXTENDS', 0.7, NULL),
((SELECT id FROM knowledge_nodes WHERE title='栈'), (SELECT id FROM knowledge_nodes WHERE title='栈的应用-表达式求值'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='栈'), (SELECT id FROM knowledge_nodes WHERE title='递归与栈'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='树的基本概念'), (SELECT id FROM knowledge_nodes WHERE title='树与森林'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='哈夫曼树'), (SELECT id FROM knowledge_nodes WHERE title='哈夫曼编码应用'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='归并排序'), (SELECT id FROM knowledge_nodes WHERE title='外部排序'), 'EXTENDS', 0.9, NULL);

-- === 408 组成原理补充关系 ===
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='定点运算'), (SELECT id FROM knowledge_nodes WHERE title='乘法运算'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='乘法运算'), (SELECT id FROM knowledge_nodes WHERE title='除法运算'), 'EXTENDS', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='CPU结构'), (SELECT id FROM knowledge_nodes WHERE title='控制器-硬布线'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='控制器-硬布线'), (SELECT id FROM knowledge_nodes WHERE title='控制器-微程序'), 'RELATED', 1.0, '两种实现对比'),
((SELECT id FROM knowledge_nodes WHERE title='主存储器'), (SELECT id FROM knowledge_nodes WHERE title='主存与CPU连接'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='主存储器'), (SELECT id FROM knowledge_nodes WHERE title='存储芯片RAM与ROM'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='I/O系统'), (SELECT id FROM knowledge_nodes WHERE title='中断系统'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='中断系统'), (SELECT id FROM knowledge_nodes WHERE title='程序中断与DMA'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='指令系统'), (SELECT id FROM knowledge_nodes WHERE title='指令周期'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='指令周期'), (SELECT id FROM knowledge_nodes WHERE title='机器周期与时钟周期'), 'EXTENDS', 1.0, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='Cache缓存'), (SELECT id FROM knowledge_nodes WHERE title='Cache映射方式'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='Cache映射方式'), (SELECT id FROM knowledge_nodes WHERE title='Cache写策略'), 'EXTENDS', 1.0, NULL);

-- === 408 操作系统补充关系 ===
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='进程与线程'), (SELECT id FROM knowledge_nodes WHERE title='线程模型'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='操作系统概述'), (SELECT id FROM knowledge_nodes WHERE title='用户态与内核态'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='用户态与内核态'), (SELECT id FROM knowledge_nodes WHERE title='系统调用'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='进程与线程'), (SELECT id FROM knowledge_nodes WHERE title='进程通信IPC'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='信号量机制'), (SELECT id FROM knowledge_nodes WHERE title='管程'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='信号量机制'), (SELECT id FROM knowledge_nodes WHERE title='读者写者问题'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='信号量机制'), (SELECT id FROM knowledge_nodes WHERE title='哲学家进餐问题'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='内存管理-分页'), (SELECT id FROM knowledge_nodes WHERE title='地址变换机构'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='地址变换机构'), (SELECT id FROM knowledge_nodes WHERE title='快表TLB'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='虚拟内存管理'), (SELECT id FROM knowledge_nodes WHERE title='页面置换-LRU实现'), 'EXTENDS', 1.0, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='页面置换-LRU实现'), (SELECT id FROM knowledge_nodes WHERE title='Clock置换算法'), 'RELATED', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='虚拟内存管理'), (SELECT id FROM knowledge_nodes WHERE title='工作集与抖动'), 'EXTENDS', 1.0, NULL);

-- === 408 计算机网络补充关系 ===
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='计算机网络体系结构'), (SELECT id FROM knowledge_nodes WHERE title='协议数据单元PDU'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='TCP协议'), (SELECT id FROM knowledge_nodes WHERE title='传输层端口与套接字'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='IP协议'), (SELECT id FROM knowledge_nodes WHERE title='NAT网络地址转换'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='IP协议'), (SELECT id FROM knowledge_nodes WHERE title='DHCP协议'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='IP协议'), (SELECT id FROM knowledge_nodes WHERE title='IPv6简介'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='IP协议'), (SELECT id FROM knowledge_nodes WHERE title='网络层IP分组转发'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='TCP协议'), (SELECT id FROM knowledge_nodes WHERE title='TCP报文段格式细节'), 'EXTENDS', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='HTTP协议'), (SELECT id FROM knowledge_nodes WHERE title='FTP / SMTP / POP3 / IMAP 应用'), 'RELATED', 0.8, '应用层对比'),
((SELECT id FROM knowledge_nodes WHERE title='以太网(IEEE 802.3)'), (SELECT id FROM knowledge_nodes WHERE title='无线WiFi 802.11'), 'RELATED', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='物理层基础'), (SELECT id FROM knowledge_nodes WHERE title='广域网技术'), 'EXTENDS', 0.6, NULL);

INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='物理层基础'), (SELECT id FROM knowledge_nodes WHERE title='网络性能指标'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='HTTPS与网络安全'), (SELECT id FROM knowledge_nodes WHERE title='VPN虚拟专用网'), 'RELATED', 0.8, NULL);

-- ============================================================================
-- 跨学科关联(数学 ↔ 408 / 408 内部跨模块)
-- ============================================================================
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
((SELECT id FROM knowledge_nodes WHERE title='随机事件与概率'), (SELECT id FROM knowledge_nodes WHERE title='散列表(哈希表)'), 'CROSS_SUBJECT', 0.7, '哈希冲突概率分析(生日悖论)'),
((SELECT id FROM knowledge_nodes WHERE title='矩阵运算'), (SELECT id FROM knowledge_nodes WHERE title='图的存储结构'), 'CROSS_SUBJECT', 0.8, '邻接矩阵即矩阵存储'),
((SELECT id FROM knowledge_nodes WHERE title='矩阵的秩'), (SELECT id FROM knowledge_nodes WHERE title='图的遍历'), 'CROSS_SUBJECT', 0.5, '可达性矩阵分析'),
((SELECT id FROM knowledge_nodes WHERE title='泊松分布'), (SELECT id FROM knowledge_nodes WHERE title='进程调度算法'), 'CROSS_SUBJECT', 0.6, '到达过程建模'),
((SELECT id FROM knowledge_nodes WHERE title='指数分布'), (SELECT id FROM knowledge_nodes WHERE title='磁盘调度算法'), 'CROSS_SUBJECT', 0.6, '寻道时间建模'),
((SELECT id FROM knowledge_nodes WHERE title='数学期望'), (SELECT id FROM knowledge_nodes WHERE title='查找算法'), 'CROSS_SUBJECT', 0.7, '平均查找长度 ASL'),
((SELECT id FROM knowledge_nodes WHERE title='中心极限定理'), (SELECT id FROM knowledge_nodes WHERE title='网络性能指标'), 'CROSS_SUBJECT', 0.5, '排队论近似'),
((SELECT id FROM knowledge_nodes WHERE title='图的遍历'), (SELECT id FROM knowledge_nodes WHERE title='进程通信IPC'), 'CROSS_SUBJECT', 0.4, '进程关系图'),
((SELECT id FROM knowledge_nodes WHERE title='B树和B+树'), (SELECT id FROM knowledge_nodes WHERE title='地址变换机构'), 'CROSS_SUBJECT', 0.6, '多级页表与树结构'),
((SELECT id FROM knowledge_nodes WHERE title='队列'), (SELECT id FROM knowledge_nodes WHERE title='传输层端口与套接字'), 'CROSS_SUBJECT', 0.5, '端口接收队列');
