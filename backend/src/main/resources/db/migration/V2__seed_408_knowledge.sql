-- ============================================================================
-- 408 计算机专业基础 种子数据
-- 数据结构、计算机组成原理、操作系统、计算机网络核心知识点
-- ============================================================================

-- === 数据结构 (topic_id = 14) ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('线性表概述', '线性表是最基本的数据结构，由n个数据元素组成的有限序列。包括顺序表和链表两种实现方式。特点：元素之间是一对一的线性关系。', 'EASY', 14, '{"weight": 5, "examFreq": "高"}'),
('顺序表', '顺序表用一组地址连续的存储单元依次存储线性表中的数据元素。支持随机访问O(1)，插入删除需要移动元素O(n)。', 'EASY', 14, '{"weight": 5, "examFreq": "高"}'),
('单链表', '单链表通过指针将各个节点串联起来。每个节点包含数据域和指针域。不支持随机访问，插入删除O(1)。头插法和尾插法是两种基本建表方式。', 'EASY', 14, '{"weight": 5, "examFreq": "高"}'),
('双链表', '双链表每个节点有两个指针：prior指向前驱，next指向后继。可以双向遍历，删除操作更方便。', 'MEDIUM', 14, '{"weight": 3, "examFreq": "中"}'),
('循环链表', '循环链表的最后一个节点的指针指向头节点，形成环状结构。适用于需要循环遍历的场景如约瑟夫问题。', 'MEDIUM', 14, '{"weight": 3, "examFreq": "中"}'),
('栈', '栈是一种后进先出(LIFO)的线性表。只能在栈顶进行插入(入栈)和删除(出栈)操作。应用：表达式求值、递归、括号匹配等。', 'EASY', 14, '{"weight": 5, "examFreq": "高"}'),
('队列', '队列是一种先进先出(FIFO)的线性表。在队尾插入(入队)，在队头删除(出队)。循环队列解决假溢出问题。', 'EASY', 14, '{"weight": 5, "examFreq": "高"}'),
('串(字符串)', '串是由零个或多个字符组成的有限序列。重点掌握KMP模式匹配算法，通过next数组避免主串指针回溯。', 'MEDIUM', 14, '{"weight": 4, "examFreq": "高"}'),
('KMP算法', 'KMP算法核心是构建next数组(部分匹配表)。当匹配失败时，利用已匹配信息将模式串右移，避免重复比较。时间复杂度O(n+m)。', 'HARD', 14, '{"weight": 5, "examFreq": "高"}'),
('树的基本概念', '树是n个节点的有限集合。关键术语：根、叶子、度、深度、高度、层次。树的性质：n个节点的树有n-1条边。', 'EASY', 14, '{"weight": 4, "examFreq": "高"}'),
('二叉树', '二叉树每个节点最多有两个子树。特殊二叉树：满二叉树、完全二叉树。性质：第i层最多2^(i-1)个节点。', 'MEDIUM', 14, '{"weight": 5, "examFreq": "高"}'),
('二叉树遍历', '前序(根左右)、中序(左根右)、后序(左右根)、层序遍历。已知前序+中序或后序+中序可唯一确定二叉树。', 'MEDIUM', 14, '{"weight": 5, "examFreq": "高"}'),
('线索二叉树', '利用空指针域存放前驱/后继信息。中序线索二叉树最常用，可以高效找到节点的前驱和后继。', 'HARD', 14, '{"weight": 3, "examFreq": "中"}'),
('二叉排序树(BST)', '左子树所有节点值<根节点值<右子树所有节点值。中序遍历得到递增序列。查找、插入、删除平均O(logn)。', 'MEDIUM', 14, '{"weight": 5, "examFreq": "高"}'),
('平衡二叉树(AVL)', '任意节点左右子树高度差不超过1。通过LL、RR、LR、RL四种旋转操作保持平衡。', 'HARD', 14, '{"weight": 4, "examFreq": "高"}'),
('哈夫曼树', '带权路径长度(WPL)最小的二叉树。构造方法：每次选两个权值最小的节点合并。哈夫曼编码是前缀编码。', 'MEDIUM', 14, '{"weight": 4, "examFreq": "中"}'),
('图的基本概念', '图G=(V,E)由顶点集V和边集E组成。有向图、无向图、完全图、连通图、度、路径、回路等基本概念。', 'EASY', 14, '{"weight": 4, "examFreq": "高"}'),
('图的存储结构', '邻接矩阵：适合稠密图，空间O(n²)。邻接表：适合稀疏图，空间O(n+e)。', 'MEDIUM', 14, '{"weight": 4, "examFreq": "高"}'),
('图的遍历', 'BFS(广度优先)使用队列，类似层序遍历。DFS(深度优先)使用栈/递归，类似前序遍历。', 'MEDIUM', 14, '{"weight": 5, "examFreq": "高"}'),
('最小生成树', 'Prim算法：从顶点出发，每次选最小权边扩展。Kruskal算法：按边权排序，每次选不构成环的最小边。', 'MEDIUM', 14, '{"weight": 4, "examFreq": "高"}'),
('最短路径', 'Dijkstra算法：单源最短路，不能有负权边，O(n²)。Floyd算法：所有顶点间最短路，O(n³)。', 'HARD', 14, '{"weight": 5, "examFreq": "高"}'),
('拓扑排序', '对有向无环图(DAG)的顶点排序，使得每条边的起点在终点之前。用于检测有向图是否有环。', 'MEDIUM', 14, '{"weight": 4, "examFreq": "高"}'),
('排序算法概述', '排序算法分为内部排序和外部排序。稳定性：相等元素排序后相对位置不变。', 'EASY', 14, '{"weight": 3, "examFreq": "中"}'),
('冒泡排序', '每趟比较相邻元素并交换，最大值"冒泡"到末尾。时间O(n²)，空间O(1)，稳定排序。', 'EASY', 14, '{"weight": 3, "examFreq": "中"}'),
('快速排序', '选基准元素，将数组分为两部分：小于基准和大于基准。递归排序。平均O(nlogn)，最坏O(n²)，不稳定。', 'HARD', 14, '{"weight": 5, "examFreq": "高"}'),
('归并排序', '分治思想：将数组分为两半，递归排序后合并。时间O(nlogn)，空间O(n)，稳定排序。', 'MEDIUM', 14, '{"weight": 4, "examFreq": "高"}'),
('堆排序', '利用大顶堆/小顶堆进行排序。建堆O(n)，排序O(nlogn)，空间O(1)，不稳定。', 'HARD', 14, '{"weight": 4, "examFreq": "高"}'),
('查找算法', '顺序查找O(n)，折半查找O(logn)要求有序表。散列表(哈希表)理想情况O(1)。', 'MEDIUM', 14, '{"weight": 4, "examFreq": "高"}'),
('散列表(哈希表)', '通过散列函数将关键字映射到存储地址。冲突处理：开放定址法、链地址法。装填因子影响查找效率。', 'MEDIUM', 14, '{"weight": 5, "examFreq": "高"}'),
('B树和B+树', 'B树是多路平衡查找树，所有叶子在同一层。B+树叶子节点包含全部关键字且形成链表，适合数据库索引。', 'HARD', 14, '{"weight": 4, "examFreq": "高"}');

