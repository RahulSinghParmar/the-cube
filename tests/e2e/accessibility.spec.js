import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('new interface and settings pass automated WCAG AA checks in each theme',async({page})=>{
  await page.goto('/the-cube/');
  for(const theme of ['light','dark','contrast']){
    await page.getByRole('link',{name:'Settings',exact:true}).click();
    await page.getByRole('combobox',{name:'Appearance'}).selectOption(theme);await page.getByRole('button',{name:'Save preferences'}).click();
    for(const route of ['#/settings','#/play']){
      await page.goto(`/the-cube/${route}`);
      await expect(page.locator('h1')).toBeVisible();
      const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
    }
  }
});
