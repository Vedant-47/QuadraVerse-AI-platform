/* =======================
   Unified AI Accessibility JS
   Features: TTS, STT, Summarize, Voice Commands
========================== */

// ----- Elements for TTS -----
const textInput = document.getElementById('textInput');
const voicesSelect = document.getElementById('voices');
const rateInput = document.getElementById('rate');
const rateVal = document.getElementById('rateVal');
const pitchInput = document.getElementById('pitch');
const pitchVal = document.getElementById('pitchVal');
const speakBtn = document.getElementById('speakBtn');
const stopBtn = document.getElementById('stopBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const clearBtn = document.getElementById('clearBtn');
const liveToggle = document.getElementById('liveToggle');

let voices = [];
let utterance = null;
let liveTimer = null;

// Populate voice list
function populateVoices() {
  voices = speechSynthesis.getVoices().sort((a,b) => a.name.localeCompare(b.name));
  voicesSelect.innerHTML = '';
  voices.forEach((v,i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${v.name}${v.lang ? ' — ' + v.lang : ''}${v.default ? ' (default)' : ''}`;
    voicesSelect.appendChild(opt);
  });
}
speechSynthesis.onvoiceschanged = populateVoices;
populateVoices();

// Create utterance
function createUtterance(text) {
  if (!text) return null;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = parseFloat(rateInput.value);
  u.pitch = parseFloat(pitchInput.value);
  const selectedVoice = voices[voicesSelect.value];
  if (selectedVoice) u.voice = selectedVoice;
  u.lang = (u.voice && u.voice.lang) || 'en-US';
  u.onend = () => console.log('Speech ended');
  u.onerror = (e) => console.error('Speech error', e);
  return u;
}

// TTS Functions
function speakText() {
  const text = textInput.value.trim();
  if (!text) {
    speechSynthesis.speak(new SpeechSynthesisUtterance('Please enter some text to speak.'));
    return;
  }
  speechSynthesis.cancel();
  utterance = createUtterance(text);
  if (utterance) speechSynthesis.speak(utterance);
}
function stopSpeech(){ speechSynthesis.cancel(); }
function pauseSpeech(){ if(speechSynthesis.speaking && !speechSynthesis.paused) speechSynthesis.pause(); }
function resumeSpeech(){ if(speechSynthesis.paused) speechSynthesis.resume(); }

// Live typing TTS
function handleLiveSpeak() {
  if (!liveToggle.checked) { if (liveTimer) clearTimeout(liveTimer); return; }
  if (liveTimer) clearTimeout(liveTimer);
  liveTimer = setTimeout(() => speakText(), 600);
}

// Update rate/pitch display
rateInput.addEventListener('input', () => { rateVal.textContent = rateInput.value; });
pitchInput.addEventListener('input', () => { pitchVal.textContent = pitchInput.value; });

// Button events
speakBtn.addEventListener('click', speakText);
stopBtn.addEventListener('click', stopSpeech);
pauseBtn.addEventListener('click', pauseSpeech);
resumeBtn.addEventListener('click', resumeSpeech);
clearBtn.addEventListener('click', () => { textInput.value=''; textInput.focus(); stopSpeech(); });
textInput.addEventListener('input', handleLiveSpeak);

// Keyboard shortcuts: Ctrl+Enter = Speak, Esc = Stop
document.addEventListener('keydown', e => {
  if(e.key==='Enter' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); speakText(); }
  else if(e.key==='Escape'){ stopSpeech(); }
});

// ----- Speech-to-Text -----
let recognition;
function startRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition) return alert('SpeechRecognition not supported in this browser.');
  recognition = new SpeechRecognition();
  recognition.lang='en-US';
  recognition.continuous=true;
  recognition.interimResults=true;
  recognition.onresult = (event) => {
    let transcript='';
    for(let i=event.resultIndex;i<event.results.length;i++){
      if(event.results[i].isFinal) transcript += event.results[i][0].transcript+' ';
    }
    console.log('Transcript:', transcript);
    alert("Captured: " + transcript);
  };
  recognition.start();
}

// ----- FIXED Summarization using FastAPI Backend -----
async function summarizeText() {
  const summaryInput = document.getElementById('summaryInput');
  const summaryOutput = document.getElementById('summaryOutput');
  
  const text = summaryInput.value.trim();
  
  if (!text) {
    alert('Please enter some text to summarize.');
    return;
  }
  
  // Show loading state
  summaryOutput.textContent = 'Summarizing...';
  
  try {
    const response = await fetch('http://localhost:8000/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Display the summary
    summaryOutput.textContent = data.summary || 'No summary generated.';
    
  } catch (error) {
    console.error('Error summarizing:', error);
    summaryOutput.textContent = `Error: ${error.message}. Make sure your FastAPI server is running on http://localhost:8000`;
  }
}

// ----- Voice Command Auto-Start -----
function startVoiceCommand() {
  const status = document.getElementById("voiceCommandStatus");
  if(!('webkitSpeechRecognition' in window)){
    status.innerText="Voice Command: Not supported in this browser"; return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang="en-US"; recognition.interimResults=false; recognition.continuous=true;
  let isListeningForCommand=false; let commandTimeout;
  recognition.onstart=()=>{ status.innerText="Voice Command: Listening..."; };
  recognition.onresult=(event)=>{
    let spokenText=event.results[event.results.length-1][0].transcript.toLowerCase().trim();
    console.log("DEBUG Command:", spokenText);

    if(!isListeningForCommand){
      if(spokenText.includes("jetha")){
        isListeningForCommand=true;
        status.innerText="Jetha Activated! Awaiting command...";
        clearTimeout(commandTimeout);
        commandTimeout=setTimeout(()=>{ isListeningForCommand=false; status.innerText="Voice Command: Listening for 'Jetha'..."; },10000);
      } else { status.innerText=`Say "Jetha" to activate. Heard: "${spokenText}"`; }
      return;
    }

    // Handle commands
    if(spokenText.includes("scroll down")) scrollToNextFeature();
    else if(spokenText.includes("scroll up")) scrollToPreviousFeature();
    else if(spokenText.includes("summarize")){ document.querySelector("#feature2").scrollIntoView({behavior:"smooth"}); summarizeText(); }
    else if(spokenText.includes("read") || spokenText.includes("play audio") || spokenText.includes("read aloud")){ document.querySelector("#feature3").scrollIntoView({behavior:"smooth"}); speakText(); }
    else if(spokenText.includes("speech to text") || spokenText.includes("start recording") || spokenText.includes("speech")){ document.querySelector("#feature1").scrollIntoView({behavior:"smooth"}); startRecording(); }
    else status.innerText=`Voice Command: "${spokenText}" not recognized`;
    
    isListeningForCommand=false;
    clearTimeout(commandTimeout);
  };
  recognition.onerror = (e)=>{ status.innerText="Voice Command Error: "+e.error; };
  recognition.start();
}
document.addEventListener("DOMContentLoaded", startVoiceCommand);

// ----- Scroll Helpers -----
function scrollToNextFeature(){
  const sections=document.querySelectorAll("section");
  const currentScroll=window.scrollY;
  for(let i=0;i<sections.length;i++){ if(sections[i].offsetTop>currentScroll+10){ sections[i].scrollIntoView({behavior:"smooth"}); break; } }
}
function scrollToPreviousFeature(){
  const sections=document.querySelectorAll("section");
  const currentScroll=window.scrollY;
  for(let i=sections.length-1;i>=0;i--){ if(sections[i].offsetTop<currentScroll-10){ sections[i].scrollIntoView({behavior:"smooth"}); break; } }
}