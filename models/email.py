"""
@author: yifan.chen
@file: email.py
@time: 2021/12/9 11:07 上午
"""

schema = {
    "name": "email",
    "label": "退款",
    "primary_key": "",
    "entry": "ajax",
    "parent": "",  # 父菜单
    "action": [{"name": "ajax", "template": "filterform"}],
    "fields": [
        {
            "name": "id",
            "label": "ID",
            "type": "String",
            "render_kw": {
                "disabled": True
            }
        },
        {
            "name": "fpid",
            "label": "Fpid",
            "type": "String",
        },
        {
            "name": "name",
            "label": "Name",
            "type": "String"
        },
        {
            "name": "email",
            "label": "Email",
            "type": "String"
        }
    ],
    "base_props": {
        "filter_form_columns":  ["id", "fpid", "name", "email"],
        "form_filters": {
            "id": ['$eq'],
            "fpid": ['$eq']
        }
    }
}