-- === 计算机组成原理 (topic_id = 15) ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('计算机系统层次结构', '从底到高：微程序机器级、传统机器级、操作系统级、汇编语言级、高级语言级。冯·诺依曼体系结构：运算器、控制器、存储器、输入设备、输出设备。', 'EASY', 15, '{"weight": 4, "examFreq": "高"}'),
('数据表示-进制转换', '二进制、八进制、十进制、十六进制之间的转换方法。整数部分除基取余，小数部分乘基取整。', 'EASY', 15, '{"weight": 3, "examFreq": "中"}'),
('原码反码补码', '原码：符号位+绝对值。反码：正数同原码，负数符号位不变其余取反。补码：反码+1。补码统一了加减运算。', 'MEDIUM', 15, '{"weight": 5, "examFreq": "高"}'),
('浮点数表示', '浮点数=(-1)^S × M × R^E。IEEE 754标准：单精度32位(1+8+23)，双精度64位(1+11+52)。规格化、非规格化、特殊值。', 'HARD', 15, '{"weight": 5, "examFreq": "高"}'),
('定点运算', '定点加减法：补码加减运算，溢出判断(双符号位法、单符号位法)。定点乘法：原码一位乘法、补码一位乘法(Booth算法)。', 'HARD', 15, '{"weight": 4, "examFreq": "高"}'),
('主存储器', '主存由DRAM组成，按字节编址。容量=存储单元数×每单元位数。主要技术指标：存取时间、存储周期、带宽。', 'MEDIUM', 15, '{"weight": 4, "examFreq": "高"}'),
('Cache缓存', 'Cache利用局部性原理提高访问速度。地址映射：直接映射、全相联映射、组相联映射。替换策略：LRU、FIFO、随机。', 'HARD', 15, '{"weight": 5, "examFreq": "高"}'),
('虚拟存储器', '虚拟存储器将主存和辅存统一编址。页式虚拟存储器：虚拟地址=页号+页内偏移，通过页表转换为物理地址。TLB加速地址转换。', 'HARD', 15, '{"weight": 5, "examFreq": "高"}'),
('指令系统', '指令格式：操作码+地址码。寻址方式：立即寻址、直接寻址、间接寻址、寄存器寻址、基址寻址、变址寻址等。CISC vs RISC。', 'MEDIUM', 15, '{"weight": 5, "examFreq": "高"}'),
('CPU结构', 'CPU由运算器(ALU、寄存器)和控制器(PC、IR、CU)组成。数据通路是CPU内部数据流经的路径。', 'MEDIUM', 15, '{"weight": 4, "examFreq": "高"}'),
('指令流水线', '将指令执行分为多个阶段(取指、译码、执行、访存、写回)并行执行。流水线冒险：结构冒险、数据冒险、控制冒险。', 'HARD', 15, '{"weight": 5, "examFreq": "高"}'),
('总线系统', '总线分为数据总线、地址总线、控制总线。总线仲裁：集中式(链式、计数器、独立请求)和分布式。', 'MEDIUM', 15, '{"weight": 3, "examFreq": "中"}'),
('I/O系统', '输入/输出方式：程序查询、程序中断、DMA、通道。中断向量表存储中断服务程序入口地址。', 'MEDIUM', 15, '{"weight": 4, "examFreq": "高"}');

