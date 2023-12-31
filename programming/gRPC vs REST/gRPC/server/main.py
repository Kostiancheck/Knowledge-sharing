from concurrent import futures
import logging

import grpc
from proto import user_pb2_grpc
from server.user import UserServicer


def serve():
    port = "50051"
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=1))
    user_pb2_grpc.add_UserServiceServicer_to_server(UserServicer(), server)
    server.add_insecure_port("[::]:" + port)
    server.start()
    print("Server started, listening on " + port)
    server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig()
    serve()