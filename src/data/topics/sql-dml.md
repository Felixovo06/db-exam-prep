### 一、统一的练习数据库

下面所有例子都用这三张表（真题里的表名、列名会略有不同，但结构一样）：

- 学生 $S(Sno,Sname,Sage,Ssex,Sdept)$
- 课程 $C(Cno,Cname,Teacher,Ccredit)$
- 选课 $SC(Sno,Cno,Grade)$

### 二、三条语句的标准模板

```sql
-- 1. 插入
INSERT INTO 表名 [(列1, 列2, ...)] VALUES (值1, 值2, ...);
INSERT INTO 表名 [(列1, ...)] SELECT ... ;         -- 把查询结果批量插入

-- 2. 修改
UPDATE 表名 SET 列1 = 表达式1 [, 列2 = 表达式2 ...] [WHERE 条件];

-- 3. 删除
DELETE FROM 表名 [WHERE 条件];
```

**共同规律**：**要改哪张表的数据，`UPDATE`/`DELETE`/`INSERT` 后面就写哪张表；条件涉及别的表，就用子查询去查。**

### 三、例题精讲

#### 例 1：INSERT 的三种写法

**题**：向 $S$ 表插入学生 (`'2024001'`, `'李明'`, 20, `'男'`, `'CS'`)。

```sql
-- 写法 A：写全列，值的顺序与表定义一致
INSERT INTO S VALUES ('2024001', '李明', 20, '男', 'CS');

-- 写法 B：显式列名（推荐，不依赖列顺序）
INSERT INTO S (Sno, Sname, Sage, Ssex, Sdept)
VALUES ('2024001', '李明', 20, '男', 'CS');

-- 写法 C：只给部分列，其余列取 NULL 或默认值
INSERT INTO S (Sno, Sname) VALUES ('2024002', '王芳');
```

**要点**：字符串用**英文单引号**，数值不加引号；写了列名，值的个数和顺序必须与列名一一对应；主码不能重复、不能为空；外码要在被参照表中存在。

**批量插入**：把计算机系学生的选课记录备份到 $SC\_bak$：
```sql
INSERT INTO SC_bak SELECT * FROM SC
WHERE Sno IN (SELECT Sno FROM S WHERE Sdept = 'CS');
```

#### 例 2：UPDATE（单表条件）

**题**：把所有学生的年龄加 1。
```sql
UPDATE S SET Sage = Sage + 1;
```
没有 `WHERE`，所以是**全表更新**，这是合法的；但如果题目只要求改一部分行，漏写 `WHERE` 就会出大错。

#### 例 3：UPDATE（子查询跨表）★高频

**题**：把选修“数据库”课程的学生的该门成绩提高 5 分。

**分析**：改的是 $SC.Grade$；“数据库”这个课程名在 $C$ 里，所以用子查询把课程名换成课程号。
```sql
UPDATE SC
SET Grade = Grade + 5
WHERE Cno IN (SELECT Cno FROM C WHERE Cname = '数据库');
```

**变形 1**：只提高**女生**的成绩——再加一层子查询（两个条件 AND 起来）：
```sql
UPDATE SC
SET Grade = Grade + 5
WHERE Cno IN (SELECT Cno FROM C WHERE Cname = '数据库')
  AND Sno IN (SELECT Sno FROM S WHERE Ssex = '女');
```

**变形 2**：只把**不及格**的成绩提高到 60（用 `CASE` 或加条件）：
```sql
UPDATE SC SET Grade = 60 WHERE Grade < 60;
```

**易错对比**：下面这个写法是错的——

```sql
UPDATE SC SET Grade = Grade + 5
WHERE Sno IN (SELECT Sno FROM SC WHERE Cno = 'C1');   -- ✘ 把这些学生所有课程的成绩都加了 5
```
题目要“该门课”，就必须直接用 `Cno` 限定被修改的行。

#### 例 4：DELETE（子查询跨表）

**题**：删除计算机系学生选修“图形学”的选课记录。
```sql
DELETE FROM SC
WHERE Sno IN (SELECT Sno FROM S WHERE Sdept = '计算机学院')
  AND Cno IN (SELECT Cno FROM C WHERE Cname = '图形学');
```

**题**：删除没有选课记录的学生（用 NOT IN / NOT EXISTS）：
```sql
DELETE FROM S WHERE Sno NOT IN (SELECT Sno FROM SC);
```

**分析**：`DELETE` 删的是**整行**，不能指定列；它保留表结构。

### 四、`=` 还是 `IN`？

| 子查询 | 返回值个数 | 应该用 |
|---|---|---|
| 查某个确定学生的学号（主码唯一） | 至多 1 个 | `=` 或 `IN` 均可 |
| 按课程名查课程号（可能重名） | 可能多个 | **`IN`** |
| 按系名查学号 | 多个 | **`IN`** |

**经验**：拿不准就写 `IN`，永远不会因为返回多行而报错。

### 五、容易混淆的三个命令

| 命令 | 作用 | 对象 | 能恢复吗 |
|---|---|---|---|
| `DELETE` | 删除表中的**行** | 数据 | 事务内可 `ROLLBACK` |
| `DROP TABLE` | 删除**整张表**（结构+数据） | 表结构 | 不可恢复 |
| `ALTER TABLE` | 修改表结构（增加/删除列等） | 表结构 | — |

### 六、考场 5 大扣分坑

1. 多行子查询用了 `=`；
2. `UPDATE`/`DELETE` 没写 `WHERE`；
3. 用学号条件去改“该门课”的成绩，把别的课也改了；
4. 字符串用了中文引号或没加引号；
5. `UPDATE SC SET Grade + 5`（漏写 `Grade =`）或写成 `Grade += 5`。

<details><summary>自测：把“王平”老师讲授课程的所有成绩降低 2 分（$C(Cno,Cname,Teacher,Ccredit)$）</summary>

```sql
UPDATE SC SET Grade = Grade - 2
WHERE Cno IN (SELECT Cno FROM C WHERE Teacher = '王平');
```
</details>
