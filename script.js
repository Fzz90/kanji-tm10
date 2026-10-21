'use strict';

// Stroke paths adapted from KanjiVG by Ulrich Apel, CC BY-SA 3.0.
// https://kanjivg.tagaini.net/ | Original retained in assets/05371.svg.
const strokes = [
  'M45.5,10.5c0.06,0.54-0.17,1.49-0.62,2.18c-3,4.57-12.38,15.07-23.13,22.32',
  'M42.25,17.63c2.84,0,17.7-1.87,20.69-2.15c2.56-0.24,3.37,2.31,2.31,3.51c-4.88,5.5-8.62,10.88-15.5,19',
  'M23.69,41.32c2.59,0.79,6.19,0.66,8.83,0.28c12.74-1.85,26.24-3.85,42.49-5.37c3.03-0.28,5.64-0.6,8.63-0.05',
  'M25.72,42.17c0.81,0.81,1.2,2.04,1.18,3.75c-0.15,12.46-1.78,33.46-12.09,47.58',
  'M37,52.25c1.38,0.62,2.8,0.77,4.64,0.58c7.98-0.83,22.54-2.8,24.82-3.17c3.75-0.6,6.19,1.31,6.04,3.73c-0.25,4.11-3.43,14.92-5.85,20.21c-2.32,5.06-5.9,1.02-7.49-0.41',
  'M39.74,53.8c0.86,0.86,1.34,2.2,1.34,3.84c0,9.87,0.04,19.21,0.04,25.92c0,11.69,2.75,13.65,24.44,13.65c23.44,0,24.82-2.21,24.82-11'
];
const svgNS = 'http://www.w3.org/2000/svg';
const colors = getComputedStyle(document.documentElement);
const color = name => colors.getPropertyValue(name).trim();
function svgElement(name, attributes = {}) {
  const element = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}
function kanjiSvg() {
  return svgElement('svg', {viewBox:'0 0 109 109', fill:'none', 'stroke-width':3.8, 'stroke-linecap':'round', 'stroke-linejoin':'round', 'aria-hidden':'true'});
}
function addStroke(svg, d, stroke) {
  const path = svgElement('path', {d, stroke});
  svg.append(path);
  return path;
}
const radical = kanjiSvg();
strokes.forEach((d, i) => addStroke(radical, d, color(i >= 4 ? '--signal' : '--ink')));
document.getElementById('radical-diagram').append(radical);

const sequence = document.getElementById('stroke-sequence');
strokes.forEach((_, stage) => {
  const item = document.createElement('li');
  item.setAttribute('aria-label', `Goresan ${stage + 1}`);
  const svg = kanjiSvg();
  strokes.slice(0, stage + 1).forEach((d, i) => addStroke(svg, d, color(i === stage ? '--stroke-on-dark' : '--on-night')));
  const number = document.createElement('span');
  number.textContent = stage + 1;
  item.append(svg, number);
  sequence.append(item);
});

const drawing = kanjiSvg();
const guides = svgElement('g', {stroke:color('--guide'), 'stroke-width':.45, 'stroke-dasharray':'2.3 2', 'stroke-linecap':'butt'});
guides.append(svgElement('line', {x1:0, y1:54.5, x2:109, y2:54.5}));
guides.append(svgElement('line', {x1:54.5, y1:0, x2:54.5, y2:109}));
drawing.append(guides);
strokes.forEach(d => addStroke(drawing, d, '#dfe2dc'));
const animatedPaths = strokes.map(d => addStroke(drawing, d, color('--ink')));
const pen = svgElement('circle', {r:2.3, fill:color('--signal'), stroke:color('--paper'), 'stroke-width':.8});
drawing.append(pen);
document.getElementById('writing-paper').append(drawing);
const lengths = animatedPaths.map(path => path.getTotalLength());
animatedPaths.forEach((path, i) => {path.style.strokeDasharray = `${lengths[i]} ${lengths[i]}`;});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const strokeDuration = 1050;
const strokeGap = 240;
const slot = strokeDuration + strokeGap;
const startDelay = 550;
const completeAt = startDelay + slot * 5 + strokeDuration;
const cycleDuration = completeAt + 1800;
let elapsed = reducedMotion.matches ? completeAt : 0;
let paused = reducedMotion.matches;
let frameId = null;
let previousTime = null;
let currentSlide = 0;
const pauseButton = document.getElementById('pause-animation');
const status = document.getElementById('stroke-status');

