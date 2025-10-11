schema = {
    "name": "tool",
    "label": "发送工具",
    "primary_key": "ID",
    "entry": "ajax",
    "parent": {"label": "Tools", "name": "工具菜单"},  # 父菜单
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
            "name": "params",
            "type": "Json",
            "label": "Params",
            "placeholder": "request params, if none, will use default value",
            "source": "{host_name}api/v1/demo/get_price"
        },
        {
            "name": "url",
            "type": "String",
            "label": "Url",
        },
        {
            "name": "test_url",  # output_result 字段
            "type": "LinkString",
            "label": "test_url",
            "model": "external-links",  # external-links (外部链接)
        },
    ],
    "base_props": {
        "ajax_form_columns": ["params", "url"],
        "custom_style": {
            "ajax_style": "match_link"  # result、table（json里的链接可以点击)
        }
    }
}
