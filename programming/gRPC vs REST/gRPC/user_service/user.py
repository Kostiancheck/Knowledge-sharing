from google.protobuf.wrappers_pb2 import Int32Value
from sqlalchemy import column, func, select, table
from stubs import user_pb2, user_pb2_grpc
from user_service.db import models
from user_service.db.database import session
from utils import msg_to_dict


class UserServicer(user_pb2_grpc.UserServiceServicer):
    def GetUser(self, request: user_pb2.GetUserRequest, context) -> user_pb2.User:
        """Get User by email"""
        print("GetUser")
        with session() as s:
            user = s.execute(
                select(models.User).where(models.User.email == request.email)
            ).first()[0]
            if not user:
                raise Exception("User not found")
            country = user.address.country.value
            address = user_pb2.Address(
                street=user.address.street,
                city=user.address.city,
                country=user_pb2.Country.Value(country),
            )
            user = user_pb2.User(
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                address=address,
            )
        print("Fetched user:", msg_to_dict(user))
        return user

    def GetUserList(
        self, request: user_pb2.GetUserListRequest, context
    ) -> user_pb2.GetUserListResponse:
        """Get list of users"""
        print("GetUserList")
        response = user_pb2.GetUserListResponse(users=[])
        with session() as s:
            users = s.execute(
                select(models.User).offset(request.offset).limit(request.limit)
            ).fetchall()
            if not users:
                raise Exception(f"Nothing to return")
            for user in users:
                user = user[0]
                country = user.address.country.value
                address = user_pb2.Address(
                    street=user.address.street,
                    city=user.address.city,
                    country=user_pb2.Country.Value(country),
                )
                user = user_pb2.User(
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    address=address,
                )
                response.users.append(user)
        print("List of users:", msg_to_dict(response))
        return response

    def CreateUser(self, request: user_pb2.CreateUserRequest, context) -> user_pb2.User:
        """Create User"""
        print("CreateUser")
        user = request.user
        with session() as s:
            country_name = user_pb2.Country.Name(user.address.country)
            address_db = s.execute(
                select(models.Address).where(
                    models.Address.street == user.address.street,
                    models.Address.city == user.address.city,
                    models.Address.country == models.Country(country_name),
                )
            ).first()
            if address_db:
                address_db = address_db[0]
            else:
                address_db = models.Address(
                    street=user.address.street,
                    city=user.address.city,
                    country=models.Country(country_name),
                )
            user_db = models.User(
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                address=address_db,
            )
            s.add(address_db)
            s.add(user_db)
            s.commit()
        print("User created:", msg_to_dict(user))
        return user

    def UpdateUser(self, request: user_pb2.UpdateUserRequest, context) -> user_pb2.User:
        """Update user"""
        print("UpdateUser")
        with session() as s:
            user = s.execute(
                select(models.User).where(models.User.email == request.user.email)
            ).first()
            if not user:
                raise Exception("User not found")
            user = user[0]
            for path in request.update_mask.paths:
                if hasattr(user, path):
                    setattr(user, path, getattr(request.user, path))
            s.commit()
            user = user_pb2.User(
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                address=user_pb2.Address(
                    street=user.address.street,
                    city=user.address.city,
                    country=user_pb2.Country.Value(user.address.country.value),
                ),
            )
        print("User updated:", msg_to_dict(user))
        return user

    def DeleteUser(
        self, request: user_pb2.DeleteUserRequest, context
    ) -> user_pb2.DeleteUserResponse:
        """Delete user by email"""
        print("DeleteUser")
        response = user_pb2.DeleteUserResponse(email=request.email)
        with session() as s:
            user = s.execute(
                select(models.User).where(models.User.email == request.email)
            ).first()
            if not user:
                raise Exception("User not found")
            user = user[0]
            s.delete(user)
            s.commit()
        print("User deleted")
        return response

    def CountUsers(self, request, context) -> int:
        """Count users"""
        print("CountUsers")
        response = Int32Value(value=0)
        with session() as s:
            users_table = table("users", column("email"))
            count = s.execute(select(func.count()).select_from(users_table)).scalar()
            response.value = count
        print("Count of users:", msg_to_dict(response))
        return response
