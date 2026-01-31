// Elements
const video = document.getElementById('webcamVideo');
const cameraSelect = document.getElementById('cameraSelect');
const micSelect = document.getElementById('micSelect');
const resolutionSelect = document.getElementById('resolutionSelect');
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnSnapshot = document.getElementById('btnSnapshot');
const btnRecord = document.getElementById('btnRecord');
const btnFullscreen = document.getElementById('btnFullscreen');
const btnPip = document.getElementById('btnPip'); // PiP Button
const galleryGrid = document.getElementById('galleryGrid');
const videoStatus = document.getElementById('videoStatus');
const canvas = document.getElementById('audioVisualizer');
const canvasCtx = canvas.getContext('2d');
const countdownEl = document.getElementById('countdown');

// Tools & Settings
const toggleMirror = document.getElementById('toggleMirror');
const toggleGrid = document.getElementById('toggleGrid');
const toggleMute = document.getElementById('toggleMute'); // Mute
const gridOverlay = document.getElementById('gridOverlay');
const btnScreenLight = document.getElementById('btnScreenLight');
const screenLightOverlay = document.getElementById('screenLightOverlay');
const themeToggle = document.getElementById('themeToggle');

// PTZ Elements
const ptzCard = document.getElementById('ptzCard');
const zoomRange = document.getElementById('zoomRange');

// Filters
const filterBrightness = document.getElementById('filterBrightness');
const filterContrast = document.getElementById('filterContrast');
const filterGrayscale = document.getElementById('filterGrayscale');
const btnResetFilters = document.getElementById('btnResetFilters');

// State
let currentStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let audioContext = null;
let analyser = null;
let animationId = null;
let isRecording = false;
let trackCapabilities = null; // Store camera capabilities

// --- Initialization ---

async function init() {
    await getDevices();
    loadTheme();
}

// --- Toast System ---

function showToast(message, icon = 'checkmark-circle') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<ion-icon name="${icon}"></ion-icon> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// --- Device Management ---

async function getDevices() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        cameraSelect.innerHTML = '';
        micSelect.innerHTML = '';

        dveicesFound = false;

        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            if (device.kind === 'videoinput') {
                option.text = device.label || `Camera ${cameraSelect.length + 1}`;
                cameraSelect.appendChild(option);
                dveicesFound = true;
            } else if (device.kind === 'audioinput') {
                option.text = device.label || `Microphone ${micSelect.length + 1}`;
                micSelect.appendChild(option);
            }
        });
        
        stopStream();
        videoStatus.textContent = "Ready to Start";

    } catch (err) {
        console.error("Error enumerating devices:", err);
        videoStatus.textContent = "Permission Denied or Error";
        showToast("Error finding devices. Check permissions.", "warning");
    }
}

// --- Stream Management ---

async function startStream() {
    if (currentStream) {
        stopStream();
    }

    const videoSource = cameraSelect.value;
    const audioSource = micSelect.value;
    const resolution = resolutionSelect.value;

    const constraints = {
        video: {
            deviceId: videoSource ? { exact: videoSource } : undefined,
            // Enable PTZ permissions if supported
            pan: true, tilt: true, zoom: true 
        },
        audio: {
            deviceId: audioSource ? { exact: audioSource } : undefined
        }
    };

    if (resolution === 'hd') {
        constraints.video.width = { ideal: 1280 };
        constraints.video.height = { ideal: 720 };
    } else if (resolution === 'fhd') {
        constraints.video.width = { ideal: 1920 };
        constraints.video.height = { ideal: 1080 };
    } else if (resolution === '4k') {
        constraints.video.width = { ideal: 3840 };
        constraints.video.height = { ideal: 2160 };
    }

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        
        // Mute toggle state
        setMuteState(toggleMute.checked);

        // Check PTZ capabilities
        const videoTrack = currentStream.getVideoTracks()[0];
        trackCapabilities = videoTrack.getCapabilities();
        
        // Show Zoom slider if supported
        if (trackCapabilities.zoom) {
            ptzCard.classList.remove('hidden');
            zoomRange.min = trackCapabilities.zoom.min;
            zoomRange.max = trackCapabilities.zoom.max;
            zoomRange.step = trackCapabilities.zoom.step;
            zoomRange.value = videoTrack.getSettings().zoom || 1;
        } else {
            ptzCard.classList.add('hidden');
        }

        btnStart.classList.add('hidden');
        btnStop.classList.remove('hidden');
        btnSnapshot.disabled = false;
        btnRecord.disabled = false;
        videoStatus.style.display = 'none';

        setupAudioVisualizer(currentStream);
        showToast("Webcam Started");

    } catch (err) {
        console.error("Error starting stream:", err);
        videoStatus.textContent = "Error accessing camera: " + err.message;
        videoStatus.style.display = 'block';
        showToast("Failed to start camera", "alert-circle");
    }
}

function stopStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;
    currentStream = null;
    
    btnStart.classList.remove('hidden');
    btnStop.classList.add('hidden');
    btnSnapshot.disabled = true;
    btnRecord.disabled = true;
    ptzCard.classList.add('hidden'); // Hide PTZ
    videoStatus.textContent = "Stopped";
    videoStatus.style.display = 'block';

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
}

// --- Features ---

btnSnapshot.onclick = () => {
    video.style.opacity = '0.5';
    setTimeout(() => video.style.opacity = '1', 100);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.filter = video.style.filter;
    if (toggleMirror.checked) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imgUrl = canvas.toDataURL('image/png');
    addToGallery(imgUrl, 'image');
    showToast("Screenshot Saved");
};

