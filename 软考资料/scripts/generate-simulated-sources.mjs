import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const sourcesDir = path.join(rootDir, 'sources');

const years = [2019, 2020, 2021, 2022, 2023, 2024];
const sourceFileByYear = new Map(years.map((year) => [year, `${year}-上午-软件设计师.json`]));
const yearContexts = ['在线选课平台', '图书借阅系统', '校园报修系统', '电商订单系统', '医院挂号系统', '仓储管理系统'];

const makeQuestion = ({ stem, correct, distractors, analysis }) => ({
  stem,
  options: {
    A: correct,
    B: distractors[0],
    C: distractors[1],
    D: distractors[2]
  },
  answer: 'A',
  analysis
});

const toBinary = (value, width = 8) => value.toString(2).padStart(width, '0');

const catalog = [
  ({ yearIndex }) => {
    const decimalValue = 41 + yearIndex * 3;
    return makeQuestion({
      stem: `十进制数 ${decimalValue} 转换为二进制数，结果是（ ）。`,
      correct: toBinary(decimalValue).replace(/^0+/, ''),
      distractors: [toBinary(decimalValue + 1).replace(/^0+/, ''), toBinary(decimalValue - 1).replace(/^0+/, ''), toBinary(decimalValue + 4).replace(/^0+/, '')],
      analysis: '十进制整数不断除以 2 取余，再逆序排列余数。'
    });
  },
  ({ yearIndex }) => {
    const absoluteValue = 13 + yearIndex;
    return makeQuestion({
      stem: `若机器字长为 8 位，采用补码表示，则整数 -${absoluteValue} 的机器码是（ ）。`,
      correct: toBinary(256 - absoluteValue),
      distractors: [toBinary(absoluteValue), toBinary(255 - absoluteValue), `1${toBinary(absoluteValue, 7)}`],
      analysis: '负数补码等于其绝对值原码按位取反后加 1，也可用 2^8 减去该绝对值。'
    });
  },
  () => makeQuestion({
    stem: '在五级指令流水线中，当流水线稳定工作后，其主要性能特点是（ ）。',
    correct: '理想情况下接近每个时钟周期完成一条指令',
    distractors: ['每条指令的执行时间一定缩短为原来的五分之一', '所有数据相关都会自动消失', '流水线级数越多性能一定越高'],
    analysis: '流水线提高的是吞吐率，不必然等比例缩短单条指令延迟。'
  }),
  () => makeQuestion({
    stem: '程序顺序访问数组元素时，最能体现的局部性原理是（ ）。',
    correct: '空间局部性',
    distractors: ['时间局部性', '控制局部性', '随机局部性'],
    analysis: '相邻存储单元在短时间内被连续访问，体现空间局部性。'
  }),
  () => makeQuestion({
    stem: '与程序查询方式相比，中断方式进行 I/O 控制的主要优点是（ ）。',
    correct: '减少 CPU 等待外设完成操作的时间',
    distractors: ['完全不需要保存现场', '不需要设备控制器参与', '一定比 DMA 传输更适合大块数据'],
    analysis: '中断让 CPU 可在外设工作期间执行其他任务，提高利用率。'
  }),
  () => makeQuestion({
    stem: 'DMA 方式适合用于磁盘与内存之间的大批量数据传输，原因是（ ）。',
    correct: '数据传输过程主要由 DMA 控制器完成，减少 CPU 逐字节搬运',
    distractors: ['DMA 不需要总线', 'DMA 只能传输一个字节', 'DMA 会取消内存地址'],
    analysis: 'DMA 可直接在 I/O 设备和内存之间传输数据，CPU 主要负责初始化和结束处理。'
  }),
  () => makeQuestion({
    stem: 'RAID 1 的核心思想是（ ）。',
    correct: '通过磁盘镜像提高可靠性',
    distractors: ['通过奇偶校验压缩数据', '把一个文件只保存在单个磁盘上', '只用于提升 CPU 主频'],
    analysis: 'RAID 1 将同样的数据写入两个或多个磁盘，任一副本可用于恢复。'
  }),
  () => makeQuestion({
    stem: '两个可靠度分别为 R1 和 R2 的部件串联组成系统，系统可靠度为（ ）。',
    correct: 'R1 × R2',
    distractors: ['R1 + R2', '1 - R1 × R2', 'R1 / R2'],
    analysis: '串联系统要求所有部件都正常工作，因此可靠度为各部件可靠度的乘积。'
  }),
  ({ context }) => makeQuestion({
    stem: `${context} 中某进程已经具备运行条件，只等待处理器分配，此时该进程处于（ ）。`,
    correct: '就绪状态',
    distractors: ['运行状态', '阻塞状态', '终止状态'],
    analysis: '就绪状态表示除 CPU 外运行所需资源已经满足。'
  }),
  () => makeQuestion({
    stem: '用于实现临界区互斥访问的二元信号量，其初值通常设置为（ ）。',
    correct: '1',
    distractors: ['0', '-1', '进程总数加 1'],
    analysis: '二元信号量初值为 1 表示临界资源初始可用。'
  }),
  () => makeQuestion({
    stem: '产生死锁的必要条件不包括（ ）。',
    correct: '资源有序分配',
    distractors: ['互斥条件', '不可剥夺条件', '循环等待条件'],
    analysis: '死锁四个必要条件是互斥、占有且等待、不可剥夺和循环等待。资源有序分配常用于预防死锁。'
  }),
  () => makeQuestion({
    stem: '银行家算法属于（ ）。',
    correct: '死锁避免算法',
    distractors: ['死锁检测算法', '页面置换算法', '磁盘调度算法'],
    analysis: '银行家算法在资源分配前判断系统是否仍处于安全状态。'
  }),
  () => makeQuestion({
    stem: '时间片轮转调度算法最适合强调（ ）的分时系统。',
    correct: '响应时间公平性',
    distractors: ['批处理吞吐量唯一最大', '长期作业绝对优先', '避免所有上下文切换'],
    analysis: '时间片轮转让就绪进程轮流获得 CPU，适合交互式分时环境。'
  }),
  () => makeQuestion({
    stem: '页面置换算法 LRU 选择换出的页面是（ ）。',
    correct: '最近最久未使用的页面',
    distractors: ['最早进入内存的页面', '访问次数最多的页面', '编号最大的页面'],
    analysis: 'LRU 根据近期访问历史推测未来访问情况。'
  }),
  () => makeQuestion({
    stem: '虚拟存储技术的主要作用是（ ）。',
    correct: '让程序可使用大于实际内存的逻辑地址空间',
    distractors: ['取消外存访问', '使 CPU 不再需要地址转换', '保证所有页面永不缺页'],
    analysis: '虚拟存储通过地址映射和页面调入调出扩展逻辑内存空间。'
  }),
  () => makeQuestion({
    stem: '文件采用索引分配方式时，最突出的优点是（ ）。',
    correct: '支持随机访问文件块',
    distractors: ['完全不需要索引块空间', '只能顺序访问', '文件大小必须固定不变'],
    analysis: '索引块记录逻辑块到物理块的映射，便于随机定位。'
  }),
  () => makeQuestion({
    stem: '关系数据库中，主键必须满足（ ）。',
    correct: '唯一且非空',
    distractors: ['可以重复但不能为空', '可以为空但不能重复', '必须由四个属性组成'],
    analysis: '主键用于唯一标识元组，因此值不能重复也不能为 NULL。'
  }),
  () => makeQuestion({
    stem: '若关系模式已满足 2NF，并且不存在非主属性对候选键的传递依赖，则该模式满足（ ）。',
    correct: '第三范式',
    distractors: ['第一范式', '第二范式但不满足第三范式', '非规范化形式'],
    analysis: '3NF 要求消除非主属性对键的传递函数依赖。'
  }),
  ({ context }) => makeQuestion({
    stem: `${context} 的概念模型中，学生和课程之间是多对多联系，转换为关系模型时通常应（ ）。`,
    correct: '增加一个包含双方主键的联系关系',
    distractors: ['只把学生编号放入课程表即可', '删除课程实体', '把两个实体强制合并成一个关系'],
    analysis: '多对多联系转换时通常形成独立关系，并包含参与实体的主键。'
  }),
  () => makeQuestion({
    stem: 'SQL 中 INNER JOIN 的语义是（ ）。',
    correct: '返回两个表中满足连接条件的匹配行',
    distractors: ['返回左表全部行且忽略右表', '返回右表全部行且忽略左表', '只返回两个表的列名'],
    analysis: '内连接只保留连接条件为真的组合。'
  }),
  () => makeQuestion({
    stem: '事务的原子性强调（ ）。',
    correct: '事务中的操作要么全部完成，要么全部不做',
    distractors: ['事务执行结果永久保存', '多个事务互不影响的隔离程度', '数据库从一个一致状态到另一个一致状态'],
    analysis: '原子性关注事务内部操作的不可分割性。'
  }),
  () => makeQuestion({
    stem: '事务隔离性不足时，可能出现的问题是（ ）。',
    correct: '脏读、不可重复读或幻读',
    distractors: ['只能出现语法错误', '磁盘物理损坏', '编译器无法生成目标代码'],
    analysis: '隔离级别控制并发事务之间可见性，隔离不足会产生并发读写异常。'
  }),
  () => makeQuestion({
    stem: 'B+ 树索引特别适合支持（ ）。',
    correct: '范围查询',
    distractors: ['只支持随机加密', '禁止顺序遍历', '只能保存非关键字数据'],
    analysis: 'B+ 树叶子结点有序并常以链表相连，适合范围扫描。'
  }),
  () => makeQuestion({
    stem: '数据库规范化通常带来的代价是（ ）。',
    correct: '查询时可能需要更多连接操作',
    distractors: ['一定导致数据大量重复', '不能消除插入异常', '主键不再可用'],
    analysis: '规范化减少冗余和异常，但拆表后复杂查询可能增加连接成本。'
  }),
  () => makeQuestion({
    stem: 'OSI 参考模型中负责端到端可靠传输控制的是（ ）。',
    correct: '传输层',
    distractors: ['物理层', '数据链路层', '表示层'],
    analysis: '传输层在主机进程之间提供端到端通信服务。'
  }),
  () => makeQuestion({
    stem: 'TCP 协议的主要特点是（ ）。',
    correct: '面向连接并提供可靠传输',
    distractors: ['无连接且不确认', '只用于域名解析', '工作在网络层并替代 IP'],
    analysis: 'TCP 通过连接、序号、确认和重传等机制实现可靠传输。'
  }),
  () => makeQuestion({
    stem: '常规 DNS 查询通常优先使用的传输协议是（ ）。',
    correct: 'UDP',
    distractors: ['ICMP', 'ARP', 'SMTP'],
    analysis: 'DNS 普通查询多使用 UDP 53 端口，区域传送等场景可使用 TCP。'
  }),
  ({ yearIndex }) => {
    const prefix = [26, 27, 28, 25, 24, 23][yearIndex];
    const hostCount = 2 ** (32 - prefix) - 2;
    return makeQuestion({
      stem: `某 IPv4 子网前缀长度为 /${prefix}，可分配给主机的地址数量是（ ）。`,
      correct: `${hostCount}`,
      distractors: [`${hostCount + 2}`, `${Math.max(hostCount - 2, 0)}`, `${2 ** (32 - prefix)}`],
      analysis: 'IPv4 普通子网可用主机数为 2 的主机位数次方减去网络地址和广播地址。'
    });
  },
  () => makeQuestion({
    stem: 'IPv4 地址 192.168.1.0/24 对应的默认子网掩码写法是（ ）。',
    correct: '255.255.255.0',
    distractors: ['255.255.0.0', '255.0.0.0', '255.255.255.255'],
    analysis: '/24 表示前 24 位为网络位，即前三个字节均为 255。'
  }),
  () => makeQuestion({
    stem: 'DNS 的主要功能是（ ）。',
    correct: '将域名解析为 IP 地址等资源记录',
    distractors: ['把二进制程序编译成机器码', '为磁盘文件建立索引', '在数据库中执行事务回滚'],
    analysis: 'DNS 是分布式命名系统，用于域名与资源记录的解析。'
  }),
  () => makeQuestion({
    stem: 'HTTP 状态码 404 表示（ ）。',
    correct: '请求的资源不存在',
    distractors: ['服务器内部错误', '永久重定向', '请求成功且返回内容'],
    analysis: '404 Not Found 表示服务器未找到请求资源。'
  }),
  () => makeQuestion({
    stem: 'HTTPS 在 HTTP 基础上主要增加了（ ）。',
    correct: 'TLS/SSL 提供的加密与身份认证能力',
    distractors: ['取消 TCP 三次握手', '只允许明文传输', '直接替代所有数据库协议'],
    analysis: 'HTTPS 使用 TLS 对通信进行加密、完整性保护和身份认证。'
  }),
  () => makeQuestion({
    stem: '下列算法中，属于对称加密算法的是（ ）。',
    correct: 'AES',
    distractors: ['RSA', 'ECC', 'DSA'],
    analysis: 'AES 加密和解密使用同一密钥，属于对称加密。'
  }),
  () => makeQuestion({
    stem: '数字签名中，发送方通常使用（ ）生成签名。',
    correct: '发送方私钥',
    distractors: ['发送方公钥', '接收方公钥', '公开的哈希值'],
    analysis: '数字签名由私钥生成，接收方用对应公钥验证。'
  }),
  () => makeQuestion({
    stem: '密码学哈希函数最重要的用途之一是（ ）。',
    correct: '校验数据完整性',
    distractors: ['压缩任意数据且可无损还原', '自动提升网络带宽', '替代所有访问控制'],
    analysis: '哈希值可用于比较数据是否被篡改，但不能从哈希值还原原文。'
  }),
  () => makeQuestion({
    stem: 'RBAC 访问控制模型中，权限通常分配给（ ）。',
    correct: '角色',
    distractors: ['网卡', '磁盘扇区', '编译器词法单元'],
    analysis: 'RBAC 通过用户与角色、角色与权限的关联简化授权管理。'
  }),
  () => makeQuestion({
    stem: '栈的典型操作特征是（ ）。',
    correct: '后进先出',
    distractors: ['先进先出', '随机进出', '按关键字有序进出'],
    analysis: '栈只能在栈顶进行插入和删除，因此后进先出。'
  }),
  () => makeQuestion({
    stem: '队列的典型操作特征是（ ）。',
    correct: '先进先出',
    distractors: ['后进先出', '只允许中间插入', '按权值自动排序'],
    analysis: '队列从队尾入队、队头出队，体现先进先出。'
  }),
  () => makeQuestion({
    stem: '在任意非空二叉树中，度为 0 的结点数 n0 与度为 2 的结点数 n2 的关系是（ ）。',
    correct: 'n0 = n2 + 1',
    distractors: ['n0 = n2', 'n0 = 2n2', 'n2 = n0 + 1'],
    analysis: '二叉树的基本性质：叶子结点数等于度为 2 的结点数加 1。'
  }),
  () => makeQuestion({
    stem: '若已知一棵二叉树的先序序列和中序序列，且结点互不相同，则（ ）。',
    correct: '可以唯一确定该二叉树',
    distractors: ['只能确定叶子数', '不能确定根结点', '只能确定树的高度'],
    analysis: '先序确定根，中序划分左右子树，可递归唯一构造。'
  }),
  () => makeQuestion({
    stem: '小顶堆中任意结点与其孩子结点的关键字关系是（ ）。',
    correct: '父结点关键字不大于孩子结点关键字',
    distractors: ['父结点关键字不小于孩子结点关键字', '左孩子一定小于右孩子', '所有叶子必须相等'],
    analysis: '小顶堆保证每个父结点不大于其孩子，因此堆顶为最小值。'
  }),
  () => makeQuestion({
    stem: '拓扑排序适用于（ ）。',
    correct: '有向无环图',
    distractors: ['任意无向完全图', '含负权环的有向图', '只有一个顶点的堆'],
    analysis: '拓扑序描述有向无环图中顶点之间的先后依赖关系。'
  }),
  () => makeQuestion({
    stem: 'Dijkstra 算法求单源最短路径时，通常要求边权满足（ ）。',
    correct: '非负',
    distractors: ['全部为负', '必须相等', '必须为整数且大于 100'],
    analysis: 'Dijkstra 基于贪心选择当前最短路径，负权边会破坏其正确性。'
  }),
  () => makeQuestion({
    stem: '在无权图中求从一个顶点到其他顶点的最短路径，适合采用（ ）。',
    correct: '广度优先搜索',
    distractors: ['快速排序', '二分查找', '哈夫曼编码'],
    analysis: '无权图中 BFS 按层扩展，第一次到达即为最短边数路径。'
  }),
  () => makeQuestion({
    stem: '快速排序在平均情况下的时间复杂度是（ ）。',
    correct: 'O(n log n)',
    distractors: ['O(n)', 'O(n^2 log n)', 'O(1)'],
    analysis: '快速排序平均每次划分较均衡，递归层数约 log n，每层处理 n 个元素。'
  }),
  () => makeQuestion({
    stem: '下列排序算法中，通常具有稳定性的是（ ）。',
    correct: '归并排序',
    distractors: ['堆排序', '选择排序', '快速排序的常见原地实现'],
    analysis: '归并排序在合并时可保持相等关键字原有相对次序。'
  }),
  () => makeQuestion({
    stem: '散列表采用链地址法处理冲突时，发生冲突的记录会（ ）。',
    correct: '链接到同一地址对应的链表中',
    distractors: ['直接删除', '移动到 CPU 寄存器', '改写哈希函数定义'],
    analysis: '链地址法为每个散列地址维护链表或桶，冲突元素进入同一链。'
  }),
  ({ context }) => makeQuestion({
    stem: `${context} 的软件需求规格说明书主要作为（ ）。`,
    correct: '开发、测试和验收的重要依据',
    distractors: ['编译器优化代码的唯一输入', '数据库自动备份脚本', '操作系统进程调度表'],
    analysis: 'SRS 描述系统应提供的功能和约束，是后续设计、测试和验收的基准。'
  }),
  () => makeQuestion({
    stem: '瀑布模型更适合（ ）的软件项目。',
    correct: '需求明确且变更较少',
    distractors: ['需求高度不确定且频繁试错', '完全不需要文档', '无法划分阶段'],
    analysis: '瀑布模型强调阶段顺序和文档，适合稳定需求环境。'
  }),
  () => makeQuestion({
    stem: '迭代开发模型的主要优点是（ ）。',
    correct: '可逐步交付并持续吸收反馈',
    distractors: ['一次性冻结所有需求', '不需要任何测试', '只能用于硬件生产'],
    analysis: '迭代开发通过多轮增量完善系统，便于应对变化和降低风险。'
  }),
  () => makeQuestion({
    stem: '原型化方法最常用于（ ）。',
    correct: '帮助澄清用户需求',
    distractors: ['替代所有系统测试', '计算磁盘寻道时间', '完成机器指令流水控制'],
    analysis: '原型让用户尽早看到交互或功能雏形，从而反馈真实需求。'
  }),
  () => makeQuestion({
    stem: 'UML 用例图主要描述（ ）。',
    correct: '系统外部参与者与系统功能之间的关系',
    distractors: ['对象之间按时间顺序发送消息', '类中方法的机器码', '数据库页的物理布局'],
    analysis: '用例图从用户视角表示系统提供的外部可见服务。'
  }),
  () => makeQuestion({
    stem: 'UML 类图中，空心三角箭头通常表示（ ）。',
    correct: '泛化关系',
    distractors: ['依赖关系', '消息返回', '对象销毁'],
    analysis: '类图中泛化表示继承关系，箭头指向父类或更一般的元素。'
  }),
  () => makeQuestion({
    stem: 'UML 顺序图最适合描述（ ）。',
    correct: '对象之间消息交互的时间顺序',
    distractors: ['系统部署节点的物理拓扑', '类属性的数据类型范围', '项目成本的挣值曲线'],
    analysis: '顺序图强调生命线和消息随时间的先后关系。'
  }),
  () => makeQuestion({
    stem: 'UML 活动图最适合描述（ ）。',
    correct: '业务流程或控制流',
    distractors: ['二进制补码编码', '哈希冲突链长度', 'TCP 报文首部校验'],
    analysis: '活动图用于表达流程、分支、并发和汇合等行为。'
  }),
  () => makeQuestion({
    stem: 'UML 状态图关注的是（ ）。',
    correct: '对象状态及触发状态变化的事件',
    distractors: ['磁盘块连续分配', 'SQL 查询优化器的执行计划', '加密密钥长度换算'],
    analysis: '状态图描述对象在生命周期中的状态及转移。'
  }),
  () => makeQuestion({
    stem: '当一个对象状态改变时需要自动通知多个依赖对象，宜采用（ ）。',
    correct: '观察者模式',
    distractors: ['单例模式', '适配器模式', '解释器模式'],
    analysis: '观察者模式定义一对多依赖，主题变化时通知观察者。'
  }),
  () => makeQuestion({
    stem: '需要在运行时切换同一类算法的不同实现，宜采用（ ）。',
    correct: '策略模式',
    distractors: ['装饰器模式', '享元模式', '备忘录模式'],
    analysis: '策略模式将算法封装为可替换对象，使算法独立于使用者变化。'
  }),
  () => makeQuestion({
    stem: '将对象创建过程延迟到子类决定，体现的是（ ）。',
    correct: '工厂方法模式',
    distractors: ['观察者模式', '代理模式', '命令模式'],
    analysis: '工厂方法定义创建对象的接口，由子类决定实例化哪一个类。'
  }),
  () => makeQuestion({
    stem: '为了让接口不兼容的类可以协同工作，宜采用（ ）。',
    correct: '适配器模式',
    distractors: ['单例模式', '迭代器模式', '访问者模式'],
    analysis: '适配器将一个类的接口转换成客户期望的接口。'
  }),
  () => makeQuestion({
    stem: '系统中只应存在一个日志管理器实例，并提供全局访问点，宜采用（ ）。',
    correct: '单例模式',
    distractors: ['桥接模式', '组合模式', '状态模式'],
    analysis: '单例模式确保类只有一个实例，并提供访问该实例的方法。'
  }),
  () => makeQuestion({
    stem: '良好模块设计通常追求（ ）。',
    correct: '高内聚、低耦合',
    distractors: ['低内聚、高耦合', '无接口、无职责', '所有功能写在一个模块中'],
    analysis: '高内聚让模块职责集中，低耦合降低模块间依赖。'
  }),
  () => makeQuestion({
    stem: '黑盒测试设计测试用例时，常用的方法是（ ）。',
    correct: '等价类划分',
    distractors: ['语句覆盖', '路径覆盖', '判定覆盖'],
    analysis: '等价类划分依据输入输出规格设计用例，不关注程序内部结构。'
  }),
  () => makeQuestion({
    stem: '白盒测试关注的是（ ）。',
    correct: '程序内部结构和执行路径',
    distractors: ['只关注用户界面颜色', '只验证安装包大小', '完全不需要源代码信息'],
    analysis: '白盒测试利用代码结构设计覆盖语句、分支、路径等用例。'
  }),
  () => makeQuestion({
    stem: '边界值分析法适合发现（ ）附近的错误。',
    correct: '输入或输出范围边界',
    distractors: ['CPU 主频最大值', '网页背景颜色', '磁盘品牌名称'],
    analysis: '很多缺陷发生在取值范围的临界点，边界值分析专门覆盖这些点。'
  }),
  () => makeQuestion({
    stem: '单元测试的主要对象是（ ）。',
    correct: '程序模块或函数等最小可测试单元',
    distractors: ['完整上线后的生产环境', '整个组织的预算流程', '网络运营商骨干网'],
    analysis: '单元测试在较小粒度验证模块内部逻辑。'
  }),
  () => makeQuestion({
    stem: '集成测试重点检查（ ）。',
    correct: '模块之间的接口和协作',
    distractors: ['单个语句的词法拼写', '显示器物理亮度', '硬盘转速标签'],
    analysis: '集成测试在模块组合后验证接口、数据传递和交互逻辑。'
  }),
  () => makeQuestion({
    stem: '修改缺陷后重新运行相关测试，主要属于（ ）。',
    correct: '回归测试',
    distractors: ['冒烟测试一定失败', '性能建模', '需求获取'],
    analysis: '回归测试用于确认修改没有破坏已有功能。'
  }),
  () => makeQuestion({
    stem: '项目网络计划中，关键路径是指（ ）。',
    correct: '总持续时间最长且决定项目工期的路径',
    distractors: ['成本最低的路径', '活动数量最少的路径', '完全没有依赖的路径'],
    analysis: '关键路径上的活动延误通常会直接影响项目完工时间。'
  }),
  ({ yearIndex }) => {
    const optimistic = 2 + yearIndex;
    const mostLikely = 5 + yearIndex;
    const pessimistic = 14 + yearIndex;
    const expected = ((optimistic + 4 * mostLikely + pessimistic) / 6).toFixed(1);
    return makeQuestion({
      stem: `某活动三点估算的乐观时间为 ${optimistic} 天、最可能时间为 ${mostLikely} 天、悲观时间为 ${pessimistic} 天，则 PERT 期望时间约为（ ）。`,
      correct: `${expected} 天`,
      distractors: [`${mostLikely} 天`, `${pessimistic - optimistic} 天`, `${(optimistic + mostLikely + pessimistic).toFixed(1)} 天`],
      analysis: 'PERT 期望时间公式为 (乐观 + 4×最可能 + 悲观) / 6。'
    });
  },
  ({ yearIndex }) => {
    const probability = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45][yearIndex];
    const loss = 10000 + yearIndex * 2000;
    return makeQuestion({
      stem: `某风险发生概率为 ${probability}，一旦发生损失为 ${loss} 元，则风险暴露值为（ ）。`,
      correct: `${probability * loss} 元`,
      distractors: [`${loss / probability} 元`, `${loss - probability} 元`, `${probability + loss} 元`],
      analysis: '风险暴露值通常按风险发生概率乘以风险损失计算。'
    });
  },
  () => makeQuestion({
    stem: 'CMMI 成熟度等级 3 通常称为（ ）。',
    correct: '已定义级',
    distractors: ['初始级', '已管理级', '优化级'],
    analysis: 'CMMI 五级通常为初始、已管理、已定义、量化管理、优化。'
  }),
  () => makeQuestion({
    stem: '圈复杂度越高，通常意味着程序（ ）。',
    correct: '控制路径越复杂，测试和维护难度可能越大',
    distractors: ['一定没有任何分支', '一定运行速度更快', '不需要任何测试用例'],
    analysis: '圈复杂度反映独立路径数量，可作为复杂度和测试规模参考。'
  }),
  () => makeQuestion({
    stem: '编译过程中的词法分析阶段主要任务是（ ）。',
    correct: '把字符流识别为记号序列',
    distractors: ['生成数据库索引', '执行页面置换', '计算项目关键路径'],
    analysis: '词法分析根据词法规则扫描源程序，输出 token 序列。'
  }),
  () => makeQuestion({
    stem: '编译过程中的语法分析阶段通常会构造（ ）。',
    correct: '语法树或分析树',
    distractors: ['磁盘分区表', 'IP 路由表', '风险登记册'],
    analysis: '语法分析依据文法判断 token 序列是否符合语法结构。'
  }),
  () => makeQuestion({
    stem: '数据流图中，外部实体通常表示（ ）。',
    correct: '系统边界之外与系统交换数据的人、组织或系统',
    distractors: ['程序中的局部变量', '数据库中的主键约束', 'CPU 内部寄存器'],
    analysis: '外部实体位于系统范围之外，是数据的来源或去向。'
  }),
  () => makeQuestion({
    stem: '结构化设计中，从数据流图导出模块结构时常用的方法是（ ）。',
    correct: '变换分析和事务分析',
    distractors: ['页面置换和磁盘调度', '冒泡排序和堆排序', '加密和解密'],
    analysis: '结构化设计可根据数据流特征采用变换分析或事务分析形成模块结构。'
  }),
  () => makeQuestion({
    stem: '面向对象分析中，封装的主要目的之一是（ ）。',
    correct: '隐藏对象内部实现并通过接口访问',
    distractors: ['让所有属性必须公开', '取消对象之间的消息传递', '强制所有类只能有一个实例'],
    analysis: '封装把数据和操作组织在对象内部，降低外部对实现细节的依赖。'
  }),
  () => makeQuestion({
    stem: '多态使得程序可以（ ）。',
    correct: '通过统一接口调用不同对象的不同实现',
    distractors: ['禁止方法重写', '删除继承关系', '让所有对象占用相同内存地址'],
    analysis: '多态提高扩展性，调用方可面向抽象接口编程。'
  }),
  () => makeQuestion({
    stem: '耦合类型中，通常最不希望出现的是（ ）。',
    correct: '内容耦合',
    distractors: ['数据耦合', '标记耦合', '控制耦合'],
    analysis: '内容耦合表示一个模块直接访问或修改另一个模块内部内容，耦合程度最高。'
  }),
  () => makeQuestion({
    stem: '内聚类型中，通常认为较理想的是（ ）。',
    correct: '功能内聚',
    distractors: ['偶然内聚', '逻辑内聚', '时间内聚'],
    analysis: '功能内聚表示模块内所有成分共同完成单一明确功能。'
  })
];

