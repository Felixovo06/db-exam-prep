### 一、为什么要优化？

关系代数表达式的写法直接决定了**中间结果的大小**。例如“先做三张表的笛卡尔积，最后再筛选”，中间结果是三表行数的乘积，代价极高；“先筛选、再连接”则小得多。优化的目标就是**尽量缩小中间结果**。

### 二、优化依据：常用的等价变换规则

| 规则 | 公式 |
|---|---|
| 选择的串联 | $\sigma_{F_1\wedge F_2}(E)=\sigma_{F_1}(\sigma_{F_2}(E))$ |
| 选择的交换 | $\sigma_{F_1}(\sigma_{F_2}(E))=\sigma_{F_2}(\sigma_{F_1}(E))$ |
| **选择对连接/乘积的分配（下推）** | 若 $F$ 只涉及 $E_1$ 的属性：$\sigma_F(E_1\times E_2)=\sigma_F(E_1)\times E_2$ |
| 投影的串联 | $\Pi_{A}(\Pi_{B}(E))=\Pi_A(E)$（$A\subseteq B$） |
| **投影对连接的分配** | 先把各表投影成“后面还需要的属性”再连接 |
| 乘积转连接 | $\sigma_{E_1.A=E_2.A}(E_1\times E_2)=E_1\bowtie E_2$ |
| 连接的结合/交换 | $E_1\bowtie E_2=E_2\bowtie E_1$，$(E_1\bowtie E_2)\bowtie E_3=E_1\bowtie(E_2\bowtie E_3)$ |

### 三、启发式优化算法（考试步骤）

1. **把选择拆开**：把合取形式的选择 $\sigma_{F_1\wedge F_2\wedge\cdots}$ 拆成一个个单条件的选择。
2. **选择下推**：把每个选择尽可能移到树的**叶子**一侧，使它紧贴对应的基本表。只涉及单个表的条件，推到那个表上；涉及两个表的条件（连接条件）留在两表合并处。
3. **投影下推**：在每个叶子（或选择）之后加投影，只保留**后面还要用的属性**（最终输出的属性 + 上层连接条件用到的属性）。
4. **把“选择 + 乘积”合并为连接**，用 $\bowtie$ 表示。
5. **选择连接顺序**：先做小的、选择性强的关系的连接。

### 四、例题精讲

#### 例 1（基础）

$S(Sno,Sname,Sage)$，$SC(Sno,Cno,Grade)$，$C(Cno,Cname)$。
**题**：查询选修了“数据库”且成绩大于 90 的学生姓名，写出表达式并优化。

**① 初始表达式**（最直观，效率差）：
$$\Pi_{Sname}\big(\sigma_{Cname='数据库'\wedge Grade>90}(S\bowtie SC\bowtie C)\big)$$

**初始语法树**：

```tree
\Pi_{\mathrm{Sname}}
  \sigma_{\mathrm{Cname}=\text{'数据库'}\land \mathrm{Grade}>90}
    \bowtie
      \bowtie
        =S
        =SC
      =C
```

**② 优化**：
- `Cname='数据库'` 只涉及 $C$，下推到 $C$；
- `Grade>90` 只涉及 $SC$，下推到 $SC$；
- 投影下推：$S$ 只需 $(Sno,Sname)$，$SC$ 只需 $(Sno,Cno)$，$C$ 只需 $Cno$。

**优化后表达式**：
$$\Pi_{Sname}\Big(\Pi_{Sno,Sname}(S)\bowtie\Pi_{Sno,Cno}\big(\sigma_{Grade>90}(SC)\big)\bowtie\Pi_{Cno}\big(\sigma_{Cname='数据库'}(C)\big)\Big)$$

**优化后语法树**：

```tree
\Pi_{\mathrm{Sname}}
  \bowtie
    \bowtie
      \Pi_{\mathrm{Sno,Sname}}
        =S
      \Pi_{\mathrm{Sno,Cno}}
        \sigma_{\mathrm{Grade}>90}
          =SC
    \Pi_{\mathrm{Cno}}
      \sigma_{\mathrm{Cname}=\text{'数据库'}}
        =C
```

**读树方法**：从叶子向根，先对每个基本表做选择、投影，再两两连接，最后在根上投影出结果属性。

#### 例 2（乘积 + 选择形式，真题 2016/2017 的写法）

**题**：$S(SNO,SNAME,SCITY)$、$P(PNO,PNAME,COLOR,WEIGHT)$、$J(JNO,JNAME,JCITY)$、$SPJ(SNO,PNO,JNO,QTY)$。
表达式：$\Pi_{PNO,PNAME}\big(\sigma_{JNAME='绿恒'\wedge COLOR='红'\wedge QTY>2000}(P\bowtie SPJ\bowtie J)\big)$

**优化的语法树**（保留乘积 + 连接条件的选择写法）：

```tree
\Pi_{\mathrm{PNO,PNAME}}
  \sigma_{\mathrm{SPJ.PNO}=\mathrm{P.PNO}}
    \times
      \sigma_{\mathrm{COLOR}=\text{'红'}}
        =P
      \sigma_{\mathrm{SPJ.JNO}=\mathrm{J.JNO}}
        \times
          \sigma_{\mathrm{QTY}>2000}
            =SPJ
          \sigma_{\mathrm{JNAME}=\text{'绿恒'}}
            =J
```

三个单表条件分别落在 $P$、$SPJ$、$J$ 上；连接条件 $SPJ.JNO=J.JNO$ 与 $SPJ.PNO=P.PNO$ 分别放在对应乘积的上方。

### 五、答题固定模板

1. 写出初始表达式 → 说明**语义**（把条件翻译成自然语言）；
2. 写**优化后表达式**：说明“选择下推到 ××、××；投影下推保留 ××”；
3. **画语法树**：叶子是基本表；选择、投影紧贴叶子；连接在上层；根是最终投影。

### 六、易错点

- **选择条件拆分错误**：连接条件（涉及两个表）不能推到单个表上；
- **投影下推丢列**：忘了保留后面连接要用的属性（如 $Sno$、$Cno$）；
- 树画反了：根在上、叶子在下，**先执行的运算在下面**；
- “选择 + 乘积”能合并成连接时，建议写成连接；若题目要求“按标准答案”风格则保留乘积形式也可；
- 叶子必须是**基本表名**，不能是属性。

<details><summary>自测：说明为什么要把选择推到连接下面</summary>

选择先做可以提前过滤掉大量无关元组，让参与连接的两个关系都变小，连接（或乘积）的结果和代价都大幅降低。
</details>
