### 一、视图（View）是什么？

- **本质**：一张**虚表**。数据库里**只存视图的定义**（保存在数据字典中），**不存视图对应的数据**；每次查询视图时，由系统把视图定义展开成对基本表的查询。
- **作用**：
  1. 简化用户操作（把复杂查询封装成一张“表”）；
  2. 让不同用户从不同角度看同一数据；
  3. 提供一定的**逻辑数据独立性**（基本表结构变了，只需改视图定义）；
  4. **保护数据安全**（只暴露部分行/列，配合授权使用）。

### 二、创建与使用视图

```sql
CREATE VIEW 视图名 [(列名1, 列名2, ...)]
AS
子查询
[WITH CHECK OPTION];
```

**什么时候必须写列名表？**
- 子查询里有**聚合函数/表达式**，没有现成列名（如 `AVG(Grade)`）；
- 多表连接后出现**同名列**；
- 想给列起新名字。

#### 例 1：简单行列子集视图

**题**：建立计算机系学生的视图，只含学号、姓名、年龄。
```sql
CREATE VIEW CS_Student
AS
SELECT Sno, Sname, Sage FROM S WHERE Sdept = 'CS'
WITH CHECK OPTION;
```
`WITH CHECK OPTION`：通过该视图做 `INSERT/UPDATE` 时，系统会检查新数据是否仍满足 `Sdept='CS'`，保证视图“看得见”它自己改的数据。

#### 例 2：带分组的视图（真题高频）

**题**：建立视图 $V\_Avg$，反映每个学生的学号和平均成绩。
```sql
CREATE VIEW V_Avg (Sno, Avg_Grade)
AS
SELECT Sno, AVG(Grade) FROM SC GROUP BY Sno;
```

查询这个视图就像查询普通表：
```sql
SELECT Sno FROM V_Avg WHERE Avg_Grade > 90;
```

#### 例 3：多表连接视图

**题**：建立“学生-课程-成绩”视图。
```sql
CREATE VIEW V_SCG (Sno, Sname, Cname, Grade)
AS
SELECT S.Sno, Sname, Cname, Grade
FROM S, SC, C
WHERE S.Sno = SC.Sno AND SC.Cno = C.Cno;
```

### 三、视图的更新问题

| 视图类型 | 能否更新 |
|---|---|
| 行列子集视图（单表、含主码、无聚合） | 一般**可以** |
| 含 `GROUP BY`、聚合函数、`DISTINCT` 的视图 | **不能**更新 |
| 由多表连接导出的视图 | 一般不能更新 |

记忆：**视图的一行对应不到基本表中唯一的一行时，就不能更新。**

### 四、授权：GRANT 与 REVOKE（自主存取控制）

```sql
GRANT 权限[, 权限 ...]
ON 对象类型 对象名
TO 用户[, 用户 ...] | PUBLIC
[WITH GRANT OPTION];

REVOKE 权限[, 权限 ...]
ON 对象类型 对象名
FROM 用户[, 用户 ...]
[CASCADE | RESTRICT];
```

- **用户权限两要素**：**数据库对象** + **操作类型**；
- `WITH GRANT OPTION`：允许被授权者**把该权限再转授**给别人；
- `PUBLIC`：授予所有用户；
- `REVOKE ... CASCADE`：收回权限时，**级联收回**被该用户转授出去的权限。

#### 例 4：常见授权题

```sql
-- 把查询 S 表的权限授给 U1
GRANT SELECT ON TABLE S TO U1;

-- 把对 SC 表的查询、修改权限授给 U2，并允许其转授
GRANT SELECT, UPDATE ON TABLE SC TO U2 WITH GRANT OPTION;

-- 列级权限：只允许 U3 修改学生的姓名和年龄
GRANT UPDATE (Sname, Sage) ON TABLE S TO U3;

-- 所有权限给 U4
GRANT ALL PRIVILEGES ON TABLE S TO U4;

-- 收回 U2 对 SC 的修改权限，同时收回他转授出去的
REVOKE UPDATE ON TABLE SC FROM U2 CASCADE;
```

#### 例 5：视图 + 授权联合使用（真题常考）

**题**：只允许用户 $U1$ 查询计算机系学生的姓名和年龄，不能看到其他系，也不能看到别的列。

**思路**：先建一个**视图**限制可见的行和列，再把视图的查询权限授给用户。
```sql
CREATE VIEW CS_V AS
SELECT Sname, Sage FROM S WHERE Sdept = 'CS';

GRANT SELECT ON CS_V TO U1;
```
这样 $U1$ 看不到基本表 $S$ 的其他行和列。这是“视图实现**按内容的存取控制**”的典型用法。

### 五、选择/填空常见点

- 视图在数据字典中存放的是**视图的定义**，而不是数据；
- 视图中的数据**来源于基本表或其他视图**；
- 视图一旦建立，**可以像基本表一样查询**，也可以在其上再定义视图；
- 数据库安全的存取控制分为：**自主存取控制 DAC**（用户自己授权，GRANT/REVOKE）与**强制存取控制 MAC**（按敏感度级别：主体级别 ≥ 客体级别才可读，主体级别 ≤ 客体级别才可写）。

### 六、易错点

1. 视图里有聚合列却没写列名表，会报错；
2. 把视图当成“存数据的表”；
3. 忘记在 `GRANT` 中写 `WITH GRANT OPTION` 却想让对方转授；
4. `REVOKE` 忘记 `CASCADE`，导致被转授的权限还在；
5. 创建视图的子查询里**不能使用 `ORDER BY`**（标准 SQL）。

<details><summary>自测：创建视图，反映每门课程的选课人数（课程号、人数）</summary>

```sql
CREATE VIEW V_CNT (Cno, Num)
AS
SELECT Cno, COUNT(*) FROM SC GROUP BY Cno;
```
</details>
