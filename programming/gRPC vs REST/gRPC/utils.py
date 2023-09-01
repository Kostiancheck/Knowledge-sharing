import json

from google.protobuf.json_format import MessageToJson


def msg_to_dict(msg):
    return json.loads(MessageToJson(msg, including_default_value_fields=True))
