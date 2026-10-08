function showPage(id){
 $$(".section").forEach(s=>s.classList.toggle("active",s.id===id));$$(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));window.scrollTo({top:0,behavior:"smooth"});drawAll();
}
$$(".nav").forEach(n=>n.onclick=()=>showPage(n.dataset.page));
$$("[data-home]").forEach(b=>b.onclick=()=>showPage("home"));
document.addEventListener("keydown",e=>{if(!S.settings.keyboard||e.target.matches("input,textarea,button"))return;const k=e.key;if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(k))return;e.preventDefault();if(k==="ArrowUp")S.player.z=Math.max(-18,S.player.z-1);if(k==="ArrowDown")S.player.z=Math.min(18,S.player.z+1);if(k==="ArrowLeft")S.player.x=Math.max(-18,S.player.x-1);if(k==="ArrowRight")S.player.x=Math.min(18,S.player.x+1);S.steps++;save();updateUI();drawAll()});
