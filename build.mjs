import * as esbuild from 'esbuild'
const r = await esbuild.build({
  entryPoints:['src/main.jsx'], bundle:true, minify:true, format:'iife',
  jsx:'automatic', target:['es2019'], outfile:'artifact/bundle.js',
  loader:{'.js':'jsx'}, logLevel:'info', metafile:true,
})
const out = Object.values(r.metafile.outputs)[0]
console.log('bundle', (out.bytes/1024).toFixed(0)+'KB')
