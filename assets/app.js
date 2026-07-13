
const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];
const state = {
  media: JSON.parse(localStorage.getItem('myeye_media') || '[]'),
  albums: JSON.parse(localStorage.getItem('myeye_albums') || '[]'),
  currentId: null,
  filter: 'all',
  search: '',
  stream: null,
  facingMode: 'environment'
};

const save = () => {
  localStorage.setItem('myeye_media', JSON.stringify(state.media));
  localStorage.setItem('myeye_albums', JSON.stringify(state.albums));
  updateStorage();
};
const toast = (msg) => {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),2500);
};
const id = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2);

function showView(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  $$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  $('.sidebar').classList.remove('open');
  if(name==='gallery') renderGallery();
  if(name==='favorites') renderFavorites();
  if(name==='albums') renderAlbums();
  if(name==='home') renderRecent();
  window.scrollTo({top:0,behavior:'smooth'});
}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
$('#menuToggle').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));

function mediaCard(item){
  const el=document.createElement('article'); el.className='media-card'; el.dataset.id=item.id;
  const preview=item.type.startsWith('video') ? `<video src="${item.data}" muted></video>` : `<img src="${item.data}" alt="${escapeHtml(item.name)}">`;
  el.innerHTML=`${preview}<div class="media-overlay"><strong>${escapeHtml(item.name)}</strong><button class="fav-mini ${item.favorite?'active':''}" aria-label="Favorit">♥</button></div>`;
  el.addEventListener('click',e=>{ if(!e.target.closest('.fav-mini')) openMedia(item.id); });
  $('.fav-mini',el).addEventListener('click',e=>{e.stopPropagation();toggleFavorite(item.id);});
  return el;
}
function escapeHtml(s=''){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

function renderGallery(){
  const grid=$('#galleryGrid'); grid.innerHTML='';
  let list=[...state.media];
  if(state.filter==='image') list=list.filter(x=>x.type.startsWith('image'));
  if(state.filter==='video') list=list.filter(x=>x.type.startsWith('video'));
  if(state.filter==='favorite') list=list.filter(x=>x.favorite);
  if(state.search) list=list.filter(x=>x.name.toLowerCase().includes(state.search));
  const sort=$('#sortMedia').value;
  list.sort((a,b)=>sort==='oldest'?a.created-b.created:sort==='name'?a.name.localeCompare(b.name):b.created-a.created);
  if(!list.length){grid.className='media-grid large empty-state';grid.textContent='Ingen filer matcher dit valg.';return}
  grid.className='media-grid large'; list.forEach(x=>grid.append(mediaCard(x)));
}
function renderRecent(){
  const grid=$('#recentGrid'); grid.innerHTML='';
  const list=[...state.media].sort((a,b)=>b.created-a.created).slice(0,4);
  if(!list.length){grid.className='media-grid compact empty-state';grid.textContent='Ingen billeder endnu';return}
  grid.className='media-grid compact'; list.forEach(x=>grid.append(mediaCard(x)));
}
function renderFavorites(){
  const grid=$('#favoriteGrid'); grid.innerHTML=''; const list=state.media.filter(x=>x.favorite);
  if(!list.length){grid.className='media-grid large empty-state';grid.textContent='Du har endnu ikke markeret nogen favoritter.';return}
  grid.className='media-grid large'; list.forEach(x=>grid.append(mediaCard(x)));
}
function renderAlbums(){
  const grid=$('#albumGrid');grid.innerHTML='';
  const defaults=[{id:'recent',name:'Seneste',description:'Dine nyeste billeder'},{id:'family',name:'Familie',description:'Personlige minder'},{id:'travel',name:'Rejser',description:'Steder og oplevelser'}];
  [...defaults,...state.albums].forEach(a=>{
    const el=document.createElement('article');el.className='album-card';
    el.innerHTML=`<strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(a.description||'Privat album')}</small>`;
    grid.append(el);
  });
}
function toggleFavorite(mediaId){
  const item=state.media.find(x=>x.id===mediaId); if(!item)return;
  item.favorite=!item.favorite; save(); renderGallery(); renderRecent(); renderFavorites();
  toast(item.favorite?'Føjet til favoritter':'Fjernet fra favoritter');
}
function openMedia(mediaId){
  const item=state.media.find(x=>x.id===mediaId); if(!item)return;
  state.currentId=mediaId;
  $('#mediaPreview').innerHTML=item.type.startsWith('video')?`<video src="${item.data}" controls autoplay></video>`:`<img src="${item.data}" alt="">`;
  $('#mediaTitle').textContent=item.name;
  $('#mediaMeta').textContent=`${new Date(item.created).toLocaleString('da-DK')} · ${formatBytes(item.size||0)}`;
  $('#favoriteBtn').textContent=item.favorite?'♥ Fjern favorit':'♡ Favorit';
  $('#mediaDialog').showModal();
}
$('[data-close]').addEventListener('click',()=>$('#mediaDialog').close());
$('#favoriteBtn').addEventListener('click',()=>{toggleFavorite(state.currentId);openMedia(state.currentId)});
$('#deleteBtn').addEventListener('click',()=>{
  if(!confirm('Vil du slette denne fil?'))return;
  state.media=state.media.filter(x=>x.id!==state.currentId);save();$('#mediaDialog').close();renderGallery();renderRecent();renderFavorites();toast('Filen er slettet');
});
$('#downloadBtn').addEventListener('click',()=>{
  const item=state.media.find(x=>x.id===state.currentId);if(!item)return;
  const a=document.createElement('a');a.href=item.data;a.download=item.name;a.click();
});

const fileInput=$('#fileInput');
['quickUpload','homeUpload','galleryUpload','mobileAdd'].forEach(k=>$('#'+k)?.addEventListener('click',()=>fileInput.click()));
fileInput.addEventListener('change',async e=>{
  for(const file of [...e.target.files]){
    if(file.size>8*1024*1024){toast(`${file.name} er for stor til lokal demo (maks. 8 MB)`);continue}
    const data=await readFile(file);
    state.media.push({id:id(),name:file.name,type:file.type||'application/octet-stream',size:file.size,created:Date.now(),favorite:false,data});
  }
  save();fileInput.value='';renderGallery();renderRecent();showView('gallery');toast('Filerne er tilføjet');
});
function readFile(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}

$('#globalSearch').addEventListener('input',e=>{state.search=e.target.value.trim().toLowerCase();if(state.search){showView('gallery');renderGallery()}});
$$('.filter-tabs button').forEach(b=>b.addEventListener('click',()=>{
  $$('.filter-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderGallery();
}));
$('#sortMedia').addEventListener('change',renderGallery);

async function startCamera(){
  try{
    stopCamera();
    state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:state.facingMode},audio:false});
    $('#cameraVideo').srcObject=state.stream;$('#cameraPlaceholder').classList.add('hidden');
  }catch(err){toast('Kameraadgang blev afvist eller er ikke tilgængelig');}
}
function stopCamera(){
  if(state.stream){state.stream.getTracks().forEach(t=>t.stop());state.stream=null}
  $('#cameraPlaceholder').classList.remove('hidden');
}
$('#startCamera').addEventListener('click',startCamera);
$('#stopCamera').addEventListener('click',stopCamera);
$('#switchCamera').addEventListener('click',async()=>{state.facingMode=state.facingMode==='environment'?'user':'environment';await startCamera()});
$('#captureBtn').addEventListener('click',()=>{
  if(!state.stream){toast('Start kameraet først');return}
  const v=$('#cameraVideo'),c=$('#captureCanvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);
  const data=c.toDataURL('image/jpeg',.92);
  state.media.push({id:id(),name:`MYEYE_${new Date().toISOString().replace(/[:.]/g,'-')}.jpg`,type:'image/jpeg',size:data.length,created:Date.now(),favorite:false,data});
  save();renderRecent();toast('Billedet er gemt');
});

$('#createAlbumBtn').addEventListener('click',()=>$('#albumDialog').showModal());
$('#albumForm').addEventListener('submit',e=>{
  e.preventDefault();const name=$('#albumName').value.trim();if(!name)return;
  state.albums.push({id:id(),name,description:$('#albumDescription').value.trim(),created:Date.now()});save();
  $('#albumDialog').close();e.target.reset();renderAlbums();toast('Albummet er oprettet');
});

$('#createShareLink').addEventListener('click',()=>{
  const token=Math.random().toString(36).slice(2,10).toUpperCase();
  const link=`https://visio.local/del/${token}`;
  const r=$('#shareResult');r.classList.remove('hidden');r.innerHTML=`<strong>Delingslink oprettet</strong><br>${link}<br><button class="text-btn" id="copyShare">Kopiér link</button>`;
  $('#copyShare').addEventListener('click',()=>navigator.clipboard?.writeText(link).then(()=>toast('Link kopieret')));
});

$('#clearAll').addEventListener('click',()=>{
  if(!confirm('Dette sletter alle billeder, album og lokale data i MyEye. Fortsæt?'))return;
  state.media=[];state.albums=[];save();renderGallery();renderRecent();renderFavorites();renderAlbums();toast('Alle lokale data er slettet');
});
function formatBytes(n){if(!n)return '0 KB';const u=['B','KB','MB','GB'];const i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),3);return `${(n/1024**i).toFixed(i?1:0)} ${u[i]}`}
function updateStorage(){
  const bytes=new Blob([localStorage.getItem('myeye_media')||'']).size;
  $('#storageLabel').textContent=formatBytes(bytes);
  $('#storageBar').style.width=Math.min(100,Math.max(2,bytes/(50*1024*1024)*100))+'%';
  $('#storageDetails').textContent=`${state.media.length} filer · ${state.albums.length} egne album · ${formatBytes(bytes)} brugt lokalt`;
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden')});
$('#installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').classList.add('hidden')});
if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(()=>{});



