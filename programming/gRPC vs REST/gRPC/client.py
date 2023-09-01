from __future__ import print_function

import logging

import grpc
from protobufs.users import users_pb2_grpc
from protobufs.users.users_pb2 import (
    Address,
    Country,
    CreateUserRequest,
    DeleteUserRequest,
    GetUserListRequest,
    GetUserRequest,
    User,
)
from utils import msg_to_dict


def run():
    # NOTE(gRPC Python Team): .close() is possible on a channel and should be
    # used in circumstances in which the with statement does not fit the needs
    # of the code.
    with grpc.insecure_channel("localhost:50051") as channel:
        stub = users_pb2_grpc.UserServiceStub(channel)

        print("Trying to delete user with email JOHNCENA@puppies.com")
        response = stub.DeleteUser(DeleteUserRequest(email="JOHNCENA@puppies.com"))
        print("client received: ", msg_to_dict(response))

        print("Trying to create user with email JOHNCENA@puppies.com")
        response = stub.CreateUser(
            CreateUserRequest(
                user=User(
                    email="JOHNCENA@puppies.com",
                    first_name="John",
                    last_name="Cena",
                    address=Address(
                        street="1234 Street",
                        city="City",
                        country=Country.Value("USA"),
                    ),
                )
            )
        )
        print("client received: ", msg_to_dict(response))

        print("Trying to get user with email 'test'")
        response = stub.GetUser(GetUserRequest(email="test"))
        print("client received: ", msg_to_dict(response))

        print("Trying to get user list with offset 0 and limit 10")
        response = stub.GetUserList(GetUserListRequest(offset=0, limit=10))
        print(msg_to_dict(response))


if __name__ == "__main__":
    logging.basicConfig()
    run()