function renderWriting() {
  const time = elapsed % cycleDuration;
  const activeStroke = time < startDelay ? -1 : Math.min(5, Math.floor((time - startDelay) / slot));
  animatedPaths.forEach((path, i) => {
    const progress = Math.max(0, Math.min(1, (time - startDelay - i * slot) / strokeDuration));
    path.style.strokeDashoffset = lengths[i] * (1 - progress);
    path.style.visibility = progress > 0 ? 'visible' : 'hidden';
    path.setAttribute('stroke', color(i === activeStroke && time < completeAt ? '--signal' : '--ink'));
  });
  const progress = activeStroke < 0 ? 0 : (time - startDelay - activeStroke * slot) / strokeDuration;
  const isDrawing = activeStroke >= 0 && progress >= 0 && progress < 1;
  pen.style.visibility = isDrawing ? 'visible' : 'hidden';
  if (isDrawing) {
    const point = animatedPaths[activeStroke].getPointAtLength(lengths[activeStroke] * progress);
    pen.setAttribute('cx', point.x);
    pen.setAttribute('cy', point.y);
  }
  const complete = time >= completeAt;
  status.textContent = complete ? '危 · 6 goresan selesai' : activeStroke < 0 ? 'Mulai dari goresan pertama' : `Goresan ${activeStroke + 1} dari 6`;
  Array.from(sequence.children).forEach((item, i) => item.classList.toggle('current', !complete && i === activeStroke));
  pauseButton.textContent = paused ? 'Putar animasi' : 'Jeda animasi';
  pauseButton.setAttribute('aria-label', paused ? 'Putar animasi penulisan' : 'Jeda animasi penulisan');
  document.querySelector('.animation-info span').textContent = paused ? 'Animasi dijeda' : 'Berulang otomatis';
}
function animate(now) {
  frameId = null;
  if (paused || currentSlide !== 2 || document.hidden) {previousTime = null; return;}
  if (previousTime !== null) elapsed += Math.min(now - previousTime, 100);
  previousTime = now;
  renderWriting();
  frameId = requestAnimationFrame(animate);
}
function syncAnimation() {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  previousTime = null;
  renderWriting();
  if (!paused && currentSlide === 2 && !document.hidden) frameId = requestAnimationFrame(animate);
}
pauseButton.addEventListener('click', () => {paused = !paused; syncAnimation();});
document.getElementById('restart-animation').addEventListener('click', () => {elapsed = 0; paused = false; syncAnimation();});
document.addEventListener('visibilitychange', syncAnimation);
reducedMotion.addEventListener('change', event => {paused = event.matches; elapsed = paused ? completeAt : 0; syncAnimation();});

const slides = Array.from(document.querySelectorAll('.slide'));
const previous = document.getElementById('previous');
const next = document.getElementById('next');
const announcement = document.getElementById('slide-announcement');
const fullscreenButton = document.getElementById('fullscreen');
const fullscreenNotice = document.getElementById('fullscreen-notice');
const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
function syncFullscreen() {
  const active = Boolean(fullscreenElement());
  fullscreenButton.setAttribute('aria-pressed', String(active));
  fullscreenButton.setAttribute('aria-label', active ? 'Keluar layar penuh' : 'Layar penuh');
  fullscreenButton.title = active ? 'Keluar layar penuh (Esc)' : 'Layar penuh';
  fullscreenButton.querySelector('.fullscreen-enter').toggleAttribute('hidden', active);
  fullscreenButton.querySelector('.fullscreen-exit').toggleAttribute('hidden', !active);
}
fullscreenButton.addEventListener('click', async () => {
  fullscreenNotice.hidden = true;
  try {
    if (fullscreenElement()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      await exit.call(document);
    } else {
      const enter = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
      if (!enter) {
        fullscreenNotice.textContent = 'Layar penuh tidak tersedia di browser ini.';
        fullscreenNotice.hidden = false;
        return;
      }
      await enter.call(document.documentElement);
    }
  } catch {
    fullscreenNotice.textContent = 'Layar penuh tidak dapat dibuka. Coba tombol F11 di Chrome atau Edge.';
    fullscreenNotice.hidden = false;
  }
  syncFullscreen();
});
document.addEventListener('fullscreenchange', syncFullscreen);
document.addEventListener('webkitfullscreenchange', syncFullscreen);
syncFullscreen();
const slideNames = ['Mengenal kanji 危', 'Bacaan dan bushu', 'Urutan penulisan', 'Jukugo dan artinya', 'Reibun atau contoh kalimat', 'Terima Kasih'];
const transitionLayer = document.getElementById('slide-transition');
const transitionSheets = [...transitionLayer.children];
let requestedSlide = 0;
let transitionRunning = false;
let pendingNavigation = null;
let firstSlideShown = false;
let contentAnimations = [];
let curtainAnimations = [];

function animateSlideContent(slide, direction) {
  if (reducedMotion.matches || typeof slide.animate !== 'function') return;
  const selectors = {
    judul: '.cover-copy h1, .cover-meaning, .cover-glyph > span, .cover-glyph > p',
    bacaan: '.slide-heading, .on-reading, .kun-readings, .radical-panel',
    menulis: '.slide-heading, .writing-statement, .stroke-sequence, .sequence-note, .writing-demo',
    kosakata: '.slide-heading, .jukugo-table',
    reibun: '.slide-heading, .vocab-entry',
    penutup: '#closing-title'
  };
  const elements = [...slide.querySelectorAll(selectors[slide.id])];
  contentAnimations = elements.map((element, i) => {
    const isVisual = element.matches('.cover-glyph > span, .writing-demo, #closing-title');
    return element.animate([
      {opacity:0, transform:`translate3d(${direction * (isVisual ? 46 : 24)}px, ${isVisual ? 8 : 18}px, 0) scale(${isVisual ? .92 : 1})`},
      {opacity:1, transform:'translate3d(0, 0, 0) scale(1)'}
    ], {duration:isVisual ? 900 : 750, delay:i * 65, easing:'cubic-bezier(.16, 1, .3, 1)', fill:'backwards'});
  });
}

