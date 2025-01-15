// Webcam test and screenshot functionality

let webcamStream;
let screenshotBtn = document.getElementById('screenshot');
let screenshotsList = document.getElementById('screenshotsList');
let startBtn = document.getElementById('startWebcam');
let stopBtn = document.getElementById('stopWebcam');
let statusDiv = document.getElementById('status');
let video = document.getElementById('webcam');

// Start Webcam
startBtn.onclick = async function () {
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = webcamStream;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        screenshotBtn.disabled = false;
        statusDiv.textContent = 'Status: Webcam is active';
    } catch (error) {
        statusDiv.textContent = 'Status: Error accessing webcam';
    }
};

// Stop Webcam
stopBtn.onclick = function () {
    if (webcamStream) {
        let tracks = webcamStream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        screenshotBtn.disabled = true;
        statusDiv.textContent = 'Status: Webcam stopped';
    }
};

// Take Screenshot
screenshotBtn.onclick = function () {
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    let screenshotDataUrl = canvas.toDataURL('image/png');
    
    // Create screenshot preview with download button
    let screenshotPreview = document.createElement('div');
    screenshotPreview.classList.add('screenshot-preview');
    
    let screenshotImage = document.createElement('img');
    screenshotImage.src = screenshotDataUrl;

    let downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Download';
    downloadBtn.onclick = function () {
        let link = document.createElement('a');
        link.href = screenshotDataUrl;
        link.download = 'webcam-screenshot.png';
        link.click();
    };

    screenshotPreview.appendChild(screenshotImage);
    screenshotPreview.appendChild(downloadBtn);

    screenshotsList.appendChild(screenshotPreview);
};
