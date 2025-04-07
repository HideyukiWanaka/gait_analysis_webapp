document.addEventListener('DOMContentLoaded', function() {
    const cameraView = document.getElementById('cameraView');
    const constraints = { video: { facingMode: { exact: 'environment' } } };
    let stream;

    function startCamera() {
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

    function sendFrameToServer() {
        if (!cameraView.videoWidth || !cameraView.videoHeight) {
            return;
        }

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
                console.log('サーバーからの応答:', data);
                // ここでサーバーからの姿勢推定結果を処理する
            })
            .catch(error => {
                console.error('フレーム送信エラー:', error);
            });
        }, 'image/jpeg', 0.8); // JPEG形式で圧縮率80%
    }

    // 定期的にフレームを送信する (例: 30fps)
    setInterval(sendFrameToServer, 1000 / 30);

    startCamera();
});