// ===== Telefonens indbyggede kamera og video =====
let latestCaptureId = null;
let selectedNativeMode = 'photo';

const nativeModeMap = {
  photo: { input: '#nativePhotoInput', label: 'Foto' },
  video: { input: '#nativeVideoInput', label: 'Video' },
  document: { input: '#nativeDocumentInput', label: 'Dokument' },
  portrait: { input: '#nativePortraitInput', label: 'Portræt' }
};

function selectNativeMode(mode){
  selectedNativeMode = mode;
  $$('.native-mode').forEach(btn => btn.classList.remove('active'));
  const selected = {
    photo: '#nativePhotoBtn',
    video: '#nativeVideoBtn',
    document: '#nativeDocumentBtn',
    portrait: '#nativePortraitBtn'
  }[mode];
  $(selected)?.classList.add('active');
}

function openNativeCapture(mode = selectedNativeMode){
  selectNativeMode(mode);
  const target = nativeModeMap[mode];
  if(!target) return;
  $(target.input).click();
}

$('#nativePhotoBtn')?.addEventListener('click', () => openNativeCapture('photo'));
$('#nativeVideoBtn')?.addEventListener('click', () => openNativeCapture('video'));
$('#nativeDocumentBtn')?.addEventListener('click', () => openNativeCapture('document'));
$('#nativePortraitBtn')?.addEventListener('click', () => openNativeCapture('portrait'));
$('#nativeShutterBtn')?.addEventListener('click', () => openNativeCapture(selectedNativeMode));