-- === 操作系统 (topic_id = 16) ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('操作系统概述', '操作系统是管理计算机硬件和软件资源的系统软件。功能：处理机管理、存储器管理、文件管理、设备管理。特征：并发、共享、虚拟、异步。', 'EASY', 16, '{"weight": 3, "examFreq": "中"}'),
('进程与线程', '进程是资源分配的基本单位，线程是CPU调度的基本单位。进程=PCB+程序段+数据段。进程状态：就绪、运行、阻塞。', 'MEDIUM', 16, '{"weight": 5, "examFreq": "高"}'),
('进程调度算法', 'FCFS(先来先服务)、SJF(短作业优先)、优先级调度、时间片轮转(RR)、多级反馈队列。', 'MEDIUM', 16, '{"weight": 5, "examFreq": "高"}'),
('进程同步与互斥', '临界区问题：互斥、前进、有限等待。解决方法：Peterson算法、硬件方法(TSL/Swap)、信号量(P/V操作)。', 'HARD', 16, '{"weight": 5, "examFreq": "高"}'),
('信号量机制', '整型信号量和记录型信号量。P操作(wait)：申请资源，可能阻塞。V操作(signal)：释放资源，可能唤醒。经典同步问题：生产者消费者、读者写者、哲学家进餐。', 'HARD', 16, '{"weight": 5, "examFreq": "高"}'),
('死锁', '死锁条件：互斥、不可剥夺、请求并保持、循环等待。预防：破坏四个条件之一。避免：银行家算法。检测：资源分配图。', 'HARD', 16, '{"weight": 5, "examFreq": "高"}'),
('内存管理-连续分配', '单一连续分配、固定分区分配、动态分区分配。动态分区分配算法：首次适应、最佳适应、最坏适应、邻近适应。', 'MEDIUM', 16, '{"weight": 3, "examFreq": "中"}'),
('内存管理-分页', '将进程地址空间分为固定大小的页，内存分为等大的页框。通过页表实现虚拟地址到物理地址的映射。多级页表减少页表空间。', 'HARD', 16, '{"weight": 5, "examFreq": "高"}'),
('内存管理-分段', '按程序逻辑结构分段。段表：段号+段基址+段长。段页式：先分段再分页，兼具两者优点。', 'MEDIUM', 16, '{"weight": 4, "examFreq": "高"}'),
('虚拟内存管理', '请求分页：需要时才调入页面。页面置换算法：OPT(最优)、FIFO、LRU(最近最少使用)、Clock。抖动(颠簸)：频繁缺页。', 'HARD', 16, '{"weight": 5, "examFreq": "高"}'),
('文件系统', '文件的逻辑结构(流式/记录式)和物理结构(连续/链接/索引分配)。目录结构：单级、两级、树形、无环图。', 'MEDIUM', 16, '{"weight": 4, "examFreq": "高"}'),
('磁盘调度算法', 'FCFS、SSTF(最短寻道)、SCAN(电梯)、C-SCAN(单向扫描)、LOOK、C-LOOK。', 'MEDIUM', 16, '{"weight": 4, "examFreq": "高"}'),
('I/O管理', 'I/O控制方式：程序直接控制、中断驱动、DMA、通道。缓冲区管理：单缓冲、双缓冲、循环缓冲、缓冲池。SPOOLing假脱机技术。', 'MEDIUM', 16, '{"weight": 3, "examFreq": "中"}');

