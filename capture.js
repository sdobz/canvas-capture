(function() {
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;
    console.log("Loading capture.js");

    const captureFilename = "capture.webm";
    const captureOptions = {
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported
        mimeType: "video/webm",
        audioBitsPerSecond : 128000,
        videoBitsPerSecond : 2500000
    };

    if (!MediaRecorder.isTypeSupported(captureOptions.mimeType)) {
        console.error(`invalid mimeType: ${captureOptions.mimeType}`);
        return;
    }

    browser.runtime.onMessage.addListener((message) => {
        if (message.command === "capture") {
            if (!isCapture()) {
                startSelection();
            }
        }
    });

    function startSelection() {
        console.log("select canvas")
        document.querySelectorAll("canvas").forEach(e => {
            e.addEventListener("click", startCapture);
            addClass(e, "selecting");
        });
    }

    function clearSelection() {
        document.querySelectorAll("canvas").forEach(e => {
            e.removeEventListener("click", startCapture);
            removeClass(e, "selecting");
        });
    }

    let currentRecorder = undefined;
    let currentCanvas = undefined;
    function startCapture(e) {
        clearSelection();
        
        capture = [];
        currentCanvas = e.target;
        addClass(currentCanvas, "recording");
        const stream = currentCanvas.captureStream();

        currentRecorder = new MediaRecorder(stream, captureOptions);
        currentRecorder.ondataavailable = onCapture;
        currentRecorder.onstop = finishCapture;
        currentRecorder.start();

        console.log("recording started");

        currentCanvas.addEventListener("click", stopCapture);
    }

    function isCapture() {
        return currentRecorder !== undefined;
    }

    let capture = [];
    function onCapture(e) {
        console.log("got data");
        capture.push(e.data);
    }

    function stopCapture() {
        if (currentRecorder === undefined) {
            return;
        }

        console.log("stopping capture...")
        currentRecorder.stop();
        currentRecorder = undefined;
        currentCanvas.removeEventListener("click", stopCapture);
        removeClass(currentCanvas, "recording");
        currentCanvas = undefined;
    }

    function finishCapture(e) {
        console.log("writing file...");
        const blob = new Blob(capture, { 'type' : captureOptions.mimeType });
        const dataUrl = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = dataUrl;
        a.download = captureFilename;
        a.click();
        window.URL.revokeObjectURL(url);
        document.removeChild(a);
        capture = [];
    }

    function addClass(e, c) {
        e.className += " " + c;
    }
    function removeClass(e,c) {
        e.className = e.className.replace( new RegExp('(?:^|\\s)'+c+'(?!\\S)') ,'');
    }

    const CSS = `
    canvas.selecting:hover {
        border: 2px dashed red;
        cursor: pointer;
    }
    canvas.recording {
        border: 2px solid red;
        cursor: pointer;
    }
    canvas.recording:hover {
        border: 2px solid green;
        cursor: pointer;
    }
    `;
    const style = document.createElement("style");
    style.innerHTML = CSS;
    document.getElementsByTagName('head')[0].appendChild(style);
    startSelection();
})();
