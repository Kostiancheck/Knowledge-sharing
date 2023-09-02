from __future__ import print_function

import logging

import grpc
from google.protobuf.empty_pb2 import Empty
from google.protobuf.field_mask_pb2 import FieldMask
from auth_service.stubs import auth_pb2, auth_pb2_grpc
from utils import msg_to_dict


def run():
    # NOTE(gRPC Python Team): .close() is possible on a channel and should be
    # used in circumstances in which the with statement does not fit the needs
    # of the code.
    with grpc.insecure_channel("localhost:50052") as channel:
        stub = auth_pb2_grpc.AuthServiceStub(channel)

        print("Trying to get user with email 'test'")
        response = stub.GetUsers(auth_pb2.GetUsersRequest(page=1, page_size=10))
        print("client received: ", msg_to_dict(response))



if __name__ == "__main__":
    logging.basicConfig()
    run()
