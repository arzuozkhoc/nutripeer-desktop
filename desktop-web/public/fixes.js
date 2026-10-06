// Patient workflow and menu details added in the follow-up update.
const followupStyles = document.createElement('style');
followupStyles.textContent = '.foodrow{grid-template-columns:minmax(150px,1fr) 66px 100px 35px 150px;align-items:center}.foodrow .search{min-width:0;width:100%;padding:8px 6px;font-size:12px}.foodrow input[id^="amount-"]{width:100%;min-width:140px;padding:12px 10px;font-size:17px;font-weight:700;text-align:right;font-variant-numeric:tabular-nums}.foodrow label{align-self:center;font-size:11px}.clinic-class{font-size:11px;color:#6e786f;margin-top:4px}.micro-details{margin:12px 0;padding:12px;border:1px solid #e2eae3;border-radius:10px}.micro-details summary,.micro-summary summary{cursor:pointer;font-weight:600;color:#386b4d}.micro-summary{margin-top:8px;padding:8px 10px;background:#f5f8f5;border-radius:8px;font-size:12px}.trend-card{margin-top:16px}.trend-svg{display:block;width:100%;height:auto}.trend-legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;margin:8px 0}.trend-legend span{display:flex;align-items:center;gap:6px}.trend-key{width:18px;height:3px;border-radius:3px}.trend-note{font-size:11px;color:#748176;margin-top:6px}';
document.head.append(followupStyles);
db.labs ||= [];
function latestMeasurement(patientId){return db.measurements.filter(x=>x.patient===patientId).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||db.measurements.indexOf(a)-db.measurements.indexOf(b)).at(-1);}
if (!patientFields.some(field => field[0] === 'waist')) {
  const weightIndex = patientFields.findIndex(field => field[0] === 'weight');
  patientFields.splice(weightIndex + 1, 0, ['waist','Bel (cm)','number',0], ['hip','Kalça (cm)','number',0]);
}
const firstVisitMeasures=[['chest','Göğüs çevresi (cm)','number',0],['upperArm','Üst orta kol çevresi (cm)','number',0],['calf','Baldır çevresi (cm)','number',0]];
const hipIndex=patientFields.findIndex(field=>field[0]==='hip');
firstVisitMeasures.forEach((field,index)=>{if(!patientFields.some(existing=>existing[0]===field[0]))patientFields.splice(hipIndex+1+index,0,field);});
const skinfoldSites=[['triceps','Triseps'],['biceps','Biseps'],['subscapular','Subskapular'],['suprailiac','Suprailiak'],['abdominal','Karın'],['thigh','Uyluk'],['calf','Baldır'],['chest','Göğüs']];
function normalizedSkinfolds(patient={}){if(Array.isArray(patient.skinfolds))return patient.skinfolds;return patient.skinfold&&patient.skinfoldSite?[{site:patient.skinfoldSite,mm:patient.skinfold}]:[];}
function skinfoldEditor(existing=[]){const bySite=Object.fromEntries(existing.map(x=>[x.site,String(x.mm)]));return `<details class="skinfold-editor" open><summary>Deri kıvrımları · bölge ekle (mm)</summary><div class="skinfold-grid">${skinfoldSites.map(([id,label])=>`<label>${label}<input type="number" min="0" step="0.1" inputmode="decimal" data-skinfold-site="${label}" value="${bySite[label]||''}" placeholder="mm"></label>`).join('')}</div></details><input type="hidden" name="skinfoldsJson" value="${esc(JSON.stringify(existing))}">`;}
function readSkinfolds(form){return [...form.querySelectorAll('[data-skinfold-site]')].filter(el=>el.value!==''&&Number.isFinite(+el.value)&&+el.value>0).map(el=>({site:el.dataset.skinfoldSite,mm:+el.value}));}
const skinfoldCss=document.createElement('style');skinfoldCss.textContent='.skinfold-editor{grid-column:1/-1;margin:4px 0;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:#fbfcfa}.skinfold-editor summary{cursor:pointer;font-size:13px;font-weight:700;color:#355b43}.skinfold-grid{display:grid;grid-template-columns:repeat(4,minmax(90px,1fr));gap:10px;margin-top:12px}.skinfold-grid label{font-size:11px;color:#657268}.skinfold-grid input{display:block;width:100%;min-width:0;margin-top:4px;padding:9px 8px;font-size:14px}@media(max-width:600px){.skinfold-grid{grid-template-columns:repeat(2,minmax(90px,1fr))}}';document.head.append(skinfoldCss);
const originalProfile = window.profile;
const originalNewDiet = window.newDiet;
const originalFoodsPage = window.foods;
const originalUpdateExchange = window.updateExchange;
const originalPatientForm = window.patientForm;
const MEAL_PRESETS={1:['Kahvaltı'],2:['Kahvaltı','Akşam'],3:['Kahvaltı','Öğle','Akşam'],4:['Kahvaltı','Ara Öğün 1','Öğle','Akşam'],5:['Kahvaltı','Ara Öğün 1','Öğle','Ara Öğün 2','Akşam'],6:['Kahvaltı','Ara Öğün 1','Öğle','Ara Öğün 2','Akşam','Gece Ara Öğünü'],7:['Kahvaltı','Ara Öğün 1','Öğle','Ara Öğün 2','Akşam','Ara Öğün 3','Gece Ara Öğünü'],8:['Kahvaltı','Ara Öğün 1','Öğle','Ara Öğün 2','Akşam','Ara Öğün 3','Gece Ara Öğünü','Ara Öğün 4']};
function defaultMealNames(count){const preset=MEAL_PRESETS[count]||MEAL_PRESETS[8].concat(Array.from({length:count-8},(_,i)=>`Öğün ${i+9}`));return preset.slice(0,count);}
function renderMealOrder(){const el=document.querySelector('#meal-order');if(!el)return;el.innerHTML=`<div class="meal-order-head"><b>Öğün sırası ve adları</b><span class="sub">Ara öğünleri adlandırıp ↑ ↓ ile öğünlerin arasına yerleştirin. Öğün sayısını değiştirince varsayılan sıra yenilenir.</span></div>${Array.from({length:menuMeals},(_,i)=>`<div class="meal-order-row"><span class="meal-order-index">${i+1}</span><input aria-label="${i+1}. öğün adı" value="${esc(window.mealNames?.[i]||`Öğün ${i+1}`)}" oninput="window.mealNames[${i}]=this.value;renderMeals()"><button class="btn light small" type="button" aria-label="Öğünü yukarı taşı" ${i===0?'disabled':''} onclick="moveMealSlot(${i},${i-1})">↑</button><button class="btn light small" type="button" aria-label="Öğünü aşağı taşı" ${i===menuMeals-1?'disabled':''} onclick="moveMealSlot(${i},${i+1})">↓</button></div>`).join('')}`;}
window.setMealCount=function setMealCount(value){const next=+value;if(next<1||next>10)return;if(menuItems.some(item=>item.meal>=next)){toast('Önce son öğünlerdeki besinleri başka öğüne taşıyın veya kaldırın.');const select=document.querySelector('#mealN');if(select)select.value=String(menuMeals);return;}menuMeals=next;window.mealNames=defaultMealNames(next);renderMealOrder();renderMeals();};
window.moveMealSlot=function moveMealSlot(from,to){if(to<0||to>=menuMeals)return;const order=Array.from({length:menuMeals},(_,i)=>i),[moved]=order.splice(from,1);order.splice(to,0,moved);window.mealNames=order.map(i=>window.mealNames[i]);menuItems.forEach(item=>{item.meal=order.indexOf(item.meal);});renderMealOrder();renderMeals();};
window.editDiet=function editDiet(dietId){const diet=db.diets.find(x=>x.id===dietId);if(!diet)return;closeModal();window.newDiet(diet.patient,null,'',dietId);};
const mealEditorStyles=document.createElement('style');mealEditorStyles.textContent='.meal-order{border:1px solid var(--line);border-radius:10px;padding:12px;margin:8px 0 14px;background:#fafcf9}.meal-order-head{display:flex;flex-direction:column;gap:3px;margin-bottom:8px}.meal-order-head b{font-size:13px}.meal-order-row{display:grid;grid-template-columns:26px minmax(130px,1fr) 34px 34px;gap:7px;align-items:center;padding:4px 0}.meal-order-index{font-size:11px;color:var(--muted);text-align:center}.meal-order-row input{min-width:0;padding:8px 10px}.meal-order-row button{padding:6px!important}.meal-order-row button:disabled{opacity:.4;cursor:default}.meal-order-head .sub{font-size:11px}';document.head.append(mealEditorStyles);

function ensureFoods() {
  if (db.foods.length) {
    let migrated = false;
    db.foods.forEach(food => {
      if (!food.basisUnit) {
        const seed = food.name === 'Muz' ? [23, 1.1, .3, 118] : food.name === 'Domates' ? [3.9, .9, .2, 123] : null;
        if (food.unit === 'adet' && food.serving === 1 && seed && Math.abs(food.cho - seed[0] * 1.2) < .01) {
          food.serving = 100; food.cho /= 1.2; food.protein /= 1.2; food.fat /= 1.2;
        }
        food.basisUnit = 'g';
        migrated = true;
      }
      if (!food.density) { food.density = 1; migrated = true; }
      const sizes = food.name === 'Muz' ? [101,118,136] : food.name === 'Domates' ? [91,123,182] : food.name === 'Elma' ? [149,182,223] : food.name === 'Yumurta, bütün' ? [38,44,50] : null;
      if (sizes && !food.mediumG) { [food.smallG,food.mediumG,food.largeG] = sizes; migrated = true; }
    });
    if (migrated) save();
    return;
  }
  db.foods = foodsSeed.map(([name, serving, cho, protein, fat]) => {
    const sizes = name === 'Muz' ? [101,118,136] : name === 'Domates' ? [91,123,182] : name === 'Elma' ? [149,182,223] : name === 'Yumurta, bütün' ? [38,44,50] : [];
    return { id: id(), name, basisUnit: 'g', serving, density: 1, ...(sizes.length ? {smallG:sizes[0],mediumG:sizes[1],largeG:sizes[2]} : {}), cho, protein, fat };
  });
  save();
}
window.foods = function foods() { ensureFoods(); originalFoodsPage(); };
views.foods = window.foods;
window.patientForm = function patientForm(patientId) {
  const patient = db.patients.find(x => x.id === patientId);
  if (patient) {
    const latest = latestMeasurement(patientId);
    if (latest) ['weight','waist','hip','chest','upperArm','calf'].forEach(key => { patient[key] = latest[key] || ''; });
    if (latest) patient.skinfolds=normalizedSkinfolds(latest);
  }
  originalPatientForm(patientId);
  const form=document.querySelector('#modal form');
  if(form){const grid=form.querySelector('.fieldgrid');grid.insertAdjacentHTML('beforeend',skinfoldEditor(normalizedSkinfolds(patient||{})));}
};
window.newDiet = function newDiet(patientId = '', energy = null, templateId = '', editId = '') {
  ensureFoods();
  const template = db.templates.find(x => x.id === templateId), editing = db.diets.find(x => x.id === editId);
  if (editing) {
    menuItems=(editing.foods||[]).map(x=>({...x})); exchanges={...(editing.ex||exchanges)};
    menuMeals=Math.max(1,Math.min(10,editing.mealNames?.length||editing.menuMeals||Math.max(1,...menuItems.map(x=>x.meal+1))));
    window.mealNames=(editing.mealNames||defaultMealNames(menuMeals)).slice(0,menuMeals);
  } else {
    menuItems=(template?.foods||[]).map(x=>({...x}));
    if(template?.mealNames?.length){menuMeals=Math.max(1,Math.min(10,template.mealNames.length));window.mealNames=template.mealNames.slice();}
    else window.mealNames=defaultMealNames(menuMeals||4);
  }
  originalNewDiet(patientId, energy, templateId);
  const count=document.querySelector('#mealN');
  if(count){count.innerHTML=Array.from({length:10},(_,i)=>`<option value="${i+1}" ${i+1===menuMeals?'selected':''}>${i+1} öğün</option>`).join('');count.value=String(menuMeals);count.onchange=()=>setMealCount(count.value);}
  const meals=document.querySelector('#meals'),form=document.querySelector('#modal form');
  if(meals){meals.insertAdjacentHTML('beforebegin',`<div id="meal-order" class="meal-order"></div>`);renderMealOrder();}
  if(editing&&form){form.insertAdjacentHTML('afterbegin',`<input type="hidden" name="editDietId" value="${editing.id}">`);form.querySelector('[name="name"]').value=editing.name||'';form.querySelector('[name="note"]').value=editing.note||'';form.querySelector('h2')?.replaceChildren(document.createTextNode('Diyet Planını Düzenle'));const h2=document.querySelector('#modal h2');if(h2)h2.textContent='Diyet Planını Düzenle';}
  renderMeals(); updateExchange();
};
window.profile = function profile() {
  originalProfile();
  const patient = selected || db.patients[0];
  window.p = patient;
  const tabs = document.querySelector('.tabs');
  if (tabs && ![...tabs.children].some(x => x.textContent === 'Laboratuvar')) {
    const tab = document.createElement('button');
    tab.textContent = 'Laboratuvar';
    tab.className = patientTab === 'Laboratuvar' ? 'on' : '';
    tab.onclick = () => { patientTab = 'Laboratuvar'; window.profile(); };
    tabs.append(tab);
  }
  if (patientTab === 'Laboratuvar') {
    const labs = db.labs.filter(x => x.patient === patient.id).sort((a,b) => b.date.localeCompare(a.date));
    document.querySelector('#ptab').innerHTML = `<div class="card"><div class="cardtitle"><h2>Laboratuvar Sonuçları</h2><button id="add-lab" class="btn">＋ Sonuç Ekle</button></div>${labs.length ? `<div class="tablewrap"><table class="table"><tr><th>Tarih</th><th>Parametre</th><th>Sonuç</th><th>Birim</th><th>Referans aralığı</th><th>Not</th></tr>${labs.map(x => `<tr><td>${esc(x.date)}</td><td>${esc(x.name)}</td><td>${esc(x.result)}</td><td>${esc(x.unit)}</td><td>${esc(x.reference)}</td><td>${esc(x.note)}</td></tr>`).join('')}</table></div>` : '<div class="empty">Henüz laboratuvar sonucu yok.</div>'}</div>`;
    document.querySelector('#add-lab').onclick = () => labForm(patient.id);
  }
  if (patientTab === 'Özet') {
    const latest = latestMeasurement(patient.id);
    const stats = document.querySelector('#ptab .statrow');
    const height = +patient.height / 100, weight = +(latest?.weight || patient.weight);
    if (stats && latest?.waist && latest?.hip) {
      const ratio = +latest.waist / +latest.hip;
      const sex = patient.sex === 'Kadın' ? 'Kadın' : patient.sex === 'Erkek' ? 'Erkek' : '';
      const cutoff = sex === 'Kadın' ? .85 : sex === 'Erkek' ? .90 : null;
      const item = document.createElement('div');
      item.className = 'stat';
      item.innerHTML = `<small>Bel / kalça oranı</small><b>${ratio.toFixed(2)}</b><div class="clinic-class">Bel ${latest.waist} cm · Kalça ${latest.hip} cm${cutoff ? ` · ${ratio >= cutoff ? 'artmış risk işareti' : 'eşik altında'}` : ''}</div>`;
      stats.append(item);
    }
  }
  if (patientTab === 'Ölçümler') {
    const latest = latestMeasurement(patient.id);
    const target = document.querySelector('#ptab');
    const height = +patient.height / 100, weight = +(latest?.weight || patient.weight);
    const bmi = height && weight ? weight / height ** 2 : null;
    const ratio = latest?.waist && latest?.hip ? +latest.waist / +latest.hip : null;
    const risk = patient.sex === 'Kadın' ? .85 : patient.sex === 'Erkek' ? .90 : null;
    const box = document.createElement('div'); box.className = 'card';
    box.innerHTML = `<div class="cardtitle"><h2>Antropometri özeti</h2><span class="sub">${esc(latest?.date || 'Ölçüm girilmedi')}</span></div><div class="statrow">${weight ? `<div class="stat"><small>Boy / kilo</small><b>${patient.height || '—'} cm / ${weight} kg</b></div>` : ''}${bmi ? `<div class="stat"><small>VKİ · yetişkin sınıflaması</small><b>${bmi.toFixed(1)} · ${age(patient.birth) >= 18 ? bmiClass(bmi) : 'Yetişkin sınıflaması uygulanmaz'}</b></div>` : ''}${latest?.waist ? `<div class="stat"><small>Bel çevresi</small><b>${latest.waist} cm</b></div>` : ''}${latest?.hip ? `<div class="stat"><small>Kalça çevresi</small><b>${latest.hip} cm</b></div>` : ''}${ratio ? `<div class="stat"><small>Bel / kalça oranı</small><b>${ratio.toFixed(2)}</b><div class="clinic-class">${risk ? ratio >= risk ? 'Artmış risk işareti' : 'Eşik altında' : 'Cinsiyet eşiği tanımlı değil'} · Tanı değildir</div></div>` : ''}</div>`;
    target.prepend(box);
  }
  const measureButton = document.querySelector('#ptab .cardtitle button');
  if (measureButton?.textContent.includes('Ölçüm')) measureButton.onclick = () => measurementForm(patient.id);
  const appointmentButton = document.querySelector('#ptab .cardtitle button');
  if (appointmentButton?.textContent.includes('Randevu')) {
    appointmentButton.onclick = () => appointmentForm('', (selected || db.patients[0]).id);
  }
};
views.profile = window.profile;

function labForm(patientId) {
  modal(`<h2>Laboratuvar Sonucu Ekle</h2><form onsubmit="saveLab(event,'${patientId}')"><div class="fieldgrid">${formFields([['date','Tarih','date',1],['name','Parametre','text',1],['result','Sonuç','text',1],['unit','Birim','text'],['reference','Referans aralığı','text'],['note','Not','textarea']],{date:iso(new Date())})}</div><p class="sub">Referans aralığı laboratuvara ve kişiye göre değişebilir; sonuçların klinik yorumunu uzman yapmalıdır.</p><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">İptal</button><button class="btn">Kaydet</button></div></form>`);
}
function saveLab(e, patientId) {
  e.preventDefault();
  db.labs.push({ ...Object.fromEntries(new FormData(e.target)), id: id(), patient: patientId });
  save(); closeModal(); profile(); toast('Laboratuvar sonucu kaydedildi.');
}
window.saveMeasurement = function saveMeasurement(e, patientId) {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(e.target));
  const skinfolds=readSkinfolds(e.target);delete values.skinfoldsJson;
  db.measurements.push({ ...values, skinfolds, id:id(), patient:patientId });
  const patient = db.patients.find(x => x.id === patientId);
  if (patient) {['weight','waist','hip','chest','upperArm','calf'].forEach(key => { patient[key] = values[key] || ''; });patient.skinfolds=skinfolds;}
  save(); closeModal(); render(); toast('Ölçüm kaydedildi.');
};

function bmiClass(bmi) {
  if (bmi < 16) return 'Ağır düzeyde zayıf';
  if (bmi < 18.5) return 'Zayıf';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Şişmanlık öncesi';
  if (bmi < 35) return '1. Derece Obez';
  if (bmi < 40) return '2. Derece Obez';
  return '3. Derece Obez';
}

function savePatient(e, pid) {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(e.target));
  delete values.skinfoldsJson;values.skinfolds=readSkinfolds(e.target);
  let patient = db.patients.find(x => x.id === pid);
  const isNew = !patient;
  if (patient) Object.assign(patient, values);
  else {
    patient = { ...values, id: id(), created: new Date().toISOString() };
    db.patients.push(patient);
  }
  const last = latestMeasurement(patient.id);
  const measureKeys=['weight','waist','hip','chest','upperArm','calf','skinfolds'];
  const hasAnthropometry = measureKeys.some(key => key==='skinfolds'?values[key]?.length:values[key]) || measureKeys.some(key => key==='skinfolds'?normalizedSkinfolds(last||{}).length:last?.[key]);
  const changed = !last || measureKeys.some(key => JSON.stringify(values[key]??'') !== JSON.stringify(key==='skinfolds'?normalizedSkinfolds(last||[]):last[key]??''));
  if (hasAnthropometry && changed) {
    db.measurements.push({ id:id(), patient:patient.id, date:iso(new Date()), ...Object.fromEntries(measureKeys.map(key=>[key,values[key]??''])), note:isNew ? 'İlk danışan kaydı ölçümü' : 'Danışan dosyası antropometri güncellemesi' });
  }
  save();
  closeModal();
  selected = patient;
  patientTab = 'Özet';
  page = 'profile';
  render();
  toast('Danışan dosyası kaydedildi.');
}

function viewDiet(dietId) {
  const diet = db.diets.find(x => x.id === dietId);
  if (!diet) return;
  const foods = (diet.foods || []).map(item => {
    const food = db.foods.find(x => x.id === item.food);
    const meal = ['Kahvaltı', 'Ara Öğün 1', 'Öğle', 'Ara Öğün 2', 'Akşam', 'Ara Öğün 3'][item.meal] || `Öğün ${(item.meal || 0) + 1}`;
    return `<div class="appt"><div class="apdot"></div><div><strong>${esc(food||item.type==='exchange'||item.type==='recipe' ? itemQuantityText(item, food, true) : 'Besin kaydı bulunamadı')}</strong><small>${meal}</small></div></div>`;
  }).join('');
  modal(`<h2>${esc(diet.name)}</h2><p class="sub">${diet.date} · ${diet.kcal} kcal · KH ${diet.macros[0]}g · Protein ${diet.macros[1]}g · Yağ ${diet.macros[2]}g</p><div class="statrow">${Object.entries(diet.ex || {}).map(([name, n]) => `<div class="stat"><small>${esc(name)} değişimi</small><b>${n}</b></div>`).join('')}</div><h3 style="font-size:14px;margin:18px 0 8px">Menüdeki besinler</h3>${foods || '<div class="empty">Bu plan kaydedilirken menüye besin eklenmemiş. Değişim özeti yukarıda gösteriliyor.</div>'}<div class="formactions"><button class="btn light" onclick="closeModal()">Kapat</button><button class="btn light" onclick="editDiet('${diet.id}')">Diyeti düzenle</button><button class="btn light" onclick="printDiet('${diet.id}')">Yazdır / PDF</button><button class="btn" onclick="closeModal();newDiet('${diet.patient}')">Yeni plan oluştur</button></div>`);
}

function openDietPrintWindow(dietId, printNotes = null) {
  const diet = db.diets.find(x => x.id === dietId);
  if (!diet?.foods?.length) return toast('Yazdırılacak öğün besinleri bulunamadı. Diyet menüsüne besin ekleyin.');
  const patient = db.patients.find(x => x.id === diet.patient);
  const groups = new Map();
  diet.foods.forEach(item => {
    const label = diet.mealNames?.[item.meal] || ['Kahvaltı','Ara Öğün 1','Öğle','Ara Öğün 2','Akşam','Ara Öğün 3'][item.meal] || `Öğün ${item.meal + 1}`;
    if (!groups.has(item.meal)) groups.set(item.meal, {label,items:[]});
    const food = db.foods.find(x => x.id === item.food);
    if (!food&&item.type!=='exchange'&&item.type!=='recipe') return;
    groups.get(item.meal).items.push(itemQuantityText(item, food, true));
  });
  const meals = [...groups].sort(([a],[b])=>a-b).map(([,group], i) => `<section class="meal"><div class="mealnum">${String(i+1).padStart(2,'0')}</div><div><h2>${esc(group.label)}</h2><ul>${group.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div></section>`).join('');
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) return toast('Yazdırma penceresi engellendi. Bu dosya için açılır pencerelere izin verin.');
  const clinician = activeUser(), notes=printNotes||diet.printNotes||{}, noteLabels=[['notes','Notlar'],['medications','İlaç ve takviye saatleri'],['drinks','İçecekler'],['reminders','Hatırlatmalar']], noteSections=noteLabels.filter(([key])=>notes[key]?.trim()).map(([key,label])=>`<section class="print-note"><h2>${label}</h2><p>${esc(notes[key]).replace(/\n/g,'<br>')}</p></section>`).join('');
  win.document.open();
  win.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(diet.name)} · NutriPeer</title><style>
    @page{size:A4;margin:17mm}*{box-sizing:border-box}body{margin:0;font-family:'Segoe UI',Arial,sans-serif;color:#20372b;background:#fff}.sheet{max-width:780px;margin:35px auto;padding:0 18px}.brand{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #dce9de;padding-bottom:17px}.brandname{display:flex;align-items:center;gap:10px;font-weight:700;font-size:18px;color:#286b4d}.mark{width:36px;height:36px;background:#286b4d;color:#fff;display:grid;place-items:center;border-radius:11px;font-size:21px}.date{text-align:right;color:#78867b;font-size:11px;line-height:1.8}.title{padding:25px 0 20px}.eyebrow{text-transform:uppercase;color:#75927e;letter-spacing:1.5px;font-size:10px;font-weight:700}.title h1{font-size:27px;line-height:1.25;margin:7px 0;color:#183b2a}.title p{font-size:14px;color:#69796d;margin:0}.patient{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f3f7f2;border-radius:12px;padding:14px 17px;margin-bottom:16px}.patient small{display:block;text-transform:uppercase;letter-spacing:.7px;color:#7c897e;font-size:9px;margin-bottom:4px}.patient strong{font-size:13px}.meal{display:grid;grid-template-columns:45px 1fr;gap:12px;padding:16px 4px;border-bottom:1px solid #e8eee8;break-inside:avoid}.mealnum{font-size:11px;color:#95a39a;font-weight:700;padding-top:4px}.meal h2{font-size:15px;margin:0 0 8px;color:#286b4d}.meal ul{margin:0;padding-left:18px}.meal li{font-size:13px;line-height:1.65;padding:2px 0}.print-note{margin-top:16px;padding:12px 14px;border:1px solid #dce9de;border-radius:10px;break-inside:avoid}.print-note h2{font-size:13px;color:#286b4d;margin:0 0 6px}.print-note p{font-size:12px;line-height:1.6;margin:0;white-space:pre-wrap}.footer{margin-top:26px;padding-top:12px;border-top:1px solid #e8eee8;display:flex;justify-content:space-between;color:#849087;font-size:10px}.actions{display:flex;justify-content:flex-end;margin:22px 0}.printbtn{border:0;background:#286b4d;color:#fff;padding:10px 17px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.sheet{margin:0 auto;padding:0}.actions{display:none}}
    </style></head><body><main class="sheet"><header class="brand"><div class="brandname"><span class="mark">✳</span><span>NutriPeer</span></div><div class="date">Diyet planı<br>${esc(diet.date)} · ${new Date().toLocaleDateString('tr-TR')}</div></header><div class="title"><div class="eyebrow">Beslenme planı</div><h1>${esc(diet.name)}</h1><p>${esc(clinician?.first || '')} ${esc(clinician?.last || '')}</p></div><div class="patient"><div><small>Danışan</small><strong>${esc(patient ? `${patient.first} ${patient.last}` : '')}</strong></div><div><small>Plan dönemi</small><strong>${esc(diet.note || 'Günlük plan')}</strong></div></div>${meals}${noteSections}<footer class="footer"><span>NutriPeer · Beslenme planınız</span><span>Bu plan danışanınıza özel hazırlanmıştır.</span></footer><div class="actions"><button class="printbtn" onclick="window.print()">Yazdır / PDF olarak kaydet</button></div></main></body></html>`);
  win.document.close();
}

function foodForm(foodId) {
  const food = { basisUnit: 'g', serving: 100, density: 1, ...(db.foods.find(x => x.id === foodId) || {}) };
  modal(`<h2>${foodId ? 'Besini Düzenle' : 'Besin Ekle'}</h2><form onsubmit="saveFood(event,'${foodId || ''}')"><div class="fieldgrid">${formFields([['name','Besin adı','text',1],['basisUnit','Besin değerlerinin birimi','select',1,['g','ml']],['serving','Besin değerlerinin miktarı (g / ml)','number',1],['density','Yoğunluk (g/ml)','number',1],['smallG','Küçük adet ağırlığı (g)','number'],['mediumG','Orta adet ağırlığı (g)','number'],['largeG','Büyük adet ağırlığı (g)','number'],['cho','Karbonhidrat (g)','number',1],['protein','Protein (g)','number',1],['fat','Yağ (g)','number',1]], food)}</div><div class="sub">Makroları yukarıda yazdığınız miktar için girin. Adetle verilecek besinlerde ağırlıkları belirtin; gram, mg, ml ve küçük/orta/büyük adet miktarları bu değerlere çevrilir. Sıvılarda yoğunluk ürün etiketine göre güncellenebilir.</div><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">İptal</button><button class="btn">Kaydet</button></div></form>`);
}

function saveFood(e, foodId) {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(e.target));
  ['serving','density','smallG','mediumG','largeG','cho','protein','fat'].forEach(key => {
    if (values[key] !== undefined && values[key] !== '') values[key] = +values[key];
  });
  if (!(values.serving > 0) || !(values.density > 0) || ['cho','protein','fat'].some(key => values[key] < 0)) {
    return toast('Porsiyon ve yoğunluk sıfırdan büyük; makro değerleri sıfır veya daha büyük olmalı.');
  }
  if (values.basisUnit === 'ml' && !(values.density > 0)) return toast('Sıvı yoğunluğunu g/ml olarak girin.');
  const food = db.foods.find(x => x.id === foodId);
  if (food) Object.assign(food, values);
  else db.foods.push({ ...values, id:id() });
  save(); closeModal(); render(); toast('Besin kaydedildi.');
}

function foodRows(items) {
  return `<div class="tablewrap"><table class="table"><tr><th>Besin</th><th>Değerlerin porsiyonu</th><th>Karbonhidrat</th><th>Protein</th><th>Yağ</th><th>Enerji (4/4/9)</th><th></th></tr>${items.map(f => `<tr><td><b>${esc(f.name)}</b></td><td>${f.serving} ${f.basisUnit || 'g'}${f.mediumG ? `<br><small class="muted">Adet ağırlıkları: ${f.smallG || '—'} / ${f.mediumG} / ${f.largeG || '—'} g</small>` : ''}</td><td>${f.cho} g</td><td>${f.protein} g</td><td>${f.fat} g</td><td>${Math.round(f.cho*4+f.protein*4+f.fat*9)} kcal</td><td><button class="btn light small" onclick="foodForm('${f.id}')">Düzenle</button></td></tr>`).join('')}</table></div>`;
}

function setMenuUnitLabel(i) {
  const food = db.foods.find(x => x.id === document.querySelector(`#food-${i}`).value);
  const unitSelect = document.querySelector(`#unit-${i}`);
  if (unitSelect.value === 'g' && food?.basisUnit === 'ml') unitSelect.value = 'ml';
  const unit = unitSelect.value;
  const label = document.querySelector(`#unit-label-${i}`);
  if (label) label.textContent = unit;
  const size = document.querySelector(`#size-${i}`);
  if (size) size.classList.toggle('hide', unit !== 'adet');
  const quantity = document.querySelector(`#amount-${i}`);
  if (quantity) quantity.value = unit === 'adet' ? '1' : unit === 'mg' ? '1000' : '100';
  const pieceOption = [...unitSelect.options].find(x => x.value === 'adet');
  if (pieceOption) pieceOption.disabled = !food?.mediumG;
}

