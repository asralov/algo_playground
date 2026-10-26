const search=document.getElementById('search');
const cards=[...document.querySelectorAll('.project-card')];
const filters=[...document.querySelectorAll('[data-filter]')];
let category='all';
function filterProjects(){
  const terms=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);let visible=0;
  cards.forEach(card=>{const text=(card.dataset.search+' '+card.querySelector('.card-category').textContent).toLowerCase();const show=(category==='all'||category===card.dataset.category)&&terms.every(term=>text.includes(term));card.hidden=!show;if(show)visible++;});
  filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===category)));
  document.getElementById('results').textContent=`${visible} of ${cards.length} visualizers`;
  document.getElementById('no-results').hidden=visible!==0;
}
filters.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;filterProjects();}));
search.addEventListener('input',filterProjects);
document.getElementById('clear-search').addEventListener('click',()=>{category='all';search.value='';filterProjects();search.focus();});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,select,[contenteditable]')){event.preventDefault();search.focus();}if(event.key==='Escape'&&event.target===search){search.value='';filterProjects();}});
filterProjects();