btnRecord.onclick = () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
};

function startRecording() {
    recordedChunks = [];
    const options = { mimeType: 'video/webm;codecs=vp9' };
    
    try {
        mediaRecorder = new MediaRecorder(currentStream, options);
    } catch (e) {
        mediaRecorder = new MediaRecorder(currentStream);
    }

    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        addToGallery(url, 'video');
        showToast("Recording Saved");
    };

    mediaRecorder.start();
    isRecording = true;
    btnRecord.innerHTML = '<ion-icon name="stop-circle-outline"></ion-icon>';
    btnRecord.style.color = 'var(--danger-color)';
    
    videoStatus.textContent = "Recording...";
    videoStatus.style.display = 'block';
    videoStatus.style.color = 'var(--danger-color)';
    showToast("Recording Started...", "radio-button-on");
}

function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
    btnRecord.innerHTML = '<ion-icon name="videocam-outline"></ion-icon>';
    btnRecord.style.color = '';
    videoStatus.style.display = 'none';
    videoStatus.style.color = 'white';
}

function setupAudioVisualizer(stream) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!currentStream) return; // Stop drawing if no stream
        animationId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = '#1e293b'; // Match card-bg roughly
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            const g = barHeight + (25 * (i/bufferLength));
            const b = 250 - barHeight;
            
            canvasCtx.fillStyle = `rgb(50, ${g}, ${b})`;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }
    draw();
}

// --- Gallery ---

function addToGallery(url, type) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    let element;
    if (type === 'image') {
        element = document.createElement('img');
        element.src = url;
    } else {
        element = document.createElement('video');
        element.src = url;
        element.controls = true;
    }
    
    const actions = document.createElement('div');
    actions.className = 'gallery-actions';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '<ion-icon name="download-outline"></ion-icon>';
    downloadBtn.className = 'action-btn';
    downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = type === 'image' ? `snapshot_${Date.now()}.png` : `recording_${Date.now()}.webm`;
        a.click();
    };
    
    actions.appendChild(downloadBtn);
    item.appendChild(element);
    item.appendChild(actions);
    
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    galleryGrid.prepend(item);
}

document.getElementById('btnClearGallery').onclick = () => {
    galleryGrid.innerHTML = '<div class="empty-state">No photos or videos taken yet.</div>';
    showToast("Gallery Cleared", "trash-outline");
};

// --- Logic & Listeners ---

// PiP
btnPip.onclick = async () => {
    try {
        if (video !== document.pictureInPictureElement) {
            await video.requestPictureInPicture();
        } else {
            await document.exitPictureInPicture();
        }
    } catch (error) {
        showToast("PiP Failed (Check Browser Support)", "warning");
    }
};

// Fullscreen
btnFullscreen.onclick = () => {
    if (!document.fullscreenElement) {
        document.querySelector('.video-section').requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};

// Mute
toggleMute.onchange = (e) => setMuteState(e.target.checked);

function setMuteState(muted) {
    if (currentStream) {
        currentStream.getAudioTracks().forEach(track => track.enabled = !muted);
        if (muted) showToast("Microphone Muted", "mic-off-outline");
        else showToast("Microphone Unmuted", "mic-outline");
    }
}

// Zoom
zoomRange.oninput = async (e) => {
    const zoomValue = e.target.value;
    const videoTrack = currentStream.getVideoTracks()[0];
    if (videoTrack) {
        await videoTrack.applyConstraints({ advanced: [{ zoom: zoomValue }] });
    }
};

// Filters
function applyFilters() {
    video.style.filter = `brightness(${filterBrightness.value}%) contrast(${filterContrast.value}%) grayscale(${filterGrayscale.value}%)`;
}
[filterBrightness, filterContrast, filterGrayscale].forEach(input => input.addEventListener('input', applyFilters));
btnResetFilters.onclick = () => {
    filterBrightness.value = 100;
    filterContrast.value = 100;
    filterGrayscale.value = 0;
    applyFilters();
    showToast("Filters Reset");
};

toggleMirror.onchange = (e) => video.style.transform = e.target.checked ? 'scaleX(-1)' : 'scaleX(1)';
toggleGrid.onchange = (e) => e.target.checked ? gridOverlay.classList.remove('hidden') : gridOverlay.classList.add('hidden');

cameraSelect.onchange = () => { if (currentStream) startStream(); };
resolutionSelect.onchange = () => { if (currentStream) startStream(); };

btnScreenLight.onclick = () => screenLightOverlay.classList.remove('hidden');
screenLightOverlay.onclick = () => screenLightOverlay.classList.add('hidden');

btnStart.onclick = startStream;
btnStop.onclick = stopStream;

// Theme
themeToggle.onclick = () => {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeToggle.querySelector('ion-icon').setAttribute('name', next === 'light' ? 'moon-outline' : 'sunny-outline');
    showToast(`Switched to ${next} Mode`);
};

function loadTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', saved);
    themeToggle.querySelector('ion-icon').setAttribute('name', saved === 'light' ? 'moon-outline' : 'sunny-outline');
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch(e.code) {
        case 'Space':
            e.preventDefault();
            if (!btnSnapshot.disabled) btnSnapshot.click();
            break;
        case 'KeyR':
            if (!btnRecord.disabled) btnRecord.click();
            break;
        case 'KeyF':
            btnFullscreen.click();
            break;
        case 'KeyM':
            toggleMute.click();
            break;
    }
});

init();
