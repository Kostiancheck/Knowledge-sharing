from concurrent import futures
import logging

import grpc
from auth_service.stubs import auth_pb2_grpc
from auth_service.auth import AuthServicer


def serve():
    port = "50052"
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=1))
    auth_pb2_grpc.add_AuthServiceServicer_to_server(AuthServicer(), server)
    server.add_insecure_port("[::]:" + port)
    server.start()
    print("Server started, listening on " + port)
    server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig()
    serve()