function amountInFoodBasis(food, amount, unit, size = 'medium') {
  const basis = food.basisUnit || 'g', density = +food.density || 1;
  let grams;
  if (unit === 'adet') {
    const weight = +food[`${size}G`] || +food.mediumG;
    if (!weight) return null;
    grams = amount * weight;
  } else if (unit === 'mg') grams = amount / 1000;
  else if (unit === 'ml') grams = amount * density;
  else grams = amount;
  return basis === 'ml' ? grams / density : grams;
}
function itemBasisAmount(item, food) {
  if (item.amount !== undefined && item.unit) return amountInFoodBasis(food, +item.amount, item.unit, item.size || 'medium');
  return +item.grams || 0;
}
function itemQuantityText(item, food, clientFriendly = false) {
  const amount = item.amount ?? item.grams;
  const unit = item.unit || (food.unit === 'adet' ? 'adet' : 'g');
  const qty = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(+amount || 0);
  if (unit === 'adet') {
    const sizeName = {small:'küçük boy',medium:'orta boy',large:'büyük boy'}[item.size || 'medium'];
    const name = food.name.toLocaleLowerCase('tr-TR');
    return `${qty} adet ${sizeName} ${name}`;
  }
  return `${qty} ${unit} ${food.name.toLocaleLowerCase('tr-TR')}`;
}
function menuMacroTotals() {
  const macros = exchangeTotals().m.slice();
  menuItems.forEach(item => {
    const food = db.foods.find(x => x.id === item.food);
    const quantity = food && itemBasisAmount(item, food);
    if (food && quantity !== null) [food.cho, food.protein, food.fat].forEach((value, index) => macros[index] += value * quantity / food.serving);
  });
  return macros;
}
window.updateExchange = function updateExchange() {
  originalUpdateExchange();
  const macros = menuMacroTotals(), energy = kcal(macros), el = document.querySelector('#extot');
  if (!el) return;
  el.innerHTML = `<div class="stat"><small>Enerji · değişim + besin</small><b>${Math.round(energy)} kcal</b></div><div class="stat"><small>Karbonhidrat</small><b>${macros[0].toFixed(1)} g · ${Math.round(macros[0]*4/energy*100||0)}%</b></div><div class="stat"><small>Protein</small><b>${macros[1].toFixed(1)} g · ${Math.round(macros[1]*4/energy*100||0)}%</b></div><div class="stat"><small>Yağ</small><b>${macros[2].toFixed(1)} g · ${Math.round(macros[2]*9/energy*100||0)}%</b></div>`;
};
function addMenuFood(i) {
  const food = document.querySelector(`#food-${i}`).value;
  const amount = +document.querySelector(`#amount-${i}`).value;
  const unit = document.querySelector(`#unit-${i}`).value;
  const size = document.querySelector(`#size-${i}`).value;
  const entry = db.foods.find(x => x.id === food);
  const grams = entry && amountInFoodBasis(entry, amount, unit, size);
  if (!amount || amount < 0 || grams === null || grams === undefined) return toast('Bu besini adetle kullanmak için besin kartında küçük/orta/büyük ağırlıklarını girin.');
  menuItems.push({ meal: i, food, amount, unit, size, grams });
  renderMeals(); updateExchange();
}

function renderMeals() {
  const el = document.querySelector('#meals');
  if (!el) return;
  const n = menuMeals || 4;
  el.innerHTML = Array.from({ length: n }, (_, i) => {
    const rows = menuItems.filter(x => x.meal === i);
    const macros = [0, 0, 0];
    rows.forEach(item => {
      const food = db.foods.find(x => x.id === item.food);
      const quantity = food && itemBasisAmount(item, food);
      if (food && quantity !== null) [food.cho, food.protein, food.fat].forEach((value, index) => macros[index] += value * quantity / food.serving);
    });
    const energy = kcal(macros);
    return `<div class="meal"><h3>${['Kahvaltı','Ara Öğün 1','Öğle','Ara Öğün 2','Akşam','Ara Öğün 3'][i] || `Öğün ${i+1}`}</h3><div class="mealstats">${Math.round(energy)} kcal · KH ${macros[0].toFixed(1)} g (${Math.round(macros[0]*4/energy*100||0)}%) · Protein ${macros[1].toFixed(1)} g (${Math.round(macros[1]*4/energy*100||0)}%) · Yağ ${macros[2].toFixed(1)} g (${Math.round(macros[2]*9/energy*100||0)}%)</div>${rows.map(item => { const food = db.foods.find(x => x.id === item.food); return `<div class="foodrow"><span>${esc(itemQuantityText(item, food))}</span><button class="btn light small" type="button" onclick="menuItems.splice(${menuItems.indexOf(item)},1);renderMeals();updateExchange()">Kaldır</button></div>`; }).join('')}<div class="foodrow"><select id="food-${i}" class="search" onchange="setMenuUnitLabel(${i})">${db.foods.map(food => `<option value="${food.id}">${esc(food.name)}</option>`).join('')}</select><select id="unit-${i}" class="search" onchange="setMenuUnitLabel(${i})"><option value="g">g</option><option value="mg">mg</option><option value="ml">ml</option><option value="adet">adet</option></select><select id="size-${i}" class="search hide"><option value="small">Küçük boy</option><option value="medium" selected>Orta boy</option><option value="large">Büyük boy</option></select><label id="unit-label-${i}" class="muted">g</label><input id="amount-${i}" class="search" type="number" min=".1" step="any" value="100" aria-label="Miktar"></div><button class="btn light small" type="button" onclick="addMenuFood(${i})">＋ Besin ekle</button></div>`;
  }).join('');
}

function saveDiet(e, patientId, templateId) {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(e.target));
  const patient = values.patient || patientId;
  const macros = exchangeTotals().m.slice();
  menuItems.forEach(item => {
    const food = db.foods.find(x => x.id === item.food);
    if (food) [food.cho, food.protein, food.fat].forEach((value, index) => macros[index] += value * item.grams / food.serving);
  });
  const energy = Math.round(kcal(macros));
  if (!patient) {
    const template = { id: templateId || id(), name: values.name, note: values.note, kcal: energy, ex: { ...exchanges }, macros, foods: menuItems.map(x => ({ ...x })) };
    const old = db.templates.find(x => x.id === templateId);
    old ? Object.assign(old, template) : db.templates.push(template);
    save(); closeModal(); render(); toast('Şablon kaydedildi.'); return;
  }
  db.diets.push({ id: id(), patient, name: values.name, note: values.note, date: iso(new Date()), kcal: energy, macros, ex: { ...exchanges }, foods: menuItems.map(x => ({ ...x })) });
  save(); closeModal();
  if (page === 'profile') { patientTab = 'Diyet Geçmişi'; profile(); } else render();
  toast('Diyet planı danışan dosyasına kaydedildi.');
}

// Extended food composition and longitudinal measurement view.
const MICRO_DEFS = [
  ['fiber','Lif','g'],['sodium','Sodyum','mg'],['calcium','Kalsiyum','mg'],['iron','Demir','mg'],
  ['potassium','Potasyum','mg'],['magnesium','Magnezyum','mg'],['zinc','Çinko','mg'],['phosphorus','Fosfor','mg'],
  ['vitaminA','A vitamini','µg RAE'],['vitaminC','C vitamini','mg'],['vitaminD','D vitamini','µg'],
  ['vitaminE','E vitamini','mg'],['vitaminK','K vitamini','µg'],['thiamin','B1 vitamini','mg'],
  ['riboflavin','B2 vitamini','mg'],['niacin','B3 vitamini','mg'],['vitaminB6','B6 vitamini','mg'],
  ['folate','Folat','µg'],['vitaminB12','B12 vitamini','µg'],['omega3','Omega-3','g']
];
function microText(values) {
  return MICRO_DEFS.filter(([key]) => +(values?.[key] || 0) > 0)
    .map(([key,label,unit]) => `${label} ${Number(values[key]).toLocaleString('tr-TR',{maximumFractionDigits:2})} ${unit}`).join(' · ');
}
function menuMicroTotals(items = menuItems) {
  const totals = {};
  items.forEach(item => {
    const food = db.foods.find(x => x.id === item.food), quantity = food && itemBasisAmount(item, food);
    if (!food || quantity === null || quantity === undefined) return;
    MICRO_DEFS.forEach(([key]) => { const v = +(food.micros?.[key] || 0); if (v) totals[key] = (totals[key] || 0) + v * quantity / (+food.serving || 1); });
  });
  return totals;
}
window.foodForm = function foodForm(foodId) {
  const food = { basisUnit:'g', serving:100, density:1, ...(db.foods.find(x => x.id === foodId) || {}) };
  const micros = food.micros || {};
  modal(`<h2>${foodId ? 'Besini Düzenle' : 'Besin Ekle'}</h2><form onsubmit="saveFood(event,'${foodId || ''}')"><div class="fieldgrid">${formFields([['name','Besin adı','text',1],['basisUnit','Besin değerlerinin birimi','select',1,['g','ml']],['serving','Besin değerlerinin miktarı (g / ml)','number',1],['density','Yoğunluk (g/ml)','number',1],['smallG','Küçük adet ağırlığı (g)','number'],['mediumG','Orta adet ağırlığı (g)','number'],['largeG','Büyük adet ağırlığı (g)','number'],['cho','Karbonhidrat (g)','number',1],['protein','Protein (g)','number',1],['fat','Yağ (g)','number',1]],food)}</div><details class="micro-details"><summary>Mikro besinler · isteğe bağlı</summary><p class="sub">Değerleri yukarıdaki porsiyon miktarı için girin. Bilinmeyen alanları boş bırakabilirsiniz.</p><div class="fieldgrid">${formFields(MICRO_DEFS.map(([key,label,unit])=>[key,`${label} (${unit})`,'number']),micros)}</div></details><div class="sub">Makro ve mikro değerlerini yukarıda yazdığınız miktar için girin. Gram, mg, ml ve küçük/orta/büyük adet miktarları porsiyon değerlerine çevrilir.</div><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">İptal</button><button class="btn">Kaydet</button></div></form>`);
};
window.saveFood = function saveFood(e, foodId) {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(e.target));
  const micros = {};
  let invalidMicro=false;
  MICRO_DEFS.forEach(([key]) => { if (values[key] !== undefined && values[key] !== '') { const v=+values[key]; if (!Number.isFinite(v) || v<0) invalidMicro=true; else micros[key]=v; } delete values[key]; });
  if(invalidMicro) return toast('Mikro besin değerleri sıfır veya daha büyük olmalı.');
  ['serving','density','smallG','mediumG','largeG','cho','protein','fat'].forEach(key => { if(values[key]!==undefined&&values[key]!=='') values[key]=+values[key]; });
  if (!(values.serving>0) || !(values.density>0) || ['cho','protein','fat'].some(key=>!Number.isFinite(+values[key])||+values[key]<0)) return toast('Porsiyon ve yoğunluk sıfırdan büyük; makro değerleri sıfır veya daha büyük olmalı.');
  const food=db.foods.find(x=>x.id===foodId);
  if(food) Object.assign(food,values,{micros}); else db.foods.push({...values,micros,id:id()});
  save();closeModal();render();toast('Besin kaydedildi.');
};
window.foodRows = function foodRows(items) {
  return `<div class="tablewrap"><table class="table"><tr><th>Besin</th><th>Değerlerin porsiyonu</th><th>Karbonhidrat</th><th>Protein</th><th>Yağ</th><th>Enerji (4/4/9)</th><th>Mikro besinler</th><th></th></tr>${items.map(f=>`<tr><td><b>${esc(f.name)}</b>${f.source?`<br><small class="muted">Kaynak: ${esc(typeof f.source==='string'?f.source:f.source.name||'Belirtilmedi')}${f.verified?' · doğrulanmış':' · kontrol bekliyor'}</small>`:''}</td><td>${f.serving} ${f.basisUnit||'g'}${f.mediumG?`<br><small class="muted">Adet ağırlıkları: ${f.smallG||'—'} / ${f.mediumG} / ${f.largeG||'—'} g</small>`:''}</td><td>${f.cho} g</td><td>${f.protein} g</td><td>${f.fat} g</td><td>${Math.round(f.cho*4+f.protein*4+f.fat*9)} kcal</td><td>${esc(microText(f.micros)||'—')}</td><td><button class="btn light small" onclick="foodForm('${f.id}')">Düzenle</button></td></tr>`).join('')}</table></div>`;
};
window.renderMeals = function renderMeals() {
  const el=document.querySelector('#meals'); if(!el)return; const n=menuMeals||4;
  el.innerHTML=Array.from({length:n},(_,i)=>{
    const rows=menuItems.filter(x=>x.meal===i), macros=[0,0,0], micros={};
    rows.forEach(item=>{const food=db.foods.find(x=>x.id===item.food),q=food&&itemBasisAmount(item,food);if(food&&q!==null&&q!==undefined){[food.cho,food.protein,food.fat].forEach((v,j)=>macros[j]+=v*q/food.serving);MICRO_DEFS.forEach(([key])=>{const v=+(food.micros?.[key]||0);if(v)micros[key]=(micros[key]||0)+v*q/food.serving;});}});
    const energy=kcal(macros),microSummary=microText(micros);
    return `<div class="meal"><h3>${esc(window.mealNames?.[i]||`Öğün ${i+1}`)}</h3><div class="mealstats">${Math.round(energy)} kcal · KH ${macros[0].toFixed(1)} g (${Math.round(macros[0]*4/energy*100||0)}%) · Protein ${macros[1].toFixed(1)} g (${Math.round(macros[1]*4/energy*100||0)}%) · Yağ ${macros[2].toFixed(1)} g (${Math.round(macros[2]*9/energy*100||0)}%)</div>${microSummary?`<details class="micro-summary"><summary>Mikro besin toplamı</summary>${esc(microSummary)}</details>`:''}${rows.map(item=>{const food=db.foods.find(x=>x.id===item.food);return `<div class="foodrow"><span>${esc(itemQuantityText(item,food))}</span><button class="btn light small" type="button" onclick="menuItems.splice(${menuItems.indexOf(item)},1);renderMeals();updateExchange()">Kaldır</button></div>`;}).join('')}<div class="foodrow"><select id="food-${i}" class="search" onchange="setMenuUnitLabel(${i})">${db.foods.map(food=>`<option value="${food.id}">${esc(food.name)}</option>`).join('')}</select><select id="unit-${i}" class="search" onchange="setMenuUnitLabel(${i})"><option value="g">g</option><option value="mg">mg</option><option value="ml">ml</option><option value="adet">adet</option></select><select id="size-${i}" class="search hide"><option value="small">Küçük boy</option><option value="medium" selected>Orta boy</option><option value="large">Büyük boy</option></select><label id="unit-label-${i}" class="muted">g</label><input id="amount-${i}" class="search" type="number" min=".1" step="any" value="100" aria-label="Miktar"></div><button class="btn light small" type="button" onclick="addMenuFood(${i})">＋ Besin ekle</button></div>`;
  }).join('');
};
const previousUpdateExchangeWithMicros = window.updateExchange;
window.updateExchange = function updateExchange() {
  previousUpdateExchangeWithMicros(); const el=document.querySelector('#extot'); if(!el)return;
  const text=microText(menuMicroTotals());
  if(text) el.insertAdjacentHTML('beforeend',`<div class="micro-summary" style="width:100%"><b>Seçilen besinlerden mikro toplamı:</b> ${esc(text)}</div>`);
};
const previousSaveDietWithMicros = window.saveDiet;
window.saveDiet = function saveDiet(e, patientId, templateId) {
  e.preventDefault();const values=Object.fromEntries(new FormData(e.target)),patient=values.patient||patientId,editingId=values.editDietId,macros=exchangeTotals().m.slice();
  menuItems.forEach(item=>{const food=db.foods.find(x=>x.id===item.food),q=food&&itemBasisAmount(item,food);if(food&&q!==null&&q!==undefined)[food.cho,food.protein,food.fat].forEach((v,j)=>macros[j]+=v*q/food.serving);});
  const record={id:templateId||id(),name:values.name,note:values.note,kcal:Math.round(kcal(macros)),ex:{...exchanges},macros,foods:menuItems.map(x=>({...x})),micros:menuMicroTotals(),mealNames:(window.mealNames||defaultMealNames(menuMeals||4)).slice(0,menuMeals),menuMeals};
  if(!patient){const old=db.templates.find(x=>x.id===templateId);old?Object.assign(old,record):db.templates.push(record);save();closeModal();render();toast('Şablon kaydedildi.');return;}
  if(editingId){const old=db.diets.find(x=>x.id===editingId);if(!old)return toast('Düzenlenecek diyet bulunamadı.');Object.assign(old,record,{id:editingId,patient,date:old.date||iso(new Date()),printNotes:old.printNotes||{}});}
  else db.diets.push({...record,id:id(),patient,date:iso(new Date())});
  save();closeModal();if(page==='profile'){patientTab='Diyet Geçmişi';profile();}else render();toast(editingId?'Diyet planı güncellendi.':'Diyet planı danışan dosyasına kaydedildi.');
};

// Barcode and label-energy improvements.
function foodLabelEnergy(food){const raw=food?.kcal,value=Number(raw);return raw!==undefined&&raw!==null&&raw!==''&&Number.isFinite(value)&&value>=0?value:Number(food?.cho||0)*4+Number(food?.protein||0)*4+Number(food?.fat||0)*9;}
function dietEnergyIncludingFoods(){return exchangeTotals().k+menuItems.reduce((sum,item)=>{const food=db.foods.find(x=>x.id===item.food),quantity=food&&itemBasisAmount(item,food);return food&&quantity!==null&&quantity!==undefined?sum+foodLabelEnergy(food)*quantity/(Number(food.serving)||1):sum;},0);}
function validGtin(value){const code=String(value||'').replace(/\D/g,'');if(![8,12,13,14].includes(code.length))return false;let sum=0,weight=3;for(let i=code.length-2;i>=0;i--){sum+=Number(code[i])*weight;weight=weight===3?1:3;}return (10-sum%10)%10===Number(code.at(-1));}
function expandUpcE(value){const c=String(value||'').replace(/\D/g,'');if(c.length!==8)return null;const [ns,a,b,d,e,f,mode,check]=c;let body;if(mode<='2')body=ns+a+b+mode+'0000'+d+e+f;else if(mode==='3')body=ns+a+b+d+'00000'+e+f;else if(mode==='4')body=ns+a+b+d+e+'00000'+f;else body=ns+a+b+d+e+f+'0000'+mode;const expanded=body+check;return validGtin(expanded)?expanded:null;}
function gtinCandidates(value){const raw=String(value||'').replace(/\D/g,'');if(raw.length===8&&expandUpcE(raw))return [expandUpcE(raw)];if(!validGtin(raw))return [];const options=[raw];if(raw.length===12)options.push('0'+raw);if(raw.length===13&&raw.startsWith('0'))options.push(raw.slice(1));return [...new Set(options)];}
function canonicalGtin(value){return String(value||'').replace(/\D/g,'').replace(/^0+(?=\d)/,'');}
window.foodRows=function foodRows(items){return `<div class="tablewrap"><table class="table"><tr><th>Besin</th><th>Değerlerin porsiyonu</th><th>Karbonhidrat</th><th>Protein</th><th>Yağ</th><th>Enerji</th><th>Mikro besinler</th><th></th></tr>${items.map(f=>`<tr><td><b>${esc(f.name)}</b>${f.source?`<br><small class="muted">Kaynak: ${esc(typeof f.source==='string'?f.source:f.source.name||'Belirtilmedi')}${f.verified?' · doğrulanmış':' · kontrol bekliyor'}</small>`:''}</td><td>${f.serving} ${f.basisUnit||'g'}${f.mediumG?`<br><small class="muted">Adet ağırlıkları: ${f.smallG||'—'} / ${f.mediumG} / ${f.largeG||'—'} g</small>`:''}</td><td>${f.cho} g</td><td>${f.protein} g</td><td>${f.fat} g</td><td>${Math.round(foodLabelEnergy(f))} kcal${Number.isFinite(Number(f.kcal))?'<br><small class="muted">etiket</small>':'<br><small class="muted">4/4/9</small>'}</td><td>${esc(microText(f.micros)||'—')}</td><td><button class="btn light small" onclick="foodForm('${f.id}')">Düzenle</button></td></tr>`).join('')}</table></div>`;};
const foodFormWithKcal=window.foodForm;
window.foodForm=function foodForm(foodId){foodFormWithKcal(foodId);const grid=document.querySelector('#modal form .fieldgrid');if(!grid||grid.querySelector('[name="kcal"]'))return;const food=db.foods.find(x=>x.id===foodId)||{},field=document.createElement('div');field.className='field';field.innerHTML=`<label>Enerji (kcal / yukarıdaki porsiyon) · isteğe bağlı</label><input name="kcal" type="number" min="0" step="any" value="${Number.isFinite(Number(food.kcal))?esc(food.kcal):''}" placeholder="Boşsa KH/protein/yağdan hesaplanır">`;const fat=grid.querySelector('[name="fat"]')?.closest('.field');if(fat)fat.after(field);else grid.append(field);};
const saveFoodWithBarcodeEnergy=window.saveFood;
window.saveFood=function saveFood(e,foodId){const entered=e.target.elements.kcal?.value?.trim();saveFoodWithBarcodeEnergy(e,foodId);const food=db.foods.find(x=>x.id===foodId)||db.foods.find(x=>x.barcode===e.target.elements.barcode?.value?.trim())||db.foods.at(-1);if(food){food.kcal=entered===''||entered===undefined?null:Number(entered);if(food.kcal!==null&&(!Number.isFinite(food.kcal)||food.kcal<0)){food.kcal=null;toast('Enerji değeri sıfır veya daha büyük olmalı.');}save();}};
window.updateExchange=function updateExchange(){const macros=menuMacroTotals(),energy=dietEnergyIncludingFoods(),el=document.querySelector('#extot');if(!el)return;const microSummary=microText(menuMicroTotals());el.innerHTML=`<div class="stat"><small>Enerji · değişim + besin</small><b>${Math.round(energy)} kcal</b></div><div class="stat"><small>Karbonhidrat</small><b>${macros[0].toFixed(1)} g · ${Math.round(macros[0]*4/energy*100||0)}%</b></div><div class="stat"><small>Protein</small><b>${macros[1].toFixed(1)} g · ${Math.round(macros[1]*4/energy*100||0)}%</b></div><div class="stat"><small>Yağ</small><b>${macros[2].toFixed(1)} g · ${Math.round(macros[2]*9/energy*100||0)}%</b></div>${microSummary?`<div class="micro-summary" style="width:100%"><b>Seçilen besinlerden mikro toplamı:</b> ${esc(microSummary)}</div>`:''}`;};
window.renderMeals=function renderMeals(){const el=document.querySelector('#meals');if(!el)return;const count=menuMeals||4;el.innerHTML=Array.from({length:count},(_,i)=>{const rows=menuItems.filter(x=>x.meal===i),macros=[0,0,0],micros={};let energy=0;rows.forEach(item=>{const food=db.foods.find(x=>x.id===item.food),q=food&&itemBasisAmount(item,food);if(food&&q!==null&&q!==undefined){[food.cho,food.protein,food.fat].forEach((v,j)=>macros[j]+=v*q/food.serving);energy+=foodLabelEnergy(food)*q/food.serving;MICRO_DEFS.forEach(([key])=>{const v=+(food.micros?.[key]||0);if(v)micros[key]=(micros[key]||0)+v*q/food.serving;});}});const microSummary=microText(micros);return `<div class="meal"><h3>${esc(window.mealNames?.[i]||`Öğün ${i+1}`)}</h3><div class="mealstats">${Math.round(energy)} kcal · KH ${macros[0].toFixed(1)} g (${Math.round(macros[0]*4/energy*100||0)}%) · Protein ${macros[1].toFixed(1)} g (${Math.round(macros[1]*4/energy*100||0)}%) · Yağ ${macros[2].toFixed(1)} g (${Math.round(macros[2]*9/energy*100||0)}%)</div>${microSummary?`<details class="micro-summary"><summary>Mikro besin toplamı</summary>${esc(microSummary)}</details>`:''}${rows.map(item=>{const food=db.foods.find(x=>x.id===item.food);return `<div class="foodrow"><span>${esc(itemQuantityText(item,food))}</span><button class="btn light small" type="button" onclick="menuItems.splice(${menuItems.indexOf(item)},1);renderMeals();updateExchange()">Kaldır</button></div>`;}).join('')}<div class="foodrow"><select id="food-${i}" class="search" onchange="setMenuUnitLabel(${i})">${db.foods.map(food=>`<option value="${food.id}">${esc(food.name)}</option>`).join('')}</select><select id="unit-${i}" class="search" onchange="setMenuUnitLabel(${i})"><option value="g">g</option><option value="mg">mg</option><option value="ml">ml</option><option value="adet">adet</option></select><select id="size-${i}" class="search hide"><option value="small">Küçük boy</option><option value="medium" selected>Orta boy</option><option value="large">Büyük boy</option></select><label id="unit-label-${i}" class="muted">g</label><input id="amount-${i}" class="search" type="number" min=".1" step="any" value="100" aria-label="Miktar"></div><button class="btn light small" type="button" onclick="addMenuFood(${i})">＋ Besin ekle</button></div>`;}).join('');};
const saveDietWithLabelEnergy=window.saveDiet;
window.saveDiet=function saveDiet(e,patientId,templateId){const formValues=Object.fromEntries(new FormData(e.target)),editingId=formValues.editDietId,before=new Set(db.diets.map(x=>x.id)),energy=Math.round(dietEnergyIncludingFoods());saveDietWithLabelEnergy(e,patientId,templateId);const targetDiet=editingId?db.diets.find(x=>x.id===editingId):db.diets.find(x=>!before.has(x.id));if(targetDiet){targetDiet.kcal=energy;save();}else if(!formValues.patient&&!patientId){const template=templateId?db.templates.find(x=>x.id===templateId):db.templates.at(-1);if(template){template.kcal=energy;save();}}};
window.lookupBarcode=async function lookupBarcode(){
  const input=document.querySelector('#modal [name="barcode"]'),entered=String(input?.value||'').trim(),candidates=gtinCandidates(entered),button=document.querySelector('#barcode-lookup'),note=document.querySelector('#barcode-result');
  if(!candidates.length){if(note)note.textContent='Geçerli EAN/UPC barkodu yazın veya kamerayla okutun. Son kontrol basamağı doğrulanır.';return toast('Barkod geçersiz. EAN/UPC rakamlarını ve kontrol basamağını kontrol edin.');}
  if(button){button.disabled=true;button.textContent='Ürün aranıyor…';}if(note)note.textContent='Barkod ve ürün kaydı karşılaştırılıyor…';window._barcodeSource=null;
  try{
    let matched=null,queried='';
    for(const code of candidates){const response=await fetch(`https://world.openfoodfacts.org/api/v3.6/product/${encodeURIComponent(code)}.json?fields=code,product_name,product_name_tr,brands,quantity,nutriments,serving_size,categories,allergens`,{headers:{'Accept':'application/json','Accept-Language':'tr,en'}});if(!response.ok)continue;const payload=await response.json(),product=payload.product;if(product&&!Number.isNaN(Number(payload.status))&&payload.status!==0&&canonicalGtin(product.code)===canonicalGtin(code)){matched=product;queried=code;break;}}
    if(!matched){if(note)note.textContent='Bu barkod için tam eşleşen ürün bulunamadı. Yanlış ürünü doldurmadım; etiketteki bilgileri elle girebilirsiniz.';return toast('Bu barkoda tam eşleşen ürün bulunamadı.');}
    const product=matched,title=product.product_name_tr||product.product_name||'';if(!title){if(note)note.textContent='Barkod bulundu ancak ürün adı katalogda yok. Adı ve etiket değerlerini elle girebilirsiniz.';return toast('Ürün adı katalogda eksik.');}
    const nutrients=product.nutriments||{},microMap=[['fiber','fiber'],['sodium','sodium'],['calcium','calcium'],['iron','iron'],['potassium','potassium'],['magnesium','magnesium'],['zinc','zinc'],['phosphorus','phosphorus'],['vitaminA','vitamin-a'],['vitaminC','vitamin-c'],['vitaminD','vitamin-d'],['vitaminE','vitamin-e'],['vitaminK','vitamin-k'],['thiamin','vitamin-b1'],['riboflavin','vitamin-b2'],['niacin','vitamin-pp'],['vitaminB6','vitamin-b6'],['folate','folates'],['vitaminB12','vitamin-b12'],['omega3','omega-3-fat']],micros={};
    microMap.forEach(([key,off])=>{let value=barcodeNutrient(product,off);if(value>0){const unit=nutrients[`${off}_unit`]||'';if(key==='sodium'&&unit==='g')value*=1000;if((key==='fiber'||key==='omega3')&&unit==='mg')value/=1000;if(['vitaminA','vitaminD','vitaminK','folate','vitaminB12'].includes(key)&&unit==='mg')value*=1000;micros[key]=value;}});
    let calories=Number(nutrients['energy-kcal_100g']);if(!Number.isFinite(calories)||calories<0){const kj=Number(nutrients['energy_100g']);calories=Number.isFinite(kj)&&kj>=0?kj/4.184:null;}
    fillFoodField('name',`${title}${product.brands?` · ${product.brands.split(',')[0].trim()}`:''}`);fillFoodField('barcode',product.code||queried);fillFoodField('basisUnit','g');fillFoodField('serving',100);fillFoodField('density',1);fillFoodField('cho',barcodeNutrient(product,'carbohydrates'));fillFoodField('protein',barcodeNutrient(product,'proteins'));fillFoodField('fat',barcodeNutrient(product,'fat'));const kcalField=document.querySelector('#modal [name="kcal"]');if(kcalField)kcalField.value=calories===null?'':String(calories);
    MICRO_DEFS.forEach(([key])=>fillFoodField(key,micros[key]??''));
    const note=document.querySelector('#barcode-result'),microList=microText(micros);if(note)note.innerHTML=`<b>${esc(title)}</b>${product.brands?` · ${esc(product.brands)}`:''}<br><span class="sub">Kod tam eşleşti · 100 g değerleri${calories===null?' · enerji katalogda yok':''}${micros.calcium===undefined?' · kalsiyum katalogda yok':''}. ${microList?`Bulunan mikro değerler: ${esc(microList)}. `:''}Paket etiketini kontrol edin.</span>`;
    window._barcodeSource={name:'Open Food Facts',url:`https://world.openfoodfacts.org/product/${encodeURIComponent(product.code||queried)}`,retrievedAt:new Date().toISOString(),reviewed:false};toast('Tam barkod eşleşmesi bulundu. Etiketteki bilgileri kontrol edip kaydedin.');
  }catch(error){if(note)note.textContent='Kataloğa bağlanılamadı. İnternet bağlantısını kontrol edin veya etiketteki değerleri elle girin.';toast('Barkod kataloğuna ulaşılamadı.');console.error('Barcode lookup failed:',error);}
  finally{if(button){button.disabled=false;button.textContent='Barkodla bul';}}
};
window.startBarcodeScan=async function startBarcodeScan(){
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){return toast('Kamera için masaüstündeki NutriPeer kısayolunu veya Baslat.cmd dosyasını kullanın; uygulama file:// olarak açılmış görünüyor.');}
  try{
    barcodeStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    modal(`<h2>Barkodu kamerayla okut</h2><video id="barcode-video" autoplay muted playsinline style="width:100%;max-height:55vh;background:#101814;border-radius:12px"></video><p class="sub">Barkodu çerçevenin ortasında, net ve tek başına görünecek şekilde tutun.</p><div class="formactions"><button class="btn light" onclick="stopBarcodeScan();foodForm()">Kapat</button></div>`);
    const video=document.querySelector('#barcode-video');video.srcObject=barcodeStream;await video.play();
    const handle=async raw=>{const candidates=gtinCandidates(raw);if(!candidates.length)return false;stopBarcodeScan();foodForm();fillFoodField('barcode',raw);await lookupBarcode();return true;};
    let nativeFormats=[];if('BarcodeDetector'in window&&BarcodeDetector.getSupportedFormats){try{nativeFormats=(await BarcodeDetector.getSupportedFormats()).filter(x=>['ean_13','ean_8','upc_a','upc_e'].includes(x));}catch{}}
    if(nativeFormats.length){const detector=new BarcodeDetector({formats:nativeFormats});const scan=async()=>{if(!barcodeStream)return;try{const codes=await detector.detect(video);const valid=codes.map(x=>x.rawValue).find(x=>gtinCandidates(x).length);if(valid){await handle(valid);return;}}catch{}barcodeFrame=requestAnimationFrame(scan);};barcodeFrame=requestAnimationFrame(scan);}
    else{
      if(!window.ZXing?.BrowserMultiFormatReader){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js';script.onload=resolve;script.onerror=()=>reject(new Error('ZXing yüklenemedi'));document.head.append(script);});}
      const reader=new ZXing.BrowserMultiFormatReader(),controls=await reader.decodeFromVideoDevice(undefined,video,(result)=>{const raw=result?.getText?.();if(raw&&gtinCandidates(raw).length){controls?.stop();handle(raw);}});window._barcodeReaderControls=controls;
    }
  }catch(error){stopBarcodeScan();toast(error?.name==='NotAllowedError'?'Kamera izni verilmedi. Edge adres çubuğundaki kamera iznini açıp yeniden deneyin.':'Kamera açılamadı. Başka bir uygulama kamerayı kullanıyorsa kapatıp yeniden deneyin.');console.error('Barcode scanner failed:',error);}
};
window.stopBarcodeScan=function stopBarcodeScan(){if(barcodeFrame)cancelAnimationFrame(barcodeFrame);barcodeFrame=0;window._barcodeReaderControls?.stop?.();window._barcodeReaderControls=null;barcodeStream?.getTracks().forEach(track=>track.stop());barcodeStream=null;};

