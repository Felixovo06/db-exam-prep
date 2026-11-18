export type ChapterId = 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6' | 'ch7';

export type QType = 'choice' | 'fill' | 'calc' | 'sql' | 'design' | 'short';

export type MasteryStatus = 'unseen' | 'wrong' | 'fuzzy' | 'mastered';

export interface Paper {
  id: string;
  title: string;
  year: number;
  term: string;
  variant: string;
  weight: number;
  is_recent: boolean;
}

export interface Question {
  id: string;
  paper_id: string;
  section: string;
  number: string;
  qtype: QType;
  points: number;
  chapter: ChapterId;
  topic_tag: string;
  difficulty: 1 | 2 | 3;
  context: string;
  stem: string;
  options: string[];
  correct_options: string[];
  answer: string;
  prereq_note: string;
  explanation: string;
}

export interface UserProgressItem {
  status: MasteryStatus;
  selectedOptions?: string[];
  draft?: string;
  updatedAt: number;
}

export type ProgressMap = Record<string, UserProgressItem>;

export interface ChapterMeta {
  id: ChapterId;
  name: string;
  shortName: string;
  description: string;
  examTip: string;
}

export const CHAPTERS: ChapterMeta[] = [
  {
    id: 'ch1',
    name: '一、数据库基础与数据模型',
    shortName: '基础与数据模型',
    description: 'DBS组成、三级模式两级映像、数据独立性、数据模型三要素',
    examTip: '几乎每年必考选择/填空，背熟“三级模式+两级映像”即可稳拿分',
  },
  {
    id: 'ch2',
    name: '二、关系代数与关系数据库',
    shortName: '关系代数',
    description: '并/交/差/笛卡尔积/选择/投影/连接/除运算、实体与参照完整性',
    examTip: '每年三大计算大题之一（15分左右），重点练熟“除法 ÷”和“自然连接 ⋈”',
  },
  {
    id: 'ch3',
    name: '三、SQL 语言与数据查询',
    shortName: 'SQL 查询与管理',
    description: 'SELECT 连接/嵌套/GROUP BY 分组、INSERT/UPDATE/DELETE、视图与 GRANT 授权',
    examTip: '分值最高（25-30分）！6道大题套路高度固定：增删改+多表连接+分组+视图/授权',
  },
  {
    id: 'ch4',
    name: '四、关系数据库规范化理论',
    shortName: '规范化与范式',
    description: '函数依赖、属性闭包、候选码、最小依赖集、1NF/2NF/3NF/BCNF、无损连接 Chase 表',
    examTip: '核心拉分大题（15-20分）！掌握 L/R/N/LR 求候选码 + Chase 表判无损即可通杀',
  },
  {
    id: 'ch5',
    name: '五、数据库设计（E-R图与关系模式）',
    shortName: 'E-R 与数据库设计',
    description: '局部/全局 E-R 图绘制、1:1 / 1:N / M:N 联系转关系模式、主码外码标注',
    examTip: '压轴大题（15分）！牢记 1:N 合并到 N 端、M:N 必须单独建表，主外码标清楚',
  },
  {
    id: 'ch6',
    name: '六、事务管理与并发控制',
    shortName: '事务与并发控制',
    description: 'ACID 特性、COMMIT/ROLLBACK、三大并发异常、一/二/三级封锁协议、两段锁与可串行化',
    examTip: '选择/填空高频考点！重点区分三级封锁协议与事务结束语句',
  },
  {
    id: 'ch7',
    name: '七、数据库恢复、安全与索引优化',
    shortName: '恢复、安全与优化',
    description: '故障类型、UNDO/REDO 日志、检查点、转储、自主/强制存取控制、查询树代数优化',
    examTip: '近几年常结合“关系代数语法树优化”和填空题考察（选择/投影下推）',
  },
];

export const QTYPE_LABELS: Record<QType, string> = {
  choice: '选择题',
  fill: '填空题',
  calc: '计算/推导题',
  sql: 'SQL 编程题',
  design: '设计题',
  short: '简答题',
};
