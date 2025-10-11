"""
@Author: xuliang.wei@centurygame.com
@Time: 2022/7/22 11:57
@File: mutil_language.py
@Desc: xxx
"""
schema = {
    "name": "mutil_language",
    "label": "Mutil Language",
    "primary_key": "id",
    "entry": "list",
    "parent": {"label": "language_config", "name": "Language Config"},
    "action": [
        {"name": "list", "template": "tablebase"},
        {"name": "create", "template": "formbase"},
        # {"name": "edit", "template": "editbase"},
        # {"name": "delete", "template": "button"}
    ],
    "fields": [
        {
            "name": "mutil_language_config",
            "label": "Config",
            "type": "LinkForm",
            "form_name": "lf_mutil_language_config",
            "actions": ["delete", "add", "import"],
            "template_url": "https://cgid-cdn.centurygame.com/cgid_source/development/faq_test.csv",
            "linkform_drag_key": "language"
        },
{
            "name": "id",
            "label": "Id",
            "type": "Integer",
            "render_kw": {
                "readonly": True
            }
        },
        {
            "name": "faq_desc",
            "label": "Faq Desc",
            "type": "String",
        },
        {
            "name": "question",
            "label": "Question",
            "type": "String",
        },
        {
            "name": "answer",
            "label": "Answer",
            "type": "TextArea",
        },
        {
            "name": "weight",
            "label": "Weight",
            "type": "Integer",
        },
    ],
    "base_props": {
        "column_list": [
            "id", "faq_desc", "question", "answer", "weight"
        ],
        "form_columns": [
            "mutil_language_config"
        ],

    },
    "custom_actions": [
        {
            "action_name": "order",
            "label": "排序",
            "action": "order",
            "unique_key": "id",
            "params": ["faq_desc"],
            "location": "batch_list"
        }
    ]
}
