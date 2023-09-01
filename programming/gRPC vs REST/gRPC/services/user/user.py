from protobufs.users import users_pb2, users_pb2_grpc
from sqlalchemy import select

from services.user.db.db import session
from services.user.db import models

from utils import msg_to_dict


class UserServicer(users_pb2_grpc.UserServiceServicer):
    def GetUser(self, request, context):
        """Get User by email"""
        print("Getting user")
        with session() as s:
            user = s.execute(
                select(models.User).where(models.User.email == request.email)
            ).first()[0]
            if not user:
                print("returning None, no users found")
                return None
            country = user.address.country.value
            address = users_pb2.Address(
                street=user.address.street,
                city=user.address.city,
                country=users_pb2.Country.Value(country),
            )
            user = users_pb2.User(
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                address=address,
            )
            print("Returning user:", msg_to_dict(user))
        return user

    def GetUserList(self, request, context):
        """Get list of users"""
        print("Getting user list")
        response = users_pb2.GetUserListResponse(users=[])
        with session() as s:
            users = s.execute(
                select(models.User).offset(request.offset).limit(request.limit)
            ).fetchall()
            if not users:
                print("returning empty list, no users found")
                return response
            print("returning list of users:")
            for user in users:
                user = user[0]
                country = user.address.country.value
                address = users_pb2.Address(
                    street=user.address.street,
                    city=user.address.city,
                    country=users_pb2.Country.Value(country),
                )
                user = users_pb2.User(
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    address=address,
                )
                print("Returning user:", msg_to_dict(user))
                response.users.append(user)
                print(msg_to_dict(response))
            return response

    def CreateUser(self, request, context):
        """Create User"""
        print("CreateUser")
        user = request.user
        with session() as s:
            country_name = users_pb2.Country.Name(user.address.country)
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
        return user

    def UpdateUser(self, request, context):
        """Update user"""
        print("UpdateUser")
        user = users_pb2.User(email="test")
        print(user)
        return user

    def DeleteUser(self, request, context):
        """Delete user by email"""
        print("DeleteUser")
        with session() as s:
            user = s.execute(
                select(models.User).where(models.User.email == request.email)
            ).first()
            if user:
                user = user[0]
                s.delete(user)
                s.commit()
        return request