const profileBeforeTrend = window.profile;
function measurementTrend(patientId) {
  const data=db.measurements.filter(x=>x.patient===patientId).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||db.measurements.indexOf(a)-db.measurements.indexOf(b));
  const card=document.createElement('div');card.className='card trend-card';card.id='measurement-trend';
  const series=[['weight','Kilo','kg','#23845b',3.5],['fat','Yağ','%','#d79528',2.3],['muscle','Kas','kg','#5482bd',2.3]];
  const usable=series.map(s=>[s,data.filter(x=>Number.isFinite(+x[s[0]])&&+x[s[0]]>0)]).filter(([,values])=>values.length);
  let content='<div class="empty">Zaman içindeki değişimi görmek için ölçüm ekleyin.</div>';
  if(usable.length){const W=760,H=250,L=55,R=18,T=22,B=32,PW=W-L-R,PH=H-T-B;let svg='';
    for(let i=0;i<4;i++){const y=T+i*PH/3;svg+=`<line x1="${L}" y1="${y}" x2="${W-R}" y2="${y}" stroke="#e8eee9"/>`;}
    usable.forEach(([s,values])=>{const [key,label,unit,color,width]=s,min=Math.min(...values.map(x=>+x[key])),max=Math.max(...values.map(x=>+x[key])),span=max-min||Math.max(max*.08,1);const pts=values.map(x=>{const index=data.indexOf(x),xpos=L+(data.length===1?PW/2:index/(data.length-1)*PW),ypos=T+PH-(+x[key]-min)/span*PH;return {x:xpos,y:ypos,row:x};});if(pts.length>1)svg+=`<polyline fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" points="${pts.map(p=>`${p.x},${p.y}`).join(' ')}"/>`;pts.forEach(p=>svg+=`<circle cx="${p.x}" cy="${p.y}" r="${label==='Kilo'?4:3}" fill="${color}"><title>${esc(p.row.date)}: ${p.row[key]} ${unit}</title></circle>`);});
    const dates=data.filter((_,i)=>i===0||i===data.length-1||i===Math.floor((data.length-1)/2));dates.forEach(d=>{const idx=data.indexOf(d),x=L+(data.length===1?PW/2:idx/(data.length-1)*PW);svg+=`<text x="${x}" y="${H-8}" text-anchor="middle" fill="#78857b" font-size="10">${esc(new Date(`${d.date}T00:00:00`).toLocaleDateString('tr-TR',{day:'numeric',month:'short'}))}</text>`;});
    const legend=usable.map(([s,values])=>{const [key,label,unit,color]=s,latest=values.at(-1);return `<span><i class="trend-key" style="background:${color}"></i>${label}: ${latest[key]} ${unit}</span>`;}).join('');
    content=`<div class="trend-legend">${legend}</div><svg class="trend-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kilo, yağ ve kas ölçümlerinin zaman içindeki değişimi">${svg}</svg><div class="trend-note">Kilo çizgisi öne çıkar. Yağ ve kas çizgileri kendi aralıklarında ölçeklenir; değerleri birbiriyle karşılaştırmak için değil, eğilimleri izlemek içindir.</div>`;
  }
  card.innerHTML=`<div class="cardtitle"><h2>Zaman İçindeki Değişim</h2></div>${content}`;return card;
}
window.profile=function profile(){profileBeforeTrend();const patient=selected||db.patients[0],target=document.querySelector('#ptab');if(!patient||!target)return;document.querySelector('#measurement-trend')?.remove();if(patientTab==='Özet'){target.append(measurementTrend(patient.id));}else if(patientTab==='Ölçümler'){const anchor=target.querySelector('.card');(anchor||target).after(measurementTrend(patient.id));}};
views.profile=window.profile;
const anthropometryStyles=document.createElement('style');
anthropometryStyles.textContent='.bmi-ruler-card{background:#fff;border:1px solid var(--line);border-radius:13px;padding:13px 16px;margin:12px 0 16px}.bmi-ruler-head{display:flex;justify-content:space-between;align-items:center;color:#405247;font-size:12px;margin-bottom:9px}.bmi-ruler-head span{font-weight:700;color:#20372b}.bmi-ruler-bar{display:flex;position:relative;height:13px;border-radius:99px;overflow:visible}.bmi-ruler-bar i{display:block;flex:1}.bmi-ruler-bar i:first-child{border-radius:99px 0 0 99px}.bmi-ruler-bar i:last-of-type{border-radius:0 99px 99px 0}.bmi-ruler-marker{position:absolute;top:-5px;height:23px;width:4px;border-radius:4px;background:#173628;border:1px solid #fff;box-shadow:0 0 0 1px #173628;transform:translateX(-50%);z-index:1}.bmi-ruler-labels{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-top:8px}.bmi-ruler-labels span{text-align:center;font-size:9px;font-weight:700;line-height:1.2}.bmi-ruler-caption{font-size:10px;color:var(--muted);margin-top:7px}';
document.head.append(anthropometryStyles);

// Additional anthropometric measurements and an adult BMI ruler on the patient overview.
window.measurementForm=function measurementForm(patientId){
  modal(`<h2>Ölçüm Ekle</h2><form onsubmit="saveMeasurement(event,'${patientId}')"><div class="fieldgrid">${formFields([['date','Tarih','date',1],['weight','Kilo (kg)','number'],['waist','Bel (cm)','number'],['hip','Kalça (cm)','number'],['chest','Göğüs çevresi (cm)','number'],['upperArm','Üst orta kol çevresi (cm)','number'],['calf','Baldır çevresi (cm)','number'],['fat','Yağ oranı (%)','number'],['muscle','Kas kütlesi (kg)','number'],['note','Not','textarea']],{date:iso(new Date())})}${skinfoldEditor([])}</div><p class="sub">Çevre ölçümlerini cm, her deri kıvrım bölgesini ayrı ayrı mm olarak kaydedin.</p><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">İptal</button><button class="btn">Kaydet</button></div></form>`);
};
window.measurementRows=function measurementRows(items){if(!items.length)return '<div class="empty">Ölçüm yok.</div>';return `<div class="tablewrap"><table class="table"><tr><th>Tarih</th><th>Kilo</th><th>Bel</th><th>Kalça</th><th>Göğüs</th><th>Üst orta kol</th><th>Baldır</th><th>Deri kıvrımı</th><th>Yağ %</th><th>Kas</th><th>Not</th><th></th></tr>${items.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(x=>`<tr><td>${esc(x.date)}</td><td>${x.weight||'—'}</td><td>${x.waist||'—'}</td><td>${x.hip||'—'}</td><td>${x.chest?`${esc(x.chest)} cm`:'—'}</td><td>${x.upperArm?`${esc(x.upperArm)} cm`:'—'}</td><td>${x.calf?`${esc(x.calf)} cm`:'—'}</td><td>${x.skinfolds?.length?x.skinfolds.map(site=>`${esc(site.site)} ${esc(site.mm)} mm`).join(' · '):x.skinfold?`${esc(x.skinfoldSite||'')} ${esc(x.skinfold)} mm`:'—'}</td><td>${x.fat||'—'}</td><td>${x.muscle||'—'}</td><td>${esc(x.note)}</td><td><button class="btn light small" onclick="deleteClinicRecord('measurements','${x.id}')">Sil</button></td></tr>`).join('')}</table></div>`;};
function bmiRulerMarkup(bmi){
  const labels=['Ağır zayıf','Zayıf','Normal','Şişmanlık öncesi','1. derece obez','2. derece obez','3. derece obez'];
  const colors=['#bd3946','#e99b42','#59ad70','#e5c84a','#e99b42','#df6651','#bd3946'];
  const bounds=[0,16,18.5,25,30,35,40,60];let index=labels.length-1;for(let i=0;i<labels.length;i++)if(bmi<bounds[i+1]){index=i;break;}
  const fraction=Math.max(0,Math.min(1,(bmi-bounds[index])/(bounds[index+1]-bounds[index]))),pos=Math.max(0,Math.min(100,((index+fraction)/labels.length)*100));
  return `<div class="bmi-ruler-card" id="bmi-ruler"><div class="bmi-ruler-head"><b>VKİ cetveli</b><span>VKİ ${bmi.toFixed(1)}</span></div><div class="bmi-ruler" role="img" aria-label="VKİ ${bmi.toFixed(1)}: ${bmiClass(bmi)}"><div class="bmi-ruler-bar">${labels.map((_,i)=>`<i style="background:${colors[i]}"></i>`).join('')}<span class="bmi-ruler-marker" style="left:${pos}%"></span></div><div class="bmi-ruler-labels">${labels.map((label,i)=>`<span style="color:${colors[i]}">${label}</span>`).join('')}</div></div><div class="bmi-ruler-caption">${bmiClass(bmi)} · tarama göstergesidir, tanı yerine geçmez.</div></div>`;
}
function anthropometryGauge({title,value,unit='',display=null,min,max,bands=[],reference,status,missing,precision=1}){
  const valid=Number.isFinite(value),circ=2*Math.PI*32,clamp=x=>Math.max(min,Math.min(max,x)),segments=bands.map(b=>{const len=Math.max(0,(Math.min(max,b.to)-Math.max(min,b.from))/(max-min)*circ);if(!len)return '';const offset=(Math.max(min,b.from)-min)/(max-min)*circ;return `<circle cx="44" cy="44" r="32" fill="none" stroke="${b.color}" stroke-width="9" stroke-dasharray="${len} ${circ-len}" stroke-dashoffset="${-offset}" transform="rotate(-90 44 44)"/>`;}).join('');
  let marker='';if(valid){const pos=(clamp(value)-min)/(max-min),angle=(-90+pos*360)*Math.PI/180,x=44+32*Math.cos(angle),y=44+32*Math.sin(angle);marker=`<circle cx="${x}" cy="${y}" r="5" fill="#20372b" stroke="#fff" stroke-width="2"/>`;}
  const center=valid?(display??value.toFixed(precision)):'—';
  return `<article class="anthro-gauge"><h3>${title}</h3><svg class="anthro-gauge-svg" viewBox="0 0 88 88" role="img" aria-label="${title}: ${valid?`${center} ${unit}, ${status}`:missing}"><circle cx="44" cy="44" r="32" fill="none" stroke="#edf0ec" stroke-width="9"/>${segments}${marker}<text x="44" y="42" text-anchor="middle" class="anthro-gauge-value">${center}</text><text x="44" y="55" text-anchor="middle" class="anthro-gauge-unit">${valid?unit:''}</text></svg><b class="anthro-gauge-status ${valid?'':'missing'}">${valid?status:missing}</b><small>${reference}</small></article>`;
}
function latestAnthroValue(patient,key){const rows=db.measurements.filter(x=>x.patient===patient.id&&Number(x[key])>0).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||db.measurements.indexOf(a)-db.measurements.indexOf(b));return rows.length?Number(rows.at(-1)[key]):Number(patient[key])>0?Number(patient[key]):null;}
function latestRecordedSkinfolds(patient){const map=new Map();db.measurements.filter(x=>x.patient===patient.id).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||db.measurements.indexOf(a)-db.measurements.indexOf(b)).forEach(row=>normalizedSkinfolds(row).forEach(site=>{if(Number(site.mm)>0)map.set(site.site,{site:site.site,mm:Number(site.mm)});}));normalizedSkinfolds(patient).forEach(site=>{if(Number(site.mm)>0&&!map.has(site.site))map.set(site.site,{site:site.site,mm:Number(site.mm)});});return [...map.values()];}
function anthropometryGauges(patient,latest){
  const sex=patient.sex==='Kadın'?'female':patient.sex==='Erkek'?'male':null;
  const waist=latestAnthroValue(patient,'waist'),hip=latestAnthroValue(patient,'hip'),arm=latestAnthroValue(patient,'upperArm'),calf=latestAnthroValue(patient,'calf');
  const ratio=waist&&hip?waist/hip:null,ratioCut=sex==='female'?.85:sex==='male'?.90:null;
  const ratioStatus=ratio===null?'':!ratioCut?'Cinsiyet seçilmedi':ratio>=ratioCut?'Android yönlü dağılım · risk eşiği üstü':'Ginoid yönlü dağılım · risk eşiği altı';
  const waistCut=sex==='female'?[80,88]:sex==='male'?[94,102]:null,waistStatus=waist===null?'':!waistCut?'Cinsiyet seçilmedi':waist>=waistCut[1]?'Çok yüksek risk eşiği':waist>=waistCut[0]?'Artmış risk eşiği':'Artmış risk eşiğinin altında';
  const folds=latestRecordedSkinfolds(patient),required=['Triseps','Biseps','Subskapular','Suprailiak'],foldMap=new Map(folds.map(x=>[String(x.site).toLocaleLowerCase('tr-TR'),Number(x.mm)])),found=required.filter(x=>foldMap.has(x.toLocaleLowerCase('tr-TR'))&&Number.isFinite(foldMap.get(x.toLocaleLowerCase('tr-TR')))),foldTotal=found.length===4?required.reduce((sum,x)=>sum+foldMap.get(x.toLocaleLowerCase('tr-TR')),0):null,foldBounds=sex==='female'?[40,80]:sex==='male'?[30,60]:null,foldStatus=foldTotal===null?'':!foldBounds?'Cinsiyet seçilmedi':foldTotal<foldBounds[0]?'Referansın altında':foldTotal>foldBounds[1]?'Referansın üstünde':'Referans aralığında';
  const cards=[];
  cards.push(anthropometryGauge({title:'Bel / kalça',value:ratio,unit:'oran',display:ratio?.toFixed(2),min:.65,max:1.1,bands:ratioCut?[{from:.65,to:ratioCut,color:'#59ad70'},{from:ratioCut,to:1.1,color:'#df6651'}]:[],reference:sex?`Eşik: kadın 0,85 · erkek 0,90`:'Cinsiyet seçin',status:ratioStatus,missing:waist&&hip?'Cinsiyet seçilmedi':'Bel ve kalça ölçüsü gerekli',precision:2}));
  cards.push(anthropometryGauge({title:'Üst orta kol',value:arm,unit:'cm',min:15,max:31,bands:[{from:15,to:21,color:'#bd3946'},{from:21,to:23,color:'#e99b42'},{from:23,to:31,color:'#59ad70'}],reference:'Normal ≥23 · orta 21–23 · şiddetli <21 cm',status:arm===null?'':arm<21?'Şiddetli malnütrisyon eşiği':arm<23?'Orta malnütrisyon eşiği':'Normal aralık',missing:'Ölçü girilmedi'}));
  cards.push(anthropometryGauge({title:'Bel çevresi',value:waist,unit:'cm',min:55,max:120,bands:waistCut?[{from:55,to:waistCut[0],color:'#59ad70'},{from:waistCut[0],to:waistCut[1],color:'#e5c84a'},{from:waistCut[1],to:120,color:'#bd3946'}]:[],reference:sex==='female'?'Kadın: 80 cm risk · 88 cm çok yüksek':sex==='male'?'Erkek: 94 cm risk · 102 cm çok yüksek':'Cinsiyet seçin',status:waistStatus,missing:'Ölçü girilmedi'}));
  cards.push(anthropometryGauge({title:'Baldır çevresi',value:calf,unit:'cm',min:20,max:40,bands:[{from:20,to:31,color:'#df6651'},{from:31,to:40,color:'#59ad70'}],reference:'<31 cm risk işareti · ≥31 cm normal',status:calf===null?'':calf<31?'Düşük baldır çevresi · risk işareti':'Eşik üstü',missing:'Ölçü girilmedi'}));
  cards.push(anthropometryGauge({title:'Deri kıvrımı toplamı',value:foldTotal,unit:'mm',display:foldTotal?.toFixed(1),min:0,max:120,bands:foldBounds?[{from:0,to:foldBounds[0],color:'#e5c84a'},{from:foldBounds[0],to:foldBounds[1],color:'#59ad70'},{from:foldBounds[1],to:120,color:'#df6651'}]:[],reference:sex==='female'?'4 bölge toplamı · kadın 40–80 mm':sex==='male'?'4 bölge toplamı · erkek 30–60 mm':'4 bölge toplamı · cinsiyet seçin',status:foldStatus,missing:`4 standart bölge gerekli (${found.length}/4)`}));
  return `<section class="anthro-gauges-wrap"><div class="anthro-gauges-title"><b>Antropometrik tarama göstergeleri</b><span>Son ölçümdeki değerler</span></div><div class="anthro-gauges">${cards.join('')}</div><p class="anthro-gauges-note">Bel/kalça ve bel çevresi risk taramasıdır; tek başına tanı koymaz. Eşikler yaş, popülasyon ve klinik duruma göre değişebilir. Deri kıvrımı toplamı dört bölgenin mm toplamıdır, yüzde yağ sonucu değildir.</p></section>`;
}
const gaugeStyles=document.createElement('style');gaugeStyles.textContent='.anthro-gauges-wrap{margin:12px 0 14px}.anthro-gauges-title{display:flex;justify-content:space-between;align-items:baseline;margin:0 2px 8px}.anthro-gauges-title b{font-size:13px;color:#314b39}.anthro-gauges-title span{font-size:10px;color:var(--muted)}.anthro-gauges{display:grid;grid-template-columns:repeat(5,minmax(126px,1fr));gap:9px}.anthro-gauge{min-width:0;text-align:center;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 8px}.anthro-gauge h3{font-size:11px;line-height:1.3;min-height:28px;margin:0 0 2px;color:#536458}.anthro-gauge-svg{display:block;width:75px;height:75px;margin:2px auto 5px;overflow:visible}.anthro-gauge-value{font-size:14px;font-weight:800;fill:#20372b}.anthro-gauge-unit{font-size:8px;fill:#69796d}.anthro-gauge-status{display:block;min-height:28px;font-size:10px;line-height:1.3;color:#345b43}.anthro-gauge-status.missing{color:#89938b;font-weight:500}.anthro-gauge small{display:block;font-size:9px;line-height:1.35;color:#7a867d;margin-top:5px}.anthro-gauges-note{font-size:10px;line-height:1.4;color:var(--muted);margin:7px 2px 0}@media(max-width:900px){.anthro-gauges{grid-template-columns:repeat(3,minmax(120px,1fr))}}@media(max-width:560px){.anthro-gauges{grid-template-columns:repeat(2,minmax(0,1fr))}.anthro-gauges-title{display:block}.anthro-gauges-title span{display:block}}';document.head.append(gaugeStyles);

const profileBeforeMeasurementsUpgrade=window.profile;
window.profile=function profile(){profileBeforeMeasurementsUpgrade();const patient=selected||db.patients[0],target=document.querySelector('#ptab');if(!patient||!target)return;
  if(patientTab==='Özet'&&age(patient.birth)>=18){target.querySelector('#bmi-ruler')?.remove();target.querySelector('#anthro-gauges')?.remove();const latest=latestMeasurement(patient.id),gauges=document.createElement('div');gauges.id='anthro-gauges';gauges.innerHTML=anthropometryGauges(patient,latest);const stats=target.querySelector('.statrow'),grid=target.querySelector('.grid.dashgrid');if(stats)stats.after(gauges);else if(grid)target.insertBefore(gauges,grid);const h=+patient.height/100,w=+(latest?.weight||patient.weight);if(h>0&&w>0){const box=document.createElement('div');box.innerHTML=bmiRulerMarkup(w/(h*h));const ruler=box.firstElementChild;if(grid)target.insertBefore(ruler,grid);else gauges.after(ruler);}}
  if(patientTab==='Ölçümler'){const latest=latestMeasurement(patient.id),statrow=target.querySelector('.card .statrow');if(statrow&&latest){[['Göğüs çevresi',latest.chest,'cm'],['Üst orta kol',latest.upperArm,'cm'],['Baldır çevresi',latest.calf,'cm']].forEach(([label,value,unit])=>{if(!value)return;const item=document.createElement('div');item.className='stat';item.innerHTML=`<small>${label}</small><b>${esc(value)} ${unit}</b>${label==='Deri kıvrımı'&&latest.skinfoldSite?`<div class="clinic-class">${esc(latest.skinfoldSite)}</div>`:''}`;statrow.append(item);});const folds=normalizedSkinfolds(latest);if(folds.length){const item=document.createElement('div');item.className='stat';item.innerHTML=`<small>Deri kıvrımları · ${folds.length} bölge</small><b>${folds.map(x=>`${esc(x.site)} ${esc(x.mm)} mm`).join(' · ')}</b>`;statrow.append(item);}}}
};views.profile=window.profile;
window.viewDiet = function viewDiet(dietId) {
  const diet=db.diets.find(x=>x.id===dietId);if(!diet)return;
  const foods=(diet.foods||[]).slice().sort((a,b)=>a.meal-b.meal).map(item=>{const food=db.foods.find(x=>x.id===item.food),meal=diet.mealNames?.[item.meal]||['Kahvaltı','Ara Öğün 1','Öğle','Ara Öğün 2','Akşam','Ara Öğün 3'][item.meal]||`Öğün ${(item.meal||0)+1}`;return `<div class="appt"><div class="apdot"></div><div><strong>${esc(food?itemQuantityText(item,food,true):'Besin kaydı bulunamadı')}</strong><small>${meal}</small></div></div>`;}).join('');
  modal(`<h2>${esc(diet.name)}</h2><p class="sub">${diet.date} · ${diet.kcal} kcal · KH ${diet.macros[0]}g · Protein ${diet.macros[1]}g · Yağ ${diet.macros[2]}g</p><div class="statrow">${Object.entries(diet.ex||{}).map(([name,n])=>`<div class="stat"><small>${esc(name)} değişimi</small><b>${n}</b></div>`).join('')}</div>${microText(diet.micros)?`<details class="micro-summary"><summary>Seçilen besinlerden günlük mikro toplamı</summary>${esc(microText(diet.micros))}</details>`:''}<h3 style="font-size:14px;margin:18px 0 8px">Menüdeki besinler</h3>${foods||'<div class="empty">Bu plan kaydedilirken menüye besin eklenmemiş. Değişim özeti yukarıda gösteriliyor.</div>'}<div class="formactions"><button class="btn light" onclick="closeModal()">Kapat</button><button class="btn light" onclick="editDiet('${diet.id}')">Diyeti düzenle</button><button class="btn light" onclick="printDiet('${diet.id}')">Yazdır / PDF</button><button class="btn" onclick="closeModal();newDiet('${diet.patient}')">Yeni plan oluştur</button></div>`);
};

// Barcode lookup (Open Food Facts), shareable food/template bundle and optional community catalog.
function fillFoodField(name,value){const field=document.querySelector(`#modal [name="${name}"]`);if(field&&value!==undefined&&value!==null)field.value=value;}
function barcodeNutrient(product,key){const n=product.nutriments||{};const v=n[`${key}_100g`];return Number.isFinite(+v)?+v:0;}
window.lookupBarcode = async function lookupBarcode(){
  const input=document.querySelector('#modal [name="barcode"]'),code=(input?.value||'').replace(/\s+/g,'');
  if(!/^\d{8,14}$/.test(code))return toast('Barkod 8–14 rakam olmalı.');
  const button=document.querySelector('#barcode-lookup');if(button){button.disabled=true;button.textContent='Ürün aranıyor…';}
  try{
    const response=await fetch(`https://world.openfoodfacts.org/api/v3.6/product/${encodeURIComponent(code)}.json?fields=code,product_name,product_name_tr,brands,quantity,nutriments,serving_size,categories,allergens`,{headers:{'Accept':'application/json','Accept-Language':'tr,en','User-Agent':'NutriPeer/1.0 (dietitian desktop app)'}});
    if(!response.ok)throw new Error(`Servis yanıtı: ${response.status}`);
    const payload=await response.json(),product=payload.product;
    if(!product||payload.status===0)return toast('Bu barkod ortak ürün veritabanında bulunamadı. Bilgileri etiketten girip kaydedebilirsin.');
    const title=product.product_name_tr||product.product_name||'';
    if(!title)return toast('Ürün bulundu ancak adı eksik. Adını etiketten yazarak devam et.');
    const nutrients=product.nutriments||{},microMap=[['fiber','fiber'],['sodium','sodium'],['calcium','calcium'],['iron','iron'],['potassium','potassium'],['magnesium','magnesium'],['zinc','zinc'],['phosphorus','phosphorus'],['vitaminA','vitamin-a'],['vitaminC','vitamin-c'],['vitaminD','vitamin-d'],['vitaminE','vitamin-e'],['vitaminK','vitamin-k'],['thiamin','vitamin-b1'],['riboflavin','vitamin-b2'],['niacin','vitamin-pp'],['vitaminB6','vitamin-b6'],['folate','folates'],['vitaminB12','vitamin-b12'],['omega3','omega-3-fat']];
    const micros={};microMap.forEach(([key,off])=>{let value=barcodeNutrient(product,off);if(value>0){const unit=nutrients[`${off}_unit`]||'';if(key==='sodium'&&unit==='g')value*=1000;if((key==='fiber'||key==='omega3')&&unit==='mg')value/=1000;if(['vitaminA','vitaminD','vitaminK','folate','vitaminB12'].includes(key)&&unit==='mg')value*=1000;micros[key]=value;}});
    fillFoodField('name',`${title}${product.brands?` · ${product.brands.split(',')[0].trim()}`:''}`);
    fillFoodField('barcode',product.code||code);fillFoodField('basisUnit','g');fillFoodField('serving',100);fillFoodField('density',1);
    fillFoodField('cho',barcodeNutrient(product,'carbohydrates'));fillFoodField('protein',barcodeNutrient(product,'proteins'));fillFoodField('fat',barcodeNutrient(product,'fat'));
    MICRO_DEFS.forEach(([key])=>fillFoodField(key,micros[key]??''));
    const note=document.querySelector('#barcode-result');if(note)note.innerHTML=`<b>${esc(title)}</b>${product.brands?` · ${esc(product.brands)}`:''}<br><span class="sub">Paket etiketindeki besin değerleri 100 g için dolduruldu. Kaydetmeden önce etiketi kontrol et.</span>`;
    window._barcodeSource={name:'Open Food Facts',url:`https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`,retrievedAt:new Date().toISOString(),reviewed:false};
    toast('Ürün bilgileri getirildi. Etiketle karşılaştırıp kaydet.');
  }catch(error){toast('Barkod servisine ulaşılamadı. İnternet bağlantısını kontrol et veya bilgileri elle gir.');console.error('Barcode lookup failed:',error);}
  finally{if(button){button.disabled=false;button.textContent='Barkodla bul';}}
};
let barcodeStream=null,barcodeFrame=0;
window.stopBarcodeScan=function stopBarcodeScan(){if(barcodeFrame)cancelAnimationFrame(barcodeFrame);barcodeFrame=0;barcodeStream?.getTracks().forEach(track=>track.stop());barcodeStream=null;};
window.startBarcodeScan=async function startBarcodeScan(){
  if(!('BarcodeDetector'in window)||!navigator.mediaDevices?.getUserMedia)return toast('Kamera barkod okuyucu bu tarayıcıda desteklenmiyor. Barkod numarasını elle yazabilirsin.');
  try{const detector=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','itf','code_128']});barcodeStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    modal(`<h2>Barkodu kamerayla okut</h2><video id="barcode-video" autoplay muted playsinline style="width:100%;max-height:55vh;background:#101814;border-radius:12px"></video><p class="sub">Barkodu çerçevenin ortasına tut. Okuyunca ürün otomatik aranır.</p><div class="formactions"><button class="btn light" onclick="stopBarcodeScan();foodForm()">Kapat</button></div>`);
    const video=document.querySelector('#barcode-video');video.srcObject=barcodeStream;await video.play();
    const scan=async()=>{if(!barcodeStream)return;try{const codes=await detector.detect(video);if(codes.length){const value=codes[0].rawValue;stopBarcodeScan();foodForm();fillFoodField('barcode',value);await lookupBarcode();return;}}catch{}barcodeFrame=requestAnimationFrame(scan);};barcodeFrame=requestAnimationFrame(scan);
  }catch(error){stopBarcodeScan();toast('Kamera açılamadı. Kamera iznini ver veya barkodu elle gir.');console.error('Barcode scanner failed:',error);}
};
const foodFormWithBarcode=window.foodForm;
window.foodForm=function foodForm(foodId){window._barcodeSource=null;foodFormWithBarcode(foodId);const modalRoot=document.querySelector('#modal .modal'),form=modalRoot?.querySelector('form');if(!form)return;
  const grid=form.querySelector('.fieldgrid');if(!grid)return;
  const barcodeField=document.createElement('div');barcodeField.className='field full';barcodeField.innerHTML=`<label>Barkodla ürün ekle</label><div class="toolbar" style="flex-wrap:wrap"><input name="barcode" class="search" inputmode="numeric" autocomplete="off" placeholder="EAN / UPC barkod numarası" style="flex:1;min-width:190px" value="${esc(db.foods.find(x=>x.id===foodId)?.barcode||'')}"><button type="button" class="btn" id="barcode-lookup" onclick="lookupBarcode()">Barkodla bul</button><button type="button" class="btn light" onclick="startBarcodeScan()">▦ Kamerayla okut</button></div><div id="barcode-result" class="sub" style="margin-top:5px"></div></div>`;
  grid.prepend(barcodeField);
  const existing=db.foods.find(x=>x.id===foodId);if(existing?.source||existing?.history?.length){const info=document.createElement('div');info.className='field full';const source=existing.source?(typeof existing.source==='string'?existing.source:existing.source.name):'El ile girildi';info.innerHTML=`<div class="sub">Kaynak: ${esc(source)} · ${existing.verified?'doğrulanmış':'etiket/kaynak kontrolü bekliyor'}${existing.barcode?` · Barkod ${esc(existing.barcode)}`:''}</div>${existing.history?.length?`<details class="micro-details"><summary>Değişiklik geçmişi (${existing.history.length})</summary>${existing.history.slice().reverse().map(x=>`<p class="sub">${esc(new Date(x.at).toLocaleString('tr-TR'))} · ${esc(x.by||'Kullanıcı')} öncesi: KH ${esc(x.before.cho)} g, P ${esc(x.before.protein)} g, Y ${esc(x.before.fat)} g</p>`).join('')}</details>`:''}`;grid.append(info);}
};
const saveFoodBeforeBarcode=window.saveFood;
window.saveFood=function saveFood(e,foodId){const barcode=e.target.elements.barcode?.value?.trim()||'',before=db.foods.find(x=>x.id===foodId),snapshot=before?JSON.stringify({name:before.name,serving:before.serving,basisUnit:before.basisUnit,cho:before.cho,protein:before.protein,fat:before.fat,kcal:before.kcal,micros:before.micros,barcode:before.barcode}):null;saveFoodBeforeBarcode(e,foodId);const food=db.foods.find(x=>x.id===foodId)||db.foods.find(x=>barcode&&x.barcode===barcode);if(food&&barcode)food.barcode=barcode;if(food&&window._barcodeSource){food.source=window._barcodeSource;food.verified=false;}if(food&&before&&snapshot!==JSON.stringify({name:food.name,serving:food.serving,basisUnit:food.basisUnit,cho:food.cho,protein:food.protein,fat:food.fat,kcal:food.kcal,micros:food.micros,barcode:food.barcode})){food.history||=[];food.history.push({at:new Date().toISOString(),by:`${activeUser()?.first||''} ${activeUser()?.last||''}`.trim(),before:JSON.parse(snapshot)});food.history=food.history.slice(-20);}save();};

