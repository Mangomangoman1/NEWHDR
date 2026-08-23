(function(){
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var progress=document.querySelector('.tip-progress');
  function updateProgress(){
    var root=document.documentElement;
    var max=root.scrollHeight-root.clientHeight;
    if(progress) progress.style.width=(max>0?root.scrollTop/max*100:0)+'%';
  }
  window.addEventListener('scroll',updateProgress,{passive:true});
  updateProgress();
  var items=[].slice.call(document.querySelectorAll('.reveal'));
  if(reduced||!('IntersectionObserver' in window)){
    items.forEach(function(item){item.classList.add('in')});
    return;
  }
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){entry.target.classList.add('in');observer.unobserve(entry.target)}
    });
  },{rootMargin:'0px 0px -7% 0px',threshold:.06});
  items.forEach(function(item){observer.observe(item)});
})();
