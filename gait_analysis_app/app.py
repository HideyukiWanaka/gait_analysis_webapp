from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import mediapipe as mp
import io
from PIL import Image

app = Flask(__name__)

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    enable_segmentation=False,
    smooth_segmentation=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_frame', methods=['POST'])
def process_frame():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'})

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected image'})

    if file:
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))
        frame = np.array(image)
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

        # MediaPipeによる姿勢推定
        results = pose.process(frame)
        landmarks = []
        if results.pose_landmarks:
            for landmark in results.pose_landmarks.landmark:
                landmarks.append({
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'visibility': landmark.visibility
                })

        return jsonify({'landmarks': landmarks})

    return jsonify({'error': 'Something went wrong'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0') # Renderで外部からアクセスできるように host='0.0.0.0' を指定
