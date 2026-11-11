const assert=require('node:assert/strict');
// Emulate visual viewport changes and WebKit's displaced fixed ancestor.
// This verifies our geometry; it is not a physical iOS keyboard test.
module.exports=async function checkMessageKeyboard(page,width){
 const before=await page.locator('#cm-text').inputValue();
 await page.evaluate(()=>{
  window.messageViewportDescriptor=Object.getOwnPropertyDescriptor(window,'visualViewport');
  window.messageSafeBottom=document.documentElement.style.getPropertyValue('--safe-bottom');
  window.messageKeyboard={height:innerHeight,offsetTop:0};
  Object.defineProperty(window,'visualViewport',{configurable:true,value:messageKeyboard});
  document.documentElement.style.setProperty('--safe-bottom','34px');cmViewport();
 });
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
 await page.evaluate(()=>{if(messageViewportDescriptor)Object.defineProperty(window,'visualViewport',messageViewportDescriptor);else delete window.visualViewport;if(messageSafeBottom)document.documentElement.style.setProperty('--safe-bottom',messageSafeBottom);else document.documentElement.style.removeProperty('--safe-bottom');cmViewport();});
 const restored=await page.evaluate(async()=>{
  closeModal();ui.tab='today';render();window.scrollTo(0,120);const y=window.scrollY;
  await cmOpen();const locked=CM.viewportLock.y;closeModal();const after=window.scrollY,position=document.body.style.position,rootLocked=document.documentElement.classList.contains('cm-scroll-lock');
  await cmOpen();return {y,locked,after,position,rootLocked};
 });
 assert.equal(restored.locked,restored.y);assert.equal(restored.after,restored.y);assert.notEqual(restored.position,'fixed');assert.equal(restored.rootLocked,false);
 console.log(JSON.stringify({width,keyboardViewportGeometry:true,pannedFixedBackdrop:true,keyboardSafeArea:true,menuRemoved:true}));
};
