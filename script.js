const video = document.getElementById('webcam');
const startButton = document.getElementById('startWebcam');
const stopButton = document.getElementById('stopWebcam');
const screenshotButton = document.getElementById('screenshot');
const statusElement = document.getElementById('status');
const screenshotPreview = document.getElementById('screenshotPreview');

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

        // Update the preview canvas with the same content
        const previewContext = screenshotPreview.getContext('2d');
        screenshotPreview.width = canvas.width;
        screenshotPreview.height = canvas.height;
        previewContext.drawImage(canvas, 0, 0, canvas.width, canvas.height);

        // Show the preview canvas
        screenshotPreview.style.display = 'block';

        statusElement.textContent = 'Status: Screenshot preview updated.';
    } else {
        statusElement.textContent = 'Status: Start the webcam first!';
    }
});
