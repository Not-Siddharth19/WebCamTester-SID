const video = document.getElementById('webcam');
const startButton = document.getElementById('startWebcam');
const stopButton = document.getElementById('stopWebcam');
const screenshotButton = document.getElementById('screenshot');
const statusElement = document.getElementById('status');
let stream;

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
  }
  



startButton.addEventListener('click', async () => {
    try {
        // Request webcam access
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
    // Stop webcam and clear video source
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
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'webcam-screenshot.png';
        link.click();

        statusElement.textContent = 'Status: Screenshot taken.';
    } else {
        statusElement.textContent = 'Status: Start the webcam first!';
    }
});
