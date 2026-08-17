/* Add later Final questions here. Each entry becomes one expandable card in MATH1231 > Test > Final Exam. */
window.MATH1231_FINAL_QUESTIONS = [
  {
    id: 1,
    title: 'Subspace tests',
    tags: ['Algebra', 'Subspace', 'closure tests'],
    hint: '同类题：集合是不是 vector subspace？',
    analysis: `<p>子空间先检查 \(\mathbf0\in H\)，再检查加法和数乘封闭。最稳的识别法：<strong>“线性条件 = 0”</strong>、\(\operatorname{span}\) 和线性参数形式通常是子空间；非零常数、不等式、整数限制、次数恰好通常不是。</p><p>例如 \(\{p\in P_{26}:p(62)=0\}\) 是子空间，因为代入 \(62\) 是线性操作；但 \(\{p:p(0)=32\}\) 不含零多项式。</p>`,
    steps: `<ol><li>先代入零向量／零函数，若不满足立即不是。</li><li>对“等于 \(0\)”的条件，写 \(L(u+v)=L(u)+L(v)=0\) 和 \(L(\lambda u)=\lambda L(u)=0\)。</li><li>遇到不等式或“次数刚好”等限制，找一个封闭性反例。</li></ol>`,
    similar: `<p>在 \(P_5\) 中，判断 \(H=\{p:p(1)-p(0)=0\}\) 是否为子空间。再判断 \(K=\{p:p(1)=3\}\) 是否为子空间。</p>`
  },
  {
    id: 2,
    title: 'Identify a surface from cross-sections',
    tags: ['Calculus', 'Surfaces', 'cross-sections'],
    hint: '同类题：从截面图反推指数、符号和系数大小。',
    analysis: `<p>对 \(px^a-y+rz^b=E\)，先取截面：\(z=0\Rightarrow y=px^a-E\)。向上抛物线给出 \(a=2,p>0\)，顶点 \((0,-3)\) 给出 \(E=3\)。</p><p>再取 \(y=0\Rightarrow px^2+rz^b=3\)。椭圆说明 \(b=2,r>0\)。半轴为 \(\sqrt{3/p}\) 和 \(\sqrt{3/r}\)；\(x\) 方向更宽时，\(p<r\)，所以 \(|p|<|r|\)。</p>`,
    steps: `<ol><li>每次只固定一个变量，写出二维截面式。</li><li>用图形形状判指数与符号：抛物线看 \(a\)，椭圆看两个平方项同号。</li><li>把式子化成 \(x^2/A^2+z^2/B^2=1\)，用半轴长度比较系数。</li></ol>`,
    similar: `<p>\(mx^\alpha-y+nz^\beta=4\)，其中 \(\alpha,\beta\in\{1,2\}\)。若 \(z=0\) 的截面是顶点 \((0,-4)\) 的向下抛物线，而 \(y=0\) 的截面是双曲线，判断 \(\alpha,\beta\) 及 \(m,n\) 的符号。</p>`
  },
  {
    id: 3,
    title: 'Cross-sections, tangent vectors and tangent plane',
    tags: ['Calculus', 'Tangent plane', 'linear approximation'],
    hint: '同类题：\(z=F(x,y)\) 的两条截线与法向量。',
    analysis: `<p>题中 \(F_x(a,b)=-3.8\)、\(F_y(a,b)=2.3\)。在 \(y=b\) 的截面，\(z=F(x,b)\)，切线方向可取 \(\langle1,0,-3.8\rangle\)。在 \(x=a\) 的截面，\(z=F(a,y)\)，切线方向可取 \(\langle0,1,2.3\rangle\)。</p><p>切平面法向量记忆：\(\mathbf n=\langle F_x,F_y,-1\rangle\)，因此可取整数向量 \(\langle-38,23,-10\rangle\)。线性近似为 \(\Delta F\approx F_x\Delta x+F_y\Delta y\)，所以 \(\Delta x=-0.4,\Delta y=0.3\) 时结果为 \(2.21\)。</p>`,
    steps: `<ol><li>固定 \(y\)：写 \(z=F(x,b)\)；固定 \(x\)：写 \(z=F(a,y)\)。</li><li>斜率 \(m\) 的方向向量写成“水平走 \(1\)，高度变 \(m\)”。</li><li>直接套 \(\mathbf n=\langle F_x,F_y,-1\rangle\)。</li><li>估计变化量时只做 \(F_x\Delta x+F_y\Delta y\)。</li></ol>`,
    similar: `<p>\(G_x(d,c)=4.2\)、\(G_y(d,c)=-1.5\)。写出 \(y=c\) 与 \(x=d\) 的截面式；给出第一条切线方向向量、切平面整数法向量，并估计 \(G(d+0.2,c-0.4)-G(d,c)\)。</p>`
  },
  {
    id: 4,
    title: 'Basis from geometry in \(\mathbb R^3\)',
    tags: ['Algebra', 'Basis', 'linear dependence'],
    hint: '同类题：三根向量是否共面？',
    analysis: `<p>在 \(\mathbb R^3\) 中，三个向量成 basis 当且仅当它们线性无关，也就是不共面。若 \(v_k\in\operatorname{span}\{v_i,v_j\}\)，第三根向量落在前两根张成的平面内，三者线性相关，不能成为 basis。</p><p>这题已确认 \(v_4\in\operatorname{span}\{v_1,v_2\}\)，所以 \(\{v_1,v_2,v_4\}\) 不能成为 basis。其余组合应通过题目 3D 图里的平面按钮确认，不要只凭一个透视角猜共面。</p>`,
    steps: `<ol><li>固定其中两个向量，打开它们张成的平面。</li><li>旋转图形看第三根是否整根落在该平面内。</li><li>若落在平面内，写 \(v_k\in\operatorname{span}\{v_i,v_j\}\)，因此线性相关且不是 basis。</li></ol>`,
    similar: `<p>\(u_3=2u_1-u_2\)，且 \(u_4\notin\operatorname{span}\{u_1,u_2\}\)。判断 \(\{u_1,u_2,u_3\}\)、\(\{u_1,u_2,u_4\}\)、\(\{u_1,u_3,u_4\}\) 中哪些不能构成 \(\mathbb R^3\) 的 basis。</p>`
  },
  {
    id: 5,
    title: 'Span, linear independence and basis',
    tags: ['Algebra', 'Span', 'LI / LD', 'definitions'],
    hint: '同类题：把定义翻译成“every / exists”和方程有无解。',
    analysis: `<p>\(\{u_1,\ldots,u_4\}\) 张成 \(\mathbb R^3\) 的意思是：对每个 \(\mathbf x\in\mathbb R^3\)，\(\lambda_1u_1+\cdots+\lambda_4u_4=\mathbf x\) 有解。不张成只需找到一个 \(\mathbf y\in\mathbb R^3\) 使该方程无解。</p><p>线性无关检查 \(\alpha_1z_1+\alpha_2z_2+\alpha_3z_3=\mathbf0\) 只有零解；线性相关则存在非零解。\(\mathbb R^n\) 的 basis 恰好有 \(n\) 个向量：\(4>3\) 和 \(3<6\)，所以题中的两组都不可能分别成为 \(\mathbb R^3\) 与 \(\mathbb R^6\) 的 basis。</p>`,
    steps: `<ol><li>Span：看到“every target can be made”，写 \(\forall\mathbf x\) 和方程有解。</li><li>Not span：找 \(\exists\mathbf y\) 使方程无解。</li><li>LI：右边必须是 \(\mathbf0\)，且只有 trivial solution。</li><li>LD：右边仍是 \(\mathbf0\)，但有 non-trivial solution。</li><li>Basis：同时要 span 和 LI；再用维数快速检查向量数。</li></ol>`,
    similar: `<p>令 \(\{a_1,a_2,a_3\}\subset\mathbb R^4\)、\(\{b_1,\ldots,b_5\}\subset\mathbb R^4\)。写出证明第一组线性无关、证明第二组不张成 \(\mathbb R^4\) 各需要的方程条件；两组中哪一组可能是 \(\mathbb R^4\) 的 basis？</p>`
  }
];
