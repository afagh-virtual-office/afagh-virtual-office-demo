(() => {
  const dict = {
    FA: {
      nav: {
        home: ['خانه','ورودی سیستم'], command: ['مرکز فرمان AI','گفتگو و تصمیم'], workspace: ['Business 360','نمای زمینه'], operations: ['عملیات هوشمند','ماموریت‌ها و اقدامات'], governance: ['حاکمیت','سیاست و اعتماد'], evidence: ['مرکز شواهد','اثبات و زنجیره'], communication: ['Communication OS','صوت و مسیریابی'], settings: ['تنظیمات','کنترل‌های سیستم']
      },
      lang: 'FA', dir: 'rtl', search: 'با سیستم صحبت کنید…  مثال: وضعیت سیستم را بررسی کن',
      mode: 'حالت', runtime: 'Runtime', controlled: 'کنترل‌شده',
      heroEyebrow: 'AI-NATIVE OPERATING SYSTEM',
      heroSubtitle: 'سیستم باید با شما کار کند؛ نه فقط اطلاعات نمایش دهد.',
      master: 'از Context به Intelligence، از Decision به Action، و از Action به Evidence — همه در یک حلقه عملیاتی قابل مشاهده و قابل کنترل.',
      heroBody: 'این صفحه Command Surface است: وضعیت واقعی Runtime را می‌خواند، با شما گفتگو می‌کند و هر ادعای سیستمی را به Evidence متصل می‌کند.',
      start: 'شروع گفتگو با سیستم', refresh: 'بررسی زنده',
      quick: ['وضعیت','DB Proof','Migration','Evidence','چرا Blocked؟'],
      commandTitle: 'گفتگوی زنده با سیستم', commandSub: 'System Dialogue · derived from live runtime signals',
      commandPlaceholder: 'به سیستم سؤال یا دستور بدهید…',
      controlTitle: 'Control Actions', controlSub: 'Real signals first · bounded execution',
      ctrl: [['Refresh Runtime Truth','Health + DB proof','اجرا'],['Communication OS','Workspace عملیاتی ارتباطات','باز کردن'],['Authentication Runtime','P0-1 Entra / session evidence','بررسی'],['Production Release','محافظت‌شده توسط Governance','BLOCKED BY GATE']],
      footer1: 'AFAGH AI Operating System · V1.0 Operational Homepage',
      footer2: 'Visual PASS ≠ Architecture PASS · Evidence remains authoritative',
      greet: 'سلام. من سطح عملیاتی AFAGH هستم.',
      live: 'SYSTEM LINK READY', blocked: 'RUNTIME BLOCKED',
      sections: [['Operational Loop','Context → Decision → Action → Evidence'],['Four-Team Control','T1 / T2 / T3 / T4'],['Evidence Lane','Proof is authoritative']],
      tags: ['AI → DECISION → ACTION','POLICY FIRST','EVIDENCE DRIVEN','FAIL CLOSED']
    },
    EN: {
      nav: {
        home: ['Home','System entry'], command: ['AI Command Center','Talk & decide'], workspace: ['Business 360','Context surface'], operations: ['Intelligent Operations','Missions & actions'], governance: ['Governance','Policy & trust'], evidence: ['Evidence Center','Proof & lineage'], communication: ['Communication OS','Voice & routing'], settings: ['Settings','System controls']
      },
      lang: 'EN', dir: 'ltr', search: 'Talk to the system… Example: check system status', mode: 'Mode', runtime: 'Runtime', controlled: 'CONTROLLED',
      heroEyebrow: 'AI-NATIVE OPERATING SYSTEM',
      heroSubtitle: 'The system should work with you — not just display information.',
      master: 'From Context to Intelligence, from Decision to Action, and from Action to Evidence — one observable, controllable operational loop.',
      heroBody: 'This page is the Command Surface: it reads real Runtime status, talks with you, and connects every system claim to Evidence.',
      start: 'Start system conversation', refresh: 'Live check',
      quick: ['Status','DB Proof','Migration','Evidence','Why blocked?'],
      commandTitle: 'Live system dialogue', commandSub: 'System Dialogue · derived from live runtime signals', commandPlaceholder: 'Ask the system a question or give a command…',
      controlTitle: 'Control Actions', controlSub: 'Real signals first · bounded execution',
      ctrl: [['Refresh Runtime Truth','Health + DB proof','Run'],['Communication OS','Operational communication workspace','Open'],['Authentication Runtime','P0-1 Entra / session evidence','Check'],['Production Release','Protected by Governance','BLOCKED BY GATE']],
      footer1: 'AFAGH AI Operating System · V1.0 Operational Homepage', footer2: 'Visual PASS ≠ Architecture PASS · Evidence remains authoritative',
      greet: 'Hello. I am the AFAGH operational surface.', live: 'SYSTEM LINK READY', blocked: 'RUNTIME BLOCKED',
      sections: [['Operational Loop','Context → Decision → Action → Evidence'],['Four-Team Control','T1 / T2 / T3 / T4'],['Evidence Lane','Proof is authoritative']],
      tags: ['AI → DECISION → ACTION','POLICY FIRST','EVIDENCE DRIVEN','FAIL CLOSED']
    }
  };

  const text = (el, value) => { if (el) el.textContent = value; };
  const setPlaceholder = (el, value) => { if (el) el.placeholder = value; };
  function apply(lang) {
    const d = dict[lang] || dict.FA;
    document.documentElement.lang = d.lang === 'FA' ? 'fa' : 'en';
    document.documentElement.dir = d.dir;
    document.body.dir = d.dir;

    const navIds = ['home','command','workspace','operations','governance','evidence','communication','settings'];
    navIds.forEach((id, i) => {
      const b = document.querySelector(`[data-nav="${id}"]`);
      if (!b) return;
      const spans = b.querySelectorAll('span');
      const strong = b.querySelector('b');
      const small = b.querySelector('small');
      text(strong, d.nav[id][0]);
      text(small, d.nav[id][1]);
      if (spans[0]) spans[0].setAttribute('aria-label', d.nav[id][0]);
    });

    setPlaceholder(document.querySelector('#globalInput'), d.search);
    const langButtons = document.querySelectorAll('.lang button');
    langButtons.forEach(btn => btn.classList.toggle('active', btn.textContent.trim().toUpperCase() === lang));

    text(document.querySelector('.hero .eyebrow'), d.heroEyebrow);
    text(document.querySelector('.hero h2'), d.heroSubtitle);
    text(document.querySelector('.hero .master'), d.master);
    const heroPs = document.querySelectorAll('.hero-copy > p');
    if (heroPs[1]) text(heroPs[1], d.heroBody);
    text(document.querySelector('#talkBtn'), d.start);
    text(document.querySelector('#refreshBtn'), d.refresh);

    const tags = document.querySelectorAll('.hero-tags .tag');
    d.tags.forEach((v,i)=>text(tags[i],v));

    const sec = document.querySelectorAll('.command .sectionhead, .lower .sectionhead');
    const commandHead = document.querySelector('#command .sectionhead');
    if (commandHead) { text(commandHead.querySelector('h2'), d.commandTitle); text(commandHead.querySelector('small'), d.commandSub); }
    const controlHead = document.querySelector('#workspace .sectionhead');
    if (controlHead) { text(controlHead.querySelector('h2'), d.controlTitle); text(controlHead.querySelector('small'), d.controlSub); }
    setPlaceholder(document.querySelector('#commandInput'), d.commandPlaceholder);

    const ctrlRows = document.querySelectorAll('.ctrl');
    d.ctrl.forEach((v,i)=>{ const row=ctrlRows[i]; if(!row)return; text(row.querySelector('b'),v[0]); text(row.querySelector('span'),v[1]); text(row.querySelector('button'),v[2]); });

    const quick = document.querySelectorAll('.quick button');
    d.quick.forEach((v,i)=>text(quick[i],v));
    text(document.querySelector('.footer span:first-child'), d.footer1);
    text(document.querySelector('.footer span:last-child'), d.footer2);

    const lowerHeads = document.querySelectorAll('.lower .sectionhead');
    d.sections.forEach((v,i)=>{ const h=lowerHeads[i]; if(!h)return; text(h.querySelector('h2'),v[0]); text(h.querySelector('small'),v[1]); });

    localStorage.setItem('afagh-language', lang);
    window.dispatchEvent(new CustomEvent('afagh:language-changed',{detail:{lang}}));
  }

  function bind() {
    document.querySelectorAll('.lang button').forEach(btn => {
      btn.type = 'button';
      btn.addEventListener('click', () => apply(btn.textContent.trim().toUpperCase() === 'EN' ? 'EN' : 'FA'));
    });
    apply(localStorage.getItem('afagh-language') === 'EN' ? 'EN' : 'FA');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true}); else bind();
})();
