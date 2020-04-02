const { desktopCapturer, remote } = require('electron');
const { Menu, dialog } = remote;
const { writeFile } = require('fs');

// Global States
let mediaRecorder;
const recordedChunks = [];
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const vidoeSelectBtn = document.getElementById('videoSelectBtn');

startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
};

stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
};

vidoeSelectBtn.onclick = getVideoSources;

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoOptionsMenu.popup();
}


async function selectSource(source) {
    vidoeSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
            }
        }
    };

    // Create Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Preview
    videoElement.srcObject = stream;
    videoElement.play();

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    // Event listeners
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;

}


function handleDataAvailable(e) {
    console.log('Video Data Available');
    recordedChunks.push(e.data);
}


async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: "Save Video",
        defaultPath: `vid-${Date.now()}.webm`
    });

    console.log(filePath);

    writeFile(filePath, buffer, () => console.log('video saved successfully'));
}