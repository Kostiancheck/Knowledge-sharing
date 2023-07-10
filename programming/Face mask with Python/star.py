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
    height, width, _ = image.shape
    pt = result.multi_face_landmarks[0].landmark[151]
    x = int(pt.x * width)
    y = int(pt.y * height)

    left_pt = result.multi_face_landmarks[0].landmark[108]
    left_x = int(left_pt.x * width)
    left_y = int(left_pt.y * height)

    right_pt = result.multi_face_landmarks[0].landmark[337]
    right_x = int(right_pt.x * width)
    right_y = int(right_pt.y * height)
    print(right_pt.z)
    # for facial_landmarks in result.multi_face_landmarks:
    #     for i in range(0, 468):
    #         pt1 = facial_landmarks.landmark[i]
    #         x = int(pt1.x * width)
    #         y = int(pt1.y * height)
    head_width = int(hypot(
        left_x - right_x,
        left_y - right_y
    ))

    sized_star = cv2.resize(star, (head_width, head_width))

    top_left = (int(x - head_width / 2),
                int(y - head_width / 2))
    bottom_right = (int(x + head_width / 2),
                    int(y + head_width / 2))

    star_gray = cv2.cvtColor(sized_star, cv2.COLOR_BGR2GRAY)
    _, star_mask = cv2.threshold(star_gray, 25, 255, cv2.THRESH_BINARY_INV)
    star_area = image[top_left[1]: top_left[1] + head_width,
                top_left[0]: top_left[0] + head_width]
    star_area_no_star = cv2.bitwise_and(star_area, star_area, mask=star_mask)
    final_star = cv2.add(star_area_no_star, sized_star)
    image[top_left[1]: top_left[1] + head_width, top_left[0]: top_left[0] + head_width] = final_star

    # cv2.imshow("Nose area", final_star)
    # cv2.imshow("Nose pig", sized_star)
    cv2.imshow("final nose", star_gray)
    cv2.circle(image, (x, y), 1, (222, 224, 190), -1)
    cv2.circle(image, (left_x, left_y), 1, (222, 224, 190), -1)
    cv2.circle(image, (right_x, right_y), 1, (222, 224, 190), -1)
    # cv2.imshow("Mask", sized_star)

    cv2.imshow("Image", image)
    cv2.waitKey(1)