async function compressCapturedImage(file, mode){
  const raw = await readFile(file);
  return await new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const maxSide = mode === 'document' ? 2200 : 1800;
      let {width, height} = img;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if(mode === 'document'){
        ctx.filter = 'contrast(1.12) saturate(.82)';
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', mode === 'document' ? .9 : .86));
    };
    img.onerror = () => resolve(raw);
    img.src = raw;
  });
}

async function handleNativeCapture(file, mode){
  if(!file) return;

  const isVideo = file.type.startsWith('video');
  let data;

  if(isVideo){
    if(file.size > 18 * 1024 * 1024){
      toast('Videoen er for stor til denne webversion. Vælg en kortere video.');
      return;
    }
    data = await readFile(file);
  }else{
    data = await compressCapturedImage(file, mode);
  }

  const prefix = {
    photo: 'MYEYE_FOTO',
    video: 'MYEYE_VIDEO',
    document: 'MYEYE_DOKUMENT',
    portrait: 'MYEYE_PORTRAET'
  }[mode] || 'MYEYE';

  const ext = isVideo ? (file.name.split('.').pop() || 'mp4') : 'jpg';
  const item = {
    id: id(),
    name: `${prefix}_${new Date().toISOString().replace(/[:.]/g,'-')}.${ext}`,
    type: isVideo ? file.type : 'image/jpeg',
    size: isVideo ? file.size : data.length,
    created: Date.now(),
    favorite: false,
    category: mode,
    data
  };

  try{
    state.media.push(item);
    save();
  }catch(error){
    state.media = state.media.filter(x => x.id !== item.id);
    toast('Filen kunne ikke gemmes lokalt. Den kan være for stor.');
    return;
  }

  latestCaptureId = item.id;
  renderCapturePreview();
  renderRecent();
  renderGallery();
  toast(`${nativeModeMap[mode].label} er gemt i MyEye`);
}

