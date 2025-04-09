document.addEventListener('DOMContentLoaded', function() {
    const cameraView = document.getElementById('cameraView');
    const resultsCanvas = document.createElement('canvas');
    const resultsCtx = resultsCanvas.getContext('2d');
    let stream;

    // カメラ映像の上に重ねて描画するためのcanvasをbodyに追加
    document.body.appendChild(resultsCanvas);
    resultsCanvas.style.position = 'absolute';
    resultsCanvas.style.top = cameraView.offsetTop + 'px';
    resultsCanvas.style.left = cameraView.offsetLeft + 'px';

    function resizeCanvas() {
        resultsCanvas.width = cameraView.videoWidth;
        resultsCanvas.height = cameraView.videoHeight;
        resultsCanvas.style.top = cameraView.offsetTop + 'px';
        resultsCanvas.style.left = cameraView.offsetLeft + 'px';
    }

    cameraView.addEventListener('loadedmetadata', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);

    function startCamera() {
        const constraints = {
    video: { facingMode: ['environment', 'user'] } // 背面カメラがなければ前面カメラを使用
};
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(constraints)
            .then(function(videoStream) {
                stream = videoStream;
                cameraView.srcObject = stream;
            })
            .catch(function(error) {
                console.error('カメラへのアクセスに失敗しました:', error);
            });
        } else {
            console.error('getUserMedia APIに対応していません。');
        }
    }

    function drawLandmarks(landmarks) {
        resultsCtx.clearRect(0, 0, resultsCanvas.width, resultsCanvas.height);
        resultsCtx.lineWidth = 5;
        resultsCtx.strokeStyle = 'white';
        resultsCtx.fillStyle = 'red';

        function drawPoint(landmark) {
            const x = landmark.x * resultsCanvas.width;
            const y = landmark.y * resultsCanvas.height;
            resultsCtx.beginPath();
            resultsCtx.arc(x, y, 10, 0, 2 * Math.PI);
            resultsCtx.fill();
        }

        // ランドマークの接続 (MediaPipeのPOSE_CONNECTIONSと同様)
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
            [9, 10], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [15, 17], [17, 19], [19, 21], [16, 18], [18, 20], [20, 22],
            [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27],
            [26, 28], [27, 29], [29, 31], [28, 30], [30, 32]
        ];

        for (const connection of connections) {
            const index1 = connection[0];
            const index2 = connection[1];
            if (landmarks[index1] && landmarks[index2]) {
                const x1 = landmarks[index1].x * resultsCanvas.width;
                const y1 = landmarks[index1].y * resultsCanvas.height;
                const x2 = landmarks[index2].x * resultsCanvas.width;
                const y2 = landmarks[index2].y * resultsCanvas.height;
                resultsCtx.beginPath();
                resultsCtx.moveTo(x1, y1);
                resultsCtx.lineTo(x2, y2);
                resultsCtx.stroke();
            }
        }

        if (landmarks) {
            landmarks.forEach(drawPoint);
        }
    }

    function sendFrameToServer() {
        if (!cameraView.videoWidth || !cameraView.videoHeight) {
            return;
        }

        resizeCanvas(); // フレーム送信前にcanvasのサイズを調整

        const canvas = document.createElement('canvas');
        canvas.width = cameraView.videoWidth;
        canvas.height = cameraView.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cameraView, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(function(blob) {
            const formData = new FormData();
            formData.append('image', blob, 'frame.jpg');

            fetch('/process_frame', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.landmarks) {
                    drawLandmarks(data.landmarks);
                }
                console.log('サーバーからの応答:', data);
            })
            .catch(error => {
                console.error('フレーム送信エラー:', error);
            });
        }, 'image/jpeg', 0.8);
    }

    setInterval(sendFrameToServer, 1000 / 30);

    startCamera();
});
