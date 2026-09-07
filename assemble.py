import base64, os, pathlib, json, sys
HERE = pathlib.Path(__file__).parent
D = '/home/claude/patient/public/photos'
SP = '/tmp/claude-0/-home-claude/561977e5-bfc3-53b4-a0bf-51218d03bb69/scratchpad'
sys.path.insert(0, SP)
import chartdata

def b64(n): return 'data:image/jpeg;base64,'+base64.b64encode(open(os.path.join(D,n),'rb').read()).decode()

IMG = { 'hero':'hero.jpg','steps':'steps.jpg','quiet':'quiet.jpg','bright':'bright.jpg',
        'phone':'phone.jpg','teen':'face-teen.jpg','family':'family.jpg','pro':'counselor.jpg',
        'appStudent':'app-student.jpg','appParent':'app-parent.jpg','appPro':'app-counselor.jpg' }
MOSAIC = [('family','A parent and teenager at the kitchen table','col-span-2 row-span-2'),
 ('corridor','A student in a school corridor','row-span-2'),
 ('track','A runner catching their breath after practice',''),
 ('study','A teenager studying in the evening',''),
 ('sofa','A teenager and her mother laughing','row-span-2'),
 ('steps','Teenagers together on school steps','col-span-2'),
 ('phone','Hands holding a phone',''),
 ('dogwalk','A father and son walking the dog','col-span-2'),
 ('bright','Two teenagers laughing outdoors','row-span-2'),
 ('flatlay','The patch, a phone and a notebook','col-span-2'),
 ('counselor','A counselor with a student',''),
 ('face-teen','A teenager on the walk home','')]

imgs = {k: b64(v) for k,v in IMG.items()}
mos  = [{'k':k,'src':b64(k+'.jpg'),'alt':a,'c':c} for k,a,c in MOSAIC]
data = json.loads(chartdata.BLOB)

css = (HERE/'artifact/app.css').read_text()
js  = (HERE/'artifact/bundle.js').read_text()
vend = '/home/claude/vend/node_modules'
gsap = pathlib.Path(vend+'/gsap/dist/gsap.min.js').read_text()
st   = pathlib.Path(vend+'/gsap/dist/ScrollTrigger.min.js').read_text()
lenis= pathlib.Path(vend+'/lenis/dist/lenis.min.js').read_text()

boot = """
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis){
    var l = new Lenis({ duration:1.05, smoothWheel:true });
    l.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(t){ l.raf(t*1000) });
    gsap.ticker.lagSmoothing(0);
  }
})();
"""
out = f"""<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MindMap Patient Edition</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@500;700;800&family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&family=JetBrains+Mono:wght@400;500&display=swap">
<style>{css}</style>
<div id="root"></div>
<script>window.__IMG={json.dumps(imgs)};window.__MOSAIC={json.dumps(mos)};window.__DATA={json.dumps(data)};</script>
<script>{gsap}</script>
<script>{st}</script>
<script>{lenis}</script>
<script>{boot}</script>
<script>{js}</script>
"""
(pathlib.Path(SP)/'mindmap-patient.html').write_text(out, encoding='utf-8')
print('built', len(out)//1024, 'KB')
