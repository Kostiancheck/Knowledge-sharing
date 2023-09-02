from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Country(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []
    UKRAINE: _ClassVar[Country]
    USA: _ClassVar[Country]
    UK: _ClassVar[Country]
    POLAND: _ClassVar[Country]
    JAPAN: _ClassVar[Country]
    AUSTRALIA: _ClassVar[Country]
UKRAINE: Country
USA: Country
UK: Country
POLAND: Country
JAPAN: Country
AUSTRALIA: Country

class Address(_message.Message):
    __slots__ = ["street", "city", "country"]
    STREET_FIELD_NUMBER: _ClassVar[int]
    CITY_FIELD_NUMBER: _ClassVar[int]
    COUNTRY_FIELD_NUMBER: _ClassVar[int]
    street: str
    city: str
    country: Country
    def __init__(self, street: _Optional[str] = ..., city: _Optional[str] = ..., country: _Optional[_Union[Country, str]] = ...) -> None: ...

class User(_message.Message):
    __slots__ = ["email", "first_name", "last_name", "address"]
    EMAIL_FIELD_NUMBER: _ClassVar[int]
    FIRST_NAME_FIELD_NUMBER: _ClassVar[int]
    LAST_NAME_FIELD_NUMBER: _ClassVar[int]
    ADDRESS_FIELD_NUMBER: _ClassVar[int]
    email: str
    first_name: str
    last_name: str
    address: Address
    def __init__(self, email: _Optional[str] = ..., first_name: _Optional[str] = ..., last_name: _Optional[str] = ..., address: _Optional[_Union[Address, _Mapping]] = ...) -> None: ...

class LoginRequest(_message.Message):
    __slots__ = ["email"]
    EMAIL_FIELD_NUMBER: _ClassVar[int]
    email: str
    def __init__(self, email: _Optional[str] = ...) -> None: ...

class RegisterRequest(_message.Message):
    __slots__ = ["user"]
    USER_FIELD_NUMBER: _ClassVar[int]
    user: User
    def __init__(self, user: _Optional[_Union[User, _Mapping]] = ...) -> None: ...

class GetUsersRequest(_message.Message):
    __slots__ = ["page_size", "page_number"]
    PAGE_SIZE_FIELD_NUMBER: _ClassVar[int]
    PAGE_NUMBER_FIELD_NUMBER: _ClassVar[int]
    page_size: int
    page_number: int
    def __init__(self, page_size: _Optional[int] = ..., page_number: _Optional[int] = ...) -> None: ...

class GetUsersResponse(_message.Message):
    __slots__ = ["users", "total_pages"]
    USERS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_PAGES_FIELD_NUMBER: _ClassVar[int]
    users: _containers.RepeatedCompositeFieldContainer[User]
    total_pages: int
    def __init__(self, users: _Optional[_Iterable[_Union[User, _Mapping]]] = ..., total_pages: _Optional[int] = ...) -> None: ...
