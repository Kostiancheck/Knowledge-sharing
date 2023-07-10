# open cv
import cv2
# google ML framework
import mediapipe as mp

# connect to the webcam
cap = cv2.VideoCapture(0)
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh()
# for all frames from webcam
while True:
    # Image
    ret, image = cap.read()
    # if there is no more frames stop the program
    if ret is not True:
        break
    # mediapipe use RGB but OpenCV use BGR, so we need change image colors
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    # get facial landmarks
    result = face_mesh.process(rgb_image)
    height, width, _ = image.shape
    # draw facial landmarks
    for facial_landmarks in result.multi_face_landmarks:
        max = 0
        max_index = 151
        for i in range(0, 468):
            pt1 = facial_landmarks.landmark[i]
            x = int(pt1.x * width)
            y = int(pt1.y * height)
            z = pt1.z
            (max, max_index) = (z, i) if z < max else (max, max_index)
            cv2.circle(image, (x, y), 1, (4, 224, 190), -1)
        # print(max_index, max)
        pt1 = facial_landmarks.landmark[max_index]
        x = int(pt1.x * width)
        y = int(pt1.y * height)
        cv2.circle(image, (x, y), 3, (256, 22, 22), -1)
        print("Nose", facial_landmarks.landmark[19].z)

    cv2.imshow("Image", image)
    cv2.waitKey(1)
