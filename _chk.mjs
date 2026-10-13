import {transform} from 'sucrase'
import fs from 'fs'
const files=process.argv.slice(2)
let bad=0
for(const f of files){
  try{ transform(fs.readFileSync(f,'utf8'),{transforms:['jsx'],jsxRuntime:'automatic'}); console.log('ok  '+f) }
  catch(e){ bad=1; console.log('ERR '+f+': '+e.message) }
}
process.exit(bad)