function safeLibraryBundle(){return {format:'NutriPeer paylaşım paketi',version:1,createdAt:new Date().toISOString(),foods:db.foods.map(f=>({...f})),templates:db.templates.map(t=>({...t,foods:(t.foods||[]).map(x=>({...x}))}))};}
window.exportLibraryBundle=function exportLibraryBundle(){const blob=new Blob([JSON.stringify(safeLibraryBundle(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`NutriPeer-paylasim-${iso(new Date())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Besinler ve danışan bilgisi içermeyen diyet şablonları dışa aktarıldı.');};
window.importLibraryFile=async function importLibraryFile(event){const file=event.target.files?.[0];if(!file)return;try{const bundle=JSON.parse(await file.text());if(bundle.format!=='NutriPeer paylaşım paketi'||bundle.version!==1)throw new Error('Bu dosya NutriPeer paylaşım paketi değil.');
  let foodsAdded=0,templatesAdded=0;const idMap=new Map();
  for(const raw of bundle.foods||[]){if(!raw.name||!Number.isFinite(+raw.serving)||+raw.serving<=0||['cho','protein','fat'].some(k=>!Number.isFinite(+raw[k])||+raw[k]<0))continue;
    const existing=db.foods.find(f=>(raw.barcode&&f.barcode===raw.barcode)||(!raw.barcode&&f.name.toLocaleLowerCase('tr-TR')===String(raw.name).toLocaleLowerCase('tr-TR')));
    if(existing){idMap.set(raw.id,existing.id);continue;}
    const food={...raw,id:id(),verified:false};db.foods.push(food);idMap.set(raw.id,food.id);foodsAdded++;
  }
  for(const raw of bundle.templates||[]){if(!raw.name||!Array.isArray(raw.macros))continue;const foods=(raw.foods||[]).filter(x=>idMap.has(x.food)).map(x=>({...x,food:idMap.get(x.food)}));db.templates.push({...raw,id:id(),foods});templatesAdded++;}
  save();render();toast(`${foodsAdded} besin ve ${templatesAdded} şablon içe aktarıldı.`);
  }catch(error){toast(error.message||'Paylaşım dosyası okunamadı.');}finally{event.target.value='';}};
function addLibraryControls(){const heading=document.querySelector('#view .heading');if(!heading||document.querySelector('#library-import'))return;const tools=document.createElement('div');tools.className='toolbar';tools.style.flexWrap='wrap';tools.innerHTML=`<button class="btn light" onclick="exportLibraryBundle()">Besin/şablon paylaş</button><button class="btn light" onclick="document.querySelector('#library-import').click()">Paylaşım paketi al</button><input id="library-import" type="file" accept="application/json,.json" class="hide" onchange="importLibraryFile(event)">`;heading.append(tools);}
const foodsBeforeSharing=window.foods;
window.foods=function foods(){foodsBeforeSharing();addLibraryControls();};views.foods=window.foods;
const dietsBeforeSharing=views.diets;
views.diets=function diets(){dietsBeforeSharing();addLibraryControls();};

const COMMUNITY_KEY='nutripeer.community.v1';
function communityConfig(){const managed=window.NUTRIPEER_COMMUNITY_CONFIG;if(managed?.managed&&managed.url&&managed.key)return {url:managed.url,key:managed.key,managed:true};try{return JSON.parse(localStorage.getItem(COMMUNITY_KEY)||'{}');}catch{return {};}}
function saveCommunityConfig(config){if(communityConfig().managed)throw new Error('Ortak kütüphane bağlantısı uygulama sahibi tarafından yönetiliyor.');localStorage.setItem(COMMUNITY_KEY,JSON.stringify(config));}
function communityHeaders(){const c=communityConfig(),s=communitySession();return {'apikey':c.key,'Authorization':`Bearer ${s?.access_token||c.key}`,'Content-Type':'application/json','Prefer':'return=representation'};}
function communitySession(){try{return JSON.parse(localStorage.getItem('nutripeer.community.auth.v1')||'null');}catch{return null;}}
async function ensureCommunitySession(){let s=communitySession();if(!s?.refresh_token||s.expires_at>Date.now()+60000)return s;const c=communityConfig();const res=await fetch(`${c.url}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});if(!res.ok){localStorage.removeItem('nutripeer.community.auth.v1');return null;}const next=await res.json();s={...next,expires_at:Date.now()+(next.expires_in||3600)*1000};localStorage.setItem('nutripeer.community.auth.v1',JSON.stringify(s));return s;}
async function communityRequest(path,options={}){const c=communityConfig();if(!c.url||!c.key)throw new Error('Önce ortak kütüphane bağlantısını ayarla.');await ensureCommunitySession();return fetch(`${c.url.replace(/\/$/,'')}/rest/v1/${path}`,{...options,headers:{...communityHeaders(),...(options.headers||{})}});}
window.communityAuth=function communityAuth(mode){const c=communityConfig();if(!c.url||!c.key)return toast('Önce ortak kütüphane bağlantısını ayarla.');modal(`<h2>Ortak kütüphane hesabı</h2><p class="sub">Katkı önermek ve kendi onay bekleyen kayıtlarını görmek için ekip hesabıyla giriş yap.</p><form onsubmit="submitCommunityAuth(event,'${mode}')"><div class="fieldgrid"><div class="field full"><label>E-posta</label><input name="email" type="email" required autocomplete="email"></div><div class="field full"><label>Şifre</label><input name="password" type="password" required minlength="8" autocomplete="${mode==='signup'?'new-password':'current-password'}"></div></div><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">Kapat</button><button class="btn">${mode==='signup'?'Hesap oluştur':'Giriş yap'}</button></div></form>`);};
window.submitCommunityAuth=async function submitCommunityAuth(e,mode){e.preventDefault();const {email,password}=Object.fromEntries(new FormData(e.target)),c=communityConfig(),endpoint=mode==='signup'?'signup':'token?grant_type=password';try{const res=await fetch(`${c.url}/auth/v1/${endpoint}`,{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify({email,password})}),data=await res.json();if(!res.ok)throw new Error(data.msg||data.message||data.error_description||data.error||'Hesap isteği başarısız oldu.');if(!data.access_token){closeModal();return toast('Hesap oluşturuldu. E-posta doğrulaması isteniyorsa bağlantıya tıkla, sonra giriş yap.');}localStorage.setItem('nutripeer.community.auth.v1',JSON.stringify({...data,expires_at:Date.now()+(data.expires_in||3600)*1000}));closeModal();render();toast('Ortak kütüphane hesabına bağlandın.');}catch(error){toast(error.message);}};
window.communityLogout=function communityLogout(){localStorage.removeItem('nutripeer.community.auth.v1');render();toast('Ortak kütüphane hesabından çıkış yapıldı.');};
window.communitySettings=function communitySettings(){const c=communityConfig();modal(`<h2>Ortak kütüphane bağlantısı</h2><p class="sub">Paylaşım alanını ekipçe ortak kullanmak için Supabase projenizin URL ve publishable key değerlerini girin. Bu anahtar yalnızca RLS kurallarıyla sınırlandırılmış erişim sağlar.</p><form onsubmit="saveCommunitySettings(event)"><div class="fieldgrid"><div class="field full"><label>Proje URL</label><input name="url" type="url" required placeholder="https://proje-id.supabase.co" value="${esc(c.url||'')}"></div><div class="field full"><label>Publishable key</label><input name="key" required autocomplete="off" placeholder="sb_publishable_…" value="${esc(c.key||'')}"></div></div><div class="notice"><b>Kurulum-Ortak-Kutuphane.sql dosyası uygulama değildir; içinde SQL kodu vardır.</b> Proje sahibi bu kodu Supabase'in SQL Editor bölümünde bir kez çalıştırır. Arkadaşlarına kodu gönderme. Onlara NutriPeer ZIP paketini, proje URL'sini ve publishable key'i gönder; onlar uygulamadaki bu alana girip topluluk hesabı açar. Secret/service-role anahtarını asla uygulamaya koyma.</div><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">Kapat</button><button class="btn">Bağlantıyı kaydet</button></div></form>`);};
window.saveCommunitySettings=function saveCommunitySettings(e){e.preventDefault();if(communityConfig().managed)return toast('Ortak kütüphane bağlantısı uygulama sahibi tarafından yönetiliyor.');const v=Object.fromEntries(new FormData(e.target));try{const url=new URL(v.url);if(url.protocol!=='https:')throw 0;}catch{return toast('Proje URL https:// ile başlamalı.');}saveCommunityConfig({url:v.url.replace(/\/$/,''),key:v.key.trim()});closeModal();render();toast('Ortak kütüphane bağlantısı kaydedildi.');};
window.refreshCommunityFoods=async function refreshCommunityFoods(){const panel=document.querySelector('#community-results');if(!panel)return;panel.innerHTML='<div class="empty">Ortak katalog yükleniyor…</div>';try{const session=await ensureCommunitySession(),fields='select=id,food_data,barcode,source,status,created_at';const requests=[communityRequest(`nutripeer_shared_foods?${fields}&status=eq.approved&order=created_at.desc&limit=100`)];if(session?.user?.id){requests.push(communityRequest(`nutripeer_shared_foods?${fields}&status=eq.pending&created_by=eq.${session.user.id}&order=created_at.desc&limit=100`));requests.push(communityRequest('rpc/nutripeer_is_moderator',{method:'POST',body:'{}'}));}const responses=await Promise.all(requests);for(const res of responses.slice(0,session?.user?.id?2:1))if(!res.ok)throw new Error(`Sunucu ${res.status}: ${(await res.text()).slice(0,180)}`);let rows=(await responses[0].json()).map(x=>({...x,isMine:false})),moderator=false;if(session?.user?.id){rows=rows.concat((await responses[1].json()).map(x=>({...x,isMine:true})));if(responses[2]?.ok)moderator=await responses[2].json();if(moderator){const pending=await communityRequest(`nutripeer_shared_foods?${fields}&status=eq.pending&order=created_at.desc&limit=100`);if(pending.ok)rows=rows.concat((await pending.json()).filter(x=>!rows.some(y=>y.id===x.id)).map(x=>({...x,isMine:false})));}}panel.innerHTML=rows.length?rows.map(row=>`<div class="appt"><div class="apdot"></div><div style="flex:1"><strong>${esc(row.food_data.name)} ${row.status==='pending'?'<span class="pill">Onay bekliyor</span>':''}</strong><small>${row.food_data.serving} ${row.food_data.basisUnit||'g'} · ${esc(row.source||'Kaynak belirtilmedi')}${row.barcode?` · ${esc(row.barcode)}`:''}</small></div>${row.status==='approved'?`<button class="btn light small" onclick="importCommunityFood('${row.id}')">Kütüphaneme ekle</button>`:moderator?`<button class="btn small" onclick="approveCommunityFood('${row.id}')">Onayla</button>`:''}</div>`).join(''):'<div class="empty">Henüz onaylı ortak besin yok.</div>'; }catch(error){panel.innerHTML=`<div class="notice">${esc(error.message)}<br>Tabloyu Kurulum-Ortak-Kutuphane.sql dosyasındaki yönergeyle oluşturup tekrar deneyin.</div>`;}};
window.submitCommunityFood=async function submitCommunityFood(){const session=await ensureCommunitySession();if(!session?.user?.id)return toast('Besin önermek için ortak kütüphane hesabına giriş yap.');const select=document.querySelector('#community-food-select'),food=db.foods.find(x=>x.id===select?.value);if(!food)return toast('Önce paylaşılacak bir besin seç.');try{const res=await communityRequest('nutripeer_shared_foods',{method:'POST',body:JSON.stringify({barcode:food.barcode||null,food_data:food,source:food.source?.name||'NutriPeer topluluk katkısı',status:'pending',created_by:session.user.id})});if(!res.ok)throw new Error(`Sunucu ${res.status}: ${(await res.text()).slice(0,160)}`);toast('Besin inceleme ve onay kuyruğuna gönderildi.');await refreshCommunityFoods();}catch(error){toast(error.message);}};
window.approveCommunityFood=async function approveCommunityFood(sharedId){try{const res=await communityRequest(`nutripeer_shared_foods?id=eq.${encodeURIComponent(sharedId)}&status=eq.pending`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'approved',reviewed_at:new Date().toISOString()})});if(!res.ok)throw new Error(`Onay başarısız: ${res.status} ${(await res.text()).slice(0,140)}`);toast('Besin ortak kütüphanede yayımlandı.');await refreshCommunityFoods();}catch(error){toast(error.message);}};
window.importCommunityFood=async function importCommunityFood(sharedId){try{const res=await communityRequest(`nutripeer_shared_foods?select=food_data&id=eq.${encodeURIComponent(sharedId)}&status=eq.approved`);if(!res.ok)throw new Error(`Sunucu ${res.status}`);const [row]=await res.json();if(!row)return toast('Ortak besin bulunamadı.');const f=row.food_data;if(db.foods.some(x=>(f.barcode&&x.barcode===f.barcode)||x.name.toLocaleLowerCase('tr-TR')===String(f.name).toLocaleLowerCase('tr-TR')))return toast('Bu besin zaten senin kütüphanende var.');db.foods.push({...f,id:id(),source:{name:'NutriPeer ortak kütüphanesi'},verified:true});save();render();toast('Onaylı besin kütüphanene eklendi.');}catch(error){toast(error.message);}};
function addCommunityPanel(){const heading=document.querySelector('#view .heading'),view=document.querySelector('#view');if(!heading||!view||document.querySelector('#community-card'))return;const c=communityConfig(),session=communitySession();const card=document.createElement('div');card.className='card';card.id='community-card';card.style.marginBottom='16px';card.innerHTML=`<div class="cardtitle"><div><h2>Ortak besin kütüphanesi</h2><div class="sub">Ekipçe katkı yapın; paylaşılan kayıtlar onaylandıktan sonra görünür.</div></div><div class="toolbar"><button class="btn light small" onclick="communitySettings()">${c.managed?'Bağlantı durumu':c.url?'Bağlantıyı düzenle':'Bağlantı ayarla'}</button><button class="btn light small" onclick="refreshCommunityFoods()">Yenile</button></div></div><div class="toolbar" style="margin-bottom:12px;flex-wrap:wrap"><select id="community-food-select" class="search"><option value="">Paylaşılacak besini seç</option>${db.foods.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select><button class="btn small" onclick="submitCommunityFood()">Onaya gönder</button>${session?.user?.email?`<span class="sub">${esc(session.user.email)}</span><button class="btn light small" onclick="communityLogout()">Hesaptan çık</button>`:`<button class="btn light small" onclick="communityAuth('signin')">Topluluk hesabına giriş</button><button class="btn light small" onclick="communityAuth('signup')">Hesap oluştur</button>`}</div><div id="community-results"><div class="empty">Bağlantı ayarlayıp ortak besinleri görüntüle.</div></div>`;view.insertBefore(card,heading.nextSibling);if(c.url)refreshCommunityFoods();}
const foodsBeforeCommunity=window.foods;
window.foods=function foods(){foodsBeforeCommunity();addCommunityPanel();};views.foods=window.foods;

// Explicit record deletion for the clinic's main lists.
window.deleteClinicRecord=function deleteClinicRecord(type,recordId){
  const labels={patients:'danışanı ve bu danışana bağlı randevu, diyet, ölçüm ve laboratuvar kayıtlarını',diets:'diyet planını',measurements:'ölçüm sonucunu',labs:'laboratuvar sonucunu'};
  const record=(db[type]||[]).find(x=>x.id===recordId);if(!record)return;
  const label=labels[type]||'kaydı';
  if(!confirm(`${label} silmek istediğine emin misin? Bu işlem geri alınamaz.`))return;
  if(type==='patients'){
    db.patients=db.patients.filter(x=>x.id!==recordId);
    for(const key of ['appointments','diets','measurements','labs'])db[key]=(db[key]||[]).filter(x=>x.patient!==recordId);
    if(selected?.id===recordId){selected=null;page='patients';patientTab='Özet';}
  }else{
    db[type]=db[type].filter(x=>x.id!==recordId);
    if(type==='measurements'){
      const remaining=db.measurements.filter(x=>x.patient===record.patient).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
      const patient=db.patients.find(x=>x.id===record.patient);if(patient){patient.weight=remaining?.weight||'';patient.waist=remaining?.waist||'';patient.hip=remaining?.hip||'';}
    }
  }
  save();render();toast(({patients:'Danışan ve bağlı kayıtları silindi.',diets:'Diyet planı silindi.',measurements:'Ölçüm sonucu silindi.',labs:'Laboratuvar sonucu silindi.'})[type]||'Kayıt silindi.');
};
const patientRowsBeforeDelete=window.patientRows;
window.patientRows=function patientRows(items){if(!items.length)return patientRowsBeforeDelete(items);return `<div class="tablewrap"><table class="table"><thead><tr><th>Danışan</th><th>Telefon</th><th>Yaş</th><th>Son Kilo</th><th>Hedef</th><th></th></tr></thead><tbody>${items.map(p=>`<tr onclick="openPatient('${p.id}')" style="cursor:pointer"><td><b>${esc(p.first)} ${esc(p.last)}</b></td><td>${esc(p.phone)}</td><td>${age(p.birth)||'—'}</td><td>${p.weight?esc(p.weight)+' kg':'—'}</td><td><span class="pill">Dosyayı aç →</span></td><td><button class="btn light small" onclick="event.stopPropagation();deleteClinicRecord('patients','${p.id}')">Sil</button></td></tr>`).join('')}</tbody></table></div>`;};
const dietRowsBeforeDelete=window.dietRows;
window.dietRows=function dietRows(items){if(!items.length)return dietRowsBeforeDelete(items);return `<div class="tablewrap"><table class="table"><tr><th>Plan</th><th>Tarih</th><th>Enerji</th><th>Danışan</th><th></th><th></th></tr>${items.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.date)}</td><td>${x.kcal} kcal</td><td>${esc(db.patients.find(p=>p.id===x.patient)?.first||'')}</td><td><button class="btn light small" onclick="viewDiet('${x.id}')">Aç</button></td><td><button class="btn light small" onclick="deleteClinicRecord('diets','${x.id}')">Sil</button></td></tr>`).join('')}</table></div>`;};
window.measurementRows=function measurementRows(items){if(!items.length)return '<div class="empty">Ölçüm yok.</div>';return `<div class="tablewrap"><table class="table"><tr><th>Tarih</th><th>Kilo</th><th>Bel</th><th>Kalça</th><th>Göğüs</th><th>Üst orta kol</th><th>Baldır</th><th>Deri kıvrımı</th><th>Yağ %</th><th>Kas kütlesi</th><th>Not</th><th></th></tr>${items.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||db.measurements.indexOf(b)-db.measurements.indexOf(a)).map(x=>`<tr><td>${esc(x.date)}</td><td>${x.weight||'—'}</td><td>${x.waist||'—'}</td><td>${x.hip||'—'}</td><td>${x.chest?`${esc(x.chest)} cm`:'—'}</td><td>${x.upperArm?`${esc(x.upperArm)} cm`:'—'}</td><td>${x.calf?`${esc(x.calf)} cm`:'—'}</td><td>${x.skinfolds?.length?x.skinfolds.map(site=>`${esc(site.site)} ${esc(site.mm)} mm`).join(' · '):x.skinfold?`${esc(x.skinfoldSite||'')} ${esc(x.skinfold)} mm`:'—'}</td><td>${x.fat||'—'}</td><td>${x.muscle||'—'}</td><td>${esc(x.note)}</td><td><button class="btn light small" onclick="deleteClinicRecord('measurements','${x.id}')">Sil</button></td></tr>`).join('')}</table></div>`;};
const viewDietBeforeDelete=window.viewDiet;
window.viewDiet=function viewDiet(dietId){viewDietBeforeDelete(dietId);const diet=db.diets.find(x=>x.id===dietId);const actions=document.querySelector('#modal .formactions');if(diet&&actions){const button=document.createElement('button');button.className='btn light';button.textContent='Diyeti sil';button.onclick=()=>{closeModal();deleteClinicRecord('diets',dietId);};actions.prepend(button);}};
const profileBeforeDelete=window.profile;
window.profile=function profile(){profileBeforeDelete();if(patientTab==='Laboratuvar'&&selected){const table=document.querySelector('#ptab table');if(table){const header=table.querySelector('tr');if(header&&!header.textContent.includes('İşlem'))header.insertAdjacentHTML('beforeend','<th>İşlem</th>');const rows=[...db.labs.filter(x=>x.patient===selected.id).sort((a,b)=>b.date.localeCompare(a.date))];[...table.querySelectorAll('tr')].slice(1).forEach((tr,i)=>{const item=rows[i];if(item)tr.insertAdjacentHTML('beforeend',`<td><button class="btn light small" onclick="deleteClinicRecord('labs','${item.id}')">Sil</button></td>`);});}}};
views.profile=window.profile;


// Stable, age-aware energy calculation and selected-weight consistency fix.
function schofieldEnergy(ageYears, female, weightKg) {
  if (ageYears < 18) return null;
  if (ageYears < 30) return female ? 14.818 * weightKg + 486.6 : 15.057 * weightKg + 692.2;
  if (ageYears < 60) return female ? 8.126 * weightKg + 845.6 : 11.472 * weightKg + 873.1;
  return female ? 9.082 * weightKg + 658.5 : 11.711 * weightKg + 587.7;
}
window.runCalc = function runCalc() {
  const number = selector => Number(document.querySelector(selector)?.value);
  const ageYears=number('#age'),height=number('#height'),current=number('#weight'),ffm=number('#ffm');
  const activityMin=number('#actmin'),activityMax=number('#actmax'),stress=number('#stress'),tefPercent=number('#tef');
  const female=document.querySelector('#sex')?.value==='Kadın',anthro=runAnthro();
  if (![ageYears,height,current].every(Number.isFinite)||ageYears<18||height<=0||current<=0||!anthro) return toast('Yetişkin hesabı için 18 yaş ve üzeri geçerli yaş, boy ve kilo girin.');
  if (![activityMin,activityMax,stress,tefPercent].every(Number.isFinite)||activityMin<=0||activityMax<activityMin||stress<=0||tefPercent<0||tefPercent>30) return toast('Aktivite alt/üst sınırlarını ve çarpanları kontrol edin.');
  const basis=document.querySelector('#basis').value,weight=basis==='ideal'?anthro.ideal:basis==='adjusted'?anthro.adjusted:current;
  const gender=female?-161:5;
  const equations=[
    ['Mifflin–St Jeor',10*weight+6.25*height-5*ageYears+gender],
    ['Harris–Benedict (revize)',female?447.593+9.247*weight+3.098*height-4.330*ageYears:88.362+13.397*weight+4.799*height-5.677*ageYears],
    ['Schofield (1985)',schofieldEnergy(ageYears,female,weight)],
    ['Cunningham',Number.isFinite(ffm)&&ffm>0&&ffm<=current?500+22*ffm:null]
  ];
  const multiplier=stress*(1+tefPercent/100);
  const options=equations.map(([name,base])=>{const display=name==='Schofield (1985)'?`${name} · ${ageYears<30?'18–30':ageYears<60?'30–60':'60+'}`:name;return {name,display,base,min:base?Math.round(base*activityMin*multiplier):null,max:base?Math.round(base*activityMax*multiplier):null};});
  const result=`<div class="cardtitle"><h2>Formül sonuçları</h2><span class="pill">${basis==='current'?'Mevcut':basis==='ideal'?'İdeal':'Düzeltilmiş'} kilo: ${weight.toFixed(1)} kg</span></div><div class="tablewrap"><table class="table"><tr><th>Denklem · bazal</th><th>Enerji aralığı</th></tr>${options.map(x=>`<tr><td>${x.display}<br><small class="muted">${x.base?Math.round(x.base)+' kcal/gün bazal':x.name==='Schofield (1985)'?'Yetişkin yaş aralığı dışında':x.name==='Cunningham'?'Yağsız kütleyi mevcut kilodan küçük veya eşit girin':'Hesaplanamadı'}</small></td><td>${x.base?`${x.min} – ${x.max} kcal/gün`:'—'}</td></tr>`).join('')}</table></div><p class="sub" style="margin-top:14px">Enerji = bazal × aktivite alt/üst sınırı × stres çarpanı × (1 + termik etki). Seçilen ağırlık: ${weight.toFixed(1)} kg.</p><div class="field" style="max-width:340px;margin-top:12px"><label>Kullanılacak denklem</label><select id="chosenEq">${options.filter(x=>x.base&&Number.isFinite(x.base)).map(x=>`<option value="${x.name}">${x.display}</option>`).join('')}</select></div><button class="btn" style="margin-top:12px" onclick="applyCalc()">Seçili denklemi kullan ve diyet yaz</button>`;
  calcResult=result;
  const target=document.querySelector('#calcresult');if(target)target.innerHTML=result;
};
window.applyCalc = function applyCalc() {
  const value=selector=>Number(document.querySelector(selector)?.value);
  const ageYears=value('#age'),height=value('#height'),current=value('#weight'),ffm=value('#ffm');
  const activityMin=value('#actmin'),activityMax=value('#actmax'),stress=value('#stress'),tefPercent=value('#tef');
  const female=document.querySelector('#sex')?.value==='Kadın',basis=document.querySelector('#basis')?.value||'current',eqName=document.querySelector('#chosenEq')?.value;
  if (![ageYears,height,current].every(Number.isFinite)||ageYears<18||height<=0||current<=0||!eqName) return toast('Hesaplama için 18 yaş ve üzeri geçerli yaş, boy, kilo ve denklem seçin.');
  if (![activityMin,activityMax,stress,tefPercent].every(Number.isFinite)||activityMin<=0||activityMax<activityMin||stress<=0||tefPercent<0||tefPercent>30) return toast('Aktivite alt/üst sınırlarını ve çarpanları kontrol edin.');
  const ideal=22*(height/100)**2,adjusted=ideal+.25*(current-ideal),weight=basis==='ideal'?ideal:basis==='adjusted'?adjusted:current;
  const gender=female?-161:5;
  const equations={'Mifflin–St Jeor':10*weight+6.25*height-5*ageYears+gender,'Harris–Benedict (revize)':female?447.593+9.247*weight+3.098*height-4.330*ageYears:88.362+13.397*weight+4.799*height-5.677*ageYears,'Schofield (1985)':schofieldEnergy(ageYears,female,weight),'Cunningham':Number.isFinite(ffm)&&ffm>0&&ffm<=current?500+22*ffm:null};
  const base=equations[eqName];if(!Number.isFinite(base)||base<=0)return toast(eqName==='Cunningham'?'Cunningham için yağsız kütleyi mevcut kilodan küçük veya eşit girin.':'Seçilen denklem için hesaplama yapılamadı. Girdileri kontrol edin.');
  const min=Math.round(base*activityMin*stress*(1+tefPercent/100)),max=Math.round(base*activityMax*stress*(1+tefPercent/100));
  if(!Number.isFinite(min)||!Number.isFinite(max))return toast('Enerji sonucu hesaplanamadı. Girdileri kontrol edin.');
  const patientId=document.querySelector('#cp')?.value||'';
  newDiet(patientId,{min,max,eq:eqName,basis,weight:+weight.toFixed(1)});
};

window.printDiet=function printDiet(dietId){
  const diet=db.diets.find(x=>x.id===dietId);if(!diet)return;
  const notes={notes:'',medications:'',drinks:'',reminders:'',...(diet.printNotes||{})};
  modal(`<h2>Danışana verilecek sayfayı düzenle</h2><p class="sub">Aşağıdaki alanlar yalnızca danışana verilecek çıktıda görünür. Enerji, makro ve değişim tabloları yer almaz.</p><form onsubmit="openDietPrintPreview(event,'${diet.id}')"><div class="fieldgrid">${formFields([['notes','Danışan notları','textarea'],['medications','İlaç / takviye ve saatleri','textarea'],['drinks','İçecekler ve saatleri','textarea'],['reminders','Ek hatırlatmalar','textarea']],notes)}</div><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">İptal</button><button class="btn">Önizlemeyi aç</button></div></form>`);
};
window.openDietPrintPreview=function openDietPrintPreview(e,dietId){e.preventDefault();const diet=db.diets.find(x=>x.id===dietId);if(!diet)return;const values=Object.fromEntries(new FormData(e.target));diet.printNotes={notes:values.notes||'',medications:values.medications||'',drinks:values.drinks||'',reminders:values.reminders||''};save();closeModal();openDietPrintWindow(dietId,diet.printNotes);};

