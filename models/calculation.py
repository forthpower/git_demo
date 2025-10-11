"""
@author: yongjian.dai
@file: calculation.py
@time: 2025/9/17 19:44
"""

schema = {
    "name": "calculation",
    "label": "Calculation",
    "primary_key": "id",
    "entry": "list",
    "parent": "",
    "action": [{"name": "list", "template": "tablebase"}, {"name": "create", "template": "formbase"},
               {"name": "edit", "template": "edit_single"}, {"name": "delete", "template": "button"},
               {"name": "ajax", "template": "filterform"}],
    "fields": [
        {
            "name": "id",
            "label": "ID",
            "type": "Integer",

        },
        {
            "name": "count",
            "label": "Count",
            "type": "Integer",
            "placeholder": "数量",
            "copy_rule": {"开启"},
            "source": "{host_name}api/v1/demo/get_price"
        },
        {
            "name": "price",
            "label": "Price",
            "placeholder": "单价",
            "type": "Json",
            "tooltip": {
                "width": 200,
                "trigger": "hover",
                "row": 2,
            },
        },
        {
            "name": "money",
            "label": "Money",
            "placeholder": "总价格 = 数量 * 单价",
            "type": "Calculation",
            "method": {
                "formula": "field1 * field2 ",
                "field_conversion": {
                    "field1": "count",
                    "field2": "price"
                }
            }
        },
        {
            "name": "radio",
            "label": "Radio",
            "type": "Radio",
            "explain": "测试结果正确与否（radio）",
            "coerce": "int",
            "choices": [(0, 'right'), (1, 'false')],
            "default": 0,
        },
        {
            "name": "radio_display",
            "label": "Radio",
            "type": "String",
        },
        {
            "name": "file_large",
            "type": "File",
            "label": "FileLarge",
            "explain": "测试上传大型文件",
            "style": "large",
            "config": "s3_config"
        },
        {
            "name": "file_stream",
            "type": "File",
            "label": "FileStream",
            "explain": "测试上传二进制文件流",
            "style": "stream",
            "config": "s3_config"
        },
    ],
    "base_props": {
        "form_columns": ["count", "price", "money", "radio", "file_large", "file_stream"],
        "column_list": ["id", "count", "price", "money", "radio_display", "file_large", "file_stream"],
        "column_details_list": ["id", "count", "price", "money", "radio_display", "file_large", "file_stream"],
        "column_filters": {
            "money": ['$eq'],
            "radio": ['$eq']
        },
        "edit_form_columns": ["count", "price"],
        "form_submit_style": "none",  # form 页是否展示提交按钮
        "submit_jump_edit": "list",
        "submit_jump": "detail",
        "detail_label_width": 100,
        "form_label_width": 50,
        "operation_width": 300,
        "table_height": 700,
        "table_column_fixed": 1,
        "field_style": "top",
        "submit_alert": True,
        "explain": "计算字段类型demo",
        "form_filters": {
            "id": ['$eq'],
            "count": ['$eq']
        },
        "filter_form_columns": ["id", "price"],
        "timeout": {
            "list": 5,
            "create": 5
        },
        "submit_style": {
            'type': 'alert',  # 提交类型. alert(弹出)
            'alert_content': "whether to execute the current configuration？",  # 提交时提示文案
        },
        "custom_style": {
            "detail_style": "dropdown"
        }

    },
    # 自定义action
    "custom_actions": [
        {
            "action_name": "copy",
            "label": "复制",
            "action": "ajax",
            "params": ["id"],
            "location": "outer_list",
            "icon": "el-icon-video-camera-solid"
        },
        {
            "action_name": "download",
            "label": "下载file_large",
            "action": "jump",
            "params": ["id"],
            "location": "list",
            "config": {
                "type": "download",
                "return_key": "url"
            },
            "jump": {
                "type": "download",  # inner
                "href": "http://www.baidu.com"
            },
        },
        {
            "action_name": "qr_code_download",
            "label": "QR Code Download",
            "action": "qcr_code",
            "params": ["id", 'is_enable_code', 'version'],
            "location": "list",
            "config": {
                "type": "url",
                "href": "http://www.baidu.com",
            }
        },
        {
            "action_name": "do_preview",
            "label": "预览",
            "action": "jump",
            "params": ["config_id"],
            "jump": {
                "type": "outer",  # inner
                "href": "http://www.baidu.com"
            },
            "location": "list"
        },
    ]
}
