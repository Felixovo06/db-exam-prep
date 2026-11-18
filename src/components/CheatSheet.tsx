import { BookOpen, Flame, CheckCircle2, AlertTriangle } from 'lucide-react';

export function CheatSheet() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-gradient-to-br from-indigo-600 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          0基础考前急救手册
        </div>
        <h1 className="text-2xl font-bold mb-2">数据库原理 · 高频考点 5 分钟速通</h1>
        <p className="text-indigo-100 text-sm leading-relaxed">
          面向零基础同学的“先会做题、再补概念”考前速查表。建议先花 5 分钟扫一遍下面 6 个核心套路，直接开始刷近几年高权重真题。
        </p>
      </div>

      {/* 1. 三级模式 & 数据模型 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">1. 三级模式与两级映像（选择/填空必考）</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">送分题</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1">外模式（子模式/用户模式）</div>
            <p className="text-slate-600 text-xs">面向单个用户/应用，描述<strong>局部数据</strong>的逻辑结构（如视图 View）。一个库可以有<strong>多个</strong>外模式。</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1">模式（逻辑模式/概念模式）</div>
            <p className="text-slate-600 text-xs">面向全体用户，描述<strong>全体数据</strong>的全局逻辑结构。一个库只有<strong>一个</strong>模式。</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1">内模式（存储模式）</div>
            <p className="text-slate-600 text-xs">面向物理存储，描述数据在磁盘上的<strong>物理存储方式和索引</strong>。一个库只有<strong>一个</strong>内模式。</p>
          </div>
        </div>
        <div className="text-xs text-slate-700 bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 space-y-1">
          <div>• <strong>外模式 / 模式映像</strong> → 保证 <strong>逻辑数据独立性</strong>（改表结构/模式时，只改映像，不用改程序）。</div>
          <div>• <strong>模式 / 内模式映像</strong> → 保证 <strong>物理数据独立性</strong>（改存储/索引时，只改映像，不用改全局逻辑）。</div>
          <div>• <strong>数据模型三要素</strong>：<strong>数据结构</strong>、<strong>数据操作</strong>、<strong>数据的完整性约束条件</strong>。</div>
        </div>
      </section>

      {/* 2. 关系代数 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">2. 关系代数 5 大高频操作（计算题 15 分）</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-200 flex items-center gap-1"><Flame className="w-3 h-3" /> 高频大题</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-2.5 border border-slate-200">符号</th>
                <th className="p-2.5 border border-slate-200">名称</th>
                <th className="p-2.5 border border-slate-200">零基础秒懂口诀</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-xs">
              <tr>
                <td className="p-2.5 border border-slate-200 font-mono font-semibold">σ_条件(R)</td>
                <td className="p-2.5 border border-slate-200">选择（行筛选）</td>
                <td className="p-2.5 border border-slate-200">挑<strong>行</strong>（相当于 SQL 的 <code>WHERE</code>）</td>
              </tr>
              <tr>
                <td className="p-2.5 border border-slate-200 font-mono font-semibold">Π_列(R)</td>
                <td className="p-2.5 border border-slate-200">投影（列筛选）</td>
                <td className="p-2.5 border border-slate-200">挑<strong>列</strong>并<strong>自动去重</strong>（相当于 SQL <code>SELECT DISTINCT</code>）</td>
              </tr>
              <tr>
                <td className="p-2.5 border border-slate-200 font-mono font-semibold">R × S</td>
                <td className="p-2.5 border border-slate-200">笛卡尔积</td>
                <td className="p-2.5 border border-slate-200">R 的每行配 S 的每行；列数 = r + s，行数 = |R| × |S|</td>
              </tr>
              <tr>
                <td className="p-2.5 border border-slate-200 font-mono font-semibold">R ⋈ S</td>
                <td className="p-2.5 border border-slate-200">自然连接</td>
                <td className="p-2.5 border border-slate-200">找<strong>同名列值相等</strong>的行拼起来，并<strong>去掉重复的同名列</strong></td>
              </tr>
              <tr className="bg-amber-50/40">
                <td className="p-2.5 border border-slate-200 font-mono font-semibold">R ÷ S</td>
                <td className="p-2.5 border border-slate-200 font-bold text-amber-800">除法（必考！）</td>
                <td className="p-2.5 border border-slate-200">
                  <strong>口诀</strong>：先找 R 有而 S 没有的列作为结果列（设为 X）；再看 S 在公共列上的所有取值，若某个 X 对应的公共列取值<strong>包含了 S 的全部行</strong>，则保留该 X！
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. SQL 套路 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">3. SQL 编程 6 类固定题型模板（30 分核心）</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-200">分值最高</span>
        </div>
        <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
{`-- 1. 插入 / 更新 / 删除
INSERT INTO SC(Sno, Cno, Grade) VALUES ('S001', 'C01', 85);
UPDATE SC SET Grade = Grade + 5 WHERE Cno IN (SELECT Cno FROM Course WHERE Cname='数据库');
DELETE FROM SC WHERE Sno IN (SELECT Sno FROM Student WHERE Sdept='CS');

-- 2. 分组统计 + 筛选（SELECT 里的非聚合列必须全部出现在 GROUP BY 中！）
SELECT Cno, COUNT(*), AVG(Grade)
FROM SC
GROUP BY Cno
HAVING COUNT(*) >= 3;   -- WHERE 过滤行（分组前），HAVING 过滤组（分组后）

-- 3. 视图 + 授权
CREATE VIEW V_CS AS SELECT Sno, Sname FROM Student WHERE Sdept='CS';
GRANT SELECT, UPDATE ON TABLE Student TO U1 WITH GRANT OPTION;`}
        </pre>
      </section>

      {/* 4. 规范化与范式 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">4. 候选码求解与范式秒判（规范化大题 15-20 分）</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">套路题</span>
        </div>
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong>① 求候选码 4 步法（L/R/N/LR 分类法）：</strong>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li><strong>L 类</strong>（只在函数依赖左边出现）与 <strong>N 类</strong>（两边都不出现）：<strong>一定属于每一个候选码</strong>！</li>
              <li><strong>R 类</strong>（只在右边出现）：<strong>一定不属于任何候选码</strong>。</li>
              <li>先求 <code>(L ∪ N)+</code>：若已包含全部属性 U，则它就是<strong>唯一候选码</strong>！</li>
              <li>若未包含 U，则从 <strong>LR 类</strong>（左右都出现）中逐个加入属性求闭包，直到包含 U。</li>
            </ul>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong>② 范式逐级判定（1NF → 2NF → 3NF → BCNF）：</strong>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li><strong>1NF</strong>：所有属性不可再分（关系模式默认满足 1NF）。</li>
              <li><strong>2NF</strong>：消除<strong>非主属性对码的部分函数依赖</strong>（若所有候选码都是单属性，则必为 2NF）。</li>
              <li><strong>3NF</strong>：消除<strong>非主属性对码的传递函数依赖</strong>（或：对每个非平凡依赖 X→Y，要么 X 含码，要么 Y 是主属性）。</li>
              <li><strong>BCNF</strong>：消除<strong>主属性</strong>对码的部分/传递依赖，即<strong>每一个非平凡依赖 X→Y 的决定因素 X 都必须包含码</strong>。</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. E-R 图转关系模式 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">5. E-R 图转关系模式 3 条铁律（15 分压轴题）</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">稳拿分</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
            <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 1:1 联系</div>
            <p className="text-slate-700">可将任一方的主码和联系属性合并到另一方中（作为外码），也可单独建表。</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
            <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 1:N 联系</div>
            <p className="text-slate-700"><strong>1 端主码 + 联系属性</strong> 合并到 <strong>N 端</strong>关系模式中（1 端主码在 N 端作外码）。</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200">
            <div className="font-bold text-amber-900 mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> M:N 联系</div>
            <p className="text-slate-700"><strong>必须单独建一个新表</strong>！新表包含双方主码（组合主码，各自也是外码）+ 联系属性。</p>
          </div>
        </div>
      </section>

      {/* 6. 封锁协议 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h2 className="text-lg font-bold text-slate-900">6. 一/二/三级封锁协议对比（高频易错点）</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-2.5 border border-slate-200">协议级别</th>
                <th className="p-2.5 border border-slate-200">加锁规则</th>
                <th className="p-2.5 border border-slate-200">解决的问题</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr>
                <td className="p-2.5 border border-slate-200 font-semibold">一级封锁协议</td>
                <td className="p-2.5 border border-slate-200"><strong>修改</strong>数据前加 X 锁，直到<strong>事务结束</strong>才释放（读不加锁）</td>
                <td className="p-2.5 border border-slate-200">防止<strong>丢失修改</strong></td>
              </tr>
              <tr>
                <td className="p-2.5 border border-slate-200 font-semibold">二级封锁协议</td>
                <td className="p-2.5 border border-slate-200">在一级基础上，<strong>读</strong>数据前加 S 锁，<strong>读完立即释放</strong></td>
                <td className="p-2.5 border border-slate-200">防止丢失修改 + <strong>读“脏”数据</strong></td>
              </tr>
              <tr>
                <td className="p-2.5 border border-slate-200 font-semibold">三级封锁协议</td>
                <td className="p-2.5 border border-slate-200">在一级基础上，<strong>读</strong>数据前加 S 锁，直到<strong>事务结束</strong>才释放</td>
                <td className="p-2.5 border border-slate-200">防止丢失修改 + 读脏数据 + <strong>不可重复读</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
