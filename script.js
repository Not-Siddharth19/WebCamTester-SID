const video = document.getElementById('webcam');
const startButton = document.getElementById('startWebcam');
const stopButton = document.getElementById('stopWebcam');
const screenshotButton = document.getElementById('screenshot');
const statusElement = document.getElementById('status');
const screenshotsList = document.getElementById('screenshotsList');

let stream;

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        video.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

startButton.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        startButton.disabled = true;
        stopButton.disabled = false;
        screenshotButton.disabled = false;
        statusElement.textContent = 'Status: Webcam is active.';
    } catch (error) {
        console.error('Error accessing the webcam:', error);
        statusElement.textContent = 'Status: Error accessing webcam.';
    }
});

stopButton.addEventListener('click', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        startButton.disabled = false;
        stopButton.disabled = true;
        screenshotButton.disabled = true;
        statusElement.textContent = 'Status: Webcam is stopped.';
    }
});

screenshotButton.addEventListener('click', () => {
    if (stream) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current video frame on the temporary canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Create image URL and download link
        const dataUrl = canvas.toDataURL('image/png');

        // Create the screenshot preview and download button
        const screenshotPreviewDiv = document.createElement('div');
        screenshotPreviewDiv.classList.add('screenshot-preview');
        
        const img = document.createElement('img');
        img.src = dataUrl;
        
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
        downloadButton.onclick = () => {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'screenshot.png';
            link.click();
        };
        
        screenshotPreviewDiv.appendChild(img);
        screenshotPreviewDiv.appendChild(downloadButton);
        screenshotsList.appendChild(screenshotPreviewDiv);
    }
});
