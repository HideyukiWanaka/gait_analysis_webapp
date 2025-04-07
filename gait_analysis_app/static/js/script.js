document.addEventListener('DOMContentLoaded', function() {
    const cameraView = document.getElementById('cameraView');

    function startCamera() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({
                video: { facingMode: { exact: 'environment' } } // 環境カメラを指定
            })
            .then(function(stream) {
                cameraView.srcObject = stream;
            })
            .catch(function(error) {
                console.error('カメラへのアクセスに失敗しました:', error);
            });
        } else {
            console.error('getUserMedia APIに対応していません。');
        }
    }

    startCamera();
});