function activateSlide(index, updateHash = true) {
  if (index < 0 || index >= slides.length) return;
  contentAnimations.forEach(animation => animation.cancel());
  contentAnimations = [];
  const moved = currentSlide !== index;
  if (moved) fullscreenNotice.hidden = true;
  currentSlide = index;
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
    slide.setAttribute('aria-hidden', String(i !== index));
    slide.inert = i !== index;
  });
  document.body.dataset.slide = slides[index].id;
  previous.disabled = index === 0;
  next.disabled = index === slides.length - 1;
  if (document.activeElement === next && next.disabled) previous.focus({preventScroll:true});
  if (document.activeElement === previous && previous.disabled) next.focus({preventScroll:true});
  if (updateHash && location.hash !== `#${slides[index].id}`) history.replaceState(null, '', `#${slides[index].id}`);
  announcement.textContent = slideNames[index];
  if (moved) window.scrollTo(0, 0);
  if (index === 2 && moved) elapsed = reducedMotion.matches && paused ? completeAt : 0;
  syncAnimation();
}

async function transitionToSlide(index, updateHash) {
  transitionRunning = true;
  document.body.dataset.transitioning = 'true';
  transitionLayer.hidden = false;
  const direction = index > currentSlide ? 1 : -1;
  const transform = amount => `translateX(${amount}%) skewX(${-direction * 11}deg)`;
  try {
    curtainAnimations = transitionSheets.map((sheet, i) => sheet.animate([
      {transform:transform(-direction * 115)},
      {transform:transform(0)}
    ], {duration:360, delay:i * 60, easing:'cubic-bezier(.76, 0, .24, 1)', fill:'both'}));
    await Promise.all(curtainAnimations.map(animation => animation.finished));
    activateSlide(index, updateHash);
    animateSlideContent(slides[index], direction);
    const exitAnimations = transitionSheets.map((sheet, i) => sheet.animate([
      {transform:transform(0)},
      {transform:transform(direction * 115)}
    ], {duration:460, delay:i * 50, easing:'cubic-bezier(.76, 0, .24, 1)', fill:'both'}));
    curtainAnimations.push(...exitAnimations);
    await Promise.all(exitAnimations.map(animation => animation.finished));
  } catch {
    activateSlide(index, updateHash);
  } finally {
    transitionLayer.hidden = true;
    curtainAnimations.forEach(animation => animation.cancel());
    curtainAnimations = [];
    transitionRunning = false;
    delete document.body.dataset.transitioning;
    const pending = pendingNavigation;
    pendingNavigation = null;
    if (pending) showSlide(pending.index, pending.updateHash);
  }
}

function showSlide(index, updateHash = true) {
  if (index < 0 || index >= slides.length) return;
  requestedSlide = index;
  if (transitionRunning) {
    pendingNavigation = {index, updateHash};
    return;
  }
  if (!firstSlideShown || index === currentSlide || reducedMotion.matches || typeof transitionLayer.animate !== 'function') {
    const initial = !firstSlideShown;
    activateSlide(index, updateHash);
    firstSlideShown = true;
    if (initial) animateSlideContent(slides[index], 1);
    return;
  }
  void transitionToSlide(index, updateHash);
}

reducedMotion.addEventListener('change', event => {
  if (!event.matches) return;
  contentAnimations.forEach(animation => animation.cancel());
  curtainAnimations.forEach(animation => animation.cancel());
});
previous.addEventListener('click', () => showSlide(requestedSlide - 1));
next.addEventListener('click', () => showSlide(requestedSlide + 1));
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  let index;
  if (event.key === 'ArrowRight' || event.key === 'PageDown') index = requestedSlide + 1;
  else if (event.key === 'ArrowLeft' || event.key === 'PageUp') index = requestedSlide - 1;
  else if (event.key === 'Home') index = 0;
  else if (event.key === 'End') index = slides.length - 1;
  else if (event.key === ' ' && !event.target.closest('button,a')) index = requestedSlide + 1;
  if (index !== undefined) {event.preventDefault();showSlide(index);}
});
let touchStart = null;
document.addEventListener('touchstart', event => {
  if (event.touches.length !== 1 || event.target.closest('button,a')) {touchStart = null;return;}
  touchStart = {x:event.touches[0].clientX,y:event.touches[0].clientY};
}, {passive:true});
document.addEventListener('touchend', event => {
  if (!touchStart) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.7) showSlide(requestedSlide + (dx < 0 ? 1 : -1));
  touchStart = null;
}, {passive:true});
function fromHash() {return Math.max(0, slides.findIndex(slide => `#${slide.id}` === location.hash));}
window.addEventListener('hashchange', () => showSlide(fromHash(), false));
document.documentElement.classList.add('js');
fullscreenButton.hidden = false;
document.querySelector('.slide-nav').hidden = false;
showSlide(fromHash(), false);
