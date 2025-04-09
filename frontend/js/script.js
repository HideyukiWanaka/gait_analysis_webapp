document.addEventListener('DOMContentLoaded', async () => {
    const cameraView = document.getElementById('cameraView');
    const resultsCanvas = document.createElement('canvas');
    const resultsCtx = resultsCanvas.getContext('2d');
    let pose;
    let camera;

    // リサイズ後の幅と高さ
    const resizedWidth = 640;  // サンプルコードに合わせて幅を大きく
    const resizedHeight = 480; // サンプルコードに合わせて高さを大きく

    // カメラ映像の上に重ねて描画するためのcanvasをbodyに追加
    document.body.appendChild(resultsCanvas);
    resultsCanvas.style.position = 'absolute';
    resultsCanvas.style.top = cameraView.offsetTop + 'px';
    resultsCanvas.style.left = cameraView.offsetLeft + 'px';
    resultsCanvas.width = resizedWidth;
    resultsCanvas.height = resizedHeight;

    function resizeCanvas() {
        resultsCanvas.width = cameraView.videoWidth;
        resultsCanvas.height = cameraView.videoHeight;
        resultsCanvas.style.top = cameraView.offsetTop + 'px';
        resultsCanvas.style.left = cameraView.offsetLeft + 'px';
    }

    cameraView.addEventListener('loadedmetadata', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);

    async function startCamera(facingMode) {
        let constraints = { video: true }; // デフォルトの制約

        if (facingMode) {
            constraints = {
                video: { facingMode: facingMode }
            };
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                cameraView.srcObject = stream;

                // カメラ初期化
                camera = new Camera(cameraView, { // Cameraクラスを使用
                    onFrame: async () => {
                        await pose.send({ image: cameraView });
                    },
                    width: resizedWidth,
                    height: resizedHeight
                });
                camera.start(); // カメラ開始
            } catch (error) {
                console.error('カメラへのアクセスに失敗しました:', error);
            }
        } else {
            console.error('getUserMedia APIに対応していません。');
        }

        // MediaPipe Poseの初期化
        pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });
        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        pose.onResults(onResults);
        await pose.initialize();
    }

    // 撮影方向が変更されたときにカメラを再起動する関数
    function changeCameraDirection() {
        const direction = document.querySelector('input[name="shooting_direction"]:checked').value;
        let facingMode = null;

        if (direction === 'front_back') {
            facingMode = 'environment'; // 背面カメラ
        } else if (direction === 'left_right') {
            facingMode = 'user'; // 前面カメラ
        }

        if (camera) {
            camera.stop(); // カメラ停止
        }
        startCamera(facingMode); // 新しい方向でカメラを起動
    }

    // 初期状態でカメラを起動
    startCamera('environment'); // 初期設定として背面カメラを起動

    // 撮影方向のラジオボタンが変更されたときに changeCameraDirection 関数を実行
    const radioButtons = document.querySelectorAll('input[name="shooting_direction"]');
    radioButtons.forEach(button => {
        button.addEventListener('change', changeCameraDirection);
    });

    function onResults(results) {
        resultsCtx.clearRect(0, 0, resultsCanvas.width, resultsCanvas.height);
        resizeCanvas();

        if (results.poseLandmarks) {
            drawLandmarks(results.poseLandmarks);
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
            resultsCtx.arc(x, y, 5, 0, 2 * Math.PI);
            resultsCtx.fill();
        }

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
            [9, 10], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [15, 17], [17, 19], [19, 21], [16, 18], [18, 20], [20, 22],
            [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27],
            [26, 28], [27, 29], [29, 31], [28, 30], [30, 32]
        ];

        for (const connection of connections) {
            const index1 = connections[0];
            const index2 = connections[1];
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
});
