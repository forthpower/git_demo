schema = {
    "name": "user",
    "label": "{{model_name}}",
    "primary_key": "id",
    "parent": {"label": "用户管理", "name": "{{parent_label}}"},
    "entry": "list",
    "action": [{"name": "list", "template": "batch_table"}, {"name": "create", "template": "formbase"},
               {"name": "edit", "template": "editbase"}, {"name": "delete", "template": "button"},
               {"name": "export", "template": "exportbase"}],
    "fields": [
        {
            "name": "id",
            "type": "Integer",
            "label": "{{id}}",
            "render_kw": {
                "readonly": 1
            }
        },
        {
            "name": "name",
            "type": "String",
            "label": "{{name}}",
            "placeholder": "{{placeholder_name}}",
            "default": None,
            'validators': [
                {"name": "data_required"},
                {"name": "length", "kws": {"min": 3, "max": 12, "message": "长度必须大于3个字符串并且小于12个字符串,这个是自定义错误提示"}},
            ],
        },
        {
            "name": "age",
            "type": "Integer",
            "label": "{{age}}",
            "filters": ['$eq'],
            "placeholder": "输入age",
            # "default": None,
            'validators': [
                {'name': 'data_required'},
            ],

        },
        {
            "name": "mobile",
            "type": "String",
            "label": "{{mobile}}",
            "filters": ['$eq'],
            "default": "110",
            "input": "password",
        },
        {
            "name": "game_id",
            "type": "Select",
            "label": "{{game}}",
            "choices": "{host_name}/api/v1/demo/game",
            # "choices": "{host_name}api/v1/demo/protobuf/game",
        },
        {
            "name": "photo",
            "type": "Image",
            "label": "{{photo}}",
            "style": "url",
            "config": "s3_config",
            "coerce": "image",
        },
        {
            "name": "file",
            "type": "ImageMulti",
            "label": "{{file}}",
            "style": "url",
            "config": "s3_config",
            "validator": [
                {"name": "count_limit", "kws": {"max": 5}},
                {"name": "size_limit", "kws": {"max": 4000}},
                {"name": "type_limit", "kws": {"type": ['.jpg']}}
            ]
        },
        {
            "name": "company",  # 测试 inlineModel
            "type": "InlineModel",
            "label": "{{company}}",
            "form_name": "im_company",
        },
        {
            "name": "hero",
            "type": "LinkForm",
            "label": "{{hero}}",
            "form_name": "lf_heroes",
            "actions": ["add", "delete"]
        },
        # {
        #     "name": "company",  # 测试 inlineModel
        #     "type": "InlineModel",
        #     "label": "Company",
        #     "style": "list",  # normal和list
        #     "fields": [
        #         {
        #             "name": "company_name",
        #             "label": "Company name",
        #             "type": "String"
        #         },
        #         {
        #             "name": "company_tel",
        #             "label": "Company tel",
        #             "type": "String"
        #         }
        #     ]
        #
        # },
        {
            "name": "editor",
            "type": "Editor",
            "label": "{{editor}}",
            "validators": [
                {
                    "name": "data_required"
                }]
        },

        {
            'name': 'create_time',
            'type': 'DateTime',
            "label": "{{create_time}}",
            "render_kw": {
                "readonly": 1  # 只读
            }
        },
        {
            "name": "params_select",
            "label": "Params Select",
            "type": "Select",
            "choices": (("aa", "aa"), ("bb", "bb")),
            "field_chains": [
                {"child": "params_source", "params": ["params_select"]}
            ],
            # "field_chains": [{"child": "params_source", "params": ["params_select"]}]
        },
        {
            "name": "params_source",
            "label": "Params SourceForm",
            "type": "SourceForm",
            "source": "{host_name}api/v1/demo/source_test",
            "explain": "替换参数",
        },
    ],

    "base_props": {
        # 列表
        'column_list': ['id', 'name', 'age', 'game_id', 'photo', 'file', 'company', 'editor', 'create_time'],
        # 表单
        'form_columns': ['name', 'age', 'game_id', 'mobile', 'photo', 'file', 'company', 'editor', 'hero',
                         "params_select", "params_source"],
        # 详情
        'column_details_list': ['id', 'name', 'age', 'game_id', 'mobile', 'photo', 'file', 'company', 'editor',
                                'create_time'],
        # 排序字段
        'column_sortable_list': ['id', 'age'],
        # 行内可编辑字段
        'column_editable_list': ['age', 'name', 'game_id'],
        # 文件导出字段
        'export_list': ['id', 'name', 'age', 'mobile'],
        # 过滤字段
        "column_filters": {  # filter
            "name": ["$eq"],
            "age": ["$eq"],
            "create_time": ["$between"],
        },
        "custom_style": {
            "edit_refresh": True,
            "editable_list_style": "alert",  # 行内编辑样式， 弹出
        }
    },

    # 自定义action
    "custom_actions": [
        {
            # 跳转
            "action_name": "game_manager",
            "label": "{{action_game_manager_name}}",  # 显示名称
            "action": "jump",  # jump, ajax, alert
            "params": ["game_id"],  # model page支持的filter字段
            "jump": {
                "type": "inner",  # inner 目前只支持inner
                "href": "gameconfig"  # model名称
            },
            "location": "list"  # list\edit\detail\create  暂时支持list
        },

        {
            "action_name": "send_email",
            "label": "{{action_send_email_name}}",  # 显示名称
            "action": "alert",  # jump,  ajax
            "prams": ["id", "game_id"],
            "alert": {
                "content": "是否发送？",
                "content_field": ["name", "age"]
            },
            "jump": {
                "type": "",  # inner, outer
                "href": ""
            },
            "location": "list"  # list\edit\detail\create  暂时支持list
        },
        {
            "action_name": "test_batch_select",
            "label": "Test Batch Select",  # 显示名称
            "action": "ajax",  # jump,  ajax
            "prams": ["id", "game_id"],
            "location": "batch_list"  # list\edit\detail\create  暂时支持list
        },

    ]
}