[
  ['#nativePhotoInput','photo'],
  ['#nativeVideoInput','video'],
  ['#nativeDocumentInput','document'],
  ['#nativePortraitInput','portrait']
].forEach(([selector, mode]) => {
  $(selector)?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    await handleNativeCapture(file, mode);
  });
});

function renderCapturePreview(){
  const box = $('#capturePreview');
  const actions = $('#captureActions');
  const clearBtn = $('#clearCapturePreview');
  const item = state.media.find(x => x.id === latestCaptureId);

  if(!item){
    box.className = 'capture-preview empty-state';
    box.textContent = 'Intet billede eller video er taget endnu.';
    actions?.classList.add('hidden');
    clearBtn?.classList.add('hidden');
    return;
  }

  box.className = 'capture-preview';
  box.innerHTML = item.type.startsWith('video')
    ? `<video src="${item.data}" controls playsinline></video>`
    : `<img src="${item.data}" alt="${escapeHtml(item.name)}">`;

  actions?.classList.remove('hidden');
  clearBtn?.classList.remove('hidden');
  $('#captureFavorite').textContent = item.favorite ? '♥ Fjern favorit' : '♡ Favorit';
}

$('#clearCapturePreview')?.addEventListener('click', () => {
  latestCaptureId = null;
  renderCapturePreview();
});

$('#captureFavorite')?.addEventListener('click', () => {
  if(!latestCaptureId) return;
  toggleFavorite(latestCaptureId);
  renderCapturePreview();
});

$('#captureGallery')?.addEventListener('click', () => showView('gallery'));

$('#captureDownload')?.addEventListener('click', () => {
  const item = state.media.find(x => x.id === latestCaptureId);
  if(!item) return;
  const link = document.createElement('a');
  link.href = item.data;
  link.download = item.name;
  link.click();
});

$('#captureDelete')?.addEventListener('click', () => {
  if(!latestCaptureId || !confirm('Vil du slette den seneste optagelse?')) return;
  state.media = state.media.filter(x => x.id !== latestCaptureId);
  latestCaptureId = null;
  save();
  renderCapturePreview();
  renderRecent();
  renderGallery();
  renderFavorites();
  toast('Optagelsen er slettet');
});

// Hovedknapper til kamera åbner nu telefonens rigtige kamera på mobil
$$('[data-view="camera"]').forEach(button => {
  if(button.id === 'menuToggle') return;
});
renderCapturePreview();

renderRecent();renderGallery();renderFavorites();renderAlbums();updateStorage();