// User-supplied outpatient protocol: adult age-specific ideal BMI and weight basis.
function protocolIdealBmi(ageYears){
  if(ageYears<19)return null;
  if(ageYears<25)return 21;
  if(ageYears<35)return 22;
  if(ageYears<45)return 23;
  if(ageYears<55)return 24;
  if(ageYears<65)return 25;
  return 26;
}
function protocolWeightBasis(bmi){return bmi<25?'current':bmi<30?'ideal':'adjusted';}
const calculatorWithProtocol=window.calculator;
window.calculator=function calculator(){
  calculatorWithProtocol();
  window._weightBasisTouched=false;
  const basis=document.querySelector('#basis');
  if(basis)basis.addEventListener('change',()=>{window._weightBasisTouched=true;});
  const note=document.querySelector('#view .grid.split > div:nth-child(2) .card p.sub');
  if(note)note.textContent='İdeal kilo: yaşa göre ideal VKİ × boy². Düzeltilmiş kilo: ideal + 0,25 × (mevcut − ideal). Önerilen hesaplama ağırlığı VKİ’ye göre otomatik seçilir; gerektiğinde diyetisyen değiştirebilir.';
};
if(typeof views==='object')views.calculator=window.calculator;
window.runAnthro=function runAnthro(){
  const ageYears=Number(document.querySelector('#age')?.value),height=Number(document.querySelector('#height')?.value),current=Number(document.querySelector('#weight')?.value),h=height/100,idealBmi=protocolIdealBmi(ageYears);
  const target=document.querySelector('#anthro');
  if(!(h>0&&current>0&&Number.isFinite(idealBmi))){
    if(target)target.innerHTML=`<div class="stat"><small>VKİ</small><b>${h>0&&current>0?(current/(h*h)).toFixed(1):'—'}</b></div><div class="stat"><small>İdeal / düzeltilmiş kilo</small><b>${ageYears>0&&ageYears<19?'19 yaş ve üzeri protokolü':'—'}</b></div>`;
    return null;
  }
  const bmi=current/(h*h),ideal=idealBmi*h*h,adjusted=ideal+.25*(current-ideal),recommended=protocolWeightBasis(bmi);
  if(target)target.innerHTML=`<div class="stat"><small>VKİ</small><b>${bmi.toFixed(1)}</b><div class="clinic-class">${bmiClass(bmi)}</div></div><div class="stat"><small>İdeal VKİ · yaş ${ageYears}</small><b>${idealBmi}</b></div><div class="stat"><small>İdeal kilo</small><b>${ideal.toFixed(1)} kg</b></div><div class="stat"><small>Düzeltilmiş kilo</small><b>${adjusted.toFixed(1)} kg</b></div><div class="stat"><small>Protokol ağırlığı</small><b>${recommended==='current'?'Mevcut':recommended==='ideal'?'İdeal':'Düzeltilmiş'}</b></div>`;
  return {bmi,idealBmi,ideal,adjusted,recommended};
};
window.calcAutofill=function calcAutofill(){
  const patient=db.patients.find(x=>x.id===document.querySelector('#cp')?.value);if(!patient)return;
  document.querySelector('#sex').value=patient.sex||'Kadın';document.querySelector('#age').value=age(patient.birth)||'';document.querySelector('#height').value=patient.height||'';document.querySelector('#weight').value=patient.weight||'';
  window._weightBasisTouched=false;const anthro=runAnthro(),basis=document.querySelector('#basis');if(anthro&&basis)basis.value=anthro.recommended;
};
window.runCalc=function runCalc(){
  const number=selector=>Number(document.querySelector(selector)?.value),ageYears=number('#age'),height=number('#height'),current=number('#weight'),ffm=number('#ffm'),activityMin=number('#actmin'),activityMax=number('#actmax'),stress=number('#stress'),tefPercent=number('#tef'),female=document.querySelector('#sex')?.value==='Kadın';
  const anthro=runAnthro();
  if(!Number.isFinite(ageYears)||ageYears<19)return toast('Bu protokol 19 yaş ve üzeri için tanımlı. Daha küçük yaşlarda bu enerji hesabı kullanılamaz.');
  if(![height,current].every(Number.isFinite)||height<=0||current<=0||!anthro)return toast('Boy ve kilo için geçerli değer girin.');
  if(![activityMin,activityMax,stress,tefPercent].every(Number.isFinite)||activityMin<=0||activityMax<activityMin||stress<=0||tefPercent<0||tefPercent>30)return toast('Aktivite alt/üst sınırlarını ve çarpanları kontrol edin.');
  const basisControl=document.querySelector('#basis');if(!window._weightBasisTouched&&basisControl)basisControl.value=anthro.recommended;
  const basis=basisControl?.value||anthro.recommended,weight=basis==='ideal'?anthro.ideal:basis==='adjusted'?anthro.adjusted:current,gender=female?-161:5;
  const equations=[['Mifflin–St Jeor',10*weight+6.25*height-5*ageYears+gender],['Harris–Benedict (revize)',female?447.593+9.247*weight+3.098*height-4.330*ageYears:88.362+13.397*weight+4.799*height-5.677*ageYears],['Schofield (1985)',schofieldEnergy(ageYears,female,weight)],['Cunningham',Number.isFinite(ffm)&&ffm>0&&ffm<=current?500+22*ffm:null]],multiplier=stress*(1+tefPercent/100);
  const options=equations.map(([name,base])=>{const display=name==='Schofield (1985)'?`${name} · ${ageYears<30?'18–30':ageYears<60?'30–60':'60+'}`:name;return {name,display,base,min:base?Math.round(base*activityMin*multiplier):null,max:base?Math.round(base*activityMax*multiplier):null};});
  const result=`<div class="cardtitle"><h2>Formül sonuçları</h2><span class="pill">${basis==='current'?'Mevcut':basis==='ideal'?'İdeal':'Düzeltilmiş'} kilo: ${weight.toFixed(1)} kg</span></div><div class="tablewrap"><table class="table"><tr><th>Denklem · bazal</th><th>Enerji aralığı</th></tr>${options.map(x=>`<tr><td>${x.display}<br><small class="muted">${x.base?Math.round(x.base)+' kcal/gün bazal':x.name==='Schofield (1985)'?'Yaş aralığı dışında':x.name==='Cunningham'?'Yağsız kütleyi mevcut kilodan küçük veya eşit girin':'Hesaplanamadı'}</small></td><td>${x.base?`${x.min} – ${x.max} kcal/gün`:'—'}</td></tr>`).join('')}</table></div><p class="sub" style="margin-top:14px">Enerji = bazal × aktivite alt/üst sınırı × stres çarpanı × (1 + termik etki). Protokol ağırlığı VKİ ${anthro.bmi.toFixed(1)} için ${anthro.recommended==='current'?'mevcut':anthro.recommended==='ideal'?'ideal':'düzeltilmiş'} kilodur; seçilen ağırlık: ${weight.toFixed(1)} kg.</p><div class="field" style="max-width:340px;margin-top:12px"><label>Kullanılacak denklem</label><select id="chosenEq">${options.filter(x=>x.base&&Number.isFinite(x.base)).map(x=>`<option value="${x.name}">${x.display}</option>`).join('')}</select></div><button class="btn" style="margin-top:12px" onclick="applyCalc()">Seçili denklemi kullan ve diyet yaz</button>`;
  calcResult=result;const target=document.querySelector('#calcresult');if(target)target.innerHTML=result;
};
window.applyCalc=function applyCalc(){
  const value=selector=>Number(document.querySelector(selector)?.value),ageYears=value('#age'),height=value('#height'),current=value('#weight'),ffm=value('#ffm'),activityMin=value('#actmin'),activityMax=value('#actmax'),stress=value('#stress'),tefPercent=value('#tef'),female=document.querySelector('#sex')?.value==='Kadın',basis=document.querySelector('#basis')?.value||'current',eqName=document.querySelector('#chosenEq')?.value;
  if(!Number.isFinite(ageYears)||ageYears<19)return toast('Bu protokol 19 yaş ve üzeri için tanımlı.');
  if(![height,current].every(Number.isFinite)||height<=0||current<=0||!eqName)return toast('Hesaplama için geçerli boy, kilo ve denklem seçin.');
  if(![activityMin,activityMax,stress,tefPercent].every(Number.isFinite)||activityMin<=0||activityMax<activityMin||stress<=0||tefPercent<0||tefPercent>30)return toast('Aktivite alt/üst sınırlarını ve çarpanları kontrol edin.');
  const bmi=current/(height/100)**2,idealBmi=protocolIdealBmi(ageYears),ideal=idealBmi*(height/100)**2,adjusted=ideal+.25*(current-ideal),weight=basis==='ideal'?ideal:basis==='adjusted'?adjusted:current,gender=female?-161:5;
  const equations={'Mifflin–St Jeor':10*weight+6.25*height-5*ageYears+gender,'Harris–Benedict (revize)':female?447.593+9.247*weight+3.098*height-4.330*ageYears:88.362+13.397*weight+4.799*height-5.677*ageYears,'Schofield (1985)':schofieldEnergy(ageYears,female,weight),'Cunningham':Number.isFinite(ffm)&&ffm>0&&ffm<=current?500+22*ffm:null},base=equations[eqName];
  if(!Number.isFinite(base)||base<=0)return toast(eqName==='Cunningham'?'Cunningham için yağsız kütleyi mevcut kilodan küçük veya eşit girin.':'Seçilen denklem için hesaplama yapılamadı.');
  const min=Math.round(base*activityMin*stress*(1+tefPercent/100)),max=Math.round(base*activityMax*stress*(1+tefPercent/100));if(!Number.isFinite(min)||!Number.isFinite(max))return toast('Enerji sonucu hesaplanamadı.');
  const patientId=document.querySelector('#cp')?.value||'';newDiet(patientId,{min,max,eq:eqName,basis,weight:+weight.toFixed(1),bmi:+bmi.toFixed(1),idealBmi});
};

// Final food-library overrides: keep these after the earlier compatibility wrappers.
const foodFormFinalBeforeEnergy=window.foodForm;
window.foodForm=function foodForm(foodId){foodFormFinalBeforeEnergy(foodId);const grid=document.querySelector('#modal form .fieldgrid');if(!grid||grid.querySelector('[name="kcal"]'))return;const food=db.foods.find(x=>x.id===foodId)||{},box=document.createElement('div');box.className='field';box.innerHTML=`<label>Enerji (kcal / yukarıdaki porsiyon) · isteğe bağlı</label><input name="kcal" type="number" min="0" step="any" value="${food.kcal!==undefined&&food.kcal!==null&&food.kcal!==''?esc(food.kcal):''}" placeholder="Boşsa makrolardan hesaplanır">`;const fat=grid.querySelector('[name="fat"]')?.closest('.field');if(fat)fat.after(box);else grid.append(box);};
const saveFoodFinalBeforeEnergy=window.saveFood;
window.saveFood=function saveFood(e,foodId){const entered=e.target.elements.kcal?.value?.trim(),barcode=e.target.elements.barcode?.value?.trim()||'',beforeIds=new Set(db.foods.map(x=>x.id));if(entered!==undefined&&entered!==''&&(!Number.isFinite(Number(entered))||Number(entered)<0))return toast('Enerji değeri sıfır veya daha büyük olmalı.');saveFoodFinalBeforeEnergy(e,foodId);const newFood=db.foods.find(x=>x.barcode&&x.barcode===barcode)||db.foods.find(x=>!beforeIds.has(x.id)),food=(foodId&&db.foods.find(x=>x.id===foodId))||newFood;if(food){food.kcal=entered===undefined||entered===''?null:Number(entered);save();}};
window.foodRows=function foodRows(items){return `<div class="tablewrap"><table class="table"><tr><th>Besin</th><th>Değerlerin porsiyonu</th><th>Karbonhidrat</th><th>Protein</th><th>Yağ</th><th>Enerji</th><th>Mikro besinler</th><th></th></tr>${items.map(f=>`<tr><td><b>${esc(f.name)}</b>${f.source?`<br><small class="muted">Kaynak: ${esc(typeof f.source==='string'?f.source:f.source.name||'Belirtilmedi')}${f.verified?' · doğrulanmış':' · kontrol bekliyor'}</small>`:''}</td><td>${f.serving} ${f.basisUnit||'g'}</td><td>${f.cho} g</td><td>${f.protein} g</td><td>${f.fat} g</td><td>${Math.round(foodLabelEnergy(f))} kcal<br><small class="muted">${f.kcal!==undefined&&f.kcal!==null&&f.kcal!==''?'etiket':'KH/protein/yağ hesabı'}</small></td><td>${esc(microText(f.micros)||'—')}</td><td><button class="btn light small" onclick="foodForm('${f.id}')">Düzenle</button></td></tr>`).join('')}</table></div>`;};
window.updateExchange=function updateExchange(){const macros=menuMacroTotals(),energy=dietEnergyIncludingFoods(),el=document.querySelector('#extot');if(!el)return;const micros=microText(menuMicroTotals());el.innerHTML=`<div class="stat"><small>Enerji · değişim + besin</small><b>${Math.round(energy)} kcal</b></div><div class="stat"><small>Karbonhidrat</small><b>${macros[0].toFixed(1)} g · ${Math.round(macros[0]*4/energy*100||0)}%</b></div><div class="stat"><small>Protein</small><b>${macros[1].toFixed(1)} g · ${Math.round(macros[1]*4/energy*100||0)}%</b></div><div class="stat"><small>Yağ</small><b>${macros[2].toFixed(1)} g · ${Math.round(macros[2]*9/energy*100||0)}%</b></div>${micros?`<div class="micro-summary" style="width:100%"><b>Seçilen besinlerden mikro toplamı:</b> ${esc(micros)}</div>`:''}`;};
window.renderMeals=function renderMeals(){const el=document.querySelector('#meals');if(!el)return;const count=menuMeals||4;el.innerHTML=Array.from({length:count},(_,i)=>{const rows=menuItems.filter(x=>x.meal===i),macros=[0,0,0],micros={};let energy=0;rows.forEach(item=>{const food=db.foods.find(x=>x.id===item.food),quantity=food&&itemBasisAmount(item,food);if(food&&quantity!==null&&quantity!==undefined){[food.cho,food.protein,food.fat].forEach((v,j)=>macros[j]+=v*quantity/food.serving);energy+=foodLabelEnergy(food)*quantity/(Number(food.serving)||1);MICRO_DEFS.forEach(([key])=>{const v=+(food.micros?.[key]||0);if(v)micros[key]=(micros[key]||0)+v*quantity/food.serving;});}});const microSummary=microText(micros);return `<div class="meal"><h3>${esc(window.mealNames?.[i]||`Öğün ${i+1}`)}</h3><div class="mealstats">${Math.round(energy)} kcal · KH ${macros[0].toFixed(1)} g (${Math.round(macros[0]*4/energy*100||0)}%) · Protein ${macros[1].toFixed(1)} g (${Math.round(macros[1]*4/energy*100||0)}%) · Yağ ${macros[2].toFixed(1)} g (${Math.round(macros[2]*9/energy*100||0)}%)</div>${microSummary?`<details class="micro-summary"><summary>Mikro besin toplamı</summary>${esc(microSummary)}</details>`:''}${rows.map(item=>{const food=db.foods.find(x=>x.id===item.food);return `<div class="foodrow"><span>${esc(itemQuantityText(item,food))}</span><button class="btn light small" type="button" onclick="menuItems.splice(${menuItems.indexOf(item)},1);renderMeals();updateExchange()">Kaldır</button></div>`;}).join('')}<div class="foodrow"><select id="food-${i}" class="search" onchange="setMenuUnitLabel(${i})">${db.foods.map(food=>`<option value="${food.id}">${esc(food.name)}</option>`).join('')}</select><select id="unit-${i}" class="search" onchange="setMenuUnitLabel(${i})"><option value="g">g</option><option value="mg">mg</option><option value="ml">ml</option><option value="adet">adet</option></select><select id="size-${i}" class="search hide"><option value="small">Küçük boy</option><option value="medium" selected>Orta boy</option><option value="large">Büyük boy</option></select><label id="unit-label-${i}" class="muted">g</label><input id="amount-${i}" class="search" type="number" min=".1" step="any" value="100" aria-label="Miktar"></div><button class="btn light small" type="button" onclick="addMenuFood(${i})">＋ Besin ekle</button></div>`;}).join('');};
const saveDietFinalBeforeEnergy=window.saveDiet;
window.saveDiet=function saveDiet(e,patientId,templateId){const values=Object.fromEntries(new FormData(e.target)),editingId=values.editDietId,knownIds=new Set(db.diets.map(x=>x.id)),energy=Math.round(dietEnergyIncludingFoods());saveDietFinalBeforeEnergy(e,patientId,templateId);const saved=editingId?db.diets.find(x=>x.id===editingId):db.diets.find(x=>!knownIds.has(x.id));if(saved){saved.kcal=energy;save();}else if(!values.patient&&!patientId){const template=templateId?db.templates.find(x=>x.id===templateId):db.templates.at(-1);if(template){template.kcal=energy;save();}}};
window.lookupBarcode=async function lookupBarcode(){const raw=String(document.querySelector('#modal [name="barcode"]')?.value||'').trim(),candidates=gtinCandidates(raw),button=document.querySelector('#barcode-lookup'),note=document.querySelector('#barcode-result');if(!candidates.length){if(note)note.textContent='EAN/UPC barkodunu kontrol edin. Kontrol basamağı geçersiz.';return toast('Barkod geçersiz; numaranın son kontrol basamağını kontrol edin.');}if(button){button.disabled=true;button.textContent='Ürün aranıyor…';}if(note)note.textContent='Barkod kaydı tam olarak karşılaştırılıyor…';window._barcodeSource=null;let requestFailed=false;try{let productFound=null,lookedUp='';for(const code of candidates){try{const response=await fetch(`https://world.openfoodfacts.org/api/v3.6/product/${encodeURIComponent(code)}.json?fields=code,product_name,product_name_tr,brands,quantity,nutriments,serving_size,categories,allergens`,{headers:{Accept:'application/json','Accept-Language':'tr,en'}});if(!response.ok){requestFailed=true;continue;}const payload=await response.json(),product=payload.product;if(product&&payload.status!==0&&canonicalGtin(product.code)===canonicalGtin(code)){productFound=product;lookedUp=code;break;}}catch{requestFailed=true;}}if(!productFound){if(requestFailed)throw new Error('Katalog isteği başarısız');if(note)note.textContent='Bu barkodla tam kod eşleşmesi bulunamadı. Yanlış ürün bilgisi doldurulmadı; etiketi kullanarak elle ekleyebilirsiniz.';return toast('Bu barkoda tam eşleşen ürün bulunamadı.');}const product=productFound,title=product.product_name_tr||product.product_name||'';if(!title){if(note)note.textContent='Kod bulundu ama katalogda ürün adı eksik. Ürün adını etiketten girin.';return toast('Ürün adı katalogda eksik.');}const n=product.nutriments||{},map=[['fiber','fiber'],['sodium','sodium'],['calcium','calcium'],['iron','iron'],['potassium','potassium'],['magnesium','magnesium'],['zinc','zinc'],['phosphorus','phosphorus'],['vitaminA','vitamin-a'],['vitaminC','vitamin-c'],['vitaminD','vitamin-d'],['vitaminE','vitamin-e'],['vitaminK','vitamin-k'],['thiamin','vitamin-b1'],['riboflavin','vitamin-b2'],['niacin','vitamin-pp'],['vitaminB6','vitamin-b6'],['folate','folates'],['vitaminB12','vitamin-b12'],['omega3','omega-3-fat']],micros={};map.forEach(([key,off])=>{let value=barcodeNutrient(product,off);if(value>0){const unit=n[`${off}_unit`]||'';if(key==='sodium'&&unit==='g')value*=1000;if((key==='fiber'||key==='omega3')&&unit==='mg')value/=1000;if(['vitaminA','vitaminD','vitaminK','folate','vitaminB12'].includes(key)&&unit==='mg')value*=1000;micros[key]=value;}});let calories=n['energy-kcal_100g']!==undefined&&n['energy-kcal_100g']!==''?Number(n['energy-kcal_100g']):NaN;if(!Number.isFinite(calories)||calories<0){const kj=Number(n['energy_100g']);calories=Number.isFinite(kj)&&kj>=0?kj/4.184:null;}fillFoodField('name',`${title}${product.brands?` · ${product.brands.split(',')[0].trim()}`:''}`);fillFoodField('barcode',product.code||lookedUp);fillFoodField('basisUnit','g');fillFoodField('serving',100);fillFoodField('density',1);fillFoodField('cho',barcodeNutrient(product,'carbohydrates'));fillFoodField('protein',barcodeNutrient(product,'proteins'));fillFoodField('fat',barcodeNutrient(product,'fat'));const kcalInput=document.querySelector('#modal [name="kcal"]');if(kcalInput)kcalInput.value=calories===null?'':String(calories);MICRO_DEFS.forEach(([key])=>fillFoodField(key,micros[key]??''));const microList=microText(micros);if(note)note.innerHTML=`<b>${esc(title)}</b>${product.brands?` · ${esc(product.brands)}`:''}<br><span class="sub">Tam barkod eşleşmesi · değerler 100 g içindir.${calories===null?' Enerji katalogda yok.':''}${micros.calcium===undefined?' Kalsiyum katalogda yok; etikette yoksa güvenilir veri kaynağı gerekir.':''}${microList?` Bulunan mikro veriler: ${esc(microList)}.`:''} Paketteki değerlerle karşılaştırın.</span>`;window._barcodeSource={name:'Open Food Facts',url:`https://world.openfoodfacts.org/product/${encodeURIComponent(product.code||lookedUp)}`,retrievedAt:new Date().toISOString(),reviewed:false};toast('Tam barkod eşleşmesi bulundu. Ürün etiketini kontrol edip kaydedin.');}catch(error){if(note)note.textContent='Barkod kataloğuna erişilemedi. İnternet bağlantısını kontrol edin veya etiketteki verileri elle girin.';toast('Barkod kataloğuna ulaşılamadı.');console.error('Barcode lookup failed:',error);}finally{if(button){button.disabled=false;button.textContent='Barkodla bul';}}};
window.stopBarcodeScan=function stopBarcodeScan(){if(barcodeFrame)cancelAnimationFrame(barcodeFrame);barcodeFrame=0;window._barcodeReaderControls?.stop?.();window._barcodeReaderControls=null;barcodeStream?.getTracks().forEach(track=>track.stop());barcodeStream=null;};
window.startBarcodeScan=async function startBarcodeScan(){if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)return toast('Bu Edge oturumunda kamera erişimi kapalı. NutriPeer kısayoluyla yeniden açıp kamera iznini verin veya barkod numarasını elle girin.');try{barcodeStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});modal(`<h2>Barkodu kamerayla okut</h2><video id="barcode-video" autoplay muted playsinline style="width:100%;max-height:55vh;background:#101814;border-radius:12px"></video><p class="sub">Barkodu net, ışık yansımayacak ve tek başına görünecek şekilde kameraya tutun.</p><div class="formactions"><button class="btn light" onclick="stopBarcodeScan();foodForm()">Kapat</button></div>`);const video=document.querySelector('#barcode-video');video.srcObject=barcodeStream;await video.play();const handle=async raw=>{if(!gtinCandidates(raw).length)return false;stopBarcodeScan();foodForm();fillFoodField('barcode',raw);await lookupBarcode();return true;};let formats=[];if('BarcodeDetector'in window&&BarcodeDetector.getSupportedFormats){try{formats=(await BarcodeDetector.getSupportedFormats()).filter(x=>['ean_13','ean_8','upc_a','upc_e'].includes(x));}catch{}}if(formats.length){const detector=new BarcodeDetector({formats});const scan=async()=>{if(!barcodeStream)return;try{const codes=await detector.detect(video),value=codes.map(x=>x.rawValue).find(x=>gtinCandidates(x).length);if(value){await handle(value);return;}}catch{}barcodeFrame=requestAnimationFrame(scan);};barcodeFrame=requestAnimationFrame(scan);return;}if(!window.ZXing?.BrowserMultiFormatReader){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js';script.onload=resolve;script.onerror=()=>reject(new Error('Barkod okuyucu yüklenemedi'));document.head.append(script);});}const reader=new ZXing.BrowserMultiFormatReader();window._barcodeReaderControls={stop:()=>reader.reset()};await reader.decodeFromVideoElementContinuously(video,(result)=>{const value=result?.getText?.();if(value&&gtinCandidates(value).length)handle(value);});}catch(error){stopBarcodeScan();toast(error?.name==='NotAllowedError'?'Kamera izni verilmedi. Edge ayarlarından NutriPeer için kameraya izin verip yeniden deneyin.':'Kamera açılamadı. Başka bir uygulama kamerayı kullanıyorsa kapatıp tekrar deneyin.');console.error('Barcode scanner failed:',error);}};

// Optional nutrition-label details (separate from micronutrients).
const LABEL_NUTRIENT_DEFS=[
  ['sugars','Şeker','g'],['saturatedFat','Doymuş yağ','g'],
  ['monounsaturatedFat','Tekli doymamış yağ','g'],['polyunsaturatedFat','Çoklu doymamış yağ','g'],
  ['transFat','Trans yağ','g']
];
function labelNutrientText(values){return LABEL_NUTRIENT_DEFS.filter(([key])=>Number.isFinite(Number(values?.[key]))&&values[key]!==''&&values[key]!==null).map(([key,label,unit])=>`${label} ${Number(values[key]).toLocaleString('tr-TR',{maximumFractionDigits:2})} ${unit}`).join(' · ');}
function menuLabelNutrientTotals(items=menuItems){const totals={};items.forEach(item=>{const food=db.foods.find(x=>x.id===item.food),quantity=food&&itemBasisAmount(item,food);if(!food||quantity===null||quantity===undefined)return;LABEL_NUTRIENT_DEFS.forEach(([key])=>{const value=Number(food.labelNutrients?.[key]);if(Number.isFinite(value)&&value>=0&&food.labelNutrients?.[key]!=='' )totals[key]=(totals[key]||0)+value*quantity/(Number(food.serving)||1);});});return totals;}
const foodFormBeforeLabelNutrients=window.foodForm;
window.foodForm=function foodForm(foodId){foodFormBeforeLabelNutrients(foodId);const form=document.querySelector('#modal form'),grid=form?.querySelector('.fieldgrid');if(!form||form.querySelector('[name="sugars"]'))return;const food=db.foods.find(x=>x.id===foodId)||{},values=food.labelNutrients||{},details=document.createElement('details');details.className='label-nutrient-details';details.innerHTML=`<summary>Şeker ve yağ ayrıntıları · isteğe bağlı</summary><p class="sub">Etikette yazan değerleri yukarıdaki porsiyon miktarı için gram olarak girin. Bilinmeyen alanları boş bırakın.</p><div class="fieldgrid">${formFields(LABEL_NUTRIENT_DEFS.map(([key,label,unit])=>[key,`${label} (${unit})`,'number']),values)}</div>`;grid?.after(details);};
const saveFoodBeforeLabelNutrients=window.saveFood;
window.saveFood=function saveFood(e,foodId){const fields=Object.fromEntries(LABEL_NUTRIENT_DEFS.map(([key])=>[key,e.target.elements[key]?.value?.trim()??'']));for(const [key,value] of Object.entries(fields))if(value!==''&&(!Number.isFinite(Number(value))||Number(value)<0))return toast('Şeker ve yağ değerleri sıfır veya daha büyük olmalı.');const barcode=e.target.elements.barcode?.value?.trim()||'',beforeIds=new Set(db.foods.map(x=>x.id));saveFoodBeforeLabelNutrients(e,foodId);const food=(foodId&&db.foods.find(x=>x.id===foodId))||db.foods.find(x=>barcode&&x.barcode===barcode)||db.foods.find(x=>!beforeIds.has(x.id));if(food){food.labelNutrients={};for(const [key,value] of Object.entries(fields)){delete food[key];if(value!=='')food.labelNutrients[key]=Number(value);}save();render();}};
const foodRowsBeforeLabelNutrients=window.foodRows;
window.foodRows=function foodRows(items){const holder=document.createElement('div');holder.innerHTML=foodRowsBeforeLabelNutrients(items);holder.querySelectorAll('tr').forEach((row,index)=>{if(!index)return;const food=items[index-1],cell=row.cells[6],summary=labelNutrientText(food?.labelNutrients);if(cell&&summary)cell.textContent=[cell.textContent,summary].filter(x=>x&&x!=='—').join(' · ');});return holder.innerHTML;};
const renderMealsBeforeLabelNutrients=window.renderMeals;
window.renderMeals=function renderMeals(){renderMealsBeforeLabelNutrients();document.querySelectorAll('#meals .meal').forEach((meal,index)=>{const rows=menuItems.filter(x=>x.meal===index),summary=labelNutrientText(menuLabelNutrientTotals(rows));if(summary){const details=document.createElement('details');details.className='micro-summary';details.innerHTML=`<summary>Şeker ve yağ toplamı</summary>${esc(summary)}`;meal.querySelector('.mealstats')?.after(details);}});};
const updateExchangeBeforeLabelNutrients=window.updateExchange;
window.updateExchange=function updateExchange(){updateExchangeBeforeLabelNutrients();const totals=labelNutrientText(menuLabelNutrientTotals()),target=document.querySelector('#extot');if(target&&totals){const details=document.createElement('div');details.className='micro-summary';details.style.width='100%';details.innerHTML=`<b>Şeker ve yağ toplamı:</b> ${esc(totals)}`;target.append(details);}};
const lookupBarcodeBeforeLabelNutrients=window.lookupBarcode;
window.lookupBarcode=async function lookupBarcode(){const raw=String(document.querySelector('#modal [name="barcode"]')?.value||'').trim();await lookupBarcodeBeforeLabelNutrients();const code=gtinCandidates(raw)[0];if(!code)return;try{const response=await fetch(`https://world.openfoodfacts.org/api/v3.6/product/${encodeURIComponent(code)}.json?fields=code,nutriments`,{headers:{Accept:'application/json','Accept-Language':'tr,en'}});if(!response.ok)return;const payload=await response.json(),product=payload.product;if(!product||canonicalGtin(product.code)!==canonicalGtin(code))return;const nutrients=product.nutriments||{},maps=[['sugars','sugars'],['saturatedFat','saturated-fat'],['monounsaturatedFat','monounsaturated-fat'],['polyunsaturatedFat','polyunsaturated-fat'],['transFat','trans-fat']];for(const [key,off] of maps){const rawValue=nutrients[`${off}_100g`];if(rawValue===undefined||rawValue===null||rawValue===''){fillFoodField(key,'');continue;}let value=Number(rawValue);if(!Number.isFinite(value)||value<0){fillFoodField(key,'');continue;}if(nutrients[`${off}_unit`]==='mg')value/=1000;fillFoodField(key,value);}}catch(error){console.warn('Optional label nutrient lookup unavailable:',error);}};

// Exchange list and recipe builder.
db.exchanges ||= [];
db.recipes ||= [];
window.menuEntryMode ||= {};
function exchangeDisplay(item){const x=db.exchanges.find(row=>row.id===item.exchangeId);if(!x)return 'Silinmiş değişim';const qty=Number(item.count)||1,measure=x.averageMeasure||`${x.quantityG} g`;return `${qty>1?`${qty} × `:''}${measure} ${x.name.toLocaleLowerCase('tr-TR')} · brüt ${x.grossG??x.quantityG} g / net ${x.netG??x.quantityG} g · ${x.preparation||'çiğ'}`;}
function recipeDisplay(item){const x=db.recipes.find(row=>row.id===item.recipeId);if(!x)return 'Silinmiş yemek';return `${Number(item.amount)||x.portionG} g ${x.name}`;}
const quantityTextBeforeExchange=window.itemQuantityText;
window.itemQuantityText=function(item,food,clientFriendly=false){if(item?.type==='exchange')return exchangeDisplay(item);if(item?.type==='recipe')return recipeDisplay(item);return quantityTextBeforeExchange(item,food,clientFriendly);};
function exchangeMacros(item){const x=db.exchanges.find(row=>row.id===item.exchangeId);return x?[Number(x.cho)||0,Number(x.protein)||0,Number(x.fat)||0].map(v=>v*(Number(item.count)||1)):[0,0,0];}
function recipeMacros(item){const x=db.recipes.find(row=>row.id===item.recipeId);return x?[Number(x.cho)||0,Number(x.protein)||0,Number(x.fat)||0].map(v=>v*(Number(item.amount)||Number(x.portionG)||1)/(Number(x.portionG)||1)):[0,0,0];}
function itemMacros(item){if(item.type==='exchange')return exchangeMacros(item);if(item.type==='recipe')return recipeMacros(item);const food=db.foods.find(x=>x.id===item.food),q=food&&itemBasisAmount(item,food);return food&&q!==null&&q!==undefined?[food.cho,food.protein,food.fat].map(v=>Number(v||0)*q/(Number(food.serving)||1)):[0,0,0];}
window.menuMacroTotals=function menuMacroTotals(){const macros=exchangeTotals().m.slice();menuItems.forEach(item=>itemMacros(item).forEach((v,i)=>macros[i]+=v));return macros;};
function nutrientRow(food){return `${food.name} · ${food.serving}${food.basisUnit||'g'} · KH ${food.cho} g · P ${food.protein} g · yağ ${food.fat} g`;}
window.exchangeForm=function exchangeForm(exchangeId){const x=db.exchanges.find(row=>row.id===exchangeId)||{quantityG:30,cho:0,protein:0,fat:0};modal(`<h2>${exchangeId?'Değişimi düzenle':'Değişim ekle'}</h2><form onsubmit="saveExchange(event,'${exchangeId||''}')"><div class="fieldgrid">${formFields([['name','Yiyecek adı','text',1],['averageMeasure','Ortalama ölçü (örn. 3 parmak boyutunda)','text',1],['quantityG','Miktar (g)','number',1],['grossG','Brüt miktar (g)','number'],['netG','Net miktar (g)','number'],['weightBasis','Diyette esas alınan','select',1,['net','brüt']],['preparation','Hazırlama durumu','select',1,['çiğ','pişmiş']],['cho','Karbonhidrat (g / tanımlı miktar)','number'],['protein','Protein (g / tanımlı miktar)','number'],['fat','Yağ (g / tanımlı miktar)','number']],x)}</div><p class="sub">Brüt/net ve çiğ/pişmiş bilgileri ayrı ayrı kaydedilir. Makrolar tanımladığın miktar için girilir.</p><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">İptal</button><button class="btn">Kaydet</button></div></form>`);};
window.saveExchange=function saveExchange(e,exchangeId){e.preventDefault();const v=Object.fromEntries(new FormData(e.target));for(const key of ['quantityG','grossG','netG','cho','protein','fat'])v[key]=v[key]===''?0:Number(v[key]);if(!v.name?.trim()||!(v.quantityG>0)||['cho','protein','fat','grossG','netG'].some(k=>!Number.isFinite(v[k])||v[k]<0))return toast('Ad, miktar ve makro değerlerini kontrol et.');const old=db.exchanges.find(x=>x.id===exchangeId);old?Object.assign(old,v):db.exchanges.push({...v,id:id()});save();closeModal();render();toast('Değişim listesi güncellendi.');};
window.deleteExchange=function deleteExchange(exchangeId){if(!confirm('Bu değişimi silmek istiyor musun?'))return;db.exchanges=db.exchanges.filter(x=>x.id!==exchangeId);save();render();};
window.addMenuExchange=function addMenuExchange(meal){const select=document.querySelector(`#exchange-${meal}`),count=Number(document.querySelector(`#exchange-count-${meal}`)?.value||1);if(!select?.value||!(count>0))return toast('Değişim seçip miktarını gir.');menuItems.push({type:'exchange',meal,exchangeId:select.value,count});renderMeals();updateExchange();};
function recipeForm(){const ingredientRows=Array.from({length:8},(_,i)=>`<div class="foodrow recipe-ingredient"><select class="search recipe-food">${db.foods.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select><input class="search recipe-grams" type="number" min="0" step="any" placeholder="Gram" aria-label="Besin miktarı gram"></div>`).join(''),exchangeKeys=['Süt','Et','Ekmek','Sebze','Meyve','Yağ','Kuruyemiş'];modal(`<h2>Yemek oluştur</h2><form onsubmit="saveRecipe(event)"><div class="fieldgrid"><div class="field"><label>Yemek adı</label><input name="name" required placeholder="Örn. Yoğurtlu yulaf kasesi"></div><div class="field"><label>Porsiyon ağırlığı (g)</label><input name="portionG" type="number" min="1" value="300" required></div></div><h3>İçindekiler · besin kütüphanesinden</h3>${ingredientRows}<h3>1 porsiyon için değişim karşılığı</h3><div class="exchange">${exchangeKeys.map((k,i)=>`<div class="field"><label>${k}</label><input name="ex-${i}" type="number" min="0" step=".5" value="0"></div>`).join('')}</div><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">İptal</button><button class="btn">Yemeği kaydet</button></div></form>`);}
window.saveRecipe=function saveRecipe(e){e.preventDefault();const form=e.target,name=form.elements.name.value.trim(),portionG=Number(form.elements.portionG.value),ingredients=[...form.querySelectorAll('.recipe-ingredient')].map(row=>({food:row.querySelector('.recipe-food').value,grams:Number(row.querySelector('.recipe-grams').value)||0})).filter(x=>x.grams>0);if(!name||!(portionG>0)||!ingredients.length)return toast('Yemek adı, porsiyon ağırlığı ve en az bir içerik gerekli.');const macros=[0,0,0];ingredients.forEach(item=>{const f=db.foods.find(x=>x.id===item.food);if(f)[f.cho,f.protein,f.fat].forEach((v,j)=>macros[j]+=Number(v||0)*item.grams/(Number(f.serving)||1));});const totalWeight=ingredients.reduce((sum,x)=>sum+x.grams,0),scale=portionG/totalWeight,scaled=macros.map(x=>x*scale),keys=['Süt','Et','Ekmek','Sebze','Meyve','Yağ','Kuruyemiş'],ex=Object.fromEntries(keys.map((k,i)=>[k,Number(form.elements[`ex-${i}`].value)||0]).filter(([,v])=>v>0)),recipe={id:id(),name,portionG,ingredients,ex,cho:scaled[0],protein:scaled[1],fat:scaled[2],kcal:scaled[0]*4+scaled[1]*4+scaled[2]*9};db.recipes.push(recipe);save();closeModal();render();toast('Yemek kaydedildi; makro ve enerji toplamları hesaplandı.');};
window.deleteRecipe=function deleteRecipe(recipeId){if(!confirm('Bu yemeği silmek istiyor musun?'))return;db.recipes=db.recipes.filter(x=>x.id!==recipeId);save();render();};
function recipesPage(){const view=document.querySelector('#view');view.innerHTML=`<div class="heading"><div><h1>Yemeklerim</h1><div class="sub">Besin kütüphanendeki gıdaları birleştir; porsiyonun değişim ve besin değerlerini gör.</div></div><button class="btn" onclick="recipeForm()">＋ Yemek oluştur</button></div><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${db.recipes.length?db.recipes.map(r=>`<article class="card"><div class="cardtitle"><h2>${esc(r.name)}</h2><button class="btn light small" onclick="deleteRecipe('${r.id}')">Sil</button></div><div class="statrow"><div class="stat"><small>Enerji / ${r.portionG} g</small><b>${Math.round(r.kcal)} kcal</b></div><div class="stat"><small>KH · protein · yağ</small><b>${r.cho.toFixed(1)} / ${r.protein.toFixed(1)} / ${r.fat.toFixed(1)} g</b></div><div class="stat"><small>Değişim karşılığı</small><b>${recipeExchangeText(r)}</b></div></div><p class="sub">${r.ingredients.map(i=>{const f=db.foods.find(x=>x.id===i.food);return f?`${esc(f.name)} ${i.grams} g`:''}).filter(Boolean).join(' · ')}</p></article>`).join(''):'<div class="card empty">Henüz yemek oluşturmadın.</div>'}</div>`;}
function recipeExchangeText(recipe){return Object.entries(recipe.ex||{}).map(([k,v])=>`${k} ${v}`).join(' · ')||'Değişim girilmedi';}
window.recipes=recipesPage;views.recipes=recipesPage;const oldPageName=window.pageName;window.pageName=function(){return page==='recipes'?'Yemeklerim':page==='exchanges'?'Değişimlerim':oldPageName();};
const foodsWithExchangeAndRecipes=window.foods;
window.foods=function foods(){foodsWithExchangeAndRecipes();};views.foods=window.foods;
window.exchangeForm=function exchangeForm(exchangeId){const x=db.exchanges.find(row=>row.id===exchangeId)||{grossG:'',netG:'',quantityG:'',cho:'',protein:'',fat:'',weightBasis:'net',preparation:'çiğ'};modal(`<h2>${exchangeId?'Değişimi düzenle':'Değişim ekle'}</h2><form onsubmit="saveExchange(event,'${exchangeId||''}')"><div class="fieldgrid"><div class="field"><label>Yiyecek adı</label><input name="name" required value="${esc(x.name||'')}" placeholder="Örn. Ahududu"></div><div class="field"><label>Ortalama ölçü</label><input name="averageMeasure" required value="${esc(x.averageMeasure||'')}" placeholder="Örn. 35 g · orta boy"></div><div class="field full"><label>Miktar (g) · brüt / net</label><div class="toolbar"><input class="search" name="grossG" type="number" min="0" step="any" required placeholder="Brüt" value="${x.grossG??''}"><span>—</span><input class="search" name="netG" type="number" min="0" step="any" required placeholder="Net" value="${x.netG??''}"></div></div></div><details style="margin-top:14px"><summary>İsteğe bağlı · çiğ/pişmiş ve besin değerleri</summary><p class="sub">Pişme durumunu ve bu değişimin makrolarını tanımlarsan öğün toplamlarında da hesaplanır.</p><div class="fieldgrid"><div class="field"><label>Diyette esas alınan ağırlık</label><select name="weightBasis"><option value="net" ${x.weightBasis!=='gross'?'selected':''}>Net</option><option value="gross" ${x.weightBasis==='gross'?'selected':''}>Brüt</option></select></div><div class="field"><label>Durum</label><select name="preparation"><option value="çiğ" ${x.preparation!=='pişmiş'?'selected':''}>Çiğ</option><option value="pişmiş" ${x.preparation==='pişmiş'?'selected':''}>Pişmiş</option></select></div><div class="field"><label>KH (g)</label><input name="cho" type="number" min="0" step="any" value="${x.cho??''}"></div><div class="field"><label>Protein (g)</label><input name="protein" type="number" min="0" step="any" value="${x.protein??''}"></div><div class="field"><label>Yağ (g)</label><input name="fat" type="number" min="0" step="any" value="${x.fat??''}"></div></div></details><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">İptal</button><button class="btn">Ekle</button></div></form>`);};
window.saveExchange=function saveExchange(e,exchangeId){e.preventDefault();const form=e.target,v=Object.fromEntries(new FormData(form));for(const key of ['grossG','netG','cho','protein','fat'])v[key]=v[key]===''?0:Number(v[key]);if(!v.name?.trim()||!v.averageMeasure?.trim()||['grossG','netG','cho','protein','fat'].some(k=>!Number.isFinite(v[k])||v[k]<0)||(!(v.grossG>0)&&!(v.netG>0)))return toast('Yiyecek adı, ortalama ölçü ve brüt/net miktarı kontrol et.');v.quantityG=v.weightBasis==='gross'?(v.grossG||v.netG):(v.netG||v.grossG);const old=db.exchanges.find(x=>x.id===exchangeId);old?Object.assign(old,v):db.exchanges.push({...v,id:id()});save();closeModal();render();toast('Değişimim kaydedildi.');};
function exchangesPage(){const view=document.querySelector('#view');view.innerHTML=`<div class="heading"><div><h1>Değişimlerim</h1><div class="sub">Kendi yiyecek değişim kayıtların. Örnek: Ahududu · 35 g orta boy · brüt 200 g / net 200 g.</div></div><button class="btn" onclick="exchangeForm()">＋ Ekle</button></div><div class="card"><div class="tablewrap"><table class="table"><thead><tr><th>Yiyecek adı</th><th>Ortalama ölçü</th><th>Miktar (brüt – net)</th></tr></thead><tbody>${db.exchanges.length?db.exchanges.map(x=>`<tr><td><b>${esc(x.name)}</b><div class="toolbar" style="margin-top:6px"><button class="btn light small" onclick="exchangeForm('${x.id}')">Düzenle</button><button class="btn light small" onclick="deleteExchange('${x.id}')">Sil</button></div></td><td>${esc(x.averageMeasure||'—')}</td><td>${Number(x.grossG??x.quantityG)||0} g – ${Number(x.netG??x.quantityG)||0} g</td></tr>`).join(''):'<tr><td colspan="3" class="empty">Henüz değişim eklemedin. Ekle düğmesiyle ilk kaydını oluştur.</td></tr>'}</tbody></table></div></div>`;}
window.exchanges=exchangesPage;views.exchanges=exchangesPage;
const baseRenderWithExchange=window.renderMeals;
window.renderMeals=function renderMeals(){baseRenderWithExchange();document.querySelectorAll('#meals .meal').forEach((meal,i)=>{const foodSelect=meal.querySelector(`#food-${i}`),foodRow=foodSelect?.closest('.foodrow'),foodButton=[...meal.querySelectorAll('button')].find(b=>b.textContent.includes('Besin ekle'));if(!foodRow||!foodButton)return;const tools=document.createElement('div');tools.className='toolbar';tools.style.margin='8px 0';tools.innerHTML=`<button class="btn light small" type="button" onclick="setMenuMode(${i},'food')">Besin ekle</button><button class="btn light small" type="button" onclick="setMenuMode(${i},'exchange')">Değişim ekle</button>`;foodRow.before(tools);const exchangeRow=document.createElement('div');exchangeRow.className='foodrow exchange-input-row';exchangeRow.innerHTML=`<select id="exchange-${i}" class="search"><option value="">Değişim seç</option>${db.exchanges.map(x=>`<option value="${x.id}">${esc(x.averageMeasure||`${x.quantityG} g`)} ${esc(x.name)}</option>`).join('')}</select><input id="exchange-count-${i}" class="search" type="number" min=".5" step=".5" value="1" aria-label="Değişim miktarı">`;exchangeRow.style.display='none';foodRow.after(exchangeRow);const addExchange=document.createElement('button');addExchange.className='btn light small';addExchange.type='button';addExchange.textContent='＋ Değişimi ekle';addExchange.style.display='none';addExchange.onclick=()=>addMenuExchange(i);exchangeRow.after(addExchange);foodButton.textContent='＋ Besin ekle';if(menuEntryMode[i]==='exchange'){foodRow.style.display='none';foodButton.style.display='none';exchangeRow.style.display='';addExchange.style.display='';}});};
window.setMenuMode=function setMenuMode(i,mode){menuEntryMode[i]=mode;renderMeals();};
const addMenuFoodBeforeRecipe=window.addMenuFood;
window.addMenuFood=function addMenuFood(i){const select=document.querySelector(`#food-${i}`),value=select?.value||'';if(value.startsWith('recipe:')){const recipe=db.recipes.find(x=>x.id===value.slice(7));if(!recipe)return toast('Yemek bulunamadı.');const amount=Number(document.querySelector(`#amount-${i}`)?.value||document.querySelector(`#grams-${i}`)?.value||recipe.portionG);if(!(amount>0))return toast('Geçerli porsiyon gramı gir.');menuItems.push({type:'recipe',meal:i,recipeId:recipe.id,amount,unit:'g'});renderMeals();updateExchange();return;}addMenuFoodBeforeRecipe(i);};
const priorRenderMealsWithEntries=window.renderMeals;
window.renderMeals=function renderMeals(){priorRenderMealsWithEntries();document.querySelectorAll('#meals .meal').forEach((meal,i)=>{const items=menuItems.filter(x=>x.meal===i),macros=[0,0,0];items.forEach(item=>itemMacros(item).forEach((v,j)=>macros[j]+=v));const energy=macros[0]*4+macros[1]*4+macros[2]*9,stats=meal.querySelector('.mealstats');if(stats)stats.textContent=`${Math.round(energy)} kcal · KH ${macros[0].toFixed(1)} g (${Math.round(macros[0]*4/energy*100||0)}%) · Protein ${macros[1].toFixed(1)} g (${Math.round(macros[1]*4/energy*100||0)}%) · Yağ ${macros[2].toFixed(1)} g (${Math.round(macros[2]*9/energy*100||0)}%)`;});document.querySelectorAll('#meals [id^="food-"]').forEach((select,i)=>{let group=select.querySelector('optgroup[data-recipes]');if(!group){group=document.createElement('optgroup');group.label='Yemeklerim';group.dataset.recipes='1';group.innerHTML=db.recipes.map(r=>`<option value="recipe:${r.id}">${esc(r.name)} · ${Math.round(r.kcal)} kcal/${r.portionG} g</option>`).join('');select.append(group);}});};
const previousDietEnergy=window.dietEnergyIncludingFoods;
window.dietEnergyIncludingFoods=function dietEnergyIncludingFoods(){let energy=exchangeTotals().k;menuItems.forEach(item=>{if(item.type==='exchange'){const m=exchangeMacros(item);energy+=m[0]*4+m[1]*4+m[2]*9;}else if(item.type==='recipe'){const m=recipeMacros(item);energy+=m[0]*4+m[1]*4+m[2]*9;}else{const food=db.foods.find(x=>x.id===item.food),quantity=food&&itemBasisAmount(item,food);if(food&&quantity!==null&&quantity!==undefined)energy+=foodLabelEnergy(food)*quantity/(Number(food.serving)||1);}});return energy;};
const saveDietWithEntryTypes=window.saveDiet;
window.saveDiet=function saveDiet(e,patientId,templateId){const oldDietIds=new Set(db.diets.map(x=>x.id)),oldTemplateIds=new Set(db.templates.map(x=>x.id)),values=Object.fromEntries(new FormData(e.target)),editId=values.editDietId;saveDietWithEntryTypes(e,patientId,templateId);const diet=editId?db.diets.find(x=>x.id===editId):db.diets.find(x=>!oldDietIds.has(x.id)),template=templateId?db.templates.find(x=>x.id===templateId):db.templates.find(x=>!oldTemplateIds.has(x.id));const saved=diet||template;if(saved){saved.macros=menuMacroTotals();saved.kcal=Math.round(dietEnergyIncludingFoods());saved.foods=menuItems.map(x=>({...x}));save();}};
const renderBeforeRecipesNav=window.render;
window.render=function render(){renderBeforeRecipesNav();const nav=document.querySelector('.nav'),foodsButton=[...document.querySelectorAll('.nav button')].find(button=>button.textContent.includes('Besin Kütüphanesi'));if(nav&&foodsButton){let exchangeButton=document.querySelector('#exchanges-nav');if(!exchangeButton){exchangeButton=document.createElement('button');exchangeButton.id='exchanges-nav';exchangeButton.innerHTML='<i>⇄</i>Değişimlerim';exchangeButton.onclick=()=>go('exchanges');foodsButton.after(exchangeButton);}exchangeButton.className=page==='exchanges'?'active':'';if(!document.querySelector('#recipes-nav')){const button=document.createElement('button');button.id='recipes-nav';button.innerHTML='<i>♨</i>Yemeklerim';button.onclick=()=>go('recipes');exchangeButton.after(button);}const recipeButton=document.querySelector('#recipes-nav');if(recipeButton)recipeButton.className=page==='recipes'?'active':'';}if(!window.__TAURI_INTERNALS__&&(location.hostname==='127.0.0.1'||location.hostname==='localhost')&&!matchMedia('(display-mode: standalone)').matches&&!navigator.standalone){const target=document.querySelector('.content')||document.querySelector('.loginform');if(target&&!document.querySelector('#install-nutripeer-hint')){const hint=document.createElement('div');hint.id='install-nutripeer-hint';hint.className='notice';hint.style.margin='0 0 16px';hint.innerHTML='<b>NutriPeer’i bilgisayarına uygulama olarak ekle</b><br>Chrome: menü ⋮ → NutriPeer’i yükle. Safari: Dosya → Dock’a Ekle. Sonrasında tarayıcı sekmesi yerine uygulama penceresinden açılır. <button type="button" class="btn light small" onclick="installNutriPeer()">Yükleme seçenekleri</button>';target.prepend(hint);}}};
let deferredPwaInstall=null;window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPwaInstall=event;});window.installNutriPeer=async function(){if(!deferredPwaInstall)return toast('Chrome menüsünden “NutriPeer’i yükle”yi, Safari’de Dosya > Dock’a Ekle’yi seç.');deferredPwaInstall.prompt();await deferredPwaInstall.userChoice;deferredPwaInstall=null;};


