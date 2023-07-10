import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.framework.formats import landmark_pb2
import numpy as np
import matplotlib.pyplot as plt
import cv2
from math import hypot


def draw_landmarks_on_image(rgb_image, detection_result):
    face_landmarks_list = detection_result.multi_face_landmarks
    annotated_image = np.copy(rgb_image)

    # Loop through the detected faces to visualize.
    # for idx in range(len(face_landmarks_list)):
    for facial_landmarks in face_landmarks_list:
        face_landmarks = facial_landmarks.landmark

        # Draw the face landmarks.
        face_landmarks_proto = landmark_pb2.NormalizedLandmarkList()
        face_landmarks_proto.landmark.extend([
            landmark_pb2.NormalizedLandmark(x=landmark.x, y=landmark.y, z=landmark.z) for landmark in
            face_landmarks
        ])

        mp.solutions.drawing_utils.draw_landmarks(
            image=annotated_image,
            landmark_list=face_landmarks_proto,
            connections=mp.solutions.face_mesh.FACEMESH_TESSELATION,
            landmark_drawing_spec=None,
            connection_drawing_spec=mp.solutions.drawing_styles
            .get_default_face_mesh_tesselation_style())
        mp.solutions.drawing_utils.draw_landmarks(
            image=annotated_image,
            landmark_list=face_landmarks_proto,
            connections=mp.solutions.face_mesh.FACEMESH_CONTOURS,
            landmark_drawing_spec=None,
            connection_drawing_spec=mp.solutions.drawing_styles
            .get_default_face_mesh_contours_style())
        # mp.solutions.drawing_utils.draw_landmarks(
        #     image=annotated_image,
        #     landmark_list=face_landmarks_proto,
        #     connections=mp.solutions.face_mesh.FACEMESH_IRISES,
        #     landmark_drawing_spec=None,
        #     connection_drawing_spec=mp.solutions.drawing_styles
        #     .get_default_face_mesh_iris_connections_style())

    return annotated_image


star = cv2.imread("star.webp")
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
    # use face mesh model

    # mediapipe use RGB but OpenCV use BGR, so we need change image colors
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    # get facial landmarks
    result = face_mesh.process(rgb_image)
    annotated_image = draw_landmarks_on_image(rgb_image, result)
    height, width, _ = image.shape

    cv2.imshow("Image", cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR))
    # cv2.imshow("Image", image)
    cv2.waitKey(1)
