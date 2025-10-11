"""
@author: yifan.chen
@file: chart.py
@time: 2022/3/29 12:03 PM
"""
schema = {
    "name": "chart",
    "label": "Chart",
    "parent": "",
    "primary_key": "",
    "entry": "list",
    "action": [
        {"name": "list", "template": "tablebase"},
        {"name": "create", "template": "formbase"},
        {"name": "edit", "template": "editbase"},
        {"name": "delete", "template": "button"},
        {"name": "chart", "template": "chartbase"},
    ],
    "fields": [
        {
            "name": "id",
            "label": "Id",
            "type": "Integer"
        },
        {
            "name": "account",
            "label": "account",
            "type": "String"
        },
        {
            "name": "status",
            "label": "status",
            "type": "Select",
            "choices": [
                (1, "using"),
                (2, "unused")
            ],
            "coerce": "int"
        },
        {
            "name": "changes",
            "label": "changes",
            "type": "SelectMulti",
            "choices": "{host_name}/api/v1/demo/game"
        },
        {
            "name": "price",
            "label": "price",
            "type": "String"
        },
        {
            "name": "rate",
            "label": "Rate",
            "type": "String"
        },
        {
            "name": "comment",
            "label": "Comment",
            "type": "TextArea"
        },
    ],
    "base_props": {
        "column_list": ["id", "account", "status", "price", "rate"],
        "form_columns": ["account", "status", "price", "rate", "comment"],
        "column_filters": {
            "account": ['$eq']
        },
        "chart_filters": {
            "account": ['$eq'],
            "status": ['$eq']
        },
        "chart_config": [
            {
                "chart": [
                    {"name": 'index2', "type": 'bar', "title": "柱状图"}
                ],
            },
            {
                "chart": [
                    {"name": 'index1', "type": 'line', "title": "折线图"},
                    {"name": 'index3', "type": 'pie', "title": "扇形图"},
                ],
            },
        ],
        "custom_style": {
            "detail_style": "none"
        }
    },
    "custom_actions": [
        {
            "action_name": "change_status",
            "label": "状态流转",
            "action": "form",
            "params": ["id", "account"],
            "form_fields": ["status", "price", "changes", "comment"],
            "location": "list",
            "default_value": [
                {
                    "name": "status",
                    "disable": False  # 是否可编辑， 默认不可编辑
                },
                {
                    "name": "price",
                    "disable": True  # 是否可编辑， 默认不可编辑
                },
            ]
        }
    ]
}