-- === 计算机网络 (topic_id = 17) ===
INSERT INTO knowledge_nodes (title, content, difficulty, topic_id, metadata) VALUES
('计算机网络体系结构', 'OSI七层模型：物理层、数据链路层、网络层、传输层、会话层、表示层、应用层。TCP/IP四层：网络接口层、网际层、传输层、应用层。', 'EASY', 17, '{"weight": 5, "examFreq": "高"}'),
('物理层基础', '数据通信基础：频带宽度、信道容量(奈奎斯特定理、香农定理)。编码：NRZ、曼彻斯特编码。传输介质：双绞线、光纤、无线。', 'MEDIUM', 17, '{"weight": 3, "examFreq": "中"}'),
('数据链路层-差错控制', '差错类型：位错、帧错。检错编码：奇偶校验、CRC循环冗余校验。纠错编码：海明码。', 'MEDIUM', 17, '{"weight": 4, "examFreq": "高"}'),
('数据链路层-流量控制', '停止-等待协议、后退N帧(GBN)协议、选择重传(SR)协议。滑动窗口机制。', 'HARD', 17, '{"weight": 5, "examFreq": "高"}'),
('以太网(IEEE 802.3)', 'CSMA/CD协议：载波监听多路访问/碰撞检测。最小帧长64字节。MAC地址48位。以太网帧格式。', 'MEDIUM', 17, '{"weight": 4, "examFreq": "高"}'),
('交换机与VLAN', '交换机工作在数据链路层，根据MAC地址转发帧。交换机的自学习算法。VLAN虚拟局域网实现逻辑隔离。', 'MEDIUM', 17, '{"weight": 3, "examFreq": "中"}'),
('IP协议', 'IPv4地址32位，分为网络号和主机号。子网划分、子网掩码、CIDR无类域间路由。IP数据报格式。', 'MEDIUM', 17, '{"weight": 5, "examFreq": "高"}'),
('路由算法', '静态路由和动态路由。距离向量算法(RIP)、链路状态算法(OSPF)。自治系统(AS)间路由：BGP。', 'HARD', 17, '{"weight": 5, "examFreq": "高"}'),
('ARP协议', 'ARP将IP地址解析为MAC地址。工作过程：广播ARP请求，单播ARP应答。ARP缓存表。', 'MEDIUM', 17, '{"weight": 4, "examFreq": "高"}'),
('ICMP协议', 'ICMP用于报告差错和查询。Ping使用ICMP回送请求/应答。Traceroute利用ICMP超时报文。', 'MEDIUM', 17, '{"weight": 3, "examFreq": "中"}'),
('TCP协议', 'TCP是面向连接的可靠传输协议。特点：全双工、面向字节流、可靠传输。TCP段格式：序号、确认号、窗口大小等。', 'MEDIUM', 17, '{"weight": 5, "examFreq": "高"}'),
('TCP三次握手与四次挥手', '建立连接(三次握手)：SYN→SYN+ACK→ACK。释放连接(四次挥手)：FIN→ACK→FIN→ACK。TIME_WAIT状态等待2MSL。', 'HARD', 17, '{"weight": 5, "examFreq": "高"}'),
('TCP流量控制', '滑动窗口机制实现流量控制。接收方通过窗口字段告知发送方可发送数据量。零窗口探测。', 'HARD', 17, '{"weight": 4, "examFreq": "高"}'),
('TCP拥塞控制', '四个阶段：慢开始、拥塞避免、快重传、快恢复。拥塞窗口(cwnd)和慢开始门限(ssthresh)。', 'HARD', 17, '{"weight": 5, "examFreq": "高"}'),
('UDP协议', 'UDP是无连接的不可靠传输协议。特点：无连接、尽最大努力交付、面向报文、首部开销小(8字节)。', 'EASY', 17, '{"weight": 3, "examFreq": "中"}'),
('DNS域名系统', 'DNS将域名解析为IP地址。层次结构：根域名服务器→顶级域名服务器→权威域名服务器。递归查询和迭代查询。', 'MEDIUM', 17, '{"weight": 4, "examFreq": "高"}'),
('HTTP协议', 'HTTP是无状态的应用层协议。请求方法：GET、POST、PUT、DELETE。状态码：1xx信息、2xx成功、3xx重定向、4xx客户端错误、5xx服务器错误。', 'MEDIUM', 17, '{"weight": 4, "examFreq": "高"}'),
('HTTPS与网络安全', 'HTTPS = HTTP + TLS/SSL。对称加密+非对称加密+数字证书。TLS握手过程。常见攻击：SQL注入、XSS、CSRF、DDoS。', 'HARD', 17, '{"weight": 4, "examFreq": "高"}');

