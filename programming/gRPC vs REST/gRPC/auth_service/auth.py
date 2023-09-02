import grpc
from auth_service.db import models
from auth_service.db.database import session
from google.protobuf.empty_pb2 import Empty
from google.protobuf.wrappers_pb2 import Int32Value
from sqlalchemy import column, func, select, table
from stubs import auth_pb2, auth_pb2_grpc
from utils import msg_to_dict


class AuthServicer(auth_pb2_grpc.AuthServiceServicer):
    def GetUsers(self, request: auth_pb2.GetUsersRequest, context):
        """Get page of users"""
        print("GetUsers")
        response = auth_pb2.GetUsersResponse(users=[])
        with grpc.insecure_channel("localhost:50051") as channel:
            stub = grpc.stub(channel) # dynamic stub

            count_response = stub.CountUsers(Empty())
            total_pages = min(count_response - 1, 0) // request.page_size + 1

            offset = request.page_size * (request.page - 1)

            request_class = stub.GetRequestPrototype("CountUsers")
            users = stub.GetUserList(request_class(offset=offset, limit=request.page_size))
            response.total_pages = total_pages
            response.users = users.users
        print("Fetched users:", msg_to_dict(response))
        return response
