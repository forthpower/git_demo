"""
@author: yifan.chen
@file: send_messagge.py
@time: 2022/7/1 6:58 下午
"""
schema = {
    "name": "chat",
    "label": "Chat 发送消息(玩家方)",
    "primary_key": "",
    "entry": "ajax",
    "parent": "",  # 父菜单
    "action": [{"name": "ajax", "template": "ajaxbase"}],
    "fields": [{
            "name": "id",
            "type": "Integer",
            "label": "ID",
            "render_kw": {
                "readonly": True
            }
        },
        {
            "name": "gid",
            "type": "Integer",
            "label": "群组id",
            "explain": "聊天的群组id, 此处只能使用123456789",
            "default": 123456789
        },
        {
            "name": "uid",
            "type": "Integer",
            "label": "玩家id",
            "explain": "玩家id，只能使用999",
            "default": 999
        },
        {
            "name": "message",
            "type": "TextArea",
            "label": "消息"
        }
    ],
    "base_props": {
        "ajax_form_columns":  ["gid", "uid", "message"],
    }
}