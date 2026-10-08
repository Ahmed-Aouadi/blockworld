const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const TYPES={
 move:{label:"⬆ تحرّك للأمام",cls:"blue"},turn:{label:"↪ استدر يمينًا",cls:"blue"},jump:{label:"↟ اقفز",cls:"purple"},
 repeat:{label:"⟳ كرر 3 مرات",cls:"yellow"},collect:{label:"✦ اجمع موردًا",cls:"green"},plant:{label:"🌱 ازرع بذرة",cls:"cyan"},build:{label:"⌂ ابنِ منزلًا",cls:"orange"}
};
const ACH=[
 ["first","🚀","أول انطلاقة","شغّل برنامجًا واحدًا"],["collector","🪵","جامع الموارد","اجمع الخشب"],["gardener","🌱","البستاني","ازرع بذرة"],["builder","🏡","البنّاء","ابنِ منزلاً بثلاثة أخشاب"],["loop","⟳","سيد التكرار","استخدم أمر التكرار"],["explorer","🧭","المستكشف","استكشف العالم"]
];
const defaultState={program:[],xp:0,used:0,wood:0,gem:0,seeds:3,fish:0,food:0,steps:0,rotation:0,player:{x:0,z:0},plants:[],house:false,ach:{},ran:false,explores:0,settings:{keyboard:true,hints:true}};
let S=load();let history=[];let camera={x:0,y:0,drag:false,lx:0,ly:0};

function load(){try{return {...defaultState,...JSON.parse(localStorage.getItem("blockverse-v2")||"{}")}}catch(e){return structuredClone(defaultState)}}
function save(){localStorage.setItem("blockverse-v2",JSON.stringify(S))}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(()=>e.classList.remove("show"),2200)}
function modal(title,text){$("#modalTitle").textContent=title;$("#modalText").textContent=text;$("#modal").classList.add("show");$("#closeModal").focus()}
$("#closeModal").onclick=()=>$("#modal").classList.remove("show");
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")$("#modal").classList.remove("show")});
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#modal").classList.remove("show")});
