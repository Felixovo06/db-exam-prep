import { ChapterId } from '../types';

import division from './topics/division.md?raw';
import sql_dml from './topics/sql-dml.md?raw';
import sql_groupby from './topics/sql-groupby.md?raw';
import candidate_key from './topics/candidate-key.md?raw';
import normal_form from './topics/normal-form.md?raw';
import er_design from './topics/er-design.md?raw';
import minimal_cover from './topics/minimal-cover.md?raw';
import chase_decompose from './topics/chase-decompose.md?raw';
import locking from './topics/locking.md?raw';
import view_grant from './topics/view-grant.md?raw';
import query_opt from './topics/query-opt.md?raw';
import three_schema from './topics/three-schema.md?raw';
import model_recovery from './topics/model-recovery.md?raw';

export interface TopicGuideItem {
  id: string;
  title: string;
  chapter: ChapterId;
  hitRate: string;
  tier: 'must' | 'almost' | 'high';
  pointsHint: string;
  summary: string;
  exampleQuestionId: string;
  /** 额外的配套真题例题 */
  extraExampleIds?: string[];
  filterKeyword?: string;
  guideMarkdown: string;
}

export const TOPIC_GUIDES: TopicGuideItem[] = [
  {
    id: 'division',
    title: '1. 关系除法运算（÷）',
    chapter: 'ch2',
    hitRate: '8/8 套必考',
    tier: 'must',
    pointsHint: '手算 3分 + 查询 5分',
    summary: '每年第三大题必考手算结果表，第四大题常考“选修了全部/指定课程”的关系代数查询。',
    exampleQuestionId: '2023_fall_13',
    extraExampleIds: ['2020_spring_A_13', '2017_fall_B_17', '2018_spring_A_16'],
    filterKeyword: '÷',
    guideMarkdown: division,
  },
  {
    id: 'sql-dml',
    title: '2. SQL 增删改（INSERT / UPDATE / DELETE）',
    chapter: 'ch3',
    hitRate: '8/8 套必考',
    tier: 'must',
    pointsHint: '5-10 分',
    summary: '第四大题必考 1~2 小问，重点考带子查询（IN）的跨表条件更新与删除。',
    exampleQuestionId: '2023_fall_16',
    extraExampleIds: ['2018_spring_A_15', '2020_spring_A_21', '2016_fall_B_14'],
    guideMarkdown: sql_dml,
  },
  {
    id: 'sql-groupby',
    title: '3. SQL 多表连接、嵌套与分组统计（GROUP BY）',
    chapter: 'ch3',
    hitRate: '8/8 套必考',
    tier: 'must',
    pointsHint: '10-15 分',
    summary: '第四大题核心分值，必考多表连接 + GROUP BY 分组统计 + HAVING 组筛选。',
    exampleQuestionId: '2018_spring_A_17',
    extraExampleIds: ['2018_spring_A_17', '2016_fall_B_16', '2023_fall_17'],
    filterKeyword: 'GROUP BY',
    guideMarkdown: sql_groupby,
  },
  {
    id: 'candidate-key',
    title: '4. 候选码求解（L/R/N/LR 四步法）',
    chapter: 'ch4',
    hitRate: '8/8 套必考',
    tier: 'must',
    pointsHint: '3-5 分（后续范式判定全靠它）',
    summary: '第五大题第 1 问必考！只要用 L/R/N/LR 分类法，30 秒稳准求出全部候选码。',
    exampleQuestionId: '2023_fall_22',
    extraExampleIds: ['2017_fall_B_25', '2016_fall_A_4'],
    filterKeyword: '候选码',
    guideMarkdown: candidate_key,
  },
  {
    id: 'normal-form',
    title: '5. 范式级别判定（1NF / 2NF / 3NF / BCNF）',
    chapter: 'ch4',
    hitRate: '8/8 套必考',
    tier: 'must',
    pointsHint: '4-6 分',
    summary: '求出候选码和主/非主属性后，按“局部依赖→传递依赖→决定因素含码”三关逐级排除。',
    exampleQuestionId: '2018_spring_A_21',
    extraExampleIds: ['2023_fall_22', '2008_fall_B_5', '2009_fall_A_6'],
    filterKeyword: '范式',
    guideMarkdown: normal_form,
  },
  {
    id: 'er-design',
    title: '6. E-R 图绘制与关系模式转换（含主外码）',
    chapter: 'ch5',
    hitRate: '8/8 套必考',
    tier: 'must',
    pointsHint: '15 分（压轴大题）',
    summary: '第六大题固定 15 分！牢记 1:1 / 1:N / M:N 转换三铁律，主码画下划线或括号标注、外码写清楚。',
    exampleQuestionId: '2023_fall_29',
    extraExampleIds: ['2016_fall_A_23', '2018_spring_A_25', '2018_spring_A_26'],
    guideMarkdown: er_design,
  },
  {
    id: 'minimal-cover',
    title: '7. 最小函数依赖集（Fm）求解',
    chapter: 'ch4',
    hitRate: '7/8 套必考',
    tier: 'almost',
    pointsHint: '3-5 分',
    summary: '化简函数依赖集固定三步：右边拆单属性 → 逐条去冗余依赖 → 逐条去左边冗余属性。',
    exampleQuestionId: '2023_fall_26',
    extraExampleIds: ['2017_fall_B_26', '2016_fall_A_22'],
    filterKeyword: '最小函数依赖',
    guideMarkdown: minimal_cover,
  },
  {
    id: 'chase-decompose',
    title: '8. 无损连接检验（Chase 表法）与 BCNF/3NF 分解',
    chapter: 'ch4',
    hitRate: '7/8 套必考',
    tier: 'almost',
    pointsHint: '6-10 分',
    summary: '用 Chase 表格填 a/b，只要出现全 a 行就是无损连接；分解到 3NF/BCNF 套用标准算法。',
    exampleQuestionId: '2023_fall_25',
    extraExampleIds: ['2009_fall_B_44', '2023_fall_28', '2016_fall_B_22'],
    filterKeyword: '无损',
    guideMarkdown: chase_decompose,
  },
  {
    id: 'locking',
    title: '9. 封锁协议与并发控制（1/2/3 级封锁、2PL）',
    chapter: 'ch6',
    hitRate: '7/8 套必考',
    tier: 'almost',
    pointsHint: '2-4 分（选择/填空必见）',
    summary: '重点背诵一/二/三级封锁协议的加锁/解锁时机与解决的并发异常，以及两段锁协议与可串行化。',
    exampleQuestionId: '2023_fall_10',
    extraExampleIds: ['2017_fall_B_3', '2023_fall_10', '2009_fall_A_30'],
    filterKeyword: '封锁',
    guideMarkdown: locking,
  },
  {
    id: 'view-grant',
    title: '10. 视图（CREATE VIEW）与权限控制（GRANT / REVOKE）',
    chapter: 'ch3',
    hitRate: '6/8 套高频',
    tier: 'high',
    pointsHint: '2-7 分',
    summary: '第四大题常考创建视图（常带分组），选择/填空常考视图定义存储位置和 GRANT 权限转授。',
    exampleQuestionId: '2023_fall_19',
    extraExampleIds: ['2018_spring_A_18', '2023_fall_19', '2008_fall_A_39'],
    filterKeyword: '视图',
    guideMarkdown: view_grant,
  },
  {
    id: 'query-opt',
    title: '11. 查询优化与关系代数语法树（选择/投影下推）',
    chapter: 'ch7',
    hitRate: '6/8 套高频（2018-2023 必考）',
    tier: 'high',
    pointsHint: '5 分',
    summary: '2018–2023 年几乎每套卷子第四大题最后一问都考！套路固定：写初始表达式→选择下推→投影下推→画优化后语法树。',
    exampleQuestionId: '2023_fall_21',
    extraExampleIds: ['2017_fall_B_21', '2020_spring_A_19', '2018_spring_A_20'],
    filterKeyword: '优化',
    guideMarkdown: query_opt,
  },
  {
    id: 'three-schema',
    title: '12. 三级模式、两级映像与数据独立性',
    chapter: 'ch1',
    hitRate: '6/8 套高频',
    tier: 'high',
    pointsHint: '2-4 分',
    summary: '选择/填空送分题！分清“外模式/模式/内模式”各自管什么，以及两级映像对应哪一种独立性。',
    exampleQuestionId: '2023_fall_8',
    extraExampleIds: ['2020_spring_A_06', '2009_fall_A_21'],
    filterKeyword: '三级',
    guideMarkdown: three_schema,
  },
  {
    id: 'model-recovery',
    title: '13. 数据模型三要素、事务 ACID 与数据库恢复',
    chapter: 'ch1',
    hitRate: '5/8 套高频',
    tier: 'high',
    pointsHint: '4-6 分',
    summary: '选择/填空高频基础概念集合：数据模型三要素、事务 ACID、UNDO/REDO 日志、故障类型与转储。',
    exampleQuestionId: '2023_fall_1',
    extraExampleIds: ['2008_fall_B_25', '2020_spring_A_04', '2023_fall_3'],
    guideMarkdown: model_recovery,
  },
];
