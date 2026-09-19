import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';
import { writeFile } from 'node:fs/promises';
const result=[];
for(const size of [2,3,4,5]) {
  const puzzle=await puzzles[`${size}x${size}x${size}`].kpuzzle();
  for(const sequence of ['R U R\' U\'', 'Rw', '2R', 'M', '[R,U]', '(R U)3']) {
    try {
      const alg=new Alg(sequence), start=puzzle.defaultPattern();
      const final=start.applyAlg(alg).applyAlg(alg.invert());
      result.push({size,sequence,accepted:true,inverseRestores:final.isIdentical(start)});
    } catch(error) {result.push({size,sequence,accepted:false,error:String(error)});}
  }
}
await writeFile('results/notation.json',JSON.stringify(result,null,2)+'\n');console.log(result);