-- ============================================================================
-- 知识点关系(边)数据
-- ============================================================================

-- 数据结构内部关系
INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, description) VALUES
-- 线性表关系链
((SELECT id FROM knowledge_nodes WHERE title='线性表概述'), (SELECT id FROM knowledge_nodes WHERE title='顺序表'), 'PREREQUISITE', 1.0, '线性表基础→顺序表'),
((SELECT id FROM knowledge_nodes WHERE title='线性表概述'), (SELECT id FROM knowledge_nodes WHERE title='单链表'), 'PREREQUISITE', 1.0, '线性表基础→单链表'),
((SELECT id FROM knowledge_nodes WHERE title='单链表'), (SELECT id FROM knowledge_nodes WHERE title='双链表'), 'EXTENDS', 0.8, '单链表→双链表扩展'),
((SELECT id FROM knowledge_nodes WHERE title='单链表'), (SELECT id FROM knowledge_nodes WHERE title='循环链表'), 'EXTENDS', 0.8, '单链表→循环链表扩展'),
-- 栈/队列
((SELECT id FROM knowledge_nodes WHERE title='线性表概述'), (SELECT id FROM knowledge_nodes WHERE title='栈'), 'PREREQUISITE', 1.0, '线性表→栈'),
((SELECT id FROM knowledge_nodes WHERE title='线性表概述'), (SELECT id FROM knowledge_nodes WHERE title='队列'), 'PREREQUISITE', 1.0, '线性表→队列'),
-- 串/KMP
((SELECT id FROM knowledge_nodes WHERE title='顺序表'), (SELECT id FROM knowledge_nodes WHERE title='串(字符串)'), 'RELATED', 0.7, '顺序存储关联'),
((SELECT id FROM knowledge_nodes WHERE title='串(字符串)'), (SELECT id FROM knowledge_nodes WHERE title='KMP算法'), 'PREREQUISITE', 1.0, '串→KMP'),
-- 树
((SELECT id FROM knowledge_nodes WHERE title='树的基本概念'), (SELECT id FROM knowledge_nodes WHERE title='二叉树'), 'PREREQUISITE', 1.0, '树→二叉树'),
((SELECT id FROM knowledge_nodes WHERE title='二叉树'), (SELECT id FROM knowledge_nodes WHERE title='二叉树遍历'), 'PREREQUISITE', 1.0, '二叉树→遍历'),
((SELECT id FROM knowledge_nodes WHERE title='二叉树'), (SELECT id FROM knowledge_nodes WHERE title='线索二叉树'), 'EXTENDS', 0.8, '二叉树→线索化'),
((SELECT id FROM knowledge_nodes WHERE title='二叉树遍历'), (SELECT id FROM knowledge_nodes WHERE title='二叉排序树(BST)'), 'PREREQUISITE', 1.0, '遍历→BST'),
((SELECT id FROM knowledge_nodes WHERE title='二叉排序树(BST)'), (SELECT id FROM knowledge_nodes WHERE title='平衡二叉树(AVL)'), 'EXTENDS', 1.0, 'BST→AVL'),
((SELECT id FROM knowledge_nodes WHERE title='二叉树'), (SELECT id FROM knowledge_nodes WHERE title='哈夫曼树'), 'RELATED', 0.7, '二叉树→哈夫曼'),
-- 图
((SELECT id FROM knowledge_nodes WHERE title='图的基本概念'), (SELECT id FROM knowledge_nodes WHERE title='图的存储结构'), 'PREREQUISITE', 1.0, '图概念→存储'),
((SELECT id FROM knowledge_nodes WHERE title='图的存储结构'), (SELECT id FROM knowledge_nodes WHERE title='图的遍历'), 'PREREQUISITE', 1.0, '存储→遍历'),
((SELECT id FROM knowledge_nodes WHERE title='图的遍历'), (SELECT id FROM knowledge_nodes WHERE title='最小生成树'), 'PREREQUISITE', 0.9, '遍历→MST'),
((SELECT id FROM knowledge_nodes WHERE title='图的遍历'), (SELECT id FROM knowledge_nodes WHERE title='最短路径'), 'PREREQUISITE', 0.9, '遍历→最短路'),
((SELECT id FROM knowledge_nodes WHERE title='图的遍历'), (SELECT id FROM knowledge_nodes WHERE title='拓扑排序'), 'PREREQUISITE', 0.9, '遍历→拓扑'),
-- 排序
((SELECT id FROM knowledge_nodes WHERE title='排序算法概述'), (SELECT id FROM knowledge_nodes WHERE title='冒泡排序'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='排序算法概述'), (SELECT id FROM knowledge_nodes WHERE title='快速排序'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='排序算法概述'), (SELECT id FROM knowledge_nodes WHERE title='归并排序'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='二叉树'), (SELECT id FROM knowledge_nodes WHERE title='堆排序'), 'PREREQUISITE', 0.8, '完全二叉树→堆'),
((SELECT id FROM knowledge_nodes WHERE title='查找算法'), (SELECT id FROM knowledge_nodes WHERE title='散列表(哈希表)'), 'PREREQUISITE', 1.0, '查找→哈希'),
((SELECT id FROM knowledge_nodes WHERE title='平衡二叉树(AVL)'), (SELECT id FROM knowledge_nodes WHERE title='B树和B+树'), 'EXTENDS', 0.9, 'AVL→B树'),

