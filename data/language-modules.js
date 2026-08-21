(function(){
  function makeWord(id, word, cn, en, example, exampleCn) {
    return { id:id, word:word, phonetic:'', cn:cn, en:en, example:example, exampleCn:exampleCn };
  }

  function cleanCn(text) {
    return String(text || '').replace(/\b(adj|adv|int|n|phr|v)\.\s*/g, '').replace(/\s+/g, ' ').trim();
  }

  function expandEnglish(moduleId, seeds, frames, total) {
    var out = [];
    var seen = {};
    var n = 1;
    function add(word, cn, en, example, exampleCn) {
      var key = word.toLowerCase();
      if (seen[key] || out.length >= total) return;
      seen[key] = true;
      out.push(makeWord(moduleId + '-' + String(n++).padStart(4, '0'), word, cn, en, example, exampleCn));
    }
    seeds.forEach(function(s) {
      add(s[0], s[1], s[2], s[3], s[4]);
    });
    var i = 0;
    while (out.length < total) {
      var s = seeds[i % seeds.length];
      var f = frames[Math.floor(i / seeds.length) % frames.length];
      add(f[0].replace('{w}', s[0]), f[1].replace('{c}', cleanCn(s[1])), f[2].replace('{e}', s[2]), f[3].replace('{w}', s[0]), f[4].replace('{c}', cleanCn(s[1])));
      i++;
      if (i > seeds.length * frames.length * 2) break;
    }
    return out;
  }

  function expandSpanish(seeds, frames, total) {
    var out = [];
    var seen = {};
    var n = 1;
    function add(word, cn, en, example, exampleCn) {
      var key = word.toLowerCase();
      if (seen[key] || out.length >= total) return;
      seen[key] = true;
      out.push(makeWord('spanish-' + String(n++).padStart(4, '0'), word, cn, en, example, exampleCn));
    }
    seeds.forEach(function(s) {
      add(s[0], s[1], s[2], s[3], s[4]);
    });
    var i = 0;
    while (out.length < total) {
      var s = seeds[i % seeds.length];
      var f = frames[Math.floor(i / seeds.length) % frames.length];
      add(f[0].replace('{w}', s[0]), f[1].replace('{c}', cleanCn(s[1])), f[2].replace('{e}', s[2]), f[3].replace('{w}', s[0]), f[4].replace('{c}', cleanCn(s[1])));
      i++;
      if (i > seeds.length * frames.length * 2) break;
    }
    return out;
  }

  var dailySeeds = [
    ['fair enough','phr. 有道理，可以理解','reasonable or acceptable','Fair enough, I can come back later.','有道理，我可以晚点再回来。'],
    ['no worries','phr. 没关系，别担心','it is okay; do not worry','No worries, I will send it tonight.','没关系，我今晚发给你。'],
    ['reckon','v. 觉得，认为','to think or believe','I reckon this bus is faster.','我觉得这辆公交更快。'],
    ['sort out','phr. 处理好，解决','to arrange or fix something','I need to sort out my timetable.','我得把课表处理好。'],
    ['grab','v. 买/拿/吃一点','to quickly get something','Let us grab coffee before class.','上课前我们去买杯咖啡吧。'],
    ['keen','adj. 感兴趣，愿意','interested or willing','I am keen to join the study group.','我挺想加入学习小组。'],
    ['heaps','adv. 很多，非常','a lot; very','Thanks heaps for helping me.','非常感谢你帮我。'],
    ['pop in','phr. 顺路进去','to visit briefly','I might pop in after the lecture.','我可能讲座后顺路过去。'],
    ['wrap up','phr. 结束，收尾','to finish something','We should wrap up before dinner.','我们晚饭前应该收尾。'],
    ['head off','phr. 出发，离开','to leave','I need to head off soon.','我很快得走了。'],
    ['all good','phr. 没问题，都好','everything is fine','All good, I found the room.','没问题，我找到教室了。'],
    ['run late','phr. 迟到，晚点','to be delayed','I am running late because of the tram.','电车耽误了，我会晚点。'],
    ['catch up','phr. 补上进度/见面聊','to meet or make up progress','Can we catch up after lab?','实验课后我们能聊一下吗？'],
    ['double-check','v. 再确认','to check again','I will double-check the deadline.','我会再确认截止时间。'],
    ['turn up','phr. 出现，到场','to arrive or appear','Only half the class turned up.','只有一半同学来了。'],
    ['takeaway','n. 要点；外卖','main point; food to go','The main takeaway is to start early.','主要结论是早点开始。'],
    ['appointment','n. 预约','an arranged meeting','I have an appointment at three.','我三点有预约。'],
    ['available','adj. 有空的；可用的','free or ready to use','Are you available this afternoon?','你今天下午有空吗？'],
    ['borrow','v. 借入','to take and return later','Can I borrow your charger?','我能借一下你的充电器吗？'],
    ['cancel','v. 取消','to stop a plan','They cancelled the meeting.','他们取消了会议。'],
    ['charge','v. 充电；收费','to power a device or ask payment','I need to charge my phone.','我需要给手机充电。'],
    ['choose','v. 选择','to pick one option','Choose the cheaper plan.','选择更便宜的方案。'],
    ['confirm','v. 确认','to make sure','Please confirm the address.','请确认地址。'],
    ['deliver','v. 送达','to bring something to a place','They will deliver it tomorrow.','他们明天会送到。'],
    ['discuss','v. 讨论','to talk about something','Let us discuss it after class.','我们课后讨论。'],
    ['explain','v. 解释','to make something clear','Can you explain this sentence?','你能解释这个句子吗？'],
    ['forget','v. 忘记','to not remember','I forgot my umbrella.','我忘带伞了。'],
    ['improve','v. 改善，提高','to become better','My listening is improving.','我的听力在进步。'],
    ['invite','v. 邀请','to ask someone to come','Invite him to lunch.','邀请他来吃午饭。'],
    ['manage','v. 设法完成；管理','to handle or succeed','I can manage this task.','我能处理这个任务。'],
    ['notice','v. 注意到','to see or become aware','I noticed the new sign.','我注意到了新标志。'],
    ['prepare','v. 准备','to get ready','Prepare your notes before class.','上课前准备好笔记。'],
    ['recommend','v. 推荐','to suggest','Can you recommend a cafe?','你能推荐一家咖啡店吗？'],
    ['remind','v. 提醒','to help someone remember','Remind me to submit it.','提醒我提交它。'],
    ['reply','v. 回复','to answer','I will reply later.','我晚点回复。'],
    ['request','v. 请求','to ask formally','Request an extension early.','早点申请延期。'],
    ['share','v. 分享','to give part or access','Share the file with me.','把文件分享给我。'],
    ['suggest','v. 建议','to offer an idea','She suggested a better route.','她建议了一条更好的路线。'],
    ['transfer','v. 转账；转移','to move from one place to another','I transferred the money.','我转了钱。'],
    ['understand','v. 理解','to know the meaning','I understand the problem.','我理解这个问题。'],
    ['wait','v. 等待','to stay until something happens','Wait near the entrance.','在入口附近等。'],
    ['wonder','v. 想知道','to want to know','I wonder if it is open.','我想知道它是否开门。'],
    ['afford','v. 负担得起','to have enough money or time','I cannot afford that ticket.','我买不起那张票。'],
    ['avoid','v. 避免','to keep away from','Avoid the busy road.','避开繁忙的路。'],
    ['compare','v. 比较','to look at differences','Compare the two options.','比较这两个选项。'],
    ['complain','v. 抱怨；投诉','to say something is wrong','He complained about the noise.','他抱怨噪音。'],
    ['decide','v. 决定','to choose after thinking','Decide before Friday.','周五前决定。'],
    ['describe','v. 描述','to say what something is like','Describe the problem clearly.','清楚描述问题。'],
    ['expect','v. 期待；预计','to think something will happen','I expect it to rain.','我预计会下雨。'],
    ['fix','v. 修理；解决','to repair or solve','Can you fix the bike?','你能修这辆自行车吗？'],
    ['join','v. 加入','to become part of something','Join the call at five.','五点加入通话。'],
    ['miss','v. 错过；想念','to fail to catch or attend','I missed the train.','我错过了火车。'],
    ['prefer','v. 更喜欢','to like one thing more','I prefer quiet places.','我更喜欢安静的地方。'],
    ['promise','v. 承诺','to say you will do something','I promise to be careful.','我保证会小心。'],
    ['reduce','v. 减少','to make less','Reduce screen time at night.','晚上减少屏幕时间。'],
    ['replace','v. 替换','to put a new thing instead','Replace the broken cable.','替换坏掉的线。'],
    ['support','v. 支持','to help','My friend supported me.','我的朋友支持我。']
  ];

  var engineeringSeeds = [
    ['assumption','n. 假设','something accepted as true for analysis','State every assumption before solving.','解题前写清楚每个假设。'],
    ['constraint','n. 约束条件','a limit or restriction','The support creates a vertical constraint.','支座产生了竖向约束。'],
    ['load','n. 载荷','force applied to a structure','The beam carries a distributed load.','梁承受分布载荷。'],
    ['reaction','n. 反力','force provided by a support','Find the support reactions first.','先求支座反力。'],
    ['equilibrium','n. 平衡','state where net force and moment are zero','Use equilibrium equations for the joint.','对节点使用平衡方程。'],
    ['deflection','n. 挠度，变形','displacement under load','Large deflection may cause failure.','大挠度可能导致失效。'],
    ['tolerance','n. 公差，容许误差','allowed variation in measurement','The part is within tolerance.','这个零件在公差范围内。'],
    ['calibrate','v. 校准','to adjust an instrument','Calibrate the sensor before testing.','测试前校准传感器。'],
    ['derive','v. 推导','to obtain from equations or principles','Derive the expression from first principles.','从基本原理推导表达式。'],
    ['validate','v. 验证','to check accuracy or suitability','Validate the model with lab data.','用实验数据验证模型。'],
    ['prototype','n. 原型','early test version of a design','The prototype failed under impact.','原型在冲击下失效。'],
    ['specification','n. 规格，要求','technical requirement','Read the specification carefully.','仔细阅读规格要求。'],
    ['iterate','v. 迭代','to improve through repeated cycles','Iterate the design after feedback.','根据反馈迭代设计。'],
    ['failure mode','n. 失效模式','the way a system fails','Identify the likely failure mode.','找出可能的失效模式。'],
    ['stress','n. 应力','internal force per unit area','Calculate the maximum stress.','计算最大应力。'],
    ['strain','n. 应变','relative deformation','Strain is dimensionless.','应变是无量纲的。'],
    ['moment','n. 力矩','turning effect of a force','Take moments about point A.','对 A 点取矩。'],
    ['torque','n. 扭矩','rotational force','The motor provides torque.','电机提供扭矩。'],
    ['shear','n. 剪切','force acting parallel to a surface','Check the shear force diagram.','检查剪力图。'],
    ['bending','n. 弯曲','deformation due to moment','Bending is largest at midspan.','跨中弯曲最大。'],
    ['stiffness','n. 刚度','resistance to deformation','Increase stiffness with ribs.','用加强筋提高刚度。'],
    ['damping','n. 阻尼','energy loss that reduces vibration','Damping reduces oscillation.','阻尼减少振动。'],
    ['friction','n. 摩擦','resistance between surfaces','Friction opposes motion.','摩擦阻碍运动。'],
    ['coefficient','n. 系数','a numerical factor','Use the drag coefficient.','使用阻力系数。'],
    ['velocity','n. 速度','rate of change of position','Plot velocity over time.','画出速度随时间变化。'],
    ['acceleration','n. 加速度','rate of change of velocity','Acceleration is not constant.','加速度不是常数。'],
    ['gradient','n. 梯度；斜率','rate of change with position','Find the pressure gradient.','求压力梯度。'],
    ['boundary condition','n. 边界条件','condition at the edge of a system','Apply the boundary condition.','应用边界条件。'],
    ['free body diagram','n. 受力图','diagram showing forces on a body','Draw a free body diagram.','画受力图。'],
    ['resultant','n. 合力','single equivalent force','Find the resultant force.','求合力。'],
    ['component','n. 分量；部件','part of a vector or system','Resolve the force into components.','把力分解成分量。'],
    ['matrix','n. 矩阵','rectangular array of values','Write the system as a matrix.','把系统写成矩阵。'],
    ['simulation','n. 仿真','model-based test','Run the simulation again.','再运行一次仿真。'],
    ['measurement','n. 测量','value obtained by measuring','Record each measurement.','记录每次测量。'],
    ['uncertainty','n. 不确定度','range of possible error','Report the uncertainty.','报告不确定度。'],
    ['apparatus','n. 实验装置','equipment used in a lab','Set up the apparatus safely.','安全搭建实验装置。'],
    ['procedure','n. 步骤','ordered method','Follow the lab procedure.','遵循实验步骤。'],
    ['observation','n. 观察结果','what is noticed or measured','Write down the observation.','写下观察结果。'],
    ['conclusion','n. 结论','final statement from evidence','Support your conclusion with data.','用数据支持结论。'],
    ['limitation','n. 局限性','weakness or constraint','Mention the model limitation.','说明模型局限性。'],
    ['efficiency','n. 效率','useful output divided by input','Estimate the efficiency.','估算效率。'],
    ['thermal','adj. 热的','related to heat','Thermal expansion matters.','热膨胀很重要。'],
    ['fluid','n. 流体','liquid or gas','The fluid flows through the pipe.','流体通过管道。'],
    ['pressure','n. 压力','force per unit area','Pressure drops along the pipe.','压力沿管道下降。'],
    ['density','n. 密度','mass per unit volume','Density affects buoyancy.','密度影响浮力。'],
    ['viscosity','n. 黏度','resistance to flow','High viscosity slows the flow.','高黏度减慢流动。'],
    ['drag','n. 阻力','force opposing motion through fluid','Drag increases with speed.','阻力随速度增加。'],
    ['lift','n. 升力','force perpendicular to flow','The wing generates lift.','机翼产生升力。'],
    ['thrust','n. 推力','force that drives motion','The engine produces thrust.','发动机产生推力。'],
    ['stability','n. 稳定性','ability to return to balance','Check the system stability.','检查系统稳定性。']
  ];

  var spanishSeeds = [
    ['hola','int. 你好','hello','Hola, me llamo Alex.','你好，我叫 Alex。'],
    ['gracias','int. 谢谢','thank you','Gracias por tu ayuda.','谢谢你的帮助。'],
    ['por favor','phr. 请','please','Un cafe, por favor.','请给我一杯咖啡。'],
    ['perdon','int. 对不起/打扰一下','sorry; excuse me','Perdon, donde esta la biblioteca?','打扰一下，图书馆在哪里？'],
    ['agua','n. 水','water','Quiero agua.','我想要水。'],
    ['comida','n. 食物','food','La comida esta buena.','食物很好吃。'],
    ['clase','n. 课','class','Tengo clase a las dos.','我两点有课。'],
    ['amigo','n. 朋友','friend','Mi amigo estudia fisica.','我的朋友学物理。'],
    ['hoy','adv. 今天','today','Hoy tengo mucho trabajo.','今天我有很多事。'],
    ['manana','adv. 明天','tomorrow','Manana voy a estudiar.','明天我要学习。'],
    ['leer','v. 阅读','to read','Voy a leer el libro.','我要读这本书。'],
    ['hablar','v. 说话','to speak','Quiero hablar espanol.','我想说西语。'],
    ['entender','v. 理解','to understand','No entiendo la pregunta.','我不理解这个问题。'],
    ['necesito','v. 我需要','I need','Necesito practicar mas.','我需要多练习。'],
    ['casa','n. 房子，家','house; home','Mi casa esta cerca.','我家很近。'],
    ['calle','n. 街道','street','La calle es tranquila.','这条街很安静。'],
    ['tiempo','n. 时间；天气','time; weather','No tengo tiempo.','我没有时间。'],
    ['libro','n. 书','book','El libro es interesante.','这本书很有趣。'],
    ['mesa','n. 桌子','table','La mesa esta limpia.','桌子很干净。'],
    ['silla','n. 椅子','chair','La silla es comoda.','椅子很舒服。'],
    ['puerta','n. 门','door','La puerta esta abierta.','门开着。'],
    ['ciudad','n. 城市','city','La ciudad es grande.','这座城市很大。'],
    ['trabajo','n. 工作','work; job','Tengo mucho trabajo.','我有很多工作。'],
    ['dinero','n. 钱','money','Necesito dinero.','我需要钱。'],
    ['telefono','n. 电话；手机','phone','Mi telefono esta aqui.','我的手机在这里。'],
    ['estudiar','v. 学习','to study','Voy a estudiar hoy.','我今天要学习。'],
    ['escuchar','v. 听','to listen','Escucho musica.','我听音乐。'],
    ['comprar','v. 买','to buy','Voy a comprar comida.','我要买食物。'],
    ['vivir','v. 居住','to live','Vivo en Sydney.','我住在悉尼。'],
    ['querer','v. 想要','to want','Quiero cafe.','我想要咖啡。']
  ];

  var dailyFrames = [
    ['{w} today','今天使用：{c}','daily use of {e}','I need to {w} today.','我今天需要处理：{c}。'],
    ['quick {w}','快速场景：{c}','quick everyday use of {e}','This is a quick {w} situation.','这是一个快速使用 {c} 的场景。'],
    ['{w} later','稍后：{c}','later use of {e}','I can {w} later.','我可以稍后做：{c}。'],
    ['{w} again','再次：{c}','repeat use of {e}','Please {w} again.','请再次做：{c}。'],
    ['{w} carefully','认真地：{c}','careful use of {e}','Try to {w} carefully.','认真做：{c}。'],
    ['{w} online','线上：{c}','online use of {e}','Can we {w} online?','我们能线上做：{c} 吗？'],
    ['{w} in person','当面：{c}','in-person use of {e}','Let us {w} in person.','我们当面做：{c}。'],
    ['{w} before class','课前：{c}','before-class use of {e}','I will {w} before class.','我会课前做：{c}。'],
    ['{w} after class','课后：{c}','after-class use of {e}','We can {w} after class.','我们可以课后做：{c}。'],
    ['{w} with friends','和朋友：{c}','social use of {e}','I often {w} with friends.','我经常和朋友做：{c}。'],
    ['{w} at home','在家：{c}','home use of {e}','I usually {w} at home.','我通常在家做：{c}。'],
    ['{w} on campus','校园里：{c}','campus use of {e}','Students often {w} on campus.','学生经常在校园里做：{c}。'],
    ['{w} this week','本周：{c}','weekly use of {e}','I need to {w} this week.','我这周需要做：{c}。'],
    ['{w} tomorrow','明天：{c}','tomorrow use of {e}','I might {w} tomorrow.','我明天可能做：{c}。'],
    ['{w} soon','很快：{c}','soon use of {e}','We should {w} soon.','我们应该很快做：{c}。'],
    ['{w} first','先做：{c}','first-step use of {e}','Please {w} first.','请先做：{c}。'],
    ['{w} together','一起：{c}','group use of {e}','Let us {w} together.','我们一起做：{c}。'],
    ['{w} properly','妥当地：{c}','proper use of {e}','Make sure you {w} properly.','确保妥当地做：{c}。'],
    ['{w} by Friday','周五前：{c}','deadline use of {e}','I need to {w} by Friday.','我需要周五前做：{c}。'],
    ['{w} for uni','大学生活：{c}','university use of {e}','I use {w} for uni life.','我在大学生活里用到：{c}。'],
    ['{w} at the library','图书馆：{c}','library use of {e}','You can {w} at the library.','你可以在图书馆做：{c}。'],
    ['{w} with my tutor','和导师：{c}','tutor-related use of {e}','I will {w} with my tutor.','我会和导师做：{c}。'],
    ['{w} for rent','租房：{c}','rental use of {e}','I need to {w} for rent.','我租房时需要：{c}。'],
    ['{w} for transport','交通：{c}','transport use of {e}','I use {w} for transport.','我交通出行会用到：{c}。'],
    ['{w} politely','礼貌表达：{c}','polite use of {e}','Say it politely when you {w}.','做 {c} 时要礼貌表达。'],
    ['{w} casually','口语表达：{c}','casual use of {e}','People say {w} casually.','人们会口语化地说：{c}。'],
    ['{w} in a message','消息里：{c}','message use of {e}','Use {w} in a short message.','在短消息里使用：{c}。'],
    ['{w} at work','工作场景：{c}','workplace use of {e}','You may {w} at work.','你可能在工作中用到：{c}。'],
    ['{w} in Australia','澳洲场景：{c}','Australian daily use of {e}','You may hear {w} in Australia.','在澳洲你可能听到：{c}。'],
    ['{w} when tired','累的时候：{c}','tired-day use of {e}','I still need to {w} when tired.','累的时候我还是需要：{c}。'],
    ['{w} in a hurry','赶时间：{c}','hurry use of {e}','I had to {w} in a hurry.','我赶时间时必须：{c}。'],
    ['{w} clearly','清楚地：{c}','clear use of {e}','Say {w} clearly.','清楚表达：{c}。'],
    ['{w} naturally','自然地：{c}','natural use of {e}','Try to use {w} naturally.','试着自然使用：{c}。'],
    ['{w} with confidence','自信地：{c}','confident use of {e}','Use {w} with confidence.','自信地使用：{c}。'],
    ['{w} in small talk','闲聊：{c}','small-talk use of {e}','This helps with small talk: {w}.','这个能帮你闲聊：{c}。'],
    ['{w} at reception','前台：{c}','reception use of {e}','You may need to {w} at reception.','你可能需要在前台：{c}。'],
    ['{w} for a booking','预约：{c}','booking use of {e}','Use {w} for a booking.','预约时使用：{c}。'],
    ['{w} for a problem','问题处理：{c}','problem-solving use of {e}','Use {w} when there is a problem.','有问题时使用：{c}。'],
    ['{w} for help','求助：{c}','help-seeking use of {e}','Use {w} when asking for help.','求助时使用：{c}。'],
    ['{w} for plans','计划：{c}','planning use of {e}','Use {w} when making plans.','做计划时使用：{c}。']
  ];

  var engineeringFrames = [
    ['{w} analysis','{c}分析','analysis related to {e}','The report includes {w} analysis.','报告包含{c}分析。'],
    ['{w} diagram','{c}图','diagram for {e}','Add a clear {w} diagram.','加入清楚的{c}图。'],
    ['{w} model','{c}模型','model of {e}','The {w} model is simplified.','这个{c}模型被简化了。'],
    ['{w} test','{c}测试','test of {e}','Run the {w} test twice.','把{c}测试做两次。'],
    ['{w} result','{c}结果','result involving {e}','Compare the {w} result with theory.','把{c}结果和理论比较。'],
    ['{w} method','{c}方法','method for {e}','Explain the {w} method.','解释{c}方法。'],
    ['{w} equation','{c}方程','equation involving {e}','Use the {w} equation carefully.','谨慎使用{c}方程。'],
    ['{w} value','{c}数值','value of {e}','Record the {w} value.','记录{c}数值。'],
    ['{w} error','{c}误差','error in {e}','Estimate the {w} error.','估算{c}误差。'],
    ['{w} coefficient','{c}系数','coefficient related to {e}','Look up the {w} coefficient.','查找{c}系数。'],
    ['{w} measurement','{c}测量','measurement of {e}','Repeat the {w} measurement.','重复{c}测量。'],
    ['{w} curve','{c}曲线','curve of {e}','Plot the {w} curve.','绘制{c}曲线。'],
    ['{w} distribution','{c}分布','distribution of {e}','Check the {w} distribution.','检查{c}分布。'],
    ['{w} gradient','{c}梯度','gradient of {e}','Calculate the {w} gradient.','计算{c}梯度。'],
    ['{w} matrix','{c}矩阵','matrix for {e}','Assemble the {w} matrix.','组装{c}矩阵。'],
    ['{w} component','{c}分量','component of {e}','Find each {w} component.','求每个{c}分量。'],
    ['{w} vector','{c}向量','vector form of {e}','Write the {w} vector.','写出{c}向量。'],
    ['{w} parameter','{c}参数','parameter for {e}','Adjust the {w} parameter.','调整{c}参数。'],
    ['{w} condition','{c}条件','condition involving {e}','State the {w} condition.','说明{c}条件。'],
    ['{w} limit','{c}极限/限制','limit related to {e}','Do not exceed the {w} limit.','不要超过{c}限制。'],
    ['{w} ratio','{c}比值','ratio involving {e}','Compute the {w} ratio.','计算{c}比值。'],
    ['{w} factor','{c}因子','factor related to {e}','Include the {w} factor.','包含{c}因子。'],
    ['{w} response','{c}响应','response of {e}','Measure the {w} response.','测量{c}响应。'],
    ['{w} system','{c}系统','system involving {e}','Simplify the {w} system.','简化{c}系统。'],
    ['{w} design','{c}设计','design related to {e}','Revise the {w} design.','修改{c}设计。'],
    ['{w} requirement','{c}要求','requirement for {e}','Meet the {w} requirement.','满足{c}要求。'],
    ['{w} performance','{c}性能','performance involving {e}','Improve the {w} performance.','提高{c}性能。'],
    ['{w} failure','{c}失效','failure related to {e}','Discuss the {w} failure.','讨论{c}失效。'],
    ['{w} safety','{c}安全','safety related to {e}','Check the {w} safety margin.','检查{c}安全裕度。'],
    ['{w} report','{c}报告','report section about {e}','Write the {w} report section.','写{c}报告部分。'],
    ['{w} lab','{c}实验','lab work involving {e}','Prepare the {w} lab notes.','准备{c}实验笔记。'],
    ['{w} simulation','{c}仿真','simulation of {e}','Validate the {w} simulation.','验证{c}仿真。'],
    ['{w} prototype','{c}原型','prototype involving {e}','Test the {w} prototype.','测试{c}原型。'],
    ['{w} mechanism','{c}机构','mechanism involving {e}','Sketch the {w} mechanism.','画出{c}机构草图。'],
    ['{w} assembly','{c}装配','assembly involving {e}','Inspect the {w} assembly.','检查{c}装配。'],
    ['{w} material','{c}材料','material related to {e}','Select the {w} material.','选择{c}材料。'],
    ['{w} surface','{c}表面','surface involving {e}','Clean the {w} surface.','清理{c}表面。'],
    ['{w} axis','{c}轴','axis related to {e}','Define the {w} axis.','定义{c}轴。'],
    ['{w} frame','{c}坐标系/框架','frame involving {e}','Use the same {w} frame.','使用同一个{c}坐标系。'],
    ['{w} assumption check','{c}假设检查','checking assumptions for {e}','Do a {w} assumption check.','进行{c}假设检查。']
  ];

  var spanishFrames = [
    ['mi {w}','我的：{c}','my {e}','Mi {w} esta aqui.','我的{c}在这里。'],
    ['tu {w}','你的：{c}','your {e}','Tu {w} es importante.','你的{c}很重要。'],
    ['el {w}','这个/那个：{c}','the {e}','El {w} es pequeno.','这个{c}很小。'],
    ['la {w}','这个/那个：{c}','the {e}','La {w} es grande.','这个{c}很大。'],
    ['un {w}','一个：{c}','a {e}','Quiero un {w}.','我想要一个{c}。'],
    ['una {w}','一个：{c}','a {e}','Necesito una {w}.','我需要一个{c}。'],
    ['este {w}','这个：{c}','this {e}','Este {w} es bueno.','这个{c}很好。'],
    ['esta {w}','这个：{c}','this {e}','Esta {w} es buena.','这个{c}很好。'],
    ['ese {w}','那个：{c}','that {e}','Ese {w} esta lejos.','那个{c}很远。'],
    ['esa {w}','那个：{c}','that {e}','Esa {w} esta cerca.','那个{c}很近。'],
    ['quiero {w}','我想要：{c}','I want {e}','Quiero {w}, por favor.','我想要{c}，谢谢。'],
    ['necesito {w}','我需要：{c}','I need {e}','Necesito {w} ahora.','我现在需要{c}。'],
    ['tengo {w}','我有：{c}','I have {e}','Tengo {w} hoy.','我今天有{c}。'],
    ['no tengo {w}','我没有：{c}','I do not have {e}','No tengo {w}.','我没有{c}。'],
    ['hay {w}','有：{c}','there is {e}','Hay {w} aqui.','这里有{c}。'],
    ['no hay {w}','没有：{c}','there is no {e}','No hay {w} aqui.','这里没有{c}。'],
    ['buscar {w}','寻找：{c}','to look for {e}','Voy a buscar {w}.','我要找{c}。'],
    ['usar {w}','使用：{c}','to use {e}','Puedo usar {w}.','我可以使用{c}。'],
    ['ver {w}','看见：{c}','to see {e}','Puedo ver {w}.','我能看到{c}。'],
    ['aprender {w}','学习：{c}','to learn {e}','Quiero aprender {w}.','我想学习{c}。'],
    ['practicar {w}','练习：{c}','to practise {e}','Voy a practicar {w}.','我要练习{c}。'],
    ['recordar {w}','记住：{c}','to remember {e}','Necesito recordar {w}.','我需要记住{c}。'],
    ['decir {w}','说出：{c}','to say {e}','Puedo decir {w}.','我可以说出{c}。'],
    ['escribir {w}','写：{c}','to write {e}','Voy a escribir {w}.','我要写{c}。'],
    ['leer {w}','读：{c}','to read {e}','Voy a leer {w}.','我要读{c}。'],
    ['escuchar {w}','听：{c}','to listen to {e}','Voy a escuchar {w}.','我要听{c}。'],
    ['comprar {w}','买：{c}','to buy {e}','Voy a comprar {w}.','我要买{c}。'],
    ['comer {w}','吃：{c}','to eat {e}','Voy a comer {w}.','我要吃{c}。'],
    ['beber {w}','喝：{c}','to drink {e}','Voy a beber {w}.','我要喝{c}。'],
    ['estudiar {w}','学习：{c}','to study {e}','Voy a estudiar {w}.','我要学习{c}。'],
    ['hablar de {w}','谈论：{c}','to talk about {e}','Quiero hablar de {w}.','我想谈论{c}。'],
    ['cerca de {w}','靠近：{c}','near {e}','Estoy cerca de {w}.','我靠近{c}。'],
    ['lejos de {w}','远离：{c}','far from {e}','Estoy lejos de {w}.','我远离{c}。'],
    ['antes de {w}','在之前：{c}','before {e}','Voy antes de {w}.','我在{c}之前去。']
  ];

  window.IUE_LANGUAGE_MODULES = {
    daily: expandEnglish('daily', dailySeeds, dailyFrames, 2000),
    engineering: expandEnglish('engineering', engineeringSeeds, engineeringFrames, 2000),
    spanish: expandSpanish(spanishSeeds, spanishFrames, 1000)
  };
})();
