### 一、SELECT 的写法与“思考顺序”

```sql
SELECT   [DISTINCT] 列 / 表达式 / 聚合函数
FROM     表1 [, 表2 ...]            -- 或 表1 JOIN 表2 ON 条件
[WHERE   行条件]                     -- 分组之前，过滤“行”
[GROUP BY 分组列]
[HAVING  组条件]                     -- 分组之后，过滤“组”，可含聚合函数
[ORDER BY 排序列 [ASC|DESC]];
```

**书写顺序**与**执行顺序**不同，理解执行顺序就能理解 `WHERE` 和 `HAVING` 的区别：

$$\text{FROM}\ \to\ \text{WHERE}\ \to\ \text{GROUP BY}\ \to\ \text{HAVING}\ \to\ \text{SELECT}\ \to\ \text{ORDER BY}$$

- `WHERE` 在分组**之前**执行，所以此时还没有“平均分”“人数”这些聚合结果，**绝不能**写聚合函数；
- `HAVING` 在分组**之后**执行，可以对每个组的聚合结果做筛选。

### 二、练习数据库

$S(Sno,Sname,Sage,Ssex,Sdept)$，$C(Cno,Cname,Teacher,Ccredit)$，$SC(Sno,Cno,Grade)$

### 三、例题精讲

#### 例 1：单表分组统计

**题**：统计每门课程的选课人数和平均成绩。
```sql
SELECT Cno, COUNT(*) AS 选课人数, AVG(Grade) AS 平均成绩
FROM SC
GROUP BY Cno;
```
**分析**：按课程号分组，每组就是一门课的所有选课记录；`COUNT(*)` 数组内行数，`AVG(Grade)` 求组内平均。

#### 例 2：WHERE 与 HAVING 同时出现

**题**：查询**至少选修 3 门课**且平均成绩大于 80 的学生学号。
```sql
SELECT Sno, AVG(Grade) AS 平均成绩
FROM SC
GROUP BY Sno
HAVING COUNT(*) >= 3 AND AVG(Grade) > 80;
```

**加一个行条件**：只统计成绩不低于 60 的选课记录（对行的筛选，放 `WHERE`）：
```sql
SELECT Sno, COUNT(*) AS 及格门数
FROM SC
WHERE Grade >= 60
GROUP BY Sno
HAVING COUNT(*) >= 3;
```
对比：`WHERE Grade>=60` 先剔除不及格的行，再分组计数；如果把条件写成 `HAVING` 里的聚合，含义就会不同。

#### 例 3：多表连接 + 分组 ★高频

**题**：查询选修课程 3 门及以上且所选课程学分都低于 2 的学生学号和姓名（对应 2018 春真题）。

**思路三步**：
1. 涉及表：姓名在 $S$，选课在 $SC$，学分在 $C$ → 三表连接，连接条件 `S.Sno=SC.Sno AND SC.Cno=C.Cno`；
2. 行条件：`C.Ccredit < 2`，放 `WHERE`；
3. 分组后计数：`GROUP BY S.Sno, S.Sname HAVING COUNT(*) >= 3`。

```sql
SELECT S.Sno, S.Sname
FROM S, SC, C
WHERE S.Sno = SC.Sno AND SC.Cno = C.Cno AND C.Ccredit < 2
GROUP BY S.Sno, S.Sname
HAVING COUNT(*) >= 3;
```

#### 例 4：嵌套子查询——IN / ALL / 比较

**题 A**：查询选修了“数据库”的学生姓名。
```sql
SELECT Sname FROM S
WHERE Sno IN (SELECT Sno FROM SC
              WHERE Cno IN (SELECT Cno FROM C WHERE Cname = '数据库'));
```

**题 B**：查询比**所有**男生年龄都小的女生（“全称”用 `ALL`）。
```sql
SELECT Sname, Sage FROM S
WHERE Ssex = '女' AND Sage < ALL (SELECT Sage FROM S WHERE Ssex = '男');
```
等价于 `Sage < (SELECT MIN(Sage) FROM S WHERE Ssex='男')`。`ANY`/`SOME` 表示“存在一个”，`< ANY` 等价于 `< MAX`。

**题 C**：查询成绩高于**该课程平均分**的选课记录（相关子查询：内层引用外层表的列）。
```sql
SELECT Sno, Cno, Grade
FROM SC X
WHERE Grade > (SELECT AVG(Grade) FROM SC Y WHERE Y.Cno = X.Cno);
```

#### 例 5：“没有……” 与 “全部”（NOT EXISTS）

**题 A**：没有选修 C2 的学生姓名。
```sql
SELECT Sname FROM S
WHERE Sno NOT IN (SELECT Sno FROM SC WHERE Cno = 'C2');
```
等价写法：
```sql
SELECT Sname FROM S
WHERE NOT EXISTS (SELECT * FROM SC WHERE SC.Sno = S.Sno AND SC.Cno = 'C2');
```

**题 B**（经典）：选修了**全部**课程的学生姓名——“不存在一门课，该生没选”，用两层 `NOT EXISTS`：
```sql
SELECT Sname FROM S
WHERE NOT EXISTS (
  SELECT * FROM C
  WHERE NOT EXISTS (
    SELECT * FROM SC WHERE SC.Sno = S.Sno AND SC.Cno = C.Cno));
```
这就是关系代数里“除法”的 SQL 表达。

### 四、必须死记的规则

1. **`SELECT` 中的非聚合列，必须全部出现在 `GROUP BY` 中**。例如 `SELECT C.Cno, C.Cname, AVG(Grade)`，则 `GROUP BY C.Cno, C.Cname`。
2. **`WHERE` 里不能写聚合函数**，聚合条件只能写在 `HAVING`。
3. **同名列加表前缀**：多张表都有 `Sno` 时写 `S.Sno`，否则报“列名不明确”。
4. **`COUNT(*)` 数行数；`COUNT(列)` 不统计 `NULL`**；`SUM/AVG/MAX/MIN` 都忽略 `NULL`。
5. **`DISTINCT`** 去重，作用于整个选出的行：`SELECT DISTINCT Sno, Cno` 是对组合去重。
6. “以上/以下”要看是否含边界：“85 分以上（含 85）”用 `>=`，“超过 85”用 `>`；`BETWEEN a AND b` 包含两端。
7. 字符串匹配用 `LIKE`：`%` 匹配任意长度，`_` 匹配单个字符。例：`Sname LIKE '王%'`。

### 五、连接写法 vs 嵌套写法，怎么选？

| 场景 | 推荐写法 |
|---|---|
| 要输出多个表的列 | **连接**（`FROM` 多表 + 连接条件） |
| 只是用别的表做筛选，输出的列都在一张表里 | 嵌套 `IN` 或连接均可 |
| “没有 / 不存在” | `NOT IN` / `NOT EXISTS` |
| “每个……的最大/平均” | 分组聚合，或相关子查询 |

<details><summary>自测：查询每个系的学生人数，只显示人数超过 50 的系，按人数降序</summary>

```sql
SELECT Sdept, COUNT(*) AS 人数
FROM S
GROUP BY Sdept
HAVING COUNT(*) > 50
ORDER BY 人数 DESC;
```
</details>
