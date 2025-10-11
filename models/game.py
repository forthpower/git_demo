schema = {

    "name": "gameconfig",
    "label": "游戏",
    "primary_key": "game_id",
    "entry": "list",
    "parent": {"label": "gameconfig", "name": "游戏管理"},
    "action": [{"name": "list", "template": "tablebase"}, {"name": "create", "template": "formbase"},
               {"name": "edit", "template": "editbase"}, {"name": "delete", "template": "button"},
               {"name": "export", "template": "exportbase"}],
    "fields": [
        {
            "name": "game_id",
            "type": "Integer",
            "label": "Game id",
            'validators': [
                {'name': 'data_required'},
            ],
        },
        {
            "name": "game_name",
            "type": "String",
            "label": "Game name",
            'validators': [
                {'name': 'data_required'},
            ],
            "tooltip": {
                "width": 200,
                "trigger": "hover",
                "length": 10,
                # "row": 2,
            }
        },
        {
            "name": "website_url",
            "type": "LinkString",
            "label": "Website",
            "params": ['game_id'],
            "model": "external-links",  # external-links (跳转当前值（链接）)
        },
        {
            "name": "area",
            "type": "Select",
            "label": "Area",
            "hide_chains": [{"child": "session_timeout", "value": 1}],  # 隐藏级联字段
            "choices": [
                (0, "global"),
                (1, "cn"),
            ],
        },
        {
            "name": "session_timeout",
            "type": "Select",
            "label": "Session Time",
            "choices": "{host_name}/api/v1/demo/session_timeout",
        },

        {
            "name": "channel_info",
            "type": "Json",
            "label": "Channel info",
            "show_style": {
                "style": "tag",
                "color": "",
            }
        },
        {
            "name": "props",
            "label": "道具",
            "type": "LinkForm",
            "form_name": "lf_props",
            "actions": ["delete", "add", "import"],
            "default": {
                "platform": "ios",
                "prop": "aaa",
                "number": "1",
            },
            "disable": {
                "platform": "ios",
                "prop": "aaa",
            },
        },
        {
            "name": "is_active",
            "type": "Boolean",
            "label": "Is active",
            "default": True,
        },
        {
            'name': 'create_time',
            'type': 'DateTime',
            "label": "Create time",
            "render_kw": {
                "readonly": 1  # 只读
            }
        },
    ],
    "base_props": {
        "page_size": 50,
        "import_size": 5,
        'column_list': ['game_id', 'game_name', 'website_url', 'area', 'channel_info', 'props', 'is_active',
                        'create_time'],
        'column_details_list': ['game_id', 'game_name', 'website_url', 'area', 'session_timeout', 'channel_info',
                                'props', 'is_active', 'create_time'],
        'form_columns': ['game_name', 'website_url', 'area', 'session_timeout', 'channel_info', 'props', 'is_active'],
        'column_sortable_list': ['game_id'],
        'filter': '',
        'column_editable_list': ['is_active'],
        "custom_style": {
            "editable_list_style": "alert",  # 行内编辑样式， 弹出
        },
        "column_filters": {
            "game_id": ["$eq"],
            "area": ["$eq"],
            "session_timeout": ["$eq"],
        },
    },
    "custom_actions": [
        {
            # 跳转
            "action_name": "website",
            "label": "Website",  # 显示名称
            "action": "jump",  # jump, ajax, alert
            "params": ["game_id"],  # model page支持的filter字段
            "jump": {
                "type": "field_link",  # inner 目前支持inner(跳转model) field_link(跳转字段)
                "href": "calculation"  # model名称
            },
            "location": "list"  # list\edit\detail\create  暂时支持list
        },
    ]
}