// Community library moderation, notifications and safe removal flow.
async function communityJson(path, options={}) {
  const response = await communityRequest(path, options);
  if (!response.ok) throw new Error(`Sunucu ${response.status}: ${(await response.text()).slice(0,220)}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
async function markCommunityNotificationsRead(rows) {
  if (!rows?.length) return;
  const ids = rows.map(x=>x.id).filter(Boolean);
  if (!ids.length) return;
  try { await communityRequest(`nutripeer_shared_notifications?id=in.(${ids.join(',')})`, {method:'PATCH',body:JSON.stringify({read_at:new Date().toISOString()}),headers:{Prefer:'return=minimal'}}); } catch {}
}
async function loadCommunityNotifications(showToast=false) {
  const session=await ensureCommunitySession(); if(!session?.user?.id) return [];
  try {
    const rows=await communityJson(`nutripeer_shared_notifications?select=id,message,created_at&user_id=eq.${encodeURIComponent(session.user.id)}&read_at=is.null&order=created_at.desc&limit=20`)||[];
    if(showToast && rows.length) toast(rows.map(x=>x.message).join(' '));
    await markCommunityNotificationsRead(rows);
    return rows;
  } catch { return []; }
}
window.refreshCommunityFoods=async function refreshCommunityFoods(){
  const panel=document.querySelector('#community-results');if(!panel)return;
  panel.innerHTML='<div class="empty">Ortak katalog yükleniyor…</div>';
  try {
    const session=await ensureCommunitySession(),fields='select=id,food_data,barcode,source,status,created_at';
    const requests=[communityRequest(`nutripeer_shared_foods?${fields}&status=eq.approved&order=created_at.desc&limit=100`)];
    if(session?.user?.id){requests.push(communityRequest(`nutripeer_shared_foods?${fields}&status=eq.pending&created_by=eq.${encodeURIComponent(session.user.id)}&order=created_at.desc&limit=100`));requests.push(communityRequest('rpc/nutripeer_is_moderator',{method:'POST',body:'{}'}));}
    const responses=await Promise.all(requests);
    for(const response of responses.slice(0,session?.user?.id?2:1))if(!response.ok)throw new Error(`Sunucu ${response.status}: ${(await response.text()).slice(0,180)}`);
    let rows=(await responses[0].json()).map(x=>({...x,isMine:false})),moderator=false;
    if(session?.user?.id){rows=rows.concat((await responses[1].json()).map(x=>({...x,isMine:true})));if(responses[2]?.ok)moderator=await responses[2].json();
      if(moderator){const pending=await communityRequest(`nutripeer_shared_foods?${fields}&status=eq.pending&order=created_at.desc&limit=100`);if(pending.ok)rows=rows.concat((await pending.json()).filter(x=>!rows.some(y=>y.id===x.id)).map(x=>({...x,isMine:false})));}
    }
    const deletionRequests=moderator?await communityJson('nutripeer_shared_food_delete_requests?select=id,shared_food_id,food_snapshot,requested_by,reason,created_at&status=eq.pending&order=created_at.asc')||[]:[];
    const notices=await loadCommunityNotifications(false);
    const notificationHtml=notices.length?`<div class="notice"><b>Yeni bildirimler</b><ul>${notices.map(x=>`<li>${esc(x.message)}</li>`).join('')}</ul></div>`:'';
    const deletionHtml=deletionRequests.length?`<div class="notice"><b>Silme onayı bekleyenler</b>${deletionRequests.map(x=>`<div class="appt"><div style="flex:1"><strong>${esc(x.food_snapshot?.name||'Besin')}</strong><small>${esc(x.reason||'Silme nedeni belirtilmedi')} · ${new Date(x.created_at).toLocaleDateString('tr-TR')}</small></div><button class="btn small" onclick="reviewCommunityFoodDeletion('${x.id}',true)">Silme isteğini onayla</button><button class="btn light small" onclick="reviewCommunityFoodDeletion('${x.id}',false)">Reddet</button></div>`).join('')}</div>`:'';
    panel.innerHTML=notificationHtml+deletionHtml+(rows.length?rows.map(row=>`<div class="appt"><div class="apdot"></div><div style="flex:1"><strong>${esc(row.food_data?.name||'Besin')} ${row.status==='pending'?'<span class="pill">Onay bekliyor</span>':''}</strong><small>${row.food_data?.serving??'—'} ${esc(row.food_data?.basisUnit||'g')} · ${esc(row.source||'Kaynak belirtilmedi')}${row.barcode?` · ${esc(row.barcode)}`:''}</small></div>${row.status==='approved'?`<button class="btn light small" onclick="importCommunityFood('${row.id}')">Kütüphaneme ekle</button><button class="btn light small" onclick="requestCommunityFoodDeletion('${row.id}')">Silinmesini iste</button>`:`<button class="btn light small" onclick="editPendingCommunityFood('${row.id}')">Düzenle</button>${moderator?`<button class="btn small" onclick="approveCommunityFood('${row.id}')">Onayla</button>`:''}`}</div>`).join(''):'<div class="empty">Henüz onaylı ortak besin yok.</div>');
  } catch(error){panel.innerHTML=`<div class="notice">${esc(error.message)}<br>Güncel Kurulum-Ortak-Kutuphane.sql dosyasını Supabase SQL Editor'de çalıştırıp tekrar deneyin.</div>`;}
};
window.submitCommunityFood=async function submitCommunityFood(){
  const session=await ensureCommunitySession();if(!session?.user?.id)return toast('Besin önermek için ortak kütüphane hesabına giriş yap.');
  const food=db.foods.find(x=>x.id===document.querySelector('#community-food-select')?.value);if(!food)return toast('Önce paylaşılacak bir besin seç.');
  const foodData=portableFoodData(food);
  try{
    const own=await communityJson(`nutripeer_shared_foods?select=id,barcode,food_data&status=eq.pending&created_by=eq.${encodeURIComponent(session.user.id)}&order=created_at.desc&limit=200`)||[];
    const match=own.find(x=>(food.barcode&&x.barcode===food.barcode)||String(x.food_data?.name||'').trim().toLocaleLowerCase('tr-TR')===String(food.name||'').trim().toLocaleLowerCase('tr-TR'));
    if(match){await communityJson(`nutripeer_shared_foods?id=eq.${encodeURIComponent(match.id)}&status=eq.pending`,{method:'PATCH',body:JSON.stringify({barcode:foodData.barcode||null,food_data:foodData,source:foodData.source?.name||'NutriPeer topluluk katkısı'}),headers:{Prefer:'return=minimal'}});toast('Onay bekleyen besin güncellendi.');}
    else {await communityJson('nutripeer_shared_foods',{method:'POST',body:JSON.stringify({barcode:foodData.barcode||null,food_data:foodData,source:foodData.source?.name||'NutriPeer topluluk katkısı',status:'pending',created_by:session.user.id})});toast('Besin inceleme ve onay kuyruğuna gönderildi.');}
    await refreshCommunityFoods();
  }catch(error){toast(error.message);}
};
window.editPendingCommunityFood=async function editPendingCommunityFood(sharedId){
  const session=await ensureCommunitySession();if(!session?.user?.id)return toast('Önce ortak kütüphane hesabına giriş yap.');
  try{
    const rows=await communityJson(`nutripeer_shared_foods?select=id,food_data,barcode,source,status,created_by&id=eq.${encodeURIComponent(sharedId)}&status=eq.pending&limit=1`),row=rows?.[0];
    if(!row)return toast('Düzenlenebilir bekleyen besin bulunamadı.');
    const moderator=await communityJson('rpc/nutripeer_is_moderator',{method:'POST',body:'{}'});
    if(row.created_by!==session.user.id&&!moderator)return toast('Yalnızca kendi bekleyen katkını düzenleyebilirsin.');
    const temporaryId=`community-edit-${row.id}`;db.foods=db.foods.filter(x=>x.id!==temporaryId);db.foods.push({...row.food_data,id:temporaryId,barcode:row.barcode||row.food_data?.barcode||'',source:row.food_data?.source||row.source});
    window.foodForm(temporaryId);const form=document.querySelector('#modal form');if(!form)return;
    form.onsubmit=async e=>{
      e.preventDefault();if(!form.reportValidity())return;
      const barcode=form.elements.barcode?.value?.trim()||'';
      if(!Number.isFinite(Number(form.elements.serving?.value))||Number(form.elements.serving.value)<=0)return toast('Porsiyon miktarı sıfırdan büyük olmalı.');
      const before=db.foods.find(x=>x.id===temporaryId);window.saveFood(e,temporaryId);
      const edited=db.foods.find(x=>x.id===temporaryId);if(!edited){db.foods.push(before);return toast('Besin düzenlemesi kaydedilemedi.');}
      const payload=portableFoodData(edited);payload.barcode=barcode;delete payload.id;
      db.foods=db.foods.filter(x=>x.id!==temporaryId);save();
      try{await communityJson(`nutripeer_shared_foods?id=eq.${encodeURIComponent(sharedId)}&status=eq.pending`,{method:'PATCH',body:JSON.stringify({food_data:payload,barcode:barcode||null,source:payload.source?.name||row.source||'NutriPeer topluluk katkısı'}),headers:{Prefer:'return=minimal'}});closeModal();render();toast('Onay bekleyen katkın düzenlendi.');await refreshCommunityFoods();}
      catch(error){closeModal();render();toast(`Düzenleme sunucuya kaydedilemedi: ${error.message}`);}
    };
  }catch(error){toast(error.message);}
};
window.approveCommunityFood=async function approveCommunityFood(sharedId){try{await communityJson('rpc/nutripeer_approve_shared_food',{method:'POST',body:JSON.stringify({p_food_id:sharedId})});toast('Besin onaylandı. Ekleyene uygulama içi bildirim gönderildi.');await refreshCommunityFoods();}catch(error){toast(`Onay başarısız: ${error.message}`);}};
window.requestCommunityFoodDeletion=async function requestCommunityFoodDeletion(sharedId){
  const session=await ensureCommunitySession();if(!session?.user?.id)return toast('Silme isteği için topluluk hesabına giriş yap.');
  if(!confirm('Bu besin için moderatör onayına silme isteği göndermek istiyor musun? Besin onay gelene kadar ortak listede kalır.'))return;
  const reason=prompt('Silme nedeni (isteğe bağlı):','');if(reason===null)return;
  try{const rows=await communityJson(`nutripeer_shared_foods?select=id,food_data&status=eq.approved&id=eq.${encodeURIComponent(sharedId)}&limit=1`),row=rows?.[0];if(!row)return toast('Ortak besin bulunamadı.');await communityJson('nutripeer_shared_food_delete_requests',{method:'POST',body:JSON.stringify({shared_food_id:row.id,food_snapshot:row.food_data,requested_by:session.user.id,reason,status:'pending'})});toast('Silme isteği moderatöre gönderildi; onaylanana kadar besin listede kalacak.');await refreshCommunityFoods();}catch(error){toast(error.message);}
};
window.reviewCommunityFoodDeletion=async function reviewCommunityFoodDeletion(requestId,approve){try{await communityJson('rpc/nutripeer_review_shared_food_delete',{method:'POST',body:JSON.stringify({p_request_id:requestId,p_approve:approve})});toast(approve?'Besin silindi; isteği gönderene bildirim iletildi.':'Silme isteği reddedildi; isteği gönderene bildirim iletildi.');await refreshCommunityFoods();}catch(error){toast(`İşlem başarısız: ${error.message}`);}};
if(!window._communityNotificationTimer){window._communityNotificationTimer=setInterval(()=>{if(document.visibilityState==='visible')loadCommunityNotifications(true);},30000);}

// Share personal exchanges and recipes through the authenticated, moderator-reviewed library.
function portableFoodData(food){
  const fields=['name','barcode','basisUnit','unit','serving','density','smallG','mediumG','largeG','cho','protein','fat','kcal','micros','labelNutrients','verified'];
  const data=Object.fromEntries(fields.filter(key=>food?.[key]!==undefined).map(key=>[key,food[key]]));
  if(food?.source){
    const source=typeof food.source==='string'?{name:food.source}:food.source;
    data.source={name:String(source.name||'').slice(0,180)};
    if(typeof source.url==='string'&&/^https:\/\//i.test(source.url))data.source.url=source.url.slice(0,500);
  }
  return data;
}
function portableRecipeData(recipe){
  return {
    name:String(recipe?.name||'').slice(0,180),
    portionG:Number(recipe?.portionG)||0,
    ingredients:(recipe?.ingredients||[]).map(ingredient=>{
    const localFood=db.foods.find(food=>food.id===ingredient.food);
      return {grams:Number(ingredient.grams)||0,foodSnapshot:localFood?portableFoodData(localFood):null};
    }),
    ex:Object.fromEntries(['Süt','Et','Ekmek','Sebze','Meyve','Yağ','Kuruyemiş'].filter(key=>Number(recipe?.ex?.[key])>0).map(key=>[key,Number(recipe.ex[key])])),
    cho:Number(recipe?.cho)||0,
    protein:Number(recipe?.protein)||0,
    fat:Number(recipe?.fat)||0,
    kcal:Number(recipe?.kcal)||0,
  };
}
function portableExchangeData(exchange){
  const fields=['name','averageMeasure','grossG','netG','rawG','cookedG','quantityG','weightBasis','cho','protein','fat'];
  return Object.fromEntries(fields.filter(key=>exchange?.[key]!==undefined).map(key=>[key,exchange[key]]));
}
function mountSharedLibraryPanel(kind){
  const view=document.querySelector('#view');if(!view)return;
  const idName=`shared-${kind}-panel`;if(document.getElementById(idName))return;
  const isExchange=kind==='exchange', localItems=isExchange?db.exchanges:db.recipes;
  const panel=document.createElement('section');panel.className='card';panel.id=idName;panel.style.marginTop='16px';
  panel.innerHTML=`<div class="cardtitle"><div><h2>Ortak ${isExchange?'değişimler':'yemekler'}</h2><div class="sub">Paylaştığın kayıtlar moderatör onayından sonra arkadaşlarının listesinde görünür.</div></div><button class="btn light small" type="button" onclick="refreshSharedLibraryItems('${kind}')">Yenile</button></div><div class="toolbar" style="flex-wrap:wrap;margin:12px 0"><select class="search" id="share-${kind}-select"><option value="">${isExchange?'Paylaşacağın değişimi':'Paylaşacağın yemeği'} seç</option>${localItems.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('')}</select><button class="btn small" type="button" onclick="submitSharedLibraryItem('${kind}')">${isExchange?'Değişimi':'Yemeği'} onaya gönder</button><span class="sub">Ortak hesap: ${communitySession()?.user?.email?esc(communitySession().user.email):'giriş yapılmadı'}</span>${!communitySession()?.user?.id?`<button class="btn light small" type="button" onclick="communityAuth('signin')">Topluluk hesabına giriş</button>`:''}</div><div id="shared-${kind}-results"><div class="empty">Ortak kayıtlar yükleniyor…</div></div>`;
  view.append(panel);refreshSharedLibraryItems(kind);
}
async function refreshSharedLibraryItems(kind){
  const target=document.querySelector(`#shared-${kind}-results`);if(!target)return;
  try{
    const session=await ensureCommunitySession(),moderator=session?.user?.id?await communityJson('rpc/nutripeer_is_moderator',{method:'POST',body:'{}'}):false;
    let rows=await communityJson(`nutripeer_shared_library_items?select=id,item_type,client_key,item_data,source,status,created_at,created_by&item_type=eq.${kind}&status=eq.approved&order=created_at.desc&limit=100`)||[];
    if(session?.user?.id){const own=await communityJson(`nutripeer_shared_library_items?select=id,item_type,client_key,item_data,source,status,created_at,created_by&item_type=eq.${kind}&status=eq.pending&created_by=eq.${encodeURIComponent(session.user.id)}&order=created_at.desc&limit=100`)||[];rows=rows.concat(own);
      if(moderator){const pending=await communityJson(`nutripeer_shared_library_items?select=id,item_type,client_key,item_data,source,status,created_at,created_by&item_type=eq.${kind}&status=eq.pending&order=created_at.asc&limit=100`)||[];rows=rows.concat(pending.filter(x=>!rows.some(y=>y.id===x.id)));}}
    target.innerHTML=rows.length?rows.map(row=>`<div class="appt"><div class="apdot"></div><div style="flex:1"><strong>${esc(row.item_data?.name||'Kayıt')} ${row.status==='pending'?'<span class="pill">Onay bekliyor</span>':''}</strong><small>${kind==='exchange'?`${esc(row.item_data?.averageMeasure||'—')} · brüt ${row.item_data?.grossG??'—'} g / net ${row.item_data?.netG??'—'} g`:`${row.item_data?.portionG||'—'} g porsiyon · ${Math.round(Number(row.item_data?.kcal)||0)} kcal`}</small></div>${row.status==='approved'?`<button class="btn light small" type="button" onclick="importSharedLibraryItem('${row.id}')">Kütüphaneme ekle</button>`:moderator?`<button class="btn small" type="button" onclick="approveSharedLibraryItem('${row.id}','${kind}')">Onayla</button>`:''}</div>`).join(''):'<div class="empty">Bu türde henüz ortak kayıt yok.</div>';
  }catch(error){target.innerHTML=`<div class="notice">${esc(error.message)}<br>Ortak katalog SQL dosyasının güncel sürümünün Supabase’te çalıştırıldığından emin olun.</div>`;}
}
window.refreshSharedLibraryItems=refreshSharedLibraryItems;
window.submitSharedLibraryItem=async function(kind){
  const session=await ensureCommunitySession();if(!session?.user?.id)return toast('Paylaşmak için ortak kütüphane hesabına giriş yap.');
  const localId=document.querySelector(`#share-${kind}-select`)?.value,sourceItems=kind==='exchange'?db.exchanges:db.recipes,item=sourceItems.find(x=>x.id===localId);if(!item)return toast('Önce paylaşılacak kaydı seç.');
  try{
    const data=kind==='recipe'?portableRecipeData(item):portableExchangeData(item);
    const existing=await communityJson(`nutripeer_shared_library_items?select=id&item_type=eq.${kind}&client_key=eq.${encodeURIComponent(String(item.id))}&status=eq.pending&created_by=eq.${encodeURIComponent(session.user.id)}&limit=1`)||[];
    const payload={item_type:kind,client_key:String(item.id),item_data:data,source:'NutriPeer topluluk katkısı',status:'pending',created_by:session.user.id};
    if(existing[0]){await communityJson(`nutripeer_shared_library_items?id=eq.${existing[0].id}&status=eq.pending`,{method:'PATCH',body:JSON.stringify({item_data:data,source:payload.source}),headers:{Prefer:'return=minimal'}});toast('Bekleyen ortak kayıt güncellendi.');}
    else {await communityJson('nutripeer_shared_library_items',{method:'POST',body:JSON.stringify(payload)});toast('Kayıt moderatör onayına gönderildi.');}
    await refreshSharedLibraryItems(kind);
  }catch(error){toast(error.message);}
};
window.approveSharedLibraryItem=async function(itemId,kind){try{await communityJson('rpc/nutripeer_approve_library_item',{method:'POST',body:JSON.stringify({p_item_id:itemId})});toast('Kayıt onaylandı; katkı sahibine uygulama içi bildirim gönderildi.');await refreshSharedLibraryItems(kind);}catch(error){toast(`Onay başarısız: ${error.message}`);}};
window.importSharedLibraryItem=async function(itemId){
  try{
    const rows=await communityJson(`nutripeer_shared_library_items?select=id,item_type,item_data&id=eq.${encodeURIComponent(itemId)}&status=eq.approved&limit=1`),row=rows?.[0];if(!row)return toast('Ortak kayıt bulunamadı.');
    const data=JSON.parse(JSON.stringify(row.item_data||{}));
    if(row.item_type==='exchange'){
      if(db.exchanges.some(x=>x.name.toLocaleLowerCase('tr-TR')===String(data.name||'').toLocaleLowerCase('tr-TR')))return toast('Bu adlı değişim listende zaten var.');
      db.exchanges.push({...data,id:id()});
    } else {
      if(db.recipes.some(x=>x.name.toLocaleLowerCase('tr-TR')===String(data.name||'').toLocaleLowerCase('tr-TR')))return toast('Bu adlı yemek listende zaten var.');
      data.ingredients=(data.ingredients||[]).map(ingredient=>{
        const snap=ingredient.foodSnapshot;let localFood=snap&&db.foods.find(f=>(snap.barcode&&f.barcode===snap.barcode)||f.name.toLocaleLowerCase('tr-TR')===String(snap.name||'').toLocaleLowerCase('tr-TR'));
        if(!localFood&&snap){localFood={...snap,id:id(),source:{name:'NutriPeer ortak yemek tarifi'}};db.foods.push(localFood);}
        const clean={...ingredient,food:localFood?.id||ingredient.food};delete clean.foodSnapshot;return clean;
      });
      db.recipes.push({...data,id:id()});
    }
    save();render();toast(row.item_type==='exchange'?'Ortak değişim listene eklendi.':'Ortak yemek tarifin ve eksik malzemeleri eklendi.');
  }catch(error){toast(error.message);}
};
const exchangesPageBeforeShared=window.exchanges;
window.exchanges=function(){exchangesPageBeforeShared();mountSharedLibraryPanel('exchange');};views.exchanges=window.exchanges;
const recipesPageBeforeShared=window.recipes;
window.recipes=function(){recipesPageBeforeShared();mountSharedLibraryPanel('recipe');};views.recipes=window.recipes;

// Keep the daily totals from counting the exchange plan and its meal allocations twice.
// When exchange entries are present in the menu, those entries become the exchange source
// of truth for the daily total; the exchange grid remains the target/reference above.
function menuHasMenuEntries(){return menuItems.length>0;}
window.menuMacroTotals=function menuMacroTotals(){
  const macros=menuHasMenuEntries()?[0,0,0]:exchangeTotals().m.slice();
  menuItems.forEach(item=>itemMacros(item).forEach((value,index)=>macros[index]+=value));
  return macros;
};
window.dietEnergyIncludingFoods=function dietEnergyIncludingFoods(){
  let energy=menuHasMenuEntries()?0:exchangeTotals().k;
  menuItems.forEach(item=>{
    if(item.type==='exchange'){
      const macros=exchangeMacros(item);energy+=macros[0]*4+macros[1]*4+macros[2]*9;
    }else if(item.type==='recipe'){
      const macros=recipeMacros(item);energy+=macros[0]*4+macros[1]*4+macros[2]*9;
    }else{
      const food=db.foods.find(row=>row.id===item.food),quantity=food&&itemBasisAmount(item,food);
      if(food&&quantity!==null&&quantity!==undefined)energy+=foodLabelEnergy(food)*quantity/(Number(food.serving)||1);
    }
  });
  return energy;
};
window.updateExchange=function updateExchange(){
  const macros=menuMacroTotals(),energy=dietEnergyIncludingFoods(),el=document.querySelector('#extot');
  if(!el)return;
  const micros=microText(menuMicroTotals()),labelNutrients=labelNutrientText(menuLabelNutrientTotals());
  const allocationNote=menuHasMenuEntries()?'Menü toplamı yalnızca menüye eklenenlerden hesaplanır; değişim hesabı ayrı kayıtlıdır.':'';
  el.innerHTML=`<div class="stat"><small>Enerji · günlük toplam</small><b>${Math.round(energy)} kcal</b></div><div class="stat"><small>Karbonhidrat</small><b>${macros[0].toFixed(1)} g · ${Math.round(macros[0]*4/energy*100||0)}%</b></div><div class="stat"><small>Protein</small><b>${macros[1].toFixed(1)} g · ${Math.round(macros[1]*4/energy*100||0)}%</b></div><div class="stat"><small>Yağ</small><b>${macros[2].toFixed(1)} g · ${Math.round(macros[2]*9/energy*100||0)}%</b></div>${allocationNote?`<div class="sub" style="width:100%">${allocationNote}</div>`:''}${micros?`<div class="micro-summary" style="width:100%"><b>Seçilen besinlerden mikro toplamı:</b> ${esc(micros)}</div>`:''}${labelNutrients?`<div class="micro-summary" style="width:100%"><b>Şeker ve yağ toplamı:</b> ${esc(labelNutrients)}</div>`:''}`;
};

// In diet printouts, exchange rows are phrased for clients; technical quantities stay
// available in the dedicated printable exchange reference list.
const quantityTextBeforeClientExchange=window.itemQuantityText;
window.itemQuantityText=function(item,food,clientFriendly=false){
  if(item?.type==='exchange'){
    const exchange=db.exchanges.find(row=>row.id===item.exchangeId);
    if(!exchange)return 'Silinmiş değişim';
    if(clientFriendly){const count=Number(item.count)||1;return `${count.toLocaleString('tr-TR',{maximumFractionDigits:2})} porsiyon ${exchange.name.toLocaleLowerCase('tr-TR')}`;}
    return exchangeDisplay(item);
  }
  return quantityTextBeforeClientExchange(item,food,clientFriendly);
};

window.moveExchange=function moveExchange(exchangeId,step){
  const from=db.exchanges.findIndex(row=>row.id===exchangeId),to=from+Number(step);
  if(from<0||to<0||to>=db.exchanges.length)return;
  [db.exchanges[from],db.exchanges[to]]=[db.exchanges[to],db.exchanges[from]];
  save();window.exchanges();
};
window.printExchangeList=function printExchangeList(){
  const popup=window.open('','_blank','width=900,height=700');
  if(!popup)return toast('Yazdırma penceresi açılamadı. Tarayıcı açılır pencerelere izin vermeli.');
  const rows=db.exchanges.map(row=>`<tr><td>${esc(row.name||'')}</td><td>${esc(row.averageMeasure||'—')}</td><td>${Number(row.grossG??row.quantityG)||0} g / ${Number(row.netG??row.quantityG)||0} g</td><td>${esc(row.preparation||'—')} · ${row.weightBasis==='gross'?'brüt':'net'} ağırlık</td></tr>`).join('');
  popup.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>NutriPeer · Değişim Listesi</title><style>body{font:14px Arial,sans-serif;color:#23352a;margin:32px}header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #4b8a62;padding-bottom:14px;margin-bottom:22px}h1{font-size:24px;margin:0 0 5px}p{color:#66746a;margin:0}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:11px 9px;border-bottom:1px solid #dce5de;vertical-align:top}th{background:#eff5f0;color:#305b3e}footer{margin-top:24px;color:#748176;font-size:11px}@media print{body{margin:12mm}button{display:none}}</style></head><body><header><div><h1>NutriPeer · Değişim Listesi</h1><p>Danışan kullanımına yönelik yiyecek değişim rehberi</p></div><div>${new Date().toLocaleDateString('tr-TR')}</div></header><table><thead><tr><th>Yiyecek adı</th><th>Ortalama ölçü</th><th>Miktar · brüt / net</th><th>Hazırlama bilgisi</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Henüz değişim eklenmemiş.</td></tr>'}</tbody></table><footer>Besin değerleri bu danışan rehberinde gösterilmez.</footer><script>window.onload=()=>window.print()<\/script></body></html>`);
  popup.document.close();
};
window.exchanges=function exchanges(){
  const view=document.querySelector('#view');
  view.innerHTML=`<div class="heading"><div><h1>Değişimlerim</h1><div class="sub">Kendi yiyecek değişim kayıtların. ↑ ↓ düğmeleriyle sırala; danışana vermek için listeyi yazdır.</div></div><div class="toolbar"><button class="btn light" type="button" onclick="printExchangeList()">Yazdır</button><button class="btn" type="button" onclick="exchangeForm()">＋ Ekle</button></div></div><div class="card"><div class="tablewrap"><table class="table"><thead><tr><th>Sıra</th><th>Yiyecek adı</th><th>Ortalama ölçü</th><th>Miktar (brüt – net)</th></tr></thead><tbody>${db.exchanges.length?db.exchanges.map((x,index)=>`<tr><td><div class="toolbar"><button class="btn light small" type="button" aria-label="Yukarı taşı" title="Yukarı taşı" ${index===0?'disabled':''} onclick="moveExchange('${x.id}',-1)">↑</button><button class="btn light small" type="button" aria-label="Aşağı taşı" title="Aşağı taşı" ${index===db.exchanges.length-1?'disabled':''} onclick="moveExchange('${x.id}',1)">↓</button></div></td><td><b>${esc(x.name)}</b><div class="toolbar" style="margin-top:6px"><button class="btn light small" type="button" onclick="exchangeForm('${x.id}')">Düzenle</button><button class="btn light small" type="button" onclick="deleteExchange('${x.id}')">Sil</button></div></td><td>${esc(x.averageMeasure||'—')}</td><td>${Number(x.grossG??x.quantityG)||0} g – ${Number(x.netG??x.quantityG)||0} g</td></tr>`).join(''):'<tr><td colspan="4" class="empty">Henüz değişim eklemedin. Ekle düğmesiyle ilk kaydını oluştur.</td></tr>'}</tbody></table></div></div>`;
  mountSharedLibraryPanel('exchange');
};
views.exchanges=window.exchanges;

// Optional paired raw/cooked weights and gross/net values for exchange references.
db.exchangePlans ||= [];
window.exchangeForm=function exchangeForm(exchangeId){
  const x=db.exchanges.find(row=>row.id===exchangeId)||{grossG:'',netG:'',rawG:'',cookedG:'',cho:'',protein:'',fat:'',weightBasis:'',averageMeasure:''};
  modal(`<h2>${exchangeId?'Değişimi düzenle':'Değişim ekle'}</h2><form onsubmit="saveExchange(event,'${exchangeId||''}')"><div class="fieldgrid"><div class="field"><label>Yiyecek adı *</label><input name="name" required value="${esc(x.name||'')}" placeholder="Örn. Mezgit"></div><div class="field"><label>Ortalama ölçü *</label><input name="averageMeasure" required value="${esc(x.averageMeasure||'')}" placeholder="Örn. 3 orta boy"></div><div class="field full"><label>Miktar (g) · brüt / net · isteğe bağlı</label><div class="toolbar"><input class="search" name="grossG" type="number" min="0" step="any" placeholder="Brüt" value="${x.grossG??''}"><span>/</span><input class="search" name="netG" type="number" min="0" step="any" placeholder="Net" value="${x.netG??''}"></div></div><div class="field full"><label>Çiğ / pişmiş miktar (g) · isteğe bağlı</label><div class="toolbar"><input class="search" name="rawG" type="number" min="0" step="any" placeholder="Çiğ" value="${x.rawG??''}"><span>/</span><input class="search" name="cookedG" type="number" min="0" step="any" placeholder="Pişmiş" value="${x.cookedG??''}"></div></div></div><details style="margin-top:14px"><summary>İsteğe bağlı · ağırlık tercihi ve makrolar</summary><p class="sub">Ağırlık alanlarını yalnızca gerekiyorsa doldurun. Makrolar bir değişim porsiyonu içindir.</p><div class="fieldgrid"><div class="field"><label>Gram gösteriminde kullanılacak ağırlık</label><select name="weightBasis"><option value="" ${!x.weightBasis?'selected':''}>Belirtilmedi</option><option value="net" ${x.weightBasis==='net'?'selected':''}>Net</option><option value="gross" ${x.weightBasis==='gross'?'selected':''}>Brüt</option><option value="raw" ${x.weightBasis==='raw'?'selected':''}>Çiğ</option><option value="cooked" ${x.weightBasis==='cooked'?'selected':''}>Pişmiş</option></select></div><div class="field"><label>Karbonhidrat (g)</label><input name="cho" type="number" min="0" step="any" value="${x.cho??''}"></div><div class="field"><label>Protein (g)</label><input name="protein" type="number" min="0" step="any" value="${x.protein??''}"></div><div class="field"><label>Yağ (g)</label><input name="fat" type="number" min="0" step="any" value="${x.fat??''}"></div></div></details><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">İptal</button><button class="btn">Kaydet</button></div></form>`);
};
window.saveExchange=function saveExchange(event,exchangeId){
  event.preventDefault();const values=Object.fromEntries(new FormData(event.target));
  for(const key of ['grossG','netG','rawG','cookedG','cho','protein','fat']){
    const raw=String(values[key]??'').trim();
    if(raw!==''&&(!Number.isFinite(Number(raw))||Number(raw)<0))return toast('Gram ve makro değerleri sıfır veya daha büyük olmalı.');
    values[key]=raw===''?null:Number(raw);
  }
  if(!values.name?.trim()||!values.averageMeasure?.trim())return toast('Yiyecek adını ve ortalama ölçüyü gir.');
  const basisValues={net:values.netG,gross:values.grossG,raw:values.rawG,cooked:values.cookedG};
  values.quantityG=Number(basisValues[values.weightBasis])||Number(values.netG)||Number(values.grossG)||Number(values.rawG)||Number(values.cookedG)||0;
  const old=db.exchanges.find(row=>row.id===exchangeId);old?Object.assign(old,values):db.exchanges.push({...values,id:id()});
  save();closeModal();render();toast('Değişim kaydedildi.');
};
function exchangeWeightText(value){return value===null||value===undefined||value===''?'—':`${Number(value).toLocaleString('tr-TR',{maximumFractionDigits:1})} g`;}
function exchangePairText(first,second){const hasFirst=first!==null&&first!==undefined&&first!=='',hasSecond=second!==null&&second!==undefined&&second!=='';if(!hasFirst&&!hasSecond)return '';return `${hasFirst?exchangeWeightText(first):'—'} / ${hasSecond?exchangeWeightText(second):'—'}`;}
window.printExchangeList=function printExchangeList(){
  const popup=window.open('','_blank','width=900,height=700');if(!popup)return toast('Yazdırma penceresine izin verin.');
  const rows=db.exchanges.map(row=>`<tr><td>${esc(row.name||'')}</td><td>${esc(row.averageMeasure||'—')}</td><td>${exchangePairText(row.grossG,row.netG)}</td><td>${exchangePairText(row.rawG,row.cookedG)}</td></tr>`).join('');
  popup.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>NutriPeer · Değişim Listesi</title><style>body{font:14px Arial,sans-serif;color:#23352a;margin:32px}header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #4b8a62;padding-bottom:14px;margin-bottom:22px}h1{font-size:24px;margin:0 0 5px}p{color:#66746a;margin:0}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:11px 9px;border-bottom:1px solid #dce5de;vertical-align:top}th{background:#eff5f0;color:#305b3e}footer{margin-top:24px;color:#748176;font-size:11px}@media print{body{margin:12mm}}</style></head><body><header><div><h1>NutriPeer · Değişim Listesi</h1><p>Danışan kullanımına yönelik yiyecek değişim rehberi</p></div><div>${new Date().toLocaleDateString('tr-TR')}</div></header><table><thead><tr><th>Yiyecek adı</th><th>Ortalama ölçü</th><th>Miktar · brüt / net</th><th>Çiğ / pişmiş (g)</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Henüz değişim eklenmemiş.</td></tr>'}</tbody></table><footer>Besin değerleri bu danışan rehberinde gösterilmez.</footer><script>window.onload=()=>window.print()<\/script></body></html>`);popup.document.close();
};
window.exchanges=function exchanges(){
  const view=document.querySelector('#view');
  view.innerHTML=`<div class="heading"><div><h1>Değişimlerim</h1><div class="sub">↑ ↓ ile sırala. Brüt/net ve çiğ/pişmiş gram alanları isteğe bağlıdır.</div></div><div class="toolbar"><button class="btn light" type="button" onclick="printExchangeList()">Yazdır</button><button class="btn" type="button" onclick="exchangeForm()">＋ Ekle</button></div></div><div class="card"><div class="tablewrap"><table class="table"><thead><tr><th>Sıra</th><th>Yiyecek adı</th><th>Ortalama ölçü</th><th>Brüt / net</th><th>Çiğ / pişmiş</th></tr></thead><tbody>${db.exchanges.length?db.exchanges.map((x,index)=>`<tr><td><div class="toolbar"><button class="btn light small" aria-label="Yukarı taşı" ${index===0?'disabled':''} onclick="moveExchange('${x.id}',-1)">↑</button><button class="btn light small" aria-label="Aşağı taşı" ${index===db.exchanges.length-1?'disabled':''} onclick="moveExchange('${x.id}',1)">↓</button></div></td><td><b>${esc(x.name)}</b><div class="toolbar" style="margin-top:6px"><button class="btn light small" onclick="exchangeForm('${x.id}')">Düzenle</button><button class="btn light small" onclick="deleteExchange('${x.id}')">Sil</button></div></td><td>${esc(x.averageMeasure||'—')}</td><td>${exchangePairText(x.grossG,x.netG)}</td><td>${exchangePairText(x.rawG,x.cookedG)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">Henüz değişim eklemedin. Ekle düğmesiyle ilk kaydını oluştur.</td></tr>'}</tbody></table></div></div>`;mountSharedLibraryPanel('exchange');
};views.exchanges=window.exchanges;

// Store exchange calculations separately; the meal-list editor is a distinct next step.
let exchangePlanFlow=null,activeExchangePlanId='';
function showExchangePlanEditor(context){
  exchangePlanFlow=context;const plan=context.plan,patient=db.patients.find(row=>row.id===context.patientId),template=db.templates.find(row=>row.id===context.templateId),latestPatientPlan=db.exchangePlans.slice().reverse().find(row=>context.patientId&&row.patient===context.patientId),zeroExchanges=Object.fromEntries(Object.keys(macro).map(key=>[key,0])),initial=plan?.ex||template?.ex||latestPatientPlan?.ex||zeroExchanges;
  exchanges={...initial};
  const energyHint=context.energy?`Enerji hesabı önerisi: ${context.energy.min}–${context.energy.max} kcal/gün (${context.energy.eq||'seçilen denklem'}).`:'';
  const patients=patient?`<input type="hidden" name="patient" value="${esc(patient.id)}"><div class="field"><label>Danışan</label><input value="${esc(`${patient.first} ${patient.last}`)}" disabled></div>`:`<div class="field"><label>Danışan</label><select name="patient"><option value="">Danışan seçilmedi</option>${db.patients.map(row=>`<option value="${row.id}" ${row.id===context.patientId?'selected':''}>${esc(row.first)} ${esc(row.last)}</option>`).join('')}</select></div>`;
  const keys=Object.keys(macro);
  modal(`<h2>${plan?'Değişim Hesabını Düzenle':'Değişimleri Hesapla'}</h2><p class="sub">Değişim hesabı ayrı kaydedilir. Kaydettikten sonra ayrı bir ekranda diyet menüsünü hazırlayabilirsin.</p><form onsubmit="saveExchangePlan(event)"><div class="fieldgrid"><div class="field"><label>Hesap adı</label><input name="name" required value="${esc(plan?.name||db.templates.find(row=>row.id===context.templateId)?.name||`${patient?.first||'Yeni'} değişim hesabı`)}"></div>${patients}</div><p class="sub">${esc(energyHint)}</p><h3>Günlük değişim adetleri</h3><div class="exchange">${keys.map(key=>`<div class="field"><label>${esc(key)}<br><span class="muted">KH/P/Yağ: ${macro[key].join('/')}</span></label><input id="ex-${key}" type="number" min="0" step=".5" value="${Number(initial[key])||0}" oninput="exchanges['${key}']=Number(this.value)||0;exchangePlanPreview()"></div>`).join('')}</div><div class="statrow" id="exchange-plan-total" style="margin-top:14px"></div><div class="formactions"><button type="button" class="btn light" onclick="closeModal()">İptal</button><button class="btn">Hesapla ve kaydet</button></div></form>`);exchangePlanPreview();
}
window.saveExchangePlan=function saveExchangePlan(event){
  event.preventDefault();const values=Object.fromEntries(new FormData(event.target)),totals=exchangeTotals(),context=exchangePlanFlow||{},old=context.plan;
  const plan={...(old||{}),id:old?.id||id(),name:String(values.name||'Değişim hesabı').trim(),patient:values.patient||context.patientId||'',date:old?.date||iso(new Date()),updatedAt:new Date().toISOString(),ex:{...exchanges},macros:totals.m.slice(),kcal:Math.round(totals.k),energy:context.energy||old?.energy||null,templateId:context.templateId||old?.templateId||''};
  const index=db.exchangePlans.findIndex(row=>row.id===plan.id);if(index>=0)db.exchangePlans[index]=plan;else db.exchangePlans.push(plan);save();closeModal();toast('Değişim hesabı kaydedildi.');
  if(context.openMenuAfterSave===false){page='diets';render();return;}
  openDietMenuBuilder(plan.id,{patientId:plan.patient,energy:plan.energy,templateId:plan.templateId});
};
window.editExchangePlan=function editExchangePlan(planId,openMenuAfterSave=false){const plan=db.exchangePlans.find(row=>row.id===planId);if(!plan)return;showExchangePlanEditor({plan,patientId:plan.patient,energy:plan.energy,templateId:plan.templateId,openMenuAfterSave});};
const newDietBeforeSeparatedFlow=window.newDiet;
window.newDiet=function newDiet(patientId='',energy=null,templateId='',editId=''){
  if(editId){const diet=db.diets.find(row=>row.id===editId);if(!diet)return;const plan=diet.exchangePlanId&&db.exchangePlans.find(row=>row.id===diet.exchangePlanId);openDietMenuBuilder(plan?.id||'',{patientId:diet.patient,energy:plan?.energy||energy,templateId:'',editId:diet.id});return;}
  const template=db.templates.find(row=>row.id===templateId),plan=template?.exchangePlanId&&db.exchangePlans.find(row=>row.id===template.exchangePlanId);
  showExchangePlanEditor({patientId,energy,templateId,plan,openMenuAfterSave:true});
};
window.openDietMenuBuilder=function openDietMenuBuilder(planId='',context={}){
  const plan=db.exchangePlans.find(row=>row.id===planId),diet=context.editId&&db.diets.find(row=>row.id===context.editId),template=db.templates.find(row=>row.id===(context.templateId||plan?.templateId));
  activeExchangePlanId=plan?.id||diet?.exchangePlanId||template?.exchangePlanId||'';
  exchanges={...(plan?.ex||diet?.ex||template?.ex||exchanges)};
  newDietBeforeSeparatedFlow(context.patientId||plan?.patient||diet?.patient||'',context.energy||plan?.energy||null,context.templateId||plan?.templateId||'',context.editId||'');
  if(plan)exchanges={...plan.ex};
  const form=document.querySelector('#modal form');if(!form)return;
  const exchangeHeading=[...form.querySelectorAll('h3')].find(node=>node.textContent.includes('Değişim adetleri'));
  if(exchangeHeading){const grid=exchangeHeading.nextElementSibling;exchangeHeading.remove();grid?.remove();}
  document.querySelector('#extot')?.remove();
  const distribution=[...form.querySelectorAll('h3')].find(node=>node.textContent.includes('Öğünlere dağıtım'));
  if(distribution){const info=document.createElement('div');info.className='notice';info.innerHTML=`<b>Diyet Listesi</b><br>Bu menü, ayrı kaydettiğin <b>${esc(plan?.name||diet?.name||template?.name||'değişim hesabı')}</b> hesabına bağlı. Menü toplamı eklediğin besin, değişim ve yemeklerden hesaplanır; üst hedef ikinci kez eklenmez. ${plan?`<button class="btn light small" type="button" onclick="editExchangePlan('${plan.id}',true)">Değişim hesabını düzenle</button>`:''}`;distribution.before(info);const total=document.createElement('div');total.id='extot';total.className='statrow';total.style.margin='10px 0 16px';distribution.after(total);}
  const hidden=document.createElement('input');hidden.type='hidden';hidden.name='exchangePlanId';hidden.value=activeExchangePlanId;form.prepend(hidden);
  const title=form.querySelector('h2');if(title)title.textContent=diet?'Diyet Listesini Düzenle':'Diyet Listesi Oluştur';
  const submit=form.querySelector('.formactions button.btn:not(.light)');if(submit)submit.textContent='Diyet listesini kaydet';
  renderMeals();updateExchange();
};
const dietsPageBeforeExchangePlans=views.diets;
views.diets=function diets(){dietsPageBeforeExchangePlans();const view=document.querySelector('#view');if(!view)return;const card=document.createElement('section');card.className='card';card.style.marginBottom='16px';card.innerHTML=`<div class="cardtitle"><div><h2>Değişim Hesapları</h2><div class="sub">Değişim hedeflerini burada ayrı hesaplayıp kaydedebilir; ardından ayrı bir diyet listesi oluşturabilirsin.</div></div><button class="btn" type="button" onclick="newDiet('')">＋ Değişim Hesapla</button></div>${db.exchangePlans.length?`<div class="tablewrap"><table class="table"><thead><tr><th>Hesap</th><th>Danışan</th><th>Tarih</th><th>Enerji</th><th></th></tr></thead><tbody>${db.exchangePlans.slice().reverse().map(plan=>{const patient=db.patients.find(row=>row.id===plan.patient);return `<tr><td><b>${esc(plan.name)}</b></td><td>${esc(patient?`${patient.first} ${patient.last}`:'—')}</td><td>${esc(plan.date||'—')}</td><td>${Math.round(plan.kcal||0)} kcal</td><td><div class="toolbar"><button class="btn light small" type="button" onclick="editExchangePlan('${plan.id}')">Düzenle</button><button class="btn light small" type="button" onclick="openDietMenuBuilder('${plan.id}')">Diyet listesi oluştur</button></div></td></tr>`;}).join('')}</tbody></table></div>`:'<div class="empty">Henüz değişim hesabı kaydedilmedi.</div>'}`;view.prepend(card);};

// Final workflow refinements: selectable exchange printout, profile tabs and visible
// exchange/energy targets carried from the saved calculation into menu planning.
function exchangeMacroPercentages(macros){const values=[+(macros?.[0]||0)*4,+(macros?.[1]||0)*4,+(macros?.[2]||0)*9],sum=values.reduce((a,b)=>a+b,0);return sum?values.map(value=>Math.round(value/sum*100)):[0,0,0];}
function exchangePlanMacroLabel(macros){const [cho,protein,fat]=exchangeMacroPercentages(macros);return `KH ${cho}% · Protein ${protein}% · Yağ ${fat}%`;}
function exchangeQuantitiesLabel(ex){return Object.entries(ex||{}).filter(([,count])=>Number(count)>0).map(([name,count])=>`${Number(count).toLocaleString('tr-TR',{maximumFractionDigits:1})} ${name.toLocaleLowerCase('tr-TR')}`).join(' · ')||'Değişim adedi girilmemiş';}
function energyRangeLabel(energy){return energy&&Number.isFinite(Number(energy.min))&&Number.isFinite(Number(energy.max))?`${Number(energy.min).toLocaleString('tr-TR')}–${Number(energy.max).toLocaleString('tr-TR')} kcal/gün`:'';}
window.printExchangeList=function printExchangeList(){
  if(!db.exchanges.length)return toast('Yazdırılacak değişim bulunmuyor.');
  const popup=window.open('','_blank','width=1000,height=760');if(!popup)return toast('Yazdırma penceresine izin verin.');
  const rows=db.exchanges.map((row,index)=>`<tr data-exchange-row><td class="check-col"><input type="checkbox" checked aria-label="${esc(row.name||'Değişim')}: yazdır"></td><td>${esc(row.name||'')}</td><td>${esc(row.averageMeasure||'—')}</td><td>${exchangePairText(row.grossG,row.netG)||'—'}</td><td>${exchangePairText(row.rawG,row.cookedG)||'—'}</td></tr>`).join('');
  popup.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NutriPeer · Değişim Listesi</title><style>*{box-sizing:border-box}body{font:15px Arial,sans-serif;color:#23352a;margin:30px;max-width:1000px}header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #4b8a62;padding-bottom:16px;margin-bottom:20px}h1{font-size:25px;margin:0 0 7px}p{color:#66746a;margin:0}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}.controls button{border:0;border-radius:8px;background:#39794e;color:white;padding:10px 14px;font-weight:600;cursor:pointer}.controls button.secondary{background:#edf3ee;color:#305b3e}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid #dce5de;vertical-align:middle}th{background:#eff5f0;color:#305b3e}td input{width:18px;height:18px;accent-color:#39794e}.excluded{display:none}footer{margin-top:22px;color:#748176;font-size:12px}@media print{body{margin:12mm;max-width:none}.controls,.check-col{display:none!important}.excluded{display:none!important}th{background:#eff5f0!important;print-color-adjust:exact}}</style></head><body><header><div><h1>NutriPeer · Değişim Listesi</h1><p>Danışan kullanımına yönelik yiyecek değişim rehberi</p></div><div>${new Date().toLocaleDateString('tr-TR')}</div></header><div class="controls"><button type="button" onclick="selectRows(true)">Tümünü seç</button><button type="button" class="secondary" onclick="selectRows(false)">Seçimi temizle</button><button type="button" onclick="window.print()">Seçilenleri yazdır / PDF</button><span style="align-self:center;color:#66746a">İstemediğiniz satırın işaretini kaldırın.</span></div><table><thead><tr><th class="check-col">Yazdır</th><th>Yiyecek adı</th><th>Ortalama ölçü</th><th>Brüt / net (g)</th><th>Çiğ / pişmiş (g)</th></tr></thead><tbody>${rows}</tbody></table><footer>Besin değerleri bu danışan rehberinde gösterilmez.</footer><script>function refreshRows(){document.querySelectorAll('[data-exchange-row]').forEach(row=>row.classList.toggle('excluded',!row.querySelector('input').checked))}function selectRows(value){document.querySelectorAll('[data-exchange-row] input').forEach(box=>box.checked=value);refreshRows()}document.querySelectorAll('[data-exchange-row] input').forEach(box=>box.addEventListener('change',refreshRows));<\/script></body></html>`);popup.document.close();
};
const profileBeforeFinalTabs=window.profile;
window.profile=function profile(){if(patientTab==='Diyetler')patientTab='Diyet Geçmişi';profileBeforeFinalTabs();const patient=selected||db.patients[0],tabs=document.querySelector('#view .tabs'),target=document.querySelector('#ptab');if(!patient||!tabs||!target)return;const tabList=[['Özet','Özet'],['Ölçümler','Ölçümler'],['Değişimler','Değişimler'],['Diyet Geçmişi','Diyetler'],['Randevular','Randevular'],['Laboratuvar','Laboratuvar Sonuçları'],['Notlar','Notlar']];tabs.innerHTML=tabList.map(([key,label])=>`<button class="${patientTab===key?'on':''}" type="button">${label}</button>`).join('');[...tabs.children].forEach((button,index)=>button.onclick=()=>{patientTab=tabList[index][0];window.profile();});if(patientTab==='Değişimler'){const plans=db.exchangePlans.filter(plan=>plan.patient===patient.id).slice().sort((a,b)=>String(b.updatedAt||b.date||'').localeCompare(String(a.updatedAt||a.date||'')));target.innerHTML=`<div class="card"><div class="cardtitle"><div><h2>Değişim Hesapları</h2><div class="sub">Danışan için kaydedilmiş günlük değişim adetleri ve makro dağılımları</div></div><button class="btn" type="button" onclick="newDiet('${patient.id}')">＋ Değişim Hesapla</button></div>${plans.length?`<div class="tablewrap"><table class="table"><thead><tr><th>Hesap</th><th>Tarih</th><th>Değişimler</th><th>Enerji</th><th>Makro dağılımı</th><th></th></tr></thead><tbody>${plans.map(plan=>`<tr><td><b>${esc(plan.name||'Değişim hesabı')}</b></td><td>${esc(plan.date||'—')}</td><td>${esc(exchangeQuantitiesLabel(plan.ex))}</td><td>${esc(energyRangeLabel(plan.energy)||`${Math.round(plan.kcal||0)} kcal`)}</td><td>${esc(exchangePlanMacroLabel(plan.macros))}</td><td><div class="toolbar"><button class="btn light small" type="button" onclick="editExchangePlan('${plan.id}')">Düzenle</button><button class="btn light small" type="button" onclick="openDietMenuBuilder('${plan.id}')">Diyet yaz</button></div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Bu danışan için henüz değişim hesabı kaydedilmedi.</div>'}</div>`;}};
views.profile=window.profile;
const openDietMenuBuilderBeforeTargets=window.openDietMenuBuilder;
window.openDietMenuBuilder=function openDietMenuBuilder(planId='',context={}){openDietMenuBuilderBeforeTargets(planId,context);const form=document.querySelector('#modal form');if(!form)return;const distribution=[...form.querySelectorAll('h3')].find(node=>node.textContent.includes('Öğünlere dağıtım'));if(!distribution)return;const plan=db.exchangePlans.find(row=>row.id===planId),diet=context.editId&&db.diets.find(row=>row.id===context.editId),exchangeCounts=exchangeQuantitiesLabel(plan?.ex||diet?.ex||{}),energy=energyRangeLabel(plan?.energy||diet?.energy||context.energy);let panel=document.querySelector('#diet-plan-targets');if(!panel){panel=document.createElement('div');panel.id='diet-plan-targets';panel.className='notice';distribution.before(panel);}panel.innerHTML=`<b>Kaydedilmiş günlük hedef</b><div style="margin-top:6px"><b>Değişimler:</b> ${esc(exchangeCounts)}</div>${energy?`<div style="margin-top:4px"><b>Enerji aralığı:</b> ${esc(energy)}</div>`:''}${plan?`<div style="margin-top:8px"><b>Makro dağılımı:</b> ${esc(exchangePlanMacroLabel(plan.macros))}</div>`:''}`;};
function exchangePlanPreview(){const totals=exchangeTotals(),el=document.querySelector('#exchange-plan-total');if(!el)return;const percent=exchangeMacroPercentages(totals.m);el.innerHTML=`<div class="stat"><small>Değişim enerjisi</small><b>${Math.round(totals.k)} kcal</b></div><div class="stat"><small>Karbonhidrat</small><b>${totals.m[0].toFixed(1)} g · ${percent[0]}%</b></div><div class="stat"><small>Protein</small><b>${totals.m[1].toFixed(1)} g · ${percent[1]}%</b></div><div class="stat"><small>Yağ</small><b>${totals.m[2].toFixed(1)} g · ${percent[2]}%</b></div>`;}
const saveDietBeforePlanLink=window.saveDiet;
window.saveDiet=function saveDiet(event,patientId,templateId){const form=event.target,planId=form.elements.exchangePlanId?.value||activeExchangePlanId,editId=form.elements.editDietId?.value||'',beforeDiets=new Set(db.diets.map(row=>row.id)),beforeTemplates=new Set(db.templates.map(row=>row.id));saveDietBeforePlanLink(event,patientId,templateId);let saved=editId?db.diets.find(row=>row.id===editId):db.diets.find(row=>!beforeDiets.has(row.id));if(!saved&&!editId)saved=db.templates.find(row=>!beforeTemplates.has(row.id))||(templateId&&db.templates.find(row=>row.id===templateId));if(saved&&planId){saved.exchangePlanId=planId;save();}};

// Add a clear recipe mode beside the food and exchange choices.
const renderMealsBeforeRecipeMode=window.renderMeals;
window.renderMeals=function renderMeals(){
  renderMealsBeforeRecipeMode();
  document.querySelectorAll('#meals .meal').forEach((meal,index)=>{
    const foodSelect=meal.querySelector(`#food-${index}`),tools=foodSelect?.closest('.foodrow')?.previousElementSibling;
    if(tools?.classList.contains('toolbar')&&!tools.querySelector('.recipe-mode-button')){const button=document.createElement('button');button.className='btn light small recipe-mode-button';button.type='button';button.textContent='Yemeklerim';button.onclick=()=>setMenuMode(index,'recipe');tools.append(button);}
    const select=meal.querySelector(`#food-${index}`),group=select?.querySelector('optgroup[data-recipes]'),amount=meal.querySelector(`#amount-${index}`),addButton=[...meal.querySelectorAll('button')].find(button=>button.textContent.includes('Besin ekle'));
    if(!select||!group)return;
    const mode=menuEntryMode[index]||'food';
    [...select.options].forEach(option=>{if(option.value.startsWith('recipe:'))option.hidden=mode==='food';else if(option.value)option.hidden=mode==='recipe';});
    if(mode==='recipe'){
      const selectedRecipe=select.value.startsWith('recipe:')?select.value:group.querySelector('option')?.value;
      if(selectedRecipe){select.value=selectedRecipe;const recipe=db.recipes.find(row=>row.id===selectedRecipe.slice(7));if(recipe&&amount)amount.value=String(recipe.portionG);}
      if(addButton)addButton.textContent='＋ Yemeği ekle';
      select.onchange=()=>{const recipe=db.recipes.find(row=>row.id===select.value.slice(7));if(recipe&&amount)amount.value=String(recipe.portionG);};
    }else if(mode==='food'){
      if(select.value.startsWith('recipe:'))select.value=[...select.options].find(option=>option.value&&!option.value.startsWith('recipe:'))?.value||'';
      if(addButton)addButton.textContent='＋ Besin ekle';
      select.onchange=()=>setMenuUnitLabel(index);
    }
    const exchangeRow=meal.querySelector('.exchange-input-row');
    if(exchangeRow&&!exchangeRow.querySelector(`#exchange-display-${index}`)){const display=document.createElement('select');display.id=`exchange-display-${index}`;display.className='search';display.setAttribute('aria-label','Danışan çıktısındaki ölçü');display.innerHTML='<option value="measure">Danışana ortalama ölçüyü göster</option><option value="grams">Danışana gramı göster</option>';exchangeRow.append(display);}
  });
};
const addMenuExchangeBeforeDisplayChoice=window.addMenuExchange;
window.addMenuExchange=function addMenuExchange(meal){const select=document.querySelector(`#exchange-${meal}`),display=document.querySelector(`#exchange-display-${meal}`)?.value||'measure',count=Number(document.querySelector(`#exchange-count-${meal}`)?.value||1);if(!select?.value||!(count>0))return toast('Değişim seçip miktarını gir.');menuItems.push({type:'exchange',meal,exchangeId:select.value,count,displayMode:display});renderMeals();updateExchange();};
const itemTextBeforeMeasuredExchange=window.itemQuantityText;
window.itemQuantityText=function itemQuantityText(item,food,clientFriendly=false){
  if(item?.type==='exchange'){
    const record=db.exchanges.find(row=>row.id===item.exchangeId);if(!record)return 'Silinmiş değişim';
    const count=Number(item.count)||1,name=record.name.toLocaleLowerCase('tr-TR');
    if(clientFriendly){
      const basisValue={net:record.netG,gross:record.grossG,raw:record.rawG,cooked:record.cookedG}[record.weightBasis];
      const grams=Number(record.quantityG)||Number(basisValue)||Number(record.netG)||Number(record.grossG)||Number(record.rawG)||Number(record.cookedG)||0;
      if(item.displayMode==='grams'&&grams>0)return `${(grams*count).toLocaleString('tr-TR',{maximumFractionDigits:1})} g ${name}`;
      if(record.averageMeasure)return `${count>1?`${count.toLocaleString('tr-TR',{maximumFractionDigits:2})} × `:''}${record.averageMeasure} ${name}`;
      if(grams>0)return `${(grams*count).toLocaleString('tr-TR',{maximumFractionDigits:1})} g ${name}`;
      return `${count.toLocaleString('tr-TR',{maximumFractionDigits:2})} porsiyon ${name}`;
    }
    return exchangeDisplay(item);
  }
  return itemTextBeforeMeasuredExchange(item,food,clientFriendly);
};
window.setMenuMode=function setMenuMode(index,mode){if(mode==='recipe'&&!db.recipes.length)return toast('Önce Yemeklerim bölümünden bir yemek oluştur.');menuEntryMode[index]=mode;renderMeals();};
const runCalcBeforeExchangeStep=window.runCalc;
window.runCalc=function runCalc(){runCalcBeforeExchangeStep();const button=document.querySelector('#calcresult button[onclick="applyCalc()"]');if(button)button.textContent='Seçili denklemi kullan ve değişimleri hesapla';};
const viewDietBeforeEditablePrint=window.viewDiet;
window.viewDiet=function viewDiet(dietId){viewDietBeforeEditablePrint(dietId);const button=[...(document.querySelectorAll('#modal button')||[])].find(node=>node.textContent.includes('Yazdır / PDF'));if(button)button.textContent='Önizle · düzenle · yazdır';};

// Let the clinician edit menu text, add/remove meal lines and write any free-form notes
// directly in the print preview. These edits affect that printout only.
window.printDiet=function printDiet(dietId){
  const diet=db.diets.find(row=>row.id===dietId);if(!diet)return;const patient=db.patients.find(row=>row.id===diet.patient);
  const groups=new Map();(diet.foods||[]).forEach(item=>{const mealName=diet.mealNames?.[item.meal]||`Öğün ${(item.meal||0)+1}`;if(!groups.has(item.meal))groups.set(item.meal,{name:mealName,items:[]});const food=db.foods.find(row=>row.id===item.food);if(food||item.type==='exchange'||item.type==='recipe')groups.get(item.meal).items.push(window.itemQuantityText(item,food,true));});
  const mealHtml=[...groups].sort((a,b)=>a[0]-b[0]).map(([index,group])=>`<section class="meal"><header><span class="number">${String(index+1).padStart(2,'0')}</span><h2 contenteditable="true">${esc(group.name)}</h2><button class="tool" onclick="npRemoveMeal(this)">Öğünü kaldır</button></header><ul>${group.items.map(value=>`<li class="print-line"><span contenteditable="true">${esc(value)}</span><button class="tool" type="button" onclick="npRemoveLine(this)">Satırı sil</button></li>`).join('')}</ul><button class="tool" onclick="npAddLine(this)">＋ Satır ekle</button></section>`).join('');
  const oldNotes=diet.printNotes||{},noteParts=[['Not',oldNotes.notes],['İlaç / takviye saatleri',oldNotes.medications],['İçecekler',oldNotes.drinks],['Hatırlatmalar',oldNotes.reminders]].filter(([,value])=>String(value||'').trim()),noteHtml=noteParts.map(([label,value])=>`<p><b>${esc(label)}:</b> ${esc(value).replace(/\n/g,'<br>')}</p>`).join('');
  const popup=window.open('','_blank','width=950,height=1000');if(!popup)return toast('Önizleme penceresine izin verin.');
  popup.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(diet.name)} · NutriPeer</title><style>@page{size:A4;margin:17mm}*{box-sizing:border-box}body{font:14px 'Segoe UI',Arial,sans-serif;color:#20372b;margin:0;background:#f3f6f2}.sheet{max-width:820px;margin:24px auto;background:white;padding:32px 42px;box-shadow:0 3px 24px #20372b18}.brand{display:flex;justify-content:space-between;border-bottom:1px solid #dce9de;padding-bottom:14px;color:#286b4d;font-weight:700}.title{padding:22px 0 15px}.title h1{margin:5px 0;color:#183b2a}.patient{background:#f3f7f2;padding:12px 15px;border-radius:10px;margin-bottom:12px}.meal{padding:12px 2px;border-bottom:1px solid #e8eee8;break-inside:avoid}.meal header{display:flex;align-items:center;gap:10px}.meal h2{color:#286b4d;font-size:16px;flex:1}.number{color:#95a39a}.meal ul{line-height:1.75;margin:4px 0 8px;padding-left:34px}.meal .print-line{display:flex;align-items:baseline;gap:8px}.meal .print-line span{flex:1;min-width:0}.meal .print-line .tool{flex:none}.notes{margin-top:20px;padding:14px;border:1px solid #dce9de;border-radius:10px;min-height:76px}.notes h2{font-size:14px;color:#286b4d;margin:0 0 8px}.free{min-height:42px;white-space:pre-wrap}.free:empty:before{content:attr(data-placeholder);color:#9aa59d}.toolbar{display:flex;gap:8px;justify-content:flex-end;margin:0 0 16px}.tool{border:1px solid #cbd8cd;background:#fff;color:#355f43;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:12px}.editable-hint{font-size:12px;color:#687a6d;margin:0 0 16px}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #e8eee8;color:#849087;font-size:10px;display:flex;justify-content:space-between}.edit{outline:1px dashed #b8c9bb;outline-offset:3px;border-radius:3px}.meal h2:focus,.meal li:focus,.free:focus{outline:2px solid #91b59b}@media print{body{background:white}.sheet{box-shadow:none;margin:0 auto;padding:0}.tool,.toolbar,.editable-hint{display:none!important}.free:empty:before{content:none}.edit{outline:none}}</style></head><body><main class="sheet"><div class="toolbar"><button class="tool" onclick="npAddMeal()">＋ Öğün ekle</button><button class="tool" onclick="window.print()">Yazdır / PDF</button></div><p class="editable-hint">Ön izlemeyi düzenlemek için metinlere tıkla. Öğün veya satır ekleyebilir, istemediğin satırları silebilirsin. Bu değişiklikler yalnızca yazdırılacak kopyaya uygulanır.</p><header class="brand"><span>NutriPeer · Beslenme Planı</span><span>${new Date().toLocaleDateString('tr-TR')}</span></header><div class="title"><small>Plan tarihi · ${esc(diet.date||'')}</small><h1 contenteditable="true" class="edit">${esc(diet.name)}</h1></div><div class="patient"><b>Danışan:</b> ${esc(patient?`${patient.first} ${patient.last}`:'—')} &nbsp; · &nbsp; <b>Dönem:</b> <span contenteditable="true" class="edit">${esc(diet.note||'Günlük plan')}</span></div><div id="print-meals">${mealHtml||'<p class="sub">Henüz menü satırı eklenmemiş. Öğün ekleyip içeriği buradan yazabilirsin.</p>'}</div><section class="notes"><h2 contenteditable="true" class="edit">Notlar · ilaçlar · içecekler</h2><div class="free edit" contenteditable="true" data-placeholder="Danışana iletmek istediğin notları buraya yaz…">${noteHtml}</div></section><footer class="footer"><span>NutriPeer · Beslenme planınız</span><span>Bu plan danışanınıza özel hazırlanmıştır.</span></footer></main><script>function npAddLine(button){const li=document.createElement('li');li.className='print-line';li.innerHTML='<span contenteditable="true" class="edit">Yeni besin / porsiyon</span><button class="tool" type="button" onclick="npRemoveLine(this)">Satırı sil</button>';button.previousElementSibling.append(li);li.querySelector('span').focus()}function npRemoveLine(button){button.closest('li')?.remove()}function npRemoveMeal(button){if(confirm('Bu öğünü yazdırılacak kopyadan kaldır?'))button.closest('.meal').remove()}function npAddMeal(){const section=document.createElement('section');section.className='meal';section.innerHTML='<header><span class="number">+</span><h2 contenteditable="true" class="edit">Yeni öğün</h2><button class="tool" onclick="npRemoveMeal(this)">Öğünü kaldır</button></header><ul><li class="print-line"><span contenteditable="true" class="edit">Yeni besin / porsiyon</span><button class="tool" type="button" onclick="npRemoveLine(this)">Satırı sil</button></li></ul><button class="tool" onclick="npAddLine(this)">＋ Satır ekle</button>';document.querySelector('#print-meals').append(section)}document.querySelectorAll('[contenteditable=true]').forEach(x=>x.classList.add('edit'))<\/script></body></html>`);popup.document.close();
};

// Keep the clinician on the same client tab after saving a diet.
const saveDietBeforeKeepingClientTab=window.saveDiet;
window.saveDiet=function saveDiet(event,patientId,templateId){const wasProfile=page==='profile',previousTab=patientTab;saveDietBeforeKeepingClientTab(event,patientId,templateId);if(wasProfile){page='profile';patientTab=previousTab;profile();}};

// Allow saved exchange calculations to be removed from both lists.
window.deleteExchangePlan=function deleteExchangePlan(planId){const plan=db.exchangePlans.find(row=>row.id===planId);if(!plan)return;if(!confirm('Bu değişim hesabını silmek istiyor musun?'))return;db.exchangePlans=db.exchangePlans.filter(row=>row.id!==planId);save();if(page==='profile')profile();else render();toast('Değişim hesabı silindi.');};
const profileBeforeExchangePlanDelete=window.profile;
window.profile=function profile(){profileBeforeExchangePlanDelete();if(patientTab!=='Değişimler')return;const patient=selected||db.patients[0],plans=db.exchangePlans.filter(plan=>plan.patient===patient?.id).slice().sort((a,b)=>String(b.updatedAt||b.date||'').localeCompare(String(a.updatedAt||a.date||''))),rows=[...document.querySelectorAll('#ptab tbody tr')];plans.forEach((plan,index)=>{const toolbar=rows[index]?.querySelector('.toolbar');if(!toolbar)return;const button=document.createElement('button');button.className='btn light small';button.type='button';button.textContent='Sil';button.onclick=()=>deleteExchangePlan(plan.id);toolbar.append(button);});};
const dietsBeforeExchangePlanDelete=views.diets;
views.diets=function diets(){dietsBeforeExchangePlanDelete();const plans=db.exchangePlans.slice().reverse(),rows=[...document.querySelectorAll('#view .card table tbody tr')].slice(0,plans.length);plans.forEach((plan,index)=>{const toolbar=rows[index]?.querySelector('.toolbar');if(!toolbar)return;const button=document.createElement('button');button.className='btn light small';button.type='button';button.textContent='Sil';button.onclick=()=>deleteExchangePlan(plan.id);toolbar.append(button);});};

// Restore a device-local backup when moving to a new app installation.
window.restoreBackup = function restoreBackup() {
  if (!confirm('Mevcut NutriPeer verilerin önce ayrıca yedek dosyası olarak indirilecek. Sonra seçtiğin yedek geri yüklenecek. Devam edilsin mi?')) return;
  try {
    if (typeof window.backup !== 'function') throw new Error('Yedek alma işlevi bulunamadı.');
    window.backup();
  } catch (error) {
    toast(error.message || 'Mevcut veriler yedeklenemedi; içe aktarma iptal edildi.');
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const restored = JSON.parse(await file.text());
      const required = ['users', 'patients', 'appointments', 'diets', 'templates', 'measurements', 'foods'];
      if (!restored || typeof restored !== 'object' || Array.isArray(restored) || required.some(key => !Array.isArray(restored[key]))) {
        throw new Error('Bu dosya geçerli bir NutriPeer yedeği değil.');
      }
      if (restored.session !== null && typeof restored.session !== 'string') {
        throw new Error('Yedekteki hesap oturumu geçersiz.');
      }
      if (!confirm('Seçilen yedekteki kayıtlar bu cihazdaki çalışma alanının yerine yüklenecek. Mevcut verilerinin yedeği az önce indirildi. Devam edilsin mi?')) return;
      for (const key of ['exchanges', 'recipes', 'exchangePlans', 'labs']) {
        if (!Array.isArray(restored[key])) restored[key] = [];
      }
      if (window.NUTRIPEER_COMMUNITY_CONFIG?.managed) {
        restored.users = db.users;
        restored.session = db.session;
      }
      const previousDb = db;
      db = restored;
      try {
        save();
      } catch (error) {
        db = previousDb;
        throw new Error(`Yedek bu cihazda saklanamadı. Eski çalışma alanın korundu. ${error.message || ''}`.trim());
      }
      render();
      toast('Yedek bu cihaza aktarıldı. Önceki verilerin yedeği İndirilenler klasöründe.');
    } catch (error) {
      toast(error.message || 'Yedek dosyası okunamadı.');
    }
  };
  input.click();
};
const renderBeforeLocalBackupImport=window.render;
window.render=function render(){renderBeforeLocalBackupImport();const nav=document.querySelector('.nav'),backupButton=[...(nav?.querySelectorAll('button')||[])].find(button=>button.textContent.includes('Yedekle'));if(backupButton&&!document.querySelector('#restore-backup-button')){const button=document.createElement('button');button.id='restore-backup-button';button.type='button';button.innerHTML='<i>⇧</i> Yedekten geri yükle';button.onclick=window.restoreBackup;backupButton.after(button);}};

const communitySettingsBeforeManagedConfig=window.communitySettings;
window.communitySettings=function communitySettings(){if(!communityConfig().managed)return communitySettingsBeforeManagedConfig();modal('<h2>NutriPeer ortak kütüphanesi</h2><p class="sub">Bu uygulama NutriPeer tarafından yönetilen ortak katalog sunucusuna bağlı. Bağlantı ayarları her kullanıcı için aynı tutulur.</p><div class="notice">Danışan kayıtların bu cihazda kalır. Ortak besin, değişim ve yemek katkıları hesabınla onaya gönderilir; onaylanan kayıtlar ekipte görünür.</div><div class="formactions"><button type="button" class="btn" onclick="closeModal()">Tamam</button></div>');};
// Use an in-app print preview instead of window.open: Tauri WebView2 blocks
// implicit secondary windows by default, while in-app editing and printing work on both platforms.
window.npPrintAddLine = function npPrintAddLine(button) {
  const list = button.previousElementSibling;
  if (!list) return;
  const row = document.createElement('li');
  row.className = 'np-print-line';
  row.innerHTML = '<span contenteditable="true" class="np-print-edit">Yeni besin / porsiyon</span><button class="np-print-tool np-print-no" type="button" onclick="npPrintRemoveLine(this)">Satırı sil</button>';
  list.append(row);
  row.querySelector('span')?.focus();
};
window.npPrintRemoveLine = function npPrintRemoveLine(button) { button.closest('li')?.remove(); };
window.npPrintRemoveMeal = function npPrintRemoveMeal(button) {
  if (confirm('Bu öğünü yazdırılacak kopyadan kaldır?')) button.closest('.np-print-meal')?.remove();
};
window.npPrintAddMeal = function npPrintAddMeal() {
  const host = document.querySelector('#np-print-meals');
  if (!host) return;
  const row = document.createElement('section');
  row.className = 'np-print-meal';
  row.innerHTML = '<header><span class="np-print-number">+</span><h2 contenteditable="true" class="np-print-edit">Yeni öğün</h2><button class="np-print-tool np-print-no" type="button" onclick="npPrintRemoveMeal(this)">Öğünü kaldır</button></header><ul><li class="np-print-line"><span contenteditable="true" class="np-print-edit">Yeni besin / porsiyon</span><button class="np-print-tool np-print-no" type="button" onclick="npPrintRemoveLine(this)">Satırı sil</button></li></ul><button class="np-print-tool np-print-no" type="button" onclick="npPrintAddLine(this)">＋ Satır ekle</button>';
  host.append(row);
  row.querySelector('h2')?.focus();
};
window.printDiet = function printDiet(dietId) {
  const diet = db.diets.find(row => row.id === dietId);
  if (!diet) return;
  const patient = db.patients.find(row => row.id === diet.patient);
  const groups = new Map();
  (diet.foods || []).forEach(item => {
    const mealIndex = Number(item.meal) || 0;
    const mealName = diet.mealNames?.[mealIndex] || `Öğün ${mealIndex + 1}`;
    if (!groups.has(mealIndex)) groups.set(mealIndex, { name: mealName, items: [] });
    const food = db.foods.find(row => row.id === item.food);
    if (food || item.type === 'exchange' || item.type === 'recipe') {
      groups.get(mealIndex).items.push(window.itemQuantityText(item, food, true));
    }
  });
  const mealHtml = [...groups].sort((a, b) => a[0] - b[0]).map(([index, group]) =>
    `<section class="np-print-meal"><header><span class="np-print-number">${String(index + 1).padStart(2, '0')}</span><h2 contenteditable="true" class="np-print-edit">${esc(group.name)}</h2><button class="np-print-tool np-print-no" type="button" onclick="npPrintRemoveMeal(this)">Öğünü kaldır</button></header><ul>${group.items.map(value => `<li class="np-print-line"><span contenteditable="true" class="np-print-edit">${esc(value)}</span><button class="np-print-tool np-print-no" type="button" onclick="npPrintRemoveLine(this)">Satırı sil</button></li>`).join('')}</ul><button class="np-print-tool np-print-no" type="button" onclick="npPrintAddLine(this)">＋ Satır ekle</button></section>`
  ).join('');
  const oldNotes = diet.printNotes || {};
  const noteParts = [['Not', oldNotes.notes], ['İlaç / takviye saatleri', oldNotes.medications], ['İçecekler', oldNotes.drinks], ['Hatırlatmalar', oldNotes.reminders]].filter(([, value]) => String(value || '').trim());
  const noteHtml = noteParts.map(([label, value]) => `<p><b>${esc(label)}:</b> ${esc(value).replace(/\n/g, '<br>')}</p>`).join('');
  if (!document.querySelector('#np-print-style')) {
    const style = document.createElement('style');
    style.id = 'np-print-style';
    style.textContent = `
      #modal .np-print-preview-modal{width:min(980px,96vw);max-height:calc(100vh - 32px);overflow:auto;padding:12px;background:#eef2ed}
      .np-print-actions{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 auto 12px;max-width:820px}
      .np-print-page{max-width:820px;margin:0 auto;background:#fff;padding:32px 42px;box-shadow:0 3px 24px #20372b18;color:#20372b;font:14px 'Segoe UI',Arial,sans-serif}
      .np-print-brand{display:flex;justify-content:space-between;border-bottom:1px solid #dce9de;padding-bottom:14px;color:#286b4d;font-weight:700}
      .np-print-title{padding:22px 0 15px}.np-print-title h1{margin:5px 0;color:#183b2a}
      .np-print-patient{background:#f3f7f2;padding:12px 15px;border-radius:10px;margin-bottom:12px}
      .np-print-meal{padding:12px 2px;border-bottom:1px solid #e8eee8;break-inside:avoid}.np-print-meal header{display:flex;align-items:center;gap:10px}.np-print-meal h2{color:#286b4d;font-size:16px;flex:1}.np-print-number{color:#95a39a}
      .np-print-meal ul{line-height:1.75;margin:4px 0 8px;padding-left:34px}.np-print-line{display:flex;align-items:baseline;gap:8px}.np-print-line span{flex:1;min-width:0}
      .np-print-notes{margin-top:20px;padding:14px;border:1px solid #dce9de;border-radius:10px;min-height:76px}.np-print-notes h2{font-size:14px;color:#286b4d;margin:0 0 8px}.np-print-free{min-height:42px;white-space:pre-wrap}
      .np-print-footer{margin-top:24px;padding-top:12px;border-top:1px solid #e8eee8;color:#849087;font-size:10px;display:flex;justify-content:space-between}.np-print-edit{outline:1px dashed #b8c9bb;outline-offset:3px}.np-print-tool{border:1px solid #cbd8cd;background:#fff;color:#355f43;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:12px}
      @page{size:A4;margin:17mm}@media print{body *{visibility:hidden!important}#np-print-document,#np-print-document *{visibility:visible!important}#np-print-document{position:fixed!important;inset:0 auto auto 0!important;width:100%!important;max-width:none!important;min-height:100vh;margin:0!important;padding:0!important;box-shadow:none!important;border-radius:0!important}.np-print-no{display:none!important}.np-print-edit{outline:none!important}#modal{position:static!important}}
    `;
    document.head.append(style);
  }
  modal(`<div class="np-print-preview-modal"><div class="np-print-actions np-print-no"><strong>Yazdırma ön izlemesi · Satırlar ve öğünler yalnızca bu çıktıda değişir</strong><div><button class="btn light small" type="button" onclick="closeModal()">Kapat</button> <button class="btn small" type="button" onclick="window.print()">Yazdır / PDF</button></div></div><div id="np-print-document" class="np-print-page"><div class="np-print-brand"><span>✳ NutriPeer · Kişiye özel beslenme planı</span><span>${esc(iso(new Date()))}</span></div><div class="np-print-title"><div class="sub">BESLENME PLANI</div><h1 contenteditable="true" class="np-print-edit">${esc(diet.name)}</h1><div>${esc(diet.date || '')}</div></div><div class="np-print-patient"><b>Danışan:</b> ${esc(patient ? `${patient.first} ${patient.last}` : '—')} ${patient?.phone ? `· ${esc(patient.phone)}` : ''}</div><div class="np-print-actions np-print-no"><button class="np-print-tool" type="button" onclick="npPrintAddMeal()">＋ Öğün ekle</button></div><main id="np-print-meals">${mealHtml}</main><section class="np-print-notes"><h2>Notlar</h2>${noteHtml}<div contenteditable="true" class="np-print-free np-print-edit" data-placeholder="Bu çıktı için not ekleyin…"></div></section><footer class="np-print-footer"><span>Hazırlayan: NutriPeer</span><span>Bu beslenme planı danışanınıza özel hazırlanmıştır.</span></footer></div></div>`);
};
// Seed the common starter foods when a user opens the diet composer first.
// Previously the catalog was seeded only when the Foods page was visited.
function ensureStarterFoodsForDietMenu() {
  if (!Array.isArray(db.foods)) db.foods = [];
  if (db.foods.length || typeof foodsSeed === 'undefined') return;
  db.foods = foodsSeed.map(([name, serving, cho, protein, fat]) => ({ id: id(), name, serving, cho, protein, fat }));
  save();
}
const newDietBeforeStarterFoods = window.newDiet;
window.newDiet = function newDiet(...args) {
  ensureStarterFoodsForDietMenu();
  return newDietBeforeStarterFoods(...args);
};
const openDietMenuBuilderBeforeStarterFoods = window.openDietMenuBuilder;
window.openDietMenuBuilder = function openDietMenuBuilder(...args) {
  ensureStarterFoodsForDietMenu();
  return openDietMenuBuilderBeforeStarterFoods(...args);
};