-- 组成原理内部关系
((SELECT id FROM knowledge_nodes WHERE title='计算机系统层次结构'), (SELECT id FROM knowledge_nodes WHERE title='数据表示-进制转换'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='数据表示-进制转换'), (SELECT id FROM knowledge_nodes WHERE title='原码反码补码'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='原码反码补码'), (SELECT id FROM knowledge_nodes WHERE title='浮点数表示'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='原码反码补码'), (SELECT id FROM knowledge_nodes WHERE title='定点运算'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='主存储器'), (SELECT id FROM knowledge_nodes WHERE title='Cache缓存'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='主存储器'), (SELECT id FROM knowledge_nodes WHERE title='虚拟存储器'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='指令系统'), (SELECT id FROM knowledge_nodes WHERE title='CPU结构'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='CPU结构'), (SELECT id FROM knowledge_nodes WHERE title='指令流水线'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='总线系统'), (SELECT id FROM knowledge_nodes WHERE title='I/O系统'), 'PREREQUISITE', 0.8, NULL),

-- 操作系统内部关系
((SELECT id FROM knowledge_nodes WHERE title='操作系统概述'), (SELECT id FROM knowledge_nodes WHERE title='进程与线程'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='进程与线程'), (SELECT id FROM knowledge_nodes WHERE title='进程调度算法'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='进程与线程'), (SELECT id FROM knowledge_nodes WHERE title='进程同步与互斥'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='进程同步与互斥'), (SELECT id FROM knowledge_nodes WHERE title='信号量机制'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='信号量机制'), (SELECT id FROM knowledge_nodes WHERE title='死锁'), 'RELATED', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='内存管理-连续分配'), (SELECT id FROM knowledge_nodes WHERE title='内存管理-分页'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='内存管理-分页'), (SELECT id FROM knowledge_nodes WHERE title='内存管理-分段'), 'RELATED', 0.8, NULL),
((SELECT id FROM knowledge_nodes WHERE title='内存管理-分页'), (SELECT id FROM knowledge_nodes WHERE title='虚拟内存管理'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='文件系统'), (SELECT id FROM knowledge_nodes WHERE title='磁盘调度算法'), 'RELATED', 0.8, NULL),

