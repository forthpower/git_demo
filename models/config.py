"""
@author: yifan.chen
@file: config.py
@time: 2021/9/13 3:30 下午
"""
schema = {
    "name": "config",
    "label": "Config",
    "primary_key": "id",
    "entry": "list",
    "parent": {"label": "gameconfig", "name": "游戏管理"},
    "action": [{"name": "list", "template": "tablebase"}, {"name": "create", "template": "formbase"},
               {"name": "edit", "template": "editbase"}, {"name": "delete", "template": "button"}],
    "fields": [
        {
            "name": "id",
            "label": "ID",
            "type": "Integer"
        }, {
            "name": "name",
            "label": "name",
            "type": "String",
            "placeholder": "this is for name",
            "validators": [
                {"name": "data_required"}
            ],
            "width": 100,
        }, {
            "name": "area",
            "type": "Select",
            "label": "Area",
            "choices": [(0, 'global'), (1, 'cn')],
            "default": 0,
            # "coerce": "int",
            "field_chains": [
                {'child': "platforms", "params": ["area"]},
                {'child': "params", "params": ["area"]},
                {'child': "company", "field": ["company_area"], "params": ["area"]},  # 级联inline model 字段
            ],
            "validators": [
                {"name": "data_required"}
            ],
            "render_kw": {
                "createonly": True
            }
        }, {
            "name": "platforms",
            "type": "SelectMulti",
            "label": "Platform",
            "choices": "{host_name}api/v1/demo/platforms",
            "coerce": "int",
            "render_kw": {
                "createonly": True
            },
            "show_rule": {
                "name": "name",
                "value": 'test',
                "hideis": True
            },
        }, {
            "name": "company",
            "label": "Company",
            "type": "InlineModel",
            "form_name": "im_company",
            "show_rule": {
                "name": "name",
                "contain": 'test',
                "hideis": True
            },
        }, {
            "name": "test_time",
            "label": "test time",
            "type": "DateTime",
            "show_rule": {
                "name": "name",
                "value": 'test',
                "hideis": False
            },
        }, {
            "name": "create_time",
            "label": "ct",
            "type": "DateTime",
            "filter_rules": {
                "value": "now",
                "range": 100,
                "left_interval": 7,
                "right_interval": 0
            }
        }, {
            "name": "update_time",
            "label": "ut",
            "type": "DateTime",
            "filter_value": {
                "value": "2021-12-15",
                "range": 100,
                "left_interval": 3,
                "right_interval": 4
            }
        }, {
            "name": "params",
            "label": "Params",
            "type": "Json",
            "source": "{host_name}api/v1/demo/get_params"
        },
        {
            "name": "file",
            "type": "FileMulti",
            "label": "文件",
            "style": "url",
            "config": "s3_config",
            "validator": [
                {"name": "count_limit", "kws": {"max": 5}},
                {"name": "size_limit", "kws": {"max": 4000}},
                {"name": "type_limit", "kws": {"type": ['.jpg']}}
            ]
        }
    ],
    "base_props": {
        "form_columns": ["name", "area", "platforms", "test_time", "company", "params", "file"],
        "column_list": ["id", "name", "area", "platforms", "test_time", "update_time", "file"],
        "column_details_list": ["id", "name", "area", "platforms", "file"],
        "filter_style": {
            "filter_type": "front",  # front\backend   front为页面筛选
            "filter_all": True
        },
        # "column_filters": {
        #     "area": ['$eq'],
        #     "create_time": ['$between'],
        #     "update_time": ['$between']
        # },
        "timeout": {
            "list": 40,
            "create": 180
        }
    }
}
