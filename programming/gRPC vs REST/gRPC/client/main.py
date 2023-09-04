from __future__ import print_function

import logging

import grpc
from google.protobuf.empty_pb2 import Empty
from google.protobuf.field_mask_pb2 import FieldMask
from proto import user_pb2, user_pb2_grpc
from utils import msg_to_dict


def run():
    # NOTE(gRPC Python Team): .close() is possible on a channel and should be
    # used in circumstances in which the with statement does not fit the needs
    # of the code.
    with grpc.insecure_channel("localhost:50051") as channel:
        stub = user_pb2_grpc.UserServiceStub(channel)

        print("Trying to create user with email JOHNCENA@puppies.com")
        response = stub.CreateUser(
            user_pb2.CreateUserRequest(
                user=user_pb2.User(
                    email="JOHNCENA@puppies.com",
                    first_name="John",
                    last_name="Cena",
                    address=user_pb2.Address(
                        street="1234 Street",
                        city="City",
                        country=user_pb2.Country.Value("USA"),
                    ),
                )
            )
        )
        print("client received: ", msg_to_dict(response))
        print("---")

        print("Trying to update user with email JOHNCENA@puppies.com")
        response = stub.UpdateUser(
            user_pb2.UpdateUserRequest(
                user=user_pb2.User(
                    email="JOHNCENA@puppies.com", first_name="Johnita", last_name="Cena"
                ),
                update_mask=FieldMask(paths=["first_name", "last_name"]),
            )
        )
        print("client received: ", msg_to_dict(response))
        print("---")

        print("Trying to get user with email 'JOHNCENA@puppies.com'")
        response = stub.GetUser(user_pb2.GetUserRequest(email="JOHNCENA@puppies.com"))
        print("client received: ", msg_to_dict(response))
        print("---")

        print("Trying to get user list with offset 0 and limit 10")
        response = stub.GetUserList(user_pb2.GetUserListRequest(offset=0, limit=10))
        print("client received: ", msg_to_dict(response))
        print("---")

        print("Trying to count users")
        response = stub.CountUsers(Empty())
        print("client received: ", msg_to_dict(response))
        print("---")

        print("Trying to delete user with email JOHNCENA@puppies.com")
        response = stub.DeleteUser(
            user_pb2.DeleteUserRequest(email="JOHNCENA@puppies.com")
        )
        print("client received: ", msg_to_dict(response))
        print("---")

        print("Trying to count users")
        response = stub.CountUsers(Empty())
        print("client received: ", msg_to_dict(response))


if __name__ == "__main__":
    logging.basicConfig()
    run()