-- 计算机网络内部关系
((SELECT id FROM knowledge_nodes WHERE title='计算机网络体系结构'), (SELECT id FROM knowledge_nodes WHERE title='物理层基础'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='物理层基础'), (SELECT id FROM knowledge_nodes WHERE title='数据链路层-差错控制'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='数据链路层-差错控制'), (SELECT id FROM knowledge_nodes WHERE title='数据链路层-流量控制'), 'RELATED', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='数据链路层-差错控制'), (SELECT id FROM knowledge_nodes WHERE title='以太网(IEEE 802.3)'), 'PREREQUISITE', 0.9, NULL),
((SELECT id FROM knowledge_nodes WHERE title='以太网(IEEE 802.3)'), (SELECT id FROM knowledge_nodes WHERE title='交换机与VLAN'), 'EXTENDS', 0.8, NULL),
((SELECT id FROM knowledge_nodes WHERE title='IP协议'), (SELECT id FROM knowledge_nodes WHERE title='路由算法'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='IP协议'), (SELECT id FROM knowledge_nodes WHERE title='ARP协议'), 'RELATED', 0.8, NULL),
((SELECT id FROM knowledge_nodes WHERE title='IP协议'), (SELECT id FROM knowledge_nodes WHERE title='ICMP协议'), 'RELATED', 0.7, NULL),
((SELECT id FROM knowledge_nodes WHERE title='TCP协议'), (SELECT id FROM knowledge_nodes WHERE title='TCP三次握手与四次挥手'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='TCP协议'), (SELECT id FROM knowledge_nodes WHERE title='TCP流量控制'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='TCP流量控制'), (SELECT id FROM knowledge_nodes WHERE title='TCP拥塞控制'), 'PREREQUISITE', 1.0, NULL),
((SELECT id FROM knowledge_nodes WHERE title='TCP协议'), (SELECT id FROM knowledge_nodes WHERE title='UDP协议'), 'RELATED', 0.7, '对比学习'),
((SELECT id FROM knowledge_nodes WHERE title='DNS域名系统'), (SELECT id FROM knowledge_nodes WHERE title='HTTP协议'), 'RELATED', 0.6, NULL),
((SELECT id FROM knowledge_nodes WHERE title='HTTP协议'), (SELECT id FROM knowledge_nodes WHERE title='HTTPS与网络安全'), 'EXTENDS', 1.0, NULL),

-- 跨学科关联
((SELECT id FROM knowledge_nodes WHERE title='图的遍历'), (SELECT id FROM knowledge_nodes WHERE title='路由算法'), 'CROSS_SUBJECT', 0.8, '图的BFS/DFS与路由发现'),
((SELECT id FROM knowledge_nodes WHERE title='栈'), (SELECT id FROM knowledge_nodes WHERE title='进程与线程'), 'CROSS_SUBJECT', 0.6, '栈帧与进程运行时栈'),
((SELECT id FROM knowledge_nodes WHERE title='队列'), (SELECT id FROM knowledge_nodes WHERE title='进程调度算法'), 'CROSS_SUBJECT', 0.7, '就绪队列调度'),
((SELECT id FROM knowledge_nodes WHERE title='B树和B+树'), (SELECT id FROM knowledge_nodes WHERE title='文件系统'), 'CROSS_SUBJECT', 0.8, 'B+树作为文件索引'),
((SELECT id FROM knowledge_nodes WHERE title='散列表(哈希表)'), (SELECT id FROM knowledge_nodes WHERE title='内存管理-分页'), 'CROSS_SUBJECT', 0.6, '页表的哈希实现'),
((SELECT id FROM knowledge_nodes WHERE title='Cache缓存'), (SELECT id FROM knowledge_nodes WHERE title='虚拟内存管理'), 'CROSS_SUBJECT', 0.9, '缓存与虚存都利用局部性原理'),
((SELECT id FROM knowledge_nodes WHERE title='数据链路层-流量控制'), (SELECT id FROM knowledge_nodes WHERE title='TCP流量控制'), 'CROSS_SUBJECT', 0.8, '滑动窗口在不同层的应用'),
((SELECT id FROM knowledge_nodes WHERE title='最短路径'), (SELECT id FROM knowledge_nodes WHERE title='路由算法'), 'CROSS_SUBJECT', 0.9, 'Dijkstra与OSPF');
