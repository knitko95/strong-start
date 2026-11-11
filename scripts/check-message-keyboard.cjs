const assert=require('node:assert/strict');
// Emulate visual viewport changes and WebKit's displaced fixed ancestor.
// This verifies our geometry; it is not a physical iOS keyboard test.
module.exports=async function checkMessageKeyboard(page,width){
 const before=await page.locator('#cm-text').inputValue();
 // Model a Home Screen fixed backdrop moving after the initial measurement,
 // with no resize event and no tap/focus on the input to trigger a correction.
 await page.evaluate(async()=>{
  closeModal();
  const transient=document.createElement('style');transient.textContent='.coach-thread-scrim{transform:translateY(-140px)}';document.head.append(transient);
  await cmOpen();transient.remove();
 });
 await page.waitForFunction(()=>Math.abs(document.querySelector('.coach-thread-sheet').getBoundingClientRect().top-(innerWidth<=600?0:64))<2);
 assert.equal(await page.locator('#cm-text').evaluate(el=>el===document.activeElement),false);
 assert.equal(await page.locator('.cm-composer').evaluate(el=>Math.round(el.getBoundingClientRect().bottom)),844);
 await page.evaluate(()=>{
  window.messageViewportDescriptor=Object.getOwnPropertyDescriptor(window,'visualViewport');
  window.messageSafeBottom=document.documentElement.style.getPropertyValue('--safe-bottom');
  window.messageSafeTop=document.documentElement.style.getPropertyValue('--cm-safe-top');
  window.messageKeyboard={height:innerHeight,offsetTop:0};
  Object.defineProperty(window,'visualViewport',{configurable:true,value:messageKeyboard});
  document.documentElement.style.setProperty('--safe-bottom','34px');document.documentElement.style.setProperty('--cm-safe-top','47px');cmViewport();
 });
 assert.equal(await page.locator('.cm-head').evaluate(el=>getComputedStyle(el).paddingTop),width<=600?'47px':'12px');
 for(const [height,offset,shift] of [[500,0,0],[444,100,0],[410,80,-72],[300,130,-40]]){
  await page.locator('#cm-text').focus();
  await page.evaluate(([height,offset,shift])=>{messageKeyboard.height=height;messageKeyboard.offsetTop=offset;document.querySelector('.coach-thread-scrim').style.transform=`translateY(${shift}px)`;window.dispatchEvent(new Event('resize'));},[height,offset,shift]);
  const geometry=await page.evaluate(()=>{
   const sheet=document.querySelector('.coach-thread-sheet').getBoundingClientRect(),composer=document.querySelector('.cm-composer').getBoundingClientRect(),row=document.querySelector('.cm-compose-row').getBoundingClientRect();
   return {top:sheet.top,bottom:sheet.bottom,composerBottom:composer.bottom,rowBottom:row.bottom,padding:getComputedStyle(document.querySelector('.cm-composer')).paddingBottom,nav:getComputedStyle(document.querySelector('nav.tabs')).display,locked:document.body.style.position,focused:document.activeElement.id};
  });
  assert.ok(Math.abs(geometry.top-offset)<2,JSON.stringify(geometry));assert.ok(Math.abs(geometry.bottom-offset-height)<2,JSON.stringify(geometry));assert.ok(Math.abs(geometry.composerBottom-offset-height)<2,JSON.stringify(geometry));assert.ok(geometry.rowBottom<=offset+height);assert.equal(geometry.padding,'10px');assert.equal(geometry.nav,'none');assert.equal(geometry.locked,'fixed');assert.equal(geometry.focused,'cm-text');
 }
 // Multiline composition and a normal viewport after keyboard dismissal.
 await page.locator('#cm-text').fill('Line one\nLine two\nLine three');
 await page.evaluate(()=>{messageKeyboard.height=innerHeight;messageKeyboard.offsetTop=0;document.querySelector('.coach-thread-scrim').style.transform='';window.dispatchEvent(new Event('resize'));});
 assert.equal(await page.locator('.cm-composer').evaluate(el=>getComputedStyle(el).paddingBottom),'34px');
 assert.equal(await page.locator('.coach-thread-sheet').evaluate(el=>Math.round(el.getBoundingClientRect().bottom)),844);
 await page.locator('#cm-text').fill(before);
 await page.evaluate(()=>{if(messageViewportDescriptor)Object.defineProperty(window,'visualViewport',messageViewportDescriptor);else delete window.visualViewport;if(messageSafeBottom)document.documentElement.style.setProperty('--safe-bottom',messageSafeBottom);else document.documentElement.style.removeProperty('--safe-bottom');if(messageSafeTop)document.documentElement.style.setProperty('--cm-safe-top',messageSafeTop);else document.documentElement.style.removeProperty('--cm-safe-top');cmViewport();});
 const restored=await page.evaluate(async()=>{
  closeModal();ui.tab='today';render();window.scrollTo(0,120);const y=window.scrollY;
  await cmOpen();const locked=CM.viewportLock.y;closeModal();const after=window.scrollY,position=document.body.style.position,rootLocked=document.documentElement.classList.contains('cm-scroll-lock');
  await cmOpen();return {y,locked,after,position,rootLocked};
 });
 assert.equal(restored.locked,restored.y);assert.equal(restored.after,restored.y);assert.notEqual(restored.position,'fixed');assert.equal(restored.rootLocked,false);
 console.log(JSON.stringify({width,initialPositionWithoutTyping:true,keyboardViewportGeometry:true,pannedFixedBackdrop:true,keyboardSafeArea:true,menuRemoved:true}));
};