const questionsPerPaper = 75;

if (catalog.length < questionsPerPaper) {
  throw new Error(`题目模板数量至少应为 ${questionsPerPaper}，当前为 ${catalog.length}`);
}

const createQuestions = (year, yearIndex) => Array.from({ length: questionsPerPaper }, (_, entryIndex) => {
  const catalogIndex = (entryIndex + yearIndex) % catalog.length;
  const createEntry = catalog[catalogIndex];
  const context = yearContexts[(yearIndex + entryIndex) % yearContexts.length];
  return {
    number: entryIndex + 1,
    ...createEntry({ context, year, yearIndex, entryIndex: catalogIndex })
  };
});

await mkdir(sourcesDir, { recursive: true });

for (const [yearIndex, year] of years.entries()) {
  const source = {
    id: `software-designer-morning-simulation-${year}`,
    title: `${year} 年中级软件设计师上午原创模拟卷`,
    year,
    exam: '中级软件设计师',
    session: '上午',
    sourceType: 'original-simulation',
    note: '本题源为按软件设计师上午考试常见考点原创整理的模拟练习题，不是历年真题原文。',
    seed: `software-designer-${year}-morning-simulation`,
    questions: createQuestions(year, yearIndex)
  };

  await writeFile(
    path.join(sourcesDir, sourceFileByYear.get(year)),
    `${JSON.stringify(source, null, 2)}\n`,
    'utf8'
  );
}

console.log(`已生成 ${years.length} 套原创模拟题源，每套 ${questionsPerPaper} 题。`);