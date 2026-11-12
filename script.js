const copy={
      ar:{brand:"نبيل ناجي نبيل",navAbout:"عني",navSkills:"المهارات",navProjects:"المشاريع",navEducation:"التعليم",navContact:"تواصل",availability:"متاح لفرص التدريب والعمل والتعاون",hello:"أهلًا، أنا",name:"نبيل ناجي نبيل",intro:"طالب بكلية الحاسبات والمعلومات في جامعة الزقازيق. أتعلم تطوير الويب وتطبيقاته وقواعد البيانات، وأبني مشاريع عملية أشاركها هنا.",viewWork:"شاهد مشاريعي",contactMe:"تواصل معي",student:"طالب حاسبات ومعلومات",zag:"جامعة الزقازيق",webDev:"تطوير الويب",learning:"أتعلم وأبني",aboutKicker:"نبذة",aboutTitle:"أتعلم، أجرّب، وأطوّر",aboutIntro:"مساحة شخصية لعرض رحلتي في الحاسبات والمشاريع التي أعمل عليها.",bio:"أنا نبيل ناجي نبيل، طالب بكلية الحاسبات والمعلومات في جامعة الزقازيق. أتعلم تطوير مواقع الويب وتطبيقات الويب وقواعد البيانات، وأسعى إلى تنمية مهاراتي من خلال تنفيذ مشاريع عملية ومشاركة أعمالي.",fieldLabel:"المجالات",fieldValue:"مواقع الويب · تطبيقات الويب · قواعد البيانات",basedLabel:"الدراسة",basedValue:"جامعة الزقازيق",focusLabel:"التركيز الحالي",focusValue:"مشاريع عملية وتعلّم مستمر",availabilityLabel:"الحالة",availabilityShort:"متاح للتعاون",skillsKicker:"ما أتعلمه",skillsTitle:"مهاراتي التقنية",skillsIntro:"المهارات التالية قيد التعلم والتطوير، وسأحدّثها مع تقدمي ومشاريعي.",inProgress:"قيد التعلم",projectsKicker:"معرض الأعمال",projectsTitle:"مشاريعي",projectsIntro:"هنا ستظهر المشاريع التي أنجزها، مع وصفها والتقنيات المستخدمة وروابطها.",emptyTitle:"المشاريع قيد الإعداد",emptyText:"سأضيف مشاريعي هنا عندما تكتمل، لتتمكن من استكشاف كل مشروع وتفاصيله.",educationKicker:"الدراسة",educationTitle:"التعليم",degree:"كلية الحاسبات والمعلومات",university:"جامعة الزقازيق",moreKicker:"مساحة قابلة للتوسّع",moreTitle:"المزيد قريبًا",moreIntro:"يمكن إضافة هذه الأقسام وتحديثها مع نمو أعمالي.",certTitle:"الشهادات والخبرات",certText:"مكان لإضافة الشهادات والخبرات لاحقًا.",coursesTitle:"الكورسات والفيديوهات",coursesText:"قسم قابل للإضافة عندما أبدأ نشر المحتوى.",articlesTitle:"المقالات والشروحات",articlesText:"مساحة لمشاركة ما أتعلمه وملاحظاتي.",contactKicker:"لنتواصل",contactTitle:"هل لديك فكرة أو فرصة؟",contactIntro:"يسعدني التواصل بشأن التدريب أو العمل أو التعاون على مشروع.",emailLabel:"البريد الإلكتروني",phoneLabel:"الهاتف",whatsappText:"ابدأ محادثة",footerNote:"موقع شخصي قيد التطوير"},
      en:{brand:"Nabil Nagy Nabil",navAbout:"About",navSkills:"Skills",navProjects:"Projects",navEducation:"Education",navContact:"Contact",availability:"Open to training, work, and collaboration",hello:"Hello, I’m",name:"Nabil Nagy Nabil",intro:"A Computer Science student at Zagazig University, learning web development, web applications, and databases while building practical projects to share here.",viewWork:"View my projects",contactMe:"Contact me",student:"Computer Science student",zag:"Zagazig University",webDev:"Web development",learning:"Learning & building",aboutKicker:"ABOUT",aboutTitle:"Learning, exploring, and building",aboutIntro:"A personal space to share my journey in computing and the projects I work on.",bio:"I’m Nabil Nagy Nabil, a Computer Science student at Zagazig University. I’m learning web development, web applications, and databases, and I’m working to build my skills through practical projects and share my work.",fieldLabel:"Areas of interest",fieldValue:"Websites · Web applications · Databases",basedLabel:"Education",basedValue:"Zagazig University",focusLabel:"Current focus",focusValue:"Practical projects and continuous learning",availabilityLabel:"Status",availabilityShort:"Open to collaboration",skillsKicker:"WHAT I’M LEARNING",skillsTitle:"Technical skills",skillsIntro:"These skills are in progress and will be updated as I learn and complete projects.",inProgress:"Learning",projectsKicker:"PORTFOLIO",projectsTitle:"Projects",projectsIntro:"Completed projects will appear here with descriptions, technologies, and links.",emptyTitle:"Projects are in progress",emptyText:"I’ll add my projects here as they’re ready, with details to explore.",educationKicker:"STUDIES",educationTitle:"Education",degree:"Faculty of Computers and Information",university:"Zagazig University",moreKicker:"GROWING PORTFOLIO",moreTitle:"More coming soon",moreIntro:"These sections can grow as I build and share more work.",certTitle:"Certificates & experience",certText:"A place to add certificates and experience later.",coursesTitle:"Courses & videos",coursesText:"A section to add when I begin publishing learning content.",articlesTitle:"Articles & tutorials",articlesText:"A space for sharing what I learn and my notes.",contactKicker:"GET IN TOUCH",contactTitle:"Have an idea or opportunity?",contactIntro:"Feel free to reach out about training, work, or project collaboration.",emailLabel:"Email",phoneLabel:"Phone",whatsappText:"Start a conversation",footerNote:"Personal website in progress"}
    };
    let lang=localStorage.getItem('nabil-lang')||'ar';let theme=localStorage.getItem('nabil-theme')||'dark';
    function renderLang(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.querySelectorAll('[data-t]').forEach(el=>{const key=el.dataset.t;if(copy[lang][key])el.textContent=copy[lang][key]});document.getElementById('language').textContent=lang==='ar'?'EN':'عربي';document.getElementById('language').setAttribute('aria-label',lang==='ar'?'Switch to English':'التبديل إلى العربية')}
    function renderTheme(){document.documentElement.classList.toggle('light',theme==='light');document.getElementById('theme').textContent=theme==='light'?'☾':'☼';document.getElementById('theme').setAttribute('aria-label',theme==='light'?'Switch to dark mode':'Switch to light mode')}
    document.getElementById('language').addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';localStorage.setItem('nabil-lang',lang);renderLang()});
    document.getElementById('theme').addEventListener('click',()=>{theme=theme==='dark'?'light':'dark';localStorage.setItem('nabil-theme',theme);renderTheme()});
    document.getElementById('year').textContent=new Date().getFullYear();renderLang();renderTheme();

    Object.assign(copy.ar,{navCourses:'الكورسات',coursesKicker:'التعلّم',coursesTitle:'الكورسات',coursesIntro:'الكورسات التي أنشرها ستظهر هنا.',coursesEmptyTitle:'لا توجد كورسات منشورة حاليًا',coursesEmptyText:'ستظهر الكورسات الجديدة هنا بعد نشرها من لوحة الإدارة.',certKicker:'الإنجازات',certText:'ستظهر الشهادات والخبرات التي أضيفها لاحقًا.',articlesKicker:'مشاركة المعرفة',articlesTitle:'المقالات والشروحات',articlesText:'مساحة لمشاركة ما أتعلمه وملاحظاتي.',videosKicker:'مشاهدة',videosTitle:'الفيديوهات',videosText:'ستظهر الفيديوهات التي أضيفها هنا.',servicesKicker:'التعاون',servicesTitle:'الخدمات',servicesText:'الخدمات التي أضيفها ستظهر هنا.',experienceKicker:'المسيرة',experienceTitle:'الخبرات',experienceText:'ستظهر الخبرات التي أضيفها هنا.',adminLink:'إدارة الموقع'});
    Object.assign(copy.en,{navCourses:'Courses',coursesKicker:'LEARNING',coursesTitle:'Courses',coursesIntro:'Courses I publish will appear here.',coursesEmptyTitle:'No courses published yet',coursesEmptyText:'New courses will appear here after they are published from the admin panel.',certKicker:'CREDENTIALS',certText:'Certificates and experience will appear here when added.',articlesKicker:'SHARING KNOWLEDGE',articlesTitle:'Articles & tutorials',articlesText:'A space for sharing what I learn and my notes.',videosKicker:'WATCH',videosTitle:'Videos',videosText:'Videos I add will appear here.',servicesKicker:'COLLABORATE',servicesTitle:'Services',servicesText:'Services I add will appear here.',experienceKicker:'CAREER',experienceTitle:'Experience',experienceText:'Experience I add will appear here.',adminLink:'Manage site'});

    let publicSettings=null;
    let publicItems=null;
    const baseRenderLang=renderLang;
    renderLang=function(){baseRenderLang();applyProfileSettings();renderAllContent();};
    function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
    function validWebUrl(value){try{const u=new URL(value,location.origin);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
    function applyProfileSettings(){
      if(!publicSettings)return;
      const langKey=lang==='ar'?'ar':'en';
      const setText=(id,value)=>{const el=document.getElementById(id);if(el&&value)el.textContent=value};
      document.querySelectorAll('[data-t="name"],[data-t="brand"]').forEach(el=>el.textContent=publicSettings[`name_${langKey}`]||copy[lang].name);
      setText('headlineText',publicSettings[`headline_${langKey}`]);
      setText('profileBio',publicSettings[`bio_${langKey}`]);
      setText('collegeName',publicSettings[`education_${langKey}`]);
      setText('universityName',publicSettings[`university_${langKey}`]);
      setText('availabilityText',publicSettings[`availability_${langKey}`]);
      setText('contactEmail',publicSettings.email);
      setText('contactPhone',publicSettings.phone);
      const emailLink=document.getElementById('emailLink');if(emailLink&&publicSettings.email)emailLink.href=`mailto:${encodeURIComponent(publicSettings.email)}`;
      const phoneLink=document.getElementById('phoneLink');if(phoneLink&&publicSettings.phone)phoneLink.href=`tel:${publicSettings.phone.replace(/[^+\d]/g,'')}`;
      const wa=document.getElementById('whatsappLink');const waNumber=(publicSettings.whatsapp||'').replace(/\D/g,'');if(wa&&waNumber)wa.href=`https://wa.me/${waNumber}`;
      for(const [id,key] of [['socialFacebook','facebook'],['socialInstagram','instagram'],['socialTikTok','tiktok']]){const el=document.getElementById(id);const url=validWebUrl(publicSettings[key]||'');if(el){if(url){el.href=url;el.hidden=false}else el.hidden=true}}
      const github=document.getElementById('socialGithub');if(github){if(publicSettings.github_username){github.href=`https://github.com/${encodeURIComponent(publicSettings.github_username)}`;github.hidden=false}else github.hidden=true}
      const image=document.getElementById('profileImage');if(image&&publicSettings.profile_image){image.src=validWebUrl(publicSettings.profile_image)||publicSettings.profile_image}
      document.title=`${publicSettings[`name_${langKey}`]||copy[lang].name} | ${lang==='ar'?'الموقع الشخصي':'Personal website'}`;
    }
    function contentCard(item,kind){
      const title=lang==='ar'?(item.title_ar||item.title_en):(item.title_en||item.title_ar);
      const summary=lang==='ar'?(item.summary_ar||item.summary_en):(item.summary_en||item.summary_ar);
      const body=lang==='ar'?(item.body_ar||item.body_en):(item.body_en||item.body_ar);
      const image=validWebUrl(item.image_url||'');
      const link=validWebUrl(item.link_url||'');
      const tags=Array.isArray(item.tags)?item.tags:[];
      const extras=[item.language,item.duration,item.price].filter(Boolean);
      const inside=`${image?`<img class="content-image" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">`:''}<div class="content-card-body"><span class="content-kind">${escapeHtml(copy[lang][kind+'Title']||kind)}</span><h3>${escapeHtml(title)}</h3>${summary?`<p>${escapeHtml(summary)}</p>`:''}${body?`<p class="content-details">${escapeHtml(body)}</p>`:''}${extras.length?`<p class="content-extras">${extras.map(escapeHtml).join(' · ')}</p>`:''}${tags.length?`<div class="content-tags">${tags.map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</div>`:''}${link?`<span class="content-link">${lang==='ar'?'عرض التفاصيل':'View details'} ↗</span>`:''}</div>`;
      return link?`<a class="content-card panel" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${inside}</a>`:`<article class="content-card panel">${inside}</article>`;
    }
    function renderAllContent(){
      if(!publicItems)return;
      for(const kind of ['projects','courses','certificates','articles','videos','services','experiences','skills']){
        const list=publicItems[kind]||[];
        if(kind==='skills'){
          const target=document.getElementById('skillsList');
          if(target)target.innerHTML=list.length?list.map(item=>`<div class="skill"><span class="skill-name">${escapeHtml(lang==='ar'?(item.title_ar||item.title_en):(item.title_en||item.title_ar))}</span><span class="status">${escapeHtml(lang==='ar'?(item.summary_ar||'قيد التعلم'):(item.summary_en||'Learning'))}</span></div>`).join(''):['HTML','CSS','JavaScript','SQL','Python'].map(name=>`<div class="skill"><span class="skill-name">${name}</span><span class="status">${lang==='ar'?'قيد التعلم':'Learning'}</span></div>`).join('');
          continue;
        }
        const target=document.getElementById(`${kind}List`);
        if(target)target.innerHTML=list.map(item=>contentCard(item,kind)).join('');
        const empty=document.getElementById(`${kind}Empty`);
        if(empty)empty.hidden=list.length>0;
      }
    }
    async function loadSiteData(){
      try{
        const [settings,items]=await Promise.all([fetch('/api/public/settings',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('settings');return r.json()}),fetch('/api/public/content',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('content');return r.json()})]);
        publicSettings=settings;
        publicItems=Object.fromEntries(['projects','courses','certificates','articles','videos','services','experiences','skills'].map(kind=>[kind,items.filter(item=>item.kind===kind)]));
        applyProfileSettings();renderAllContent();
      }catch(error){console.info('Start the local server to load editable content.',error.message)}
    }
    loadSiteData();